const express = require('express');
const { handlers, CalcInputError, setPlanetPositionLookup } = require('../calc');
const { getPlanetPosition } = require('./horizons');

const router = express.Router();

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
