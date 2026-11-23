const { handlers } = require('../calc');
const User = require('../models/User');

async function saveBirthProfile(req, res, next) {
  try {
    const { year, month, day, time, city } = req.body || {};
    if (![year, month, day].every(Number.isInteger) || year < 1900 || year > new Date().getFullYear() ||
        typeof time !== 'string' || (time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      return res.status(400).json({ error: 'Enter a valid birth date and time.' });
    }
    const [hour, minute] = time ? time.split(':').map(Number) : [12, 0];
    const birthdate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    if (birthdate.getUTCDate() !== day || birthdate.getUTCMonth() + 1 !== month ||
        Date.UTC(year, month - 1, day) > Date.now()) return res.status(400).json({ error: 'Enter a valid birth date.' });
    if (typeof city?.name !== 'string' || !city.name.trim() || city.name.length > 200 ||
        !Number.isFinite(city.latitude) || Math.abs(city.latitude) > 90 ||
        !Number.isFinite(city.longitude) || Math.abs(city.longitude) > 180 || typeof city.timezone !== 'string') {
      return res.status(400).json({ error: 'Choose a birth city from the search results.' });
    }
    const birthCity = { name: city.name.trim(), country: typeof city.country === 'string' ? city.country.slice(0, 100) : '',
      latitude: city.latitude, longitude: city.longitude, timezone: city.timezone };
    let formatter;
    try {
      if (!birthCity.timezone) throw new Error();
      formatter = new Intl.DateTimeFormat('en', { timeZone: birthCity.timezone, timeZoneName: 'longOffset' });
    } catch {
      return res.status(400).json({ error: 'The selected city has no valid time zone. Select it again.' });
    }
    const birth = { birthdate, birthTime: time || null, hasExactBirthTime: Boolean(time), birthCity };
    const dStr = [day, month, year].map((part) => String(part).padStart(2, '0')).join('.');
    const { chart, profilePatch } = await handlers.astrology['natal-chart']({ birth: {
      dStr, tStr: time || '12:00', hasExactBirthTime: Boolean(time),
      lat: birthCity.latitude, lon: birthCity.longitude, cityName: birthCity.name, timezone: birthCity.timezone,
    } });
    if (!profilePatch) return res.status(422).json({ error: 'Could not calculate the natal chart for these details.' });
    if (!time) delete profilePatch.natalChart.ascendant;
    const offset = formatter.formatToParts(new Date(chart.birthDateTimeUtc))
      .find(({ type }) => type === 'timeZoneName')?.value.match(/GMT([+-])(\d{2}):(\d{2})/);
    const tzOffsetHours = offset ? (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) + Number(offset[3]) / 60) : 0;
    const { chart: fourPillars } = await handlers.bazi.chart({ input: {
      y: year, m: month, d: day, hour: time ? hour : null, minute,
      city: { name: birthCity.name, country: birthCity.country, longitude: birthCity.longitude, tzOffsetHours },
      gender: req.account.gender === 'male' ? 'male' : 'female',
    } });
    const life = await handlers.numerology['life-path']({ user: birth });
    const { card } = await handlers.cardology['birth-card']({ user: birth });
    const user = await User.findByIdAndUpdate(req.account.id, { $set: {
      ...birth, ...profilePatch,
      numerology: { lifePathNumber: life.lifePathNumber, isMasterNumber: [11, 22, 33].includes(life.lifePathNumber) },
      cardology: { birthCard: card?.code },
      bazi: { dayMaster: fourPillars.dayMaster.title, zodiacAnimal: fourPillars.zodiacAnimal },
    } }, { new: true, runValidators: true });
    if (!user) return res.sendStatus(404);
    res.json({ success: true, user });
  } catch (error) { next(error); }
}

module.exports = saveBirthProfile;
