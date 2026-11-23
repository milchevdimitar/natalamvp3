const mongoose = require('mongoose');

const TIERS = ['free', 'plus', 'pro'];
const free = ['astrology', 'numerology', 'mbti', 'cardology', 'ayurveda', 'chinese-zodiac'];
const plus = [...free, 'tarot', 'bazi'];
const FEATURES = [...plus, 'pdf-report'];
const defaults = { free, plus, pro: FEATURES };
const Plan = mongoose.model('SubscriptionPlan', new mongoose.Schema({
  _id: { type: String, enum: TIERS },
  features: [{ type: String, enum: FEATURES }],
}));

async function listedPlans() {
  const records = await Plan.find({ _id: { $in: TIERS } }).lean();
  return { ...defaults, ...Object.fromEntries(records.map(({ _id, features }) => [_id, features])) };
}

async function featuresFor(tier) {
  if (tier === 'owner') return FEATURES;
  const plan = await Plan.findById(tier).lean();
  return plan?.features ?? defaults[tier];
}

module.exports = { Plan, TIERS, FEATURES, listedPlans, featuresFor };
