const express = require('express');
const router = express.Router();

let Astronomy = null;
try {
  Astronomy = require('astronomy-engine');
} catch {
  // Използва се вграденият аналитичен калкулатор, ако пакетът не е инсталиран
}

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

// Кеш в паметта (ключ: "Sun_2026-11-18")
const ephemerisCache = new Map();
const inFlight = new Map();
let nasaQueue = Promise.resolve();

// Circuit Breaker: при 503/timeout от NASA превключва директно на локален режим за 10 мин.
let nasaCooldownUntil = 0;
const NASA_COOLDOWN_MS = 10 * 60 * 1000;

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

function computeLocalGeocentricLongitude(planet, dateObj) {
  if (Astronomy && Astronomy.Body && Astronomy.Body[planet]) {
    const geoVec = Astronomy.GeoVector(Astronomy.Body[planet], dateObj, true);
    const ecl = Astronomy.Ecliptic(geoVec);
    return ((ecl.elon % 360) + 360) % 360;
  }

  const jd = dateObj.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const norm = (a) => ((a % 360) + 360) % 360;

  const wSun = norm(282.9404 + 4.70935e-5 * d);
  const eSun = 0.016709 - 1.151e-9 * d;
  const MSun = norm(356.047 + 0.9856002585 * d);
  const ESun = MSun + eSun * deg * Math.sin(MSun * rad) * (1 + eSun * Math.cos(MSun * rad));
  const xvSun = Math.cos(ESun * rad) - eSun;
  const yvSun = Math.sqrt(1 - eSun * eSun) * Math.sin(ESun * rad);
  const vSun = Math.atan2(yvSun, xvSun) * deg;
  const rSun = Math.sqrt(xvSun * xvSun + yvSun * yvSun);
  const lonSun = norm(vSun + wSun);

  if (planet === 'Sun') return lonSun;

  if (planet === 'Moon') {
    const N = norm(125.1228 - 0.0529538083 * d);
    const i = 5.1454;
    const w = norm(318.0634 + 0.1643573223 * d);
    const a = 60.2666;
    const e = 0.0549;
    const M = norm(115.3654 + 13.0649929509 * d);
    const E = M + e * deg * Math.sin(M * rad) * (1 + e * Math.cos(M * rad));
    const xv = a * (Math.cos(E * rad) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E * rad);
    const v = Math.atan2(yv, xv) * deg;
    const r = Math.sqrt(xv * xv + yv * yv);
    const xh =
      r *
      (Math.cos(N * rad) * Math.cos((v + w) * rad) -
        Math.sin(N * rad) * Math.sin((v + w) * rad) * Math.cos(i * rad));
    const yh =
      r *
      (Math.sin(N * rad) * Math.cos((v + w) * rad) +
        Math.cos(N * rad) * Math.sin((v + w) * rad) * Math.cos(i * rad));
    let lonMoon = norm(Math.atan2(yh, xh) * deg);
    const Lm = norm(N + w + M);
    const D = norm(Lm - lonSun);
    const F = norm(Lm - N);
    lonMoon +=
      -1.274 * Math.sin((M - 2 * D) * rad) +
      0.658 * Math.sin(2 * D * rad) -
      0.186 * Math.sin(MSun * rad) -
      0.059 * Math.sin((2 * M - 2 * D) * rad) -
      0.057 * Math.sin((M - 2 * D + MSun) * rad) +
      0.053 * Math.sin((M + 2 * D) * rad) +
      0.046 * Math.sin((2 * D - MSun) * rad) +
      0.041 * Math.sin((M - MSun) * rad) -
      0.035 * Math.sin(D * rad) -
      0.031 * Math.sin((M + MSun) * rad) -
      0.015 * Math.sin((2 * F - 2 * D) * rad);
    return norm(lonMoon);
  }

  const ELEMENTS = {
    Mercury: [48.3313, 3.24587e-5, 7.0047, 5e-8, 29.1241, 1.01444e-5, 0.387098, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
    Venus: [76.6799, 2.4659e-5, 3.3946, 2.75e-8, 54.891, 1.38374e-5, 0.72333, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
    Mars: [49.5574, 2.11081e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
    Jupiter: [100.4542, 2.76854e-5, 1.303, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0.048498, 4.469e-9, 19.895, 0.0830853001],
    Saturn: [113.6634, 2.3898e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0.055546, -9.499e-9, 316.967, 0.0334442282],
    Uranus: [74.0005, 1.3978e-5, 0.7733, 1.9e-8, 96.6612, 3.0565e-5, 19.18171, 0.047318, 7.45e-9, 142.5905, 0.011725806],
    Neptune: [131.7806, 3.0173e-5, 1.77, -2.55e-7, 272.8461, -6.027e-6, 30.05826, 0.008606, 2.15e-9, 260.2471, 0.005995147],
    Pluto: [110.30347, 0, 17.14175, 0, 113.76329, 0, 39.48168677, 0.24880766, 0, 14.882, 0.003968],
  };

  const el = ELEMENTS[planet];
  if (!el) return lonSun;

  const N = norm(el[0] + el[1] * d);
  const i = el[2] + el[3] * d;
  const w = norm(el[4] + el[5] * d);
  const a = el[6];
  const e = el[7] + el[8] * d;
  const M = norm(el[9] + el[10] * d);

  let E = M + e * deg * Math.sin(M * rad) * (1 + e * Math.cos(M * rad));
  for (let iter = 0; iter < 4; iter++) {
    E = E - (E - e * deg * Math.sin(E * rad) - M) / (1 - e * Math.cos(E * rad));
  }

  const xv = a * (Math.cos(E * rad) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E * rad);
  const v = Math.atan2(yv, xv) * deg;
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh =
    r *
    (Math.cos(N * rad) * Math.cos((v + w) * rad) -
      Math.sin(N * rad) * Math.sin((v + w) * rad) * Math.cos(i * rad));
  const yh =
    r *
    (Math.sin(N * rad) * Math.cos((v + w) * rad) +
      Math.cos(N * rad) * Math.sin((v + w) * rad) * Math.cos(i * rad));

  const xEarth = rSun * Math.cos(lonSun * rad);
  const yEarth = rSun * Math.sin(lonSun * rad);

  return norm(Math.atan2(yh - yEarth, xh - xEarth) * deg);
}

function buildLocalPayload(planet, targetDate) {
  const fallbackLon = Math.round(computeLocalGeocentricLongitude(planet, targetDate) * 10000) / 10000;
  const zodiac = getZodiacInfo(fallbackLon);
  return {
    planet,
    longitude: fallbackLon,
    sign: zodiac.sign,
    symbol: zodiac.symbol,
    degree: zodiac.degree,
    isLiveNASA: false,
    source: Astronomy ? 'astronomy-engine-local' : 'analytical-ephemeris',
  };
}

// Връща геоцентричната дължина на планета за дата: NASA JPL Horizons с кеш и локален резерв
function getPlanetPosition(planet, targetDate) {
  const key = `${planet}_${targetDate.toISOString().slice(0, 10)}`;
  if (ephemerisCache.has(key)) return Promise.resolve(ephemerisCache.get(key));
  if (Date.now() < nasaCooldownUntil || inFlight.size >= 24) return Promise.resolve(buildLocalPayload(planet, targetDate));
  const existing = inFlight.get(key);
  if (existing) return existing;
  const request = nasaQueue.then(() => fetchPlanetPosition(planet, targetDate)).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  nasaQueue = request.catch(() => {});
  return request;
}

async function fetchPlanetPosition(planet, targetDate) {
  const command = PLANET_COMMANDS[planet];
  const startDateStr = targetDate.toISOString().split('T')[0];
  const cacheKey = `${planet}_${startDateStr}`;

  if (ephemerisCache.has(cacheKey)) {
    return ephemerisCache.get(cacheKey);
  }

  // Ако NASA наскоро е върнала 503 или timeout, изчисляваме мигновено локално
  if (Date.now() < nasaCooldownUntil) {
    return buildLocalPayload(planet, targetDate);
  }

  try {
    const nextDate = new Date(targetDate.getTime() + 86400000);
    const endDateStr = nextDate.toISOString().split('T')[0];

    const horizonsUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${command}'&CENTER='500@399'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&START_TIME='${startDateStr}'&STOP_TIME='${endDateStr}'&STEP_SIZE='1d'&QUANTITIES='31'`;

    const response = await fetch(horizonsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NatalaAstrologyApp/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`NASA HTTP ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.result || '';
    const soeIndex = resultText.indexOf('$$SOE');
    const eoeIndex = resultText.indexOf('$$EOE');

    if (soeIndex === -1 || eoeIndex === -1) {
      throw new Error('Липсват ефемеридни данни в отговора на NASA');
    }

    const dataBlock = resultText.substring(soeIndex + 5, eoeIndex).trim();
    const lines = dataBlock.split('\n');

    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      const longitude = parseFloat(parts[2]);

      if (!isNaN(longitude)) {
        const zodiac = getZodiacInfo(longitude);
        const payload = {
          planet,
          longitude,
          sign: zodiac.sign,
          symbol: zodiac.symbol,
          degree: zodiac.degree,
          isLiveNASA: true,
        };
        if (ephemerisCache.size >= 512) ephemerisCache.delete(ephemerisCache.keys().next().value);
        ephemerisCache.set(cacheKey, payload);
        return payload;
      }
    }

    throw new Error('Неуспешно парсване на данните от NASA');
  } catch (err) {
    if (Date.now() >= nasaCooldownUntil) {
      nasaCooldownUntil = Date.now() + NASA_COOLDOWN_MS;
      console.info(
        `ℹ️ NASA Horizons недостъпен (${err.cause?.code || err.message}) — превключване към локални ефемериди за 10 мин.`
      );
    }

    return buildLocalPayload(planet, targetDate);
  }
}

// GET /api/horizons?planet=Sun&date=2026-11-18
router.get('/', async (req, res) => {
  const { planet, date } = req.query;

  if (!PLANET_COMMANDS[planet]) {
    return res.status(400).json({ error: 'Невалидна планета' });
  }

  const targetDate = date ? new Date(date) : new Date();
  if (Number.isNaN(targetDate.getTime())) {
    return res.status(400).json({ error: 'Невалидна дата' });
  }

  return res.json(await getPlanetPosition(planet, targetDate));
});

module.exports = router;
module.exports.getPlanetPosition = getPlanetPosition;
module.exports.PLANET_NAMES = Object.keys(PLANET_COMMANDS);
