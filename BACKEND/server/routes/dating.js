const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const DatingPair = require('../models/DatingPair');

const router = express.Router();
const genders = ['any', 'female', 'male', 'other'];
const minimumAge = 18;
const ageOn = (date, today = new Date()) => {
  if (!date || !Number.isFinite(date.getTime())) return 0;
  const beforeBirthday = today.getUTCMonth() < date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate());
  return today.getUTCFullYear() - date.getUTCFullYear() - Number(beforeBirthday);
};
const adult = (user) => ageOn(user.birthdate) >= minimumAge;
const includes = (ids, id) => (ids || []).some((entry) => String(entry) === String(id));
const blocked = (a, b) => includes(a.blockedUsers, b._id) || includes(b.blockedUsers, a._id);
const enabled = (user) => user.dating?.enabled && user.isActive !== false && adult(user);
const accepts = (a, b) => {
  const age = ageOn(b.birthdate);
  return age >= a.dating.minAge && age <= a.dating.maxAge &&
    (a.dating.preference === 'any' || a.dating.preference === b.gender);
};
const isMatch = (pair) => pair?.firstAction === 'like' && pair?.secondAction === 'like';
const targetFields = 'name email avatarUrl birthdate gender isActive blockedUsers dating natalChart.moonSign';
const publicCard = (user, viewer) => {
  const interests = user.dating.interests || [];
  const shared = interests.filter((item) => viewer.dating.interests.some((own) => own.toLowerCase() === item.toLowerCase()));
  const sameMoon = user.natalChart?.moonSign && user.natalChart.moonSign === viewer.natalChart?.moonSign;
  return {
    id: user.id, name: user.name, age: ageOn(user.birthdate), city: user.dating.city,
    photo: user.avatarUrl, bio: user.dating.bio, prompt: user.dating.prompt,
    interests, shared, sharedMoon: sameMoon ? user.natalChart.moonSign : undefined,
  };
};
const route = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) {
    console.error('Dating request failed:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'Dating could not complete this request.' });
  }
};

router.get('/', route(async (req, res) => {
  const me = req.account;
  const result = { eligible: adult(me), hasPhoto: Boolean(me.avatarUrl), settings: me.dating, discover: [], matches: [] };
  if (!enabled(me)) return res.json(result);

  const pairs = await DatingPair.find({ members: me.id }).lean();
  const excluded = new Set();
  const matches = [];
  for (const pair of pairs) {
    const first = pair.members[0] === me.id;
    const other = pair.members[first ? 1 : 0];
    if (pair[first ? 'firstAction' : 'secondAction'] || pair.closed) excluded.add(other);
    if (isMatch(pair) && !pair.closed) { matches.push(other); excluded.add(other); }
  }
  const today = new Date();
  const adultCutoff = new Date(Date.UTC(today.getUTCFullYear() - minimumAge, today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  const candidates = await User.find({
    birthdate: { $lte: adultCutoff },
    _id: { $nin: [...excluded, ...(me.blockedUsers || []), me.id] },
    isActive: { $ne: false }, 'dating.enabled': true, avatarUrl: { $type: 'string', $ne: '' },
    blockedUsers: { $ne: me._id },
    ...(me.dating.preference === 'any' ? {} : { gender: me.dating.preference }),
  }).select(targetFields).sort({ lastActiveAt: -1, _id: 1 }).cursor();
  for await (const other of candidates) {
    if (enabled(other) && accepts(me, other) && accepts(other, me)) result.discover.push(publicCard(other, me));
    if (result.discover.length >= 30) break;
  }
  const matchedUsers = await User.find({ _id: { $in: matches } }).select(targetFields);
  result.matches = matchedUsers.filter((other) => adult(other) && other.isActive !== false && !blocked(me, other))
    .map((other) => publicCard(other, me));
  res.json(result);
}));

router.put('/', route(async (req, res) => {
  const me = req.account;
  if (req.body.enabled === false) {
    await User.updateOne({ _id: me._id }, { $set: { 'dating.enabled': false } });
    return res.json({ success: true });
  }
  if (!adult(me) || !me.avatarUrl) return res.status(403).json({ message: 'Dating requires an adult account and profile photo.' });
  const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  const { preference, minAge, maxAge } = req.body;
  const bio = clean(req.body.bio, 240);
  const prompt = clean(req.body.prompt, 160);
  const city = clean(req.body.city, 60);
  const interests = Array.isArray(req.body.interests) ? [...new Set(req.body.interests.map((item) => clean(item, 24)).filter(Boolean))].slice(0, 5) : [];
  if (req.body.enabled !== true || !bio || !prompt || !genders.includes(preference) ||
    !Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < minimumAge || minAge > maxAge || maxAge > 100) {
    return res.status(400).json({ message: 'Add a bio, answer the prompt and choose a valid age range.' });
  }
  await User.updateOne({ _id: me._id }, { $set: { dating: { enabled: true, bio, prompt, city, interests, preference, minAge, maxAge } } });
  res.json({ success: true });
}));

router.post('/:id/action', route(async (req, res) => {
  const me = req.account;
  const { id } = req.params;
  const { action } = req.body;
  if (!mongoose.isValidObjectId(id) || id.toLowerCase() === me.id || !['like', 'pass', 'unmatch', 'block', 'report', 'chat'].includes(action)) {
    return res.status(400).json({ message: 'Invalid dating action.' });
  }
  const other = await User.findById(id).select(targetFields);
  if (!other) return res.status(404).json({ message: 'Profile unavailable.' });
  const members = [me.id, other.id].sort();
  const pairId = members.join(':');
  const slot = members[0] === me.id ? 'firstAction' : 'secondAction';
  if (['unmatch', 'block', 'report'].includes(action)) {
    const pair = action === 'block' ? null : await DatingPair.findById(pairId);
    if (action === 'unmatch' && !isMatch(pair)) return res.status(404).json({ message: 'Match unavailable.' });
    if (action === 'report' && !pair && !(enabled(me) && enabled(other) && !blocked(me, other) && accepts(me, other) && accepts(other, me))) {
      return res.status(404).json({ message: 'Profile unavailable.' });
    }
    if (action === 'block' || action === 'report') {
      const field = action === 'block' ? 'blockedUsers' : 'reportedUsers';
      await User.updateOne({ _id: me._id }, { $addToSet: { [field]: other._id } });
    }
    await DatingPair.updateOne({ _id: pairId }, { $set: { closed: true }, $setOnInsert: { members } }, { upsert: true });
    return res.json({ success: true });
  }
  if (!enabled(me) || blocked(me, other) || !adult(other) || other.isActive === false) {
    return res.status(403).json({ message: 'This profile is unavailable.' });
  }
  if (action === 'chat') {
    const pair = await DatingPair.findById(pairId);
    if (!isMatch(pair) || pair.closed) return res.status(403).json({ message: 'This match is no longer active.' });
    const chat = await Chat.findOneAndUpdate({ datingPair: pairId },
      { $setOnInsert: { participants: [me.email, other.email] } }, { upsert: true, new: true });
    return res.json({ chatId: chat.id });
  }
  if (!enabled(other) || !other.avatarUrl || !accepts(me, other) || !accepts(other, me)) {
    return res.status(403).json({ message: 'This profile is no longer available to discover.' });
  }
  await DatingPair.updateOne({ _id: pairId }, { $setOnInsert: { members } }, { upsert: true });
  const pair = await DatingPair.findOneAndUpdate(
    { _id: pairId, closed: { $ne: true }, [slot]: { $exists: false } }, { $set: { [slot]: action } }, { new: true },
  ) || await DatingPair.findById(pairId);
  res.json({ success: true, match: !pair?.closed && isMatch(pair) ? publicCard(other, me) : null });
}));

module.exports = router;
