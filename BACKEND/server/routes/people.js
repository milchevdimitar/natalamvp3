const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const { annotatePerson, enrichPeopleHub } = require('../calc');

const router = express.Router();
router.use(require('./account').requireAccount);

router.get('/shared/:profileId', async (req, res) => {
  const { profileId } = req.params;
  if (!/^[a-f\d]{24}$/i.test(profileId)) {
    return res.status(404).json({ success: false, message: 'Profile unavailable.' });
  }
  try {
    const viewer = req.account;
    if (!viewer) return res.status(401).json({ success: false, message: 'Sign in to view this profile.' });
    const target = await User.findById(profileId)
      .select('name email bio interests isActive isDiscoverable blockedUsers avatarUrl')
      .lean();
    const same = String(viewer._id) === profileId.toLowerCase();
    const contains = (values, id) => (values || []).some((value) => String(value) === String(id));
    const isFriend = contains(viewer.friends, profileId.toLowerCase());
    if (!target || target.isActive === false || (!same && (
      (target.isDiscoverable === false && !isFriend) ||
      contains(target.blockedUsers, viewer._id) || contains(viewer.blockedUsers, target._id)
    ))) {
      return res.status(404).json({ success: false, message: 'Profile unavailable.' });
    }
    const stories = await Story.find({
      userId: { $in: [String(target._id), target.email].filter(Boolean) },
      createdAt: { $gte: new Date(Date.now() - 86400000) },
    }).select('imageUrl createdAt').sort({ createdAt: -1 }).limit(24).lean();
    return res.json({
      success: true,
      profile: {
        id: String(target._id), name: target.name, bio: target.bio, interests: target.interests, avatarUrl: target.avatarUrl,
        relationship: same ? 'self' : isFriend ? 'friend' : contains(viewer.sentRequests, target._id) ? 'pending' : 'available',
        ...(isFriend ? { chatEmail: target.email } : {}),
        stories: stories.map((story) => ({ id: String(story._id), imageUrl: story.imageUrl, createdAt: story.createdAt })),
      },
    });
  } catch (error) {
    console.error('Shared profile lookup failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load this profile.' });
  }
});

// Помощна функция: намира текущия потребител по _id или email
async function resolveCurrentUser(userId, email) {
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const byId = await User.findById(userId);
    if (byId) return byId;
  }
  if (email) {
    const byEmail = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (byEmail) return byEmail;
  }
  return null;
}

// Форматира реален MongoDB User документ за мобилното приложение
function serializePerson(doc, extra = {}) {
  const idStr = String(doc._id);
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const isOnline = doc.lastActiveAt ? new Date(doc.lastActiveAt).getTime() >= tenMinutesAgo : false;

  return {
    _id: idStr,
    id: idStr,
    cosmicId: `NTL-${idStr.slice(-6).toUpperCase()}`,
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    email: doc.email,
    birthdate: doc.birthdate,
    birthCity: doc.birthCity || { name: 'Unknown', country: '' },
    bloodGroup: doc.bloodGroup || null,
    mbti: doc.mbti || { type: '' },
    natalChart: doc.natalChart || {},
    cardology: doc.cardology || {},
    ayurveda: doc.ayurveda || {},
    numerology: doc.numerology || {},
    bio: doc.bio || '',
    interests:
      Array.isArray(doc.interests) && doc.interests.length > 0
        ? doc.interests
        : ['Astrology', 'Numerology'],
    isOnline,
    ...extra,
  };
}

// GET /api/people/hub?userId=...&email=...
// Зарежда всички реални потребители от базата и ги разпределя в секции
router.get('/hub', async (req, res) => {
  try {
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me) {
      return res.status(404).json({ success: false, message: 'Потребителят не е намерен.' });
    }

    // Обновяваме онлайн статуса на текущия потребител
    me.lastActiveAt = new Date();
    await me.save();

    const friendSet = new Set((me.friends || []).map((id) => String(id)));
    const sentSet = new Set((me.sentRequests || []).map((id) => String(id)));
    const receivedSet = new Set((me.receivedRequests || []).map((id) => String(id)));
    const skippedSet = new Set((me.skippedUsers || []).map((id) => String(id)));
    const blockedSet = new Set((me.blockedUsers || []).map(String));

    const allOthers = await User.find({ _id: { $ne: me._id } })
      .select('-__v')
      .sort({ lastActiveAt: -1, createdAt: -1 })
      .lean();

    const friends = [];
    const incomingRequests = [];
    const potentialMatches = [];
    const discover = [];

    for (const person of allOthers) {
      const pid = String(person._id);
      if (person.isActive === false || blockedSet.has(pid) || (person.blockedUsers || []).some((id) => String(id) === String(me._id))) continue;

      if (friendSet.has(pid)) {
        friends.push(serializePerson(person, { category: 'friend' }));
        continue;
      }

      if (receivedSet.has(pid)) {
        incomingRequests.push(
          serializePerson(person, { category: 'discover', mutualLikesYou: true })
        );
        continue;
      }

      // В Discover влизат всички потребители, които още не са приятели
      discover.push(
        serializePerson(person, {
          category: 'discover',
          mutualLikesYou: receivedSet.has(pid),
        })
      );

      // В Potential Matches влизат тези, на които още не сме пратили покана и не сме пропуснали
      if (!sentSet.has(pid) && !skippedSet.has(pid)) {
        potentialMatches.push(
          serializePerson(person, {
            category: 'match',
            mutualLikesYou: receivedSet.has(pid),
          })
        );
      }
    }

    return res.json({
      success: true,
      myCosmicId: `NTL-${String(me._id).slice(-6).toUpperCase()}`,
      ...enrichPeopleHub(me.toObject(), { friends, incomingRequests, potentialMatches, discover },
        new Map(allOthers.map((person) => [String(person._id), person]))),
      requestedIds: Array.from(sentSet),
      rankedOnServer: true,
    });
  } catch (err) {
    console.error('GET /api/people/hub error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при зареждане на потребителите.' });
  }
});

// POST /api/people/like
// Харесване или изпращане на покана; при взаимно харесване стават приятели веднага
router.post('/like', async (req, res) => {
  try {
    const { targetId } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни за заявката.' });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Потребителят не съществува.' });
    }

    const myIdStr = String(me._id);
    const targetIdStr = String(target._id);

    const isAlreadyFriend = (me.friends || []).some((id) => String(id) === targetIdStr);
    if (isAlreadyFriend) {
      return res.json({
        success: true,
        matched: true,
        person: annotatePerson(me, serializePerson(target, { category: 'friend' })),
      });
    }

    // Проверяваме дали другият потребител вече ни е харесал / пратил покана
    const isMutual = (me.receivedRequests || []).some((id) => String(id) === targetIdStr);

    if (isMutual) {
      await Promise.all([
        User.findByIdAndUpdate(me._id, {
          $addToSet: { friends: target._id },
          $pull: { receivedRequests: target._id, sentRequests: target._id, skippedUsers: target._id },
        }),
        User.findByIdAndUpdate(target._id, {
          $addToSet: { friends: me._id },
          $pull: { sentRequests: me._id, receivedRequests: me._id, skippedUsers: me._id },
        }),
      ]);

      return res.json({
        success: true,
        matched: true,
        person: annotatePerson(me, serializePerson(target, { category: 'friend' })),
      });
    }

    // Изпращаме покана за свързване
    await Promise.all([
      User.findByIdAndUpdate(me._id, {
        $addToSet: { sentRequests: target._id },
        $pull: { skippedUsers: target._id },
      }),
      User.findByIdAndUpdate(target._id, {
        $addToSet: { receivedRequests: me._id },
      }),
    ]);

    return res.json({
      success: true,
      matched: false,
      targetId: targetIdStr,
    });
  } catch (err) {
    console.error('POST /api/people/like error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при свързване.' });
  }
});

// POST /api/people/cancel-request
// Отменя изпратена покана от Discover секцията
router.post('/cancel-request', async (req, res) => {
  try {
    const { targetId } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни.' });
    }

    await Promise.all([
      User.findByIdAndUpdate(me._id, { $pull: { sentRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { receivedRequests: me._id } }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/people/cancel-request error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при отмяна на покана.' });
  }
});

// POST /api/people/accept
// Приема входяща покана за приятелство
router.post('/accept', async (req, res) => {
  try {
    const { targetId } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни.' });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Потребителят не е намерен.' });
    }

    await Promise.all([
      User.findByIdAndUpdate(me._id, {
        $addToSet: { friends: target._id },
        $pull: { receivedRequests: target._id, sentRequests: target._id },
      }),
      User.findByIdAndUpdate(target._id, {
        $addToSet: { friends: me._id },
        $pull: { sentRequests: me._id, receivedRequests: me._id },
      }),
    ]);

    return res.json({
      success: true,
      person: annotatePerson(me, serializePerson(target, { category: 'friend' })),
    });
  } catch (err) {
    console.error('POST /api/people/accept error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при приемане на покана.' });
  }
});

// POST /api/people/decline
// Отхвърля входяща покана
router.post('/decline', async (req, res) => {
  try {
    const { targetId } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни.' });
    }

    await Promise.all([
      User.findByIdAndUpdate(me._id, { $pull: { receivedRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { sentRequests: me._id } }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/people/decline error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при отхвърляне на покана.' });
  }
});

// POST /api/people/skip
// Пропуска предложение (или го възстановява при undo: true)
router.post('/skip', async (req, res) => {
  try {
    const { targetId, undo } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни.' });
    }

    const updateOp = undo
      ? { $pull: { skippedUsers: targetId } }
      : { $addToSet: { skippedUsers: targetId } };

    await User.findByIdAndUpdate(me._id, updateOp);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/people/skip error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при пропускане.' });
  }
});

// POST /api/people/remove
// Премахва приятел от списъка на двамата потребители
router.post('/remove', async (req, res) => {
  try {
    const { targetId } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Невалидни данни.' });
    }

    await Promise.all([
      User.findByIdAndUpdate(me._id, { $pull: { friends: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { friends: me._id } }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/people/remove error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при премахване на приятел.' });
  }
});

// POST /api/people/connect-by-code
// Търси реален потребител по Cosmic ID (NTL-XXXXXX) или имейл и изпраща покана
router.post('/connect-by-code', async (req, res) => {
  try {
    const { codeOrEmail } = req.body;
    const me = await resolveCurrentUser(req.account.id, req.account.email);

    if (!me || !codeOrEmail || !String(codeOrEmail).trim()) {
      return res.status(400).json({ success: false, message: 'Въведете валиден Cosmic ID или имейл.' });
    }

    const raw = String(codeOrEmail).trim();
    let target = null;

    if (raw.includes('@')) {
      target = await User.findOne({
        email: raw.toLowerCase(),
        _id: { $ne: me._id },
      });
    } else {
      const suffix = raw.replace(/^NTL-/i, '').toLowerCase();
      const candidates = await User.find({ _id: { $ne: me._id } });
      target =
        candidates.find((u) => String(u._id).toLowerCase().endsWith(suffix)) ||
        candidates.find((u) => u.name.toLowerCase() === raw.toLowerCase()) ||
        null;
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Не е намерен регистриран потребител с този Cosmic ID или имейл.',
      });
    }

    const targetIdStr = String(target._id);
    if ((me.friends || []).some((id) => String(id) === targetIdStr)) {
      return res.json({
        success: true,
        alreadyFriend: true,
        matched: true,
        person: annotatePerson(me, serializePerson(target, { category: 'friend' })),
      });
    }

    const isMutual = (me.receivedRequests || []).some((id) => String(id) === targetIdStr);

    if (isMutual) {
      await Promise.all([
        User.findByIdAndUpdate(me._id, {
          $addToSet: { friends: target._id },
          $pull: { receivedRequests: target._id, sentRequests: target._id },
        }),
        User.findByIdAndUpdate(target._id, {
          $addToSet: { friends: me._id },
          $pull: { sentRequests: me._id, receivedRequests: me._id },
        }),
      ]);

      return res.json({
        success: true,
        matched: true,
        person: annotatePerson(me, serializePerson(target, { category: 'friend' })),
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(me._id, { $addToSet: { sentRequests: target._id } }),
      User.findByIdAndUpdate(target._id, { $addToSet: { receivedRequests: me._id } }),
    ]);

    return res.json({
      success: true,
      matched: false,
      person: annotatePerson(me, serializePerson(target, { category: 'discover' })),
    });
  } catch (err) {
    console.error('POST /api/people/connect-by-code error:', err);
    return res.status(500).json({ success: false, message: 'Грешка при търсене на потребител.' });
  }
});

module.exports = router;
