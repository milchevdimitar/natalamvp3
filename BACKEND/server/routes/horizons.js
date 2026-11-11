const express = require('express');
const router = express.Router();

const PLANET_COMMANDS = {
  Sun: '10',
  Moon: '301',
  Mercury: '199',
  Venus: '299',
  Mars: '499',
  Jupiter: '599',
  Saturn: '699',
  Uranus: '799',
  Neptune: '899',
  Pluto: '999',
};

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
];

function getZodiacInfo(longitude) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const degree = Math.floor(normalized % 30);
  const zodiac = ZODIAC_SIGNS[index] || ZODIAC_SIGNS[0];
  return {
    sign: zodiac.name,
    symbol: zodiac.symbol,
    degree,
  };
}

// GET /api/horizons?planet=Sun&date=2026-11-11
router.get('/', async (req, res) => {
  try {
    const { planet, date } = req.query;
    const command = PLANET_COMMANDS[planet];

    if (!command) {
      return res.status(400).json({ error: 'Невалидна планета' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startDateStr = targetDate.toISOString().split('T')[0];
    const nextDate = new Date(targetDate.getTime() + 86400000);
    const endDateStr = nextDate.toISOString().split('T')[0];

    const horizonsUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${command}'&CENTER='500@399'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&START_TIME='${startDateStr}'&STOP_TIME='${endDateStr}'&STEP_SIZE='1d'&QUANTITIES='31'`;

    const response = await fetch(horizonsUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Грешка при заявка към NASA JPL API' });
    }

    const data = await response.json();
    const resultText = data.result || '';

    const soeIndex = resultText.indexOf('$$SOE'); const eoeIndex = resultText.indexOf('$$EOE');

    if (soeIndex === -1 || eoeIndex === -1) {
      return res.status(404).json({ error: 'Липсват ефемеридни данни в отговора на NASA' });
    }

    const dataBlock = resultText.substring(soeIndex + 5, eoeIndex).trim();
    const lines = dataBlock.split('\n');

    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      const longitude = parseFloat(parts[2]);

      if (!isNaN(longitude)) {
        const zodiac = getZodiacInfo(longitude);
        return res.json({
          planet,
          longitude,
          sign: zodiac.sign,
          symbol: zodiac.symbol,
          degree: zodiac.degree,
          isLiveNASA: true,
        });
      }
    }

    res.status(500).json({ error: 'Неуспешно парсване на данните от NASA' });
  } catch (err) {
    console.error('Horizons Proxy Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;