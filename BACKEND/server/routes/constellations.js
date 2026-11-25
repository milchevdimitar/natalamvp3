const express = require('express');
const User = require('../models/User');
const Mirror = require('../models/MirrorSession');
const Memory = require('../models/CircleMemory');
const { requireAccount } = require('./account');
const { canViewFriendship } = require('./circleAccess');

const router = express.Router();
const objectId = /^[a-f\d]{24}$/i;
const endpoint = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const personFields = 'name interests friends blockedUsers isActive';

router.use(requireAccount);
router.param('friendId', (req, res, next, id) => {
  if (!objectId.test(id) || id.toLowerCase() === req.account.id) return res.status(404).json({ error: 'Constellation unavailable.' });
  User.findById(id).select(personFields).lean().then((other) => {
    if (!canViewFriendship(req.account, other)) return res.status(404).json({ error: 'Constellation unavailable.' });
    req.circleFriend = other;
    req.circlePair = [req.account.id, String(other._id)].sort().join(':');
    next();
  }).catch(next);
});

function visibleMemory(memory, owner) {
  return { id: String(memory._id), text: memory.text, status: memory.status,
    proposedByYou: String(memory.proposer) === owner };
}

router.get('/:friendId', endpoint(async (req, res) => {
  const me = req.account;
  const other = req.circleFriend;
  const [mirrors, entries] = await Promise.all([
    Mirror.find({ status: 'revealed', $or: [
      { initiator: me._id, recipient: other._id },
      { initiator: other._id, recipient: me._id },
    ] }).select('question.text revealedAt').sort({ revealedAt: -1 }).limit(20).lean(),
    Memory.find({ pair: req.circlePair, status: { $ne: 'removed' } }).sort({ updatedAt: -1 }).limit(40).lean(),
  ]);
  const normalize = (text) => text.trim().toLowerCase();
  const theirInterests = new Set((other.interests || []).map(normalize));
  const interests = [...new Set((me.interests || []).map(normalize).filter((text) => text && theirInterests.has(text)))].sort();
  res.json({
    friend: { id: String(other._id), name: other.name },
    interests,
    mirrors: mirrors.map(({ _id, question, revealedAt }) => ({ id: String(_id), title: question.text, date: revealedAt })),
    memories: entries.map((item) => visibleMemory(item, me.id)),
  });
}));

router.post('/:friendId/memories', endpoint(async (req, res) => {
  const { text, requestId } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 160
      || typeof requestId !== 'string' || !/^[\w-]{12,80}$/.test(requestId)) {
    return res.status(400).json({ error: 'Write a memory of up to 160 characters.' });
  }
  const key = { proposer: req.account._id, requestId };
  const memory = await Memory.findOneAndUpdate(key,
    { $setOnInsert: { pair: req.circlePair, recipient: req.circleFriend._id, text: text.trim(), status: 'pending' } },
    { upsert: true, new: true, timestamps: { updatedAt: false } }).catch((error) => {
    if (error.code !== 11000) throw error;
    return Memory.findOne(key);
  });
  if (memory.pair !== req.circlePair || memory.text !== text.trim()) return res.status(409).json({ error: 'Refresh and try again.' });
  res.json(visibleMemory(memory, req.account.id));
}));

router.put('/:friendId/memories/:id', endpoint(async (req, res) => {
  const { id } = req.params;
  if (!objectId.test(id)) return res.status(404).json({ error: 'Memory unavailable.' });
  const key = { _id: id, pair: req.circlePair, recipient: req.account._id };
  const memory = await Memory.findOneAndUpdate({ ...key, status: 'pending' }, { $set: { status: 'saved' } }, { new: true })
    ?? await Memory.findOne({ ...key, status: 'saved' });
  if (!memory) return res.status(404).json({ error: 'Memory unavailable.' });
  res.json(visibleMemory(memory, req.account.id));
}));

router.delete('/:friendId/memories/:id', endpoint(async (req, res) => {
  const { id } = req.params;
  if (!objectId.test(id)) return res.status(404).json({ error: 'Memory unavailable.' });
  await Memory.updateOne({ _id: id, pair: req.circlePair, status: { $ne: 'removed' } },
    { $set: { status: 'removed' }, $unset: { text: 1 } });
  res.sendStatus(204);
}));

module.exports = router;
