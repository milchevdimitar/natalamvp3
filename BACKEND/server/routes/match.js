const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ProfileSnapshotCache, PairMatchCache } = require('../models/MatchCache');
const {
  computeProfileFeatures,
  calculatePairCompatibilityFromSnapshots,
  getEligibleRankedCandidates,
  DEFAULT_MATCH_ENGINE_CONFIG,
} = require('../calc/match-engine');

// Strip private birth coordinates & exact birth time before returning candidate DTOs
function sanitizePublicCandidate(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  return {
    id: String(obj._id),
    name: obj.name,
    birthdate: obj.birthdate ? new Date(obj.birthdate).toISOString().slice(0, 7) : null, // YYYY-MM only
    birthCity: obj.birthCity?.name
      ? { name: obj.birthCity.name, country: obj.birthCity.country || '' }
      : null,
    mbti: obj.mbti?.type ? { type: obj.mbti.type } : null,
    natalChart: {
      sunSign: obj.natalChart?.sunSign || null,
      moonSign: obj.natalChart?.moonSign || null,
      ascendant: obj.hasExactBirthTime ? obj.natalChart?.ascendant || null : null,
    },
    interests: Array.isArray(obj.interests) ? obj.interests : [],
    bio: obj.bio || '',
  };
}

async function getOrComputeSnapshot(userObj, config = DEFAULT_MATCH_ENGINE_CONFIG) {
  const userId = String(userObj._id || userObj.id);
  const profileVersion = String(userObj.updatedAt ? new Date(userObj.updatedAt).getTime() : '1');

  const cached = await ProfileSnapshotCache.findOne({
    userId,
    profileVersion,
    rulesVersion: config.rulesVersion,
    ephemerisVersion: config.ephemerisVersion,
  }).lean();

  if (cached?.snapshot) return cached.snapshot;

  const snapshot = computeProfileFeatures({ ...userObj, id: userId, profileVersion }, config);
  await ProfileSnapshotCache.findOneAndUpdate(
    {
      userId,
      profileVersion,
      rulesVersion: config.rulesVersion,
      ephemerisVersion: config.ephemerisVersion,
    },
    { $set: { snapshot } },
    { upsert: true }
  );
  return snapshot;
}

// POST /api/match/pair — deterministic pair breakdown with immutable version cache
router.post('/pair', async (req, res) => {
  try {
    const { userAId, userBId } = req.body;
    if (!userAId || !userBId) {
      return res.status(400).json({ success: false, error: 'userAId and userBId are required' });
    }

    const [docA, docB] = await Promise.all([
      User.findById(userAId).lean(),
      User.findById(userBId).lean(),
    ]);
    if (!docA || !docB) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const config = DEFAULT_MATCH_ENGINE_CONFIG;
    const [snapA, snapB] = await Promise.all([
      getOrComputeSnapshot(docA, config),
      getOrComputeSnapshot(docB, config),
    ]);

    const [minId, maxId] = [String(docA._id), String(docB._id)].sort();
    const pairId = `${minId}::${maxId}`;
    const versionKey = `${snapA.profileVersion}:${snapB.profileVersion}:${config.rulesVersion}`;

    const cachedPair = await PairMatchCache.findOne({ pairId, versionKey }).lean();
    if (cachedPair?.result) {
      return res.json({ success: true, cached: true, result: cachedPair.result });
    }

    const result = calculatePairCompatibilityFromSnapshots(
      { ...docA, id: String(docA._id) },
      snapA,
      { ...docB, id: String(docB._id) },
      snapB,
      config
    );

    await PairMatchCache.findOneAndUpdate(
      { pairId, versionKey },
      { $set: { rulesVersion: config.rulesVersion, result } },
      { upsert: true }
    );

    return res.json({ success: true, cached: false, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/match/candidates?userId=...&limit=20&cursor=0
router.get('/candidates', async (req, res) => {
  try {
    const { userId, limit = '20', cursor = '0' } = req.query;
    const currentUser = await User.findById(userId).lean();
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Current user not found' });
    }

    // Fast DB-level pre-filtering before in-memory ranking (no O(N^2), no N+1)
    const excludedIds = [
      currentUser._id,
      ...(currentUser.blockedUserIds || []),
      ...(currentUser.dislikedUserIds || []),
      ...(currentUser.reportedUserIds || []),
    ];

    const rawCandidates = await User.find({
      _id: { $nin: excludedIds },
      isActive: { $ne: false },
      isDiscoverable: { $ne: false },
    })
      .limit(250)
      .lean();

    const page = getEligibleRankedCandidates(
      { ...currentUser, id: String(currentUser._id) },
      rawCandidates.map((c) => ({ ...c, id: String(c._id) })),
      { limit: Number(limit), cursor: String(cursor), requireDatingAdultCheck: true }
    );

    return res.json({
      success: true,
      items: page.items.map((item) => ({
        rank: item.rank,
        rankingTier: item.rankingTier,
        candidate: sanitizePublicCandidate(item.candidate),
        compatibility: item.compatibility,
      })),
      nextCursor: page.nextCursor,
      totalEligible: page.totalEligible,
      rulesVersion: page.rulesVersion,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Cache invalidation helper to call in User profile update routes
async function invalidateUserMatchCache(userId) {
  const idStr = String(userId);
  await Promise.all([
    ProfileSnapshotCache.deleteMany({ userId: idStr }),
    PairMatchCache.deleteMany({ pairId: { $regex: idStr } }),
  ]);
}

module.exports = { router, invalidateUserMatchCache };