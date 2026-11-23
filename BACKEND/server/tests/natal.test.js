const assert = require('node:assert/strict');
const test = require('node:test');
const { computeNatalChart, parseDateTimeToUTC } = require('../calc/astrology/astrology.calculations');
const { NATAL_SIGNATURE_SUFFIX, normalizeDegrees } = require('../../../SHARED/natalGeometry');

test('Shumen chart matches the Swiss Ephemeris Placidus reference', () => {
  const chart = computeNatalChart('01.04.1994', '09:00', 43.27064, 26.92286, 'Europe/Sofia');
  assert.ok(chart);
  assert.equal(chart.birthDateTimeUtc, '1994-04-01T06:00:00.000Z');
  assert.equal(chart.houseSystem, 'Placidus');
  assert.ok(chart.signature.endsWith(NATAL_SIGNATURE_SUFFIX));
  assert.equal(chart.isDayChart, true);
  assert.deepEqual(
    ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
      .map((key) => chart.planetsByKey[key].house),
    [12, 7, 11, 12, 11, 6, 11, 9, 9, 6],
  );
  const reference = [58.34064, 82.83278, 102.94920, 123.97410, 150.63893, 189.40218,
    238.34064, 262.83278, 282.94920, 303.97410, 330.63893, 9.40218];
  reference.forEach((degree, index) => assert.ok(Math.abs(degree - chart.cusps[index + 1]) < 0.005));
  assert.ok(Math.abs(chart.planetsByKey.northNode.deg - 234.63467) < 0.02);
  assert.ok(Math.abs(chart.planetsByKey.lilith.deg - 29.36416) < 0.02);
});

test('civil-time conversion handles the DST gap, shift and overlap', () => {
  const convert = (date, time) => parseDateTimeToUTC(date, time, -74.006, 'America/New_York');
  assert.equal(convert('10.03.2024', '03:30').toISOString(), '2024-03-10T07:30:00.000Z');
  assert.ok(Number.isNaN(convert('10.03.2024', '02:30').getTime()));
  assert.equal(convert('03.11.2024', '01:30').toISOString(), '2024-11-03T05:30:00.000Z');
});

test('polar charts use an ordered and explicitly labeled Porphyry fallback', () => {
  const chart = computeNatalChart('15.06.1990', '12:00', 69.6492, 18.9553, 'Europe/Oslo');
  assert.ok(chart);
  assert.equal(chart.houseSystem, 'Porphyry');
  const cusps = chart.cusps.slice(1);
  const spans = cusps.map((degree, i) => normalizeDegrees(cusps[(i + 1) % 12] - degree));
  assert.ok(spans.every((span) => span > 0));
  assert.ok(Math.abs(spans.reduce((a, b) => a + b, 0) - 360) < 1e-7);
});
