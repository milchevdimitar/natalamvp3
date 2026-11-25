const express = require('express');
const { createHash } = require('node:crypto');
const { atlasChapters, atlasSteps, atlasVersion, nextAtlasStep } = require('../../../SHARED/atlasSteps');
const AtlasProgress = require('../models/AtlasProgress');

const router = express.Router();
const { requireAccount, requireFeature } = require('./account');
router.use(requireAccount);
const endpoint = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

function birthRevision(user, stepId) {
  if (!(user.birthdate instanceof Date) || !Number.isFinite(user.birthdate.getTime())) return null;
  const city = user.birthCity;
  const positionInputs = stepId === 'sun' ? [user.birthTime, city?.latitude, city?.longitude, city?.timezone] : [];
  return createHash('sha256').update(JSON.stringify([user.birthdate.toISOString(), ...positionInputs])).digest('hex');
}

async function progress(user) {
  const entries = await AtlasProgress.find({ owner: user._id, version: atlasVersion }).lean();
  return entries.filter((entry) => !entry.birthRevision || entry.birthRevision === birthRevision(user, entry.stepId));
}

function serialize(entries) {
  const completed = entries.map(({ stepId, choice }) => ({ stepId, ...(choice !== undefined && { choice }) }));
  return { completed, nextStepId: nextAtlasStep(atlasSteps, completed)?.id ?? null };
}

router.get('/progress', endpoint(async (req, res) => {
  res.json(serialize(await progress(req.account)));
}));

router.put('/steps/:id/completion', (req, res, next) => {
  const step = atlasSteps.find(({ id }) => id === req.params.id);
  return step?.requiresBirth ? requireFeature(step.route)(req, res, next) : next();
}, endpoint(async (req, res) => {
  const step = atlasSteps.find(({ id }) => id === req.params.id);
  if (!step) return res.status(404).json({ error: 'Station unavailable.' });
  const owner = req.account._id;
  const revision = step.requiresBirth ? birthRevision(req.account, step.id) : null;
  const choice = req.body?.choice;
  if (step.choices && (!Number.isInteger(choice) || choice < 0 || choice >= step.choices.length)) {
    return res.status(400).json({ error: 'Choose an answer before saving.' });
  }
  if (step.requiresBirth && !revision) return res.status(409).json({ error: 'Add your birth date before completing this station.' });
  const entries = await progress(req.account);
  const chapter = atlasChapters.find(({ steps }) => steps.includes(step));
  const next = nextAtlasStep(chapter.steps, entries);
  if (step.id !== next?.id && !entries.some(({ stepId }) => stepId === step.id)) {
    return res.status(409).json({ error: 'Complete the earlier stations first.' });
  }
  const key = { owner, stepId: step.id, version: atlasVersion };
  const expected = step.requiresBirth ? { birthRevision: revision } : { choice };
  const filter = { ...key, ...(step.requiresBirth ? { birthRevision: { $ne: revision } } : { choice: { $ne: choice } }) };
  const result = await AtlasProgress.findOneAndUpdate(filter, { $set: expected }, {
    upsert: true, new: true, includeResultMetadata: true,
  }).catch((error) => {
    if (error.code !== 11000) throw error;
    return null;
  });
  if (result && !result.lastErrorObject?.updatedExisting) {
    console.info('[atlas]', 'atlas_step_completed', String(result.value._id), new Date().toISOString());
  }
  res.json(serialize(await progress(req.account)));
}));

module.exports = router;
