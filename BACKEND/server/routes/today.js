const express = require('express');
const DailyEntry = require('../models/DailyEntry');
const { getMoonPhaseData } = require('../calc/sky/home.calculations');

const router = express.Router();
router.use(['/today', '/me/reflections'], require('./account').requireAccount);
const questions = [
  ['quiet', 'Room for quiet', 'When you need quiet, what do you usually do?', ['Ask for space', 'Go quiet', 'Keep going'], 'relationships'],
  ['energy', 'Where your energy goes', 'What would you like to make time for today?', ['Rest', 'Someone I love', 'Something I’m making'], 'ritual'],
  ['change', 'Start small', 'Where would a small change feel good?', ['My routine', 'A conversation', 'My surroundings'], 'myself'],
  ['attention', 'What stays with you', 'What deserves a little more of your attention today?', ['Something unfinished', 'Something enjoyable', 'Something I’ve avoided'], 'myself'],
  ['connection', 'A little closer', 'What kind of connection would feel good today?', ['A deep talk', 'Light company', 'Time to myself'], 'relationships'],
  ['balance', 'A slower rhythm', 'What would make today feel more balanced?', ['Fewer plans', 'More movement', 'A quiet pause'], 'ritual'],
  ['notice', 'Take a closer look', 'What do you want to notice more often?', ['What energizes me', 'Who makes me laugh', 'When I feel at ease'], 'myself'],
];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function dayInZone(zone, now) {
  if (typeof zone !== 'string' || zone.length > 100) return null;
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const value = (part) => parts.find(({ type }) => type === part).value;
    return [value('year'), value('month'), value('day')].join('-');
  } catch {
    return null;
  }
}

function selection(day, owner, interest, now) {
  const epochDay = Math.floor(Date.parse(day) / 86400000);
  const offset = Number.parseInt(String(owner).slice(-6), 16) || 0;
  const base = (epochDay + offset) % questions.length;
  const [id, title, question, options] = questions.find((row, i) => i === base && row[4] === interest)
    ?? (epochDay % 2 === 0 ? questions.find((row, i) => row[4] === interest && i >= base) : undefined)
    ?? questions[base];
  const moon = getMoonPhaseData(now);
  return { id, version: 1, title, question, options,
    reason: 'This question comes from Natala’s daily rotation. Today’s Moon is ' + moon.phaseName + '.' };
}

function publicEntry(entry) {
  return { date: entry.localDate, prompt: entry.prompt, answer: entry.answer };
}

function endpoint(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

router.get('/today/current', endpoint(async (req, res) => {
  const now = new Date();
  const zone = req.query.zone;
  const day = dayInZone(zone, now);
  if (!day) return res.status(400).json({ error: 'Choose a valid time zone.' });
  const key = { owner: req.account._id, localDate: day };
  const prompt = selection(day, key.owner, req.query.interest, now);
  const entry = await DailyEntry.findOneAndUpdate(key, { $setOnInsert: { zone, prompt } },
    { upsert: true, new: true, timestamps: { updatedAt: false } })
    .catch((error) => {
      if (error.code !== 11000) throw error;
      return DailyEntry.findOne(key);
    });
  return res.json(publicEntry(entry));
}));

router.put('/today/:date/answer', endpoint(async (req, res) => {
  const { date } = req.params;
  const { zone, answer, promptId, version } = req.body ?? {};
  const localDate = dayInZone(zone, new Date());
  if (!localDate || !datePattern.test(date)) return res.status(400).json({ error: 'Invalid local date or time zone.' });
  if (date !== localDate) return res.status(409).json({ error: 'A new daily moment is available. Refresh to continue.' });
  const key = { owner: req.account._id, localDate: date };
  const entry = await DailyEntry.findOne(key);
  if (!entry || entry.prompt.id !== promptId || entry.prompt.version !== version) {
    return res.status(409).json({ error: 'Refresh today’s question and try again.' });
  }
  if (!Number.isInteger(answer) || answer < 0 || answer >= entry.prompt.options.length) {
    return res.status(400).json({ error: 'Choose one of the available answers.' });
  }
  const first = await DailyEntry.findOneAndUpdate({ ...key, answer: null }, { $set: { answer } }, { new: true });
  if (first) {
    console.info('[today]', 'daily_answer_saved', String(first._id), new Date().toISOString());
    return res.json(publicEntry(first));
  }
  // Corrections keep the same entry. A replay of the same answer performs no write.
  const saved = await DailyEntry.findOneAndUpdate({ ...key, answer: { $ne: answer } },
    { $set: { answer } }, { new: true }) ?? await DailyEntry.findOne(key);
  return res.json(publicEntry(saved));
}));

router.get('/me/reflections', endpoint(async (req, res) => {
  const { cursor } = req.query;
  if (cursor !== undefined && (typeof cursor !== 'string' || !datePattern.test(cursor))) {
    return res.status(400).json({ error: 'Invalid history cursor.' });
  }
  const rows = await DailyEntry.find({
    owner: req.account._id, answer: { $ne: null }, ...(cursor && { localDate: { $lt: cursor } }),
  }).sort({ localDate: -1 }).limit(21).lean();
  return res.json({ entries: rows.slice(0, 20).map(publicEntry), nextCursor: rows.length > 20 ? rows[19].localDate : null });
}));

module.exports = router;
