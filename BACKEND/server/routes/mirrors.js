const { createHash, randomBytes } = require('node:crypto');
const express = require('express');
const User = require('../models/User');
const Mirror = require('../models/MirrorSession');
const { canViewFriendship: isAllowed } = require('./circleAccess');

const router = express.Router();
router.use(require('./account').requireAccount);
const rows = [
  ['quiet', 'When I need quiet, what do I usually do?', 'Ask for space', 'Go quiet', 'Keep going'],
  ['care', 'What makes me feel cared for?', 'A kind word', 'Time together', 'A practical gesture'],
  ['rest', 'How do I reset after a long day?', 'Move around', 'Talk it through', 'Spend time alone'],
  ['plans', 'What do I want from a free afternoon?', 'A familiar place', 'Something new', 'No plans'],
  ['change', 'What helps me try something new?', 'A clear plan', 'Someone beside me', 'Room to improvise'],
  ['listen', 'When I’m upset, how do I want a friend to respond?', 'Listen first', 'Offer ideas', 'Give me time'],
  ['notice', 'What am I most likely to notice first?', 'The mood', 'The details', 'The possibilities'],
];
const questions = rows.map(([id, text, ...options]) => ({ id, version: 1, text, options }));
const objectId = /^[a-f\d]{24}$/i;
const answerValid = (answer, question) => Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
const endpoint = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const participantFilter = (id) => ({ $or: [{ initiator: id }, { recipient: id }] });

async function connections(account) {
  const list = await User.find({ _id: { $in: account.friends || [] }, blockedUsers: { $ne: account._id } })
    .select('name email friends blockedUsers isActive').sort({ name: 1 }).lean();
  return list.filter((user) => isAllowed(account, user));
}

function serialize(session, me, other) {
  const author = String(session.initiator) === String(me);
  const result = {
    id: String(session._id), status: session.status, question: session.question,
    role: author ? 'initiator' : 'recipient', other: { id: String(other._id), name: other.name },
  };
  if (session.status === 'revealed') {
    return { ...result, ownAnswer: session.ownAnswer, guess: session.guess, chatEmail: other.email };
  }
  return author && session.status === 'pending' ? { ...result, ownAnswer: session.ownAnswer } : result;
}

async function available(req) {
  if (!objectId.test(req.params.id)) return null;
  const session = await Mirror.findOne({ _id: req.params.id, ...participantFilter(req.account._id) }).lean();
  if (!session) return null;
  const author = String(session.initiator) === req.account.id;
  const other = await User.findById(author ? session.recipient : session.initiator)
    .select('name email friends blockedUsers isActive').lean();
  return isAllowed(req.account, other) ? { session, author, other } : null;
}

router.get('/', endpoint(async (req, res) => {
  const friends = await connections(req.account);
  const people = new Map(friends.map((person) => [String(person._id), person]));
  const sessions = await Mirror.find(participantFilter(req.account._id)).sort({ updatedAt: -1 }).limit(60).lean();
  const visible = sessions.flatMap((session) => {
    const otherId = String(String(session.initiator) === req.account.id ? session.recipient : session.initiator);
    const other = people.get(otherId);
    return other ? [serialize(session, req.account._id, other)] : [];
  });
  res.json({ friends: friends.map(({ _id, name }) => ({ id: String(_id), name })), questions, sessions: visible });
}));

router.post('/', endpoint(async (req, res) => {
  const { recipient, clientRequestId, questionId, answer } = req.body ?? {};
  const question = questions.find(({ id }) => id === questionId);
  if (typeof recipient !== 'string' || !objectId.test(recipient) || recipient.toLowerCase() === req.account.id
      || typeof clientRequestId !== 'string' || !/^[\w-]{12,80}$/.test(clientRequestId)
      || !question || !answerValid(answer, question)) {
    return res.status(400).json({ error: 'Choose a friend, question and answer.' });
  }
  const other = await User.findById(recipient).select('name email friends blockedUsers isActive').lean();
  if (!isAllowed(req.account, other)) return res.status(404).json({ error: 'Friend unavailable.' });
  const key = { initiator: req.account._id, clientRequestId };
  const result = await Mirror.findOneAndUpdate(key, {
    $setOnInsert: { recipient: other._id, question, ownAnswer: answer },
  }, { upsert: true, new: true, includeResultMetadata: true, timestamps: { updatedAt: false } }).catch(async (error) => {
    if (error.code !== 11000) throw error;
    return { value: await Mirror.findOne(key) };
  });
  const session = result.value;
  if (String(session.recipient) !== String(other._id) || session.question.id !== questionId || session.ownAnswer !== answer) {
    return res.status(409).json({ error: 'This request ID already belongs to a different invitation.' });
  }
  if (!result.lastErrorObject?.updatedExisting && result.lastErrorObject) {
    console.info('[mirror]', 'mirror_invited', String(session._id), new Date().toISOString());
  }
  res.json(serialize(session, req.account._id, other));
}));

const invalidInvite = { error: 'This invite is unavailable. Ask your friend for a fresh link.' };
const inviteDigest = (token) => createHash('sha256').update(token).digest('hex');

router.post('/:id/link', endpoint(async (req, res) => {
  const entry = await available(req);
  if (!entry || !entry.author) return res.status(404).json(invalidInvite);
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const result = await Mirror.findOneAndUpdate({
    _id: entry.session._id, initiator: req.account._id, status: 'pending',
  }, { $set: { invite: { digest: inviteDigest(token), expiresAt } } });
  if (!result) return res.status(404).json(invalidInvite);
  return res.json({ token, expiresAt });
}));

router.post('/redeem-link', endpoint(async (req, res) => {
  const { token } = req.body ?? {};
  if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) return res.status(404).json(invalidInvite);
  const now = new Date();
  const key = { recipient: req.account._id, 'invite.digest': inviteDigest(token), 'invite.expiresAt': { $gt: now } };
  const session = await Mirror.findOne(key).lean();
  if (!session) return res.status(404).json(invalidInvite);
  const other = await User.findById(session.initiator).select('friends blockedUsers isActive').lean();
  if (!isAllowed(req.account, other)) return res.status(404).json(invalidInvite);

  const redeemed = await Mirror.findOneAndUpdate({ ...key, status: 'pending', 'invite.redeemedAt': { $exists: false } },
    { $set: { 'invite.redeemedAt': now } }, { new: true, timestamps: false });
  if (redeemed) return res.json({ sessionId: String(redeemed._id) });

  // A retry by the designated recipient can return to an already opened session.
  const retry = await Mirror.findOne({
    ...key, status: { $in: ['pending', 'revealed'] }, 'invite.redeemedAt': { $exists: true },
  }).select('_id').lean();
  if (!retry) return res.status(404).json(invalidInvite);
  return res.json({ sessionId: String(retry._id) });
}));

router.get('/:id', endpoint(async (req, res) => {
  const entry = await available(req);
  if (!entry) return res.status(404).json({ error: 'Mirror unavailable.' });
  res.json(serialize(entry.session, req.account._id, entry.other));
}));

router.put('/:id/answer', endpoint(async (req, res) => {
  const entry = await available(req);
  if (!entry || entry.author) return res.status(404).json({ error: 'Mirror unavailable.' });
  const { answer } = req.body ?? {};
  if (!answerValid(answer, entry.session.question)) return res.status(400).json({ error: 'Choose an available answer.' });
  const changed = await Mirror.findOneAndUpdate({ _id: entry.session._id, status: 'pending' },
    { $set: { guess: answer, status: 'revealed', revealedAt: new Date() } }, { new: true });
  const result = changed ?? await Mirror.findById(entry.session._id);
  if (!result || result.status !== 'revealed') return res.status(409).json({ error: 'This invitation is no longer pending.' });
  if (changed) {
    console.info('[mirror]', 'mirror_joined', String(changed._id), new Date().toISOString());
    console.info('[mirror]', 'mirror_revealed', String(changed._id), new Date().toISOString());
  }
  res.json(serialize(result, req.account._id, entry.other));
}));

async function close(req, res, author, status) {
  const entry = await available(req);
  if (!entry || entry.author !== author) return res.status(404).json({ error: 'Mirror unavailable.' });
  const result = await Mirror.findOneAndUpdate({ _id: entry.session._id, status: 'pending' },
    { $set: { status } }, { new: true }) ?? await Mirror.findById(entry.session._id);
  if (!result || result.status !== status) return res.status(409).json({ error: 'This invitation is no longer pending.' });
  res.json(serialize(result, req.account._id, entry.other));
}

router.post('/:id/decline', endpoint((req, res) => close(req, res, false, 'declined')));
router.post('/:id/cancel', endpoint((req, res) => close(req, res, true, 'cancelled')));

module.exports = router;
