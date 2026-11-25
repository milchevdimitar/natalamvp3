const express = require('express');
const User = require('../models/User');
const { requireAccount } = require('./account');

const router = express.Router();
const slots = ['signature', 'exploring', 'ask'];
const view = (user) => ({
  discoverable: user.isDiscoverable !== false,
  cards: slots.flatMap((slot) => {
    const card = user.showcase?.[slot];
    return card?.text ? [{ slot, text: card.text, visible: card.visible === true }] : [];
  }),
});

router.get('/', requireAccount, (req, res) => res.json(view(req.account)));
router.put('/', requireAccount, async (req, res, next) => {
  try {
    const { cards, discoverable } = req.body ?? {};
    if (!Array.isArray(cards) || cards.length > slots.length || typeof discoverable !== 'boolean') {
      return res.status(400).json({ error: 'Choose up to three cards and a profile visibility.' });
    }
    const showcase = {};
    for (const card of cards) {
      if (!slots.includes(card?.slot) || Object.hasOwn(showcase, card.slot)
          || typeof card.text !== 'string' || !card.text.trim() || card.text.trim().length > 120
          || typeof card.visible !== 'boolean') {
        return res.status(400).json({ error: 'Each card needs a unique slot and up to 120 characters.' });
      }
      showcase[card.slot] = { text: card.text.trim(), visible: card.visible };
    }
    const saved = await User.findByIdAndUpdate(req.account._id, { $set: { showcase, isDiscoverable: discoverable } },
      { new: true, runValidators: true });
    if (!saved) return res.sendStatus(404);
    res.json(view(saved));
  } catch (error) { next(error); }
});

module.exports = router;
