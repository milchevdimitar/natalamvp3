const express = require('express');
const { handlers, CalcInputError, setPlanetPositionLookup } = require('../calc');
const { getPlanetPosition } = require('./horizons');

const router = express.Router();
const { requireAccount, requireFeature } = require('./account');
for (const domain of ['bazi', 'ayurveda', 'mbti', 'numerology', 'cardology']) {
  router.use('/' + domain, requireAccount, requireFeature(domain));
}
// Home uses the atlas independently of the Explore Astrology screen.
router.use('/astrology', (req, res, next) => {
  if (req.path === '/atlas') return next();
  requireAccount(req, res, (error) => error ? next(error) : requireFeature('astrology')(req, res, next));
});

setPlanetPositionLookup(getPlanetPosition);

// POST /api/calc/:domain/:action — всички изчисления (астрология, BaZi, Аюрведа, MBTI, небе, нумерология, кардиология)
router.post('/:domain/:action', async (req, res) => {
  const { domain, action } = req.params;
  const actions = Object.hasOwn(handlers, domain) ? handlers[domain] : undefined;
  const handler = actions && Object.hasOwn(actions, action) ? actions[action] : undefined;

  if (!handler) {
    return res.status(404).json({ success: false, error: `Unknown calculation: ${domain}/${action}` });
  }

  try {
    const result = await handler(req.body || {});
    return res.json({ success: true, result });
  } catch (err) {
    if (err instanceof CalcInputError) {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error(`❌ [calc ${domain}/${action}]`, err);
    return res.status(500).json({ success: false, error: 'Calculation failed' });
  }
});

module.exports = router;
