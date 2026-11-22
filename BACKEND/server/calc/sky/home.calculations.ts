import { Body, Ecliptic, EclipticGeoMoon, GeoVector, Illumination, MoonPhase, SearchMoonPhase, SunPosition } from 'astronomy-engine';
import { PLANET_METADATA, ZODIAC_SIGNS_DATA } from './home.constants';
import { DetailedPlanetPosition, MoonPhaseData, ZodiacInfo } from './home.types';

export function getZodiacInfo(longitude: number): ZodiacInfo {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const degree = Math.floor(normalized % 30);
  const signData = ZODIAC_SIGNS_DATA[index] || ZODIAC_SIGNS_DATA[0];

  return {
    sign: signData.name,
    symbol: signData.symbol,
    element: signData.element,
    degree,
  };
}

/** Изчислява прецизно фазата, осветеността и възрастта на Луната */
export function getMoonPhaseData(date = new Date()): MoonPhaseData {
  const synodicMonth = 29.53058770576;
  const phasePercent = MoonPhase(date) / 3.6;
  const cyclePosition = phasePercent / 100 * synodicMonth;
  const previousNewMoon = SearchMoonPhase(0, date, -31);
  const age = previousNewMoon ? (date.getTime() - previousNewMoon.date.getTime()) / 86400000 : cyclePosition;
  const illuminated = Math.round(Illumination(Body.Moon, date).phase_fraction * 100);

  let phaseName = '';
  let symbol = '';
  let isSpecial = false;

  if (cyclePosition < 1.84 || cyclePosition >= 27.68) {
    phaseName = 'New Moon';
    symbol = '🌑';
    isSpecial = true;
  } else if (cyclePosition < 5.53) {
    phaseName = 'Waxing Crescent';
    symbol = '🌒';
  } else if (cyclePosition < 9.22) {
    phaseName = 'First Quarter';
    symbol = '🌓';
  } else if (cyclePosition < 12.91) {
    phaseName = 'Waxing Gibbous';
    symbol = '🌔';
  } else if (cyclePosition < 16.61) {
    phaseName = 'Full Moon';
    symbol = '🌕';
    isSpecial = true;
  } else if (cyclePosition < 20.3) {
    phaseName = 'Waning Gibbous';
    symbol = '🌖';
  } else if (cyclePosition < 23.99) {
    phaseName = 'Last Quarter';
    symbol = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    symbol = '🌘';
  }

  return {
    cyclePosition,
    phasePercent,
    illuminated,
    phaseName,
    symbol,
    isSpecial,
    ageInDays: age.toFixed(1),
  };
}

/** Алгоритмичен резервен изчислетел (Fallback при офлайн режим) */
export function getFallbackRawLongitudes(date: Date) {
  const longitude = (body: Body) => Ecliptic(GeoVector(body, date, true)).elon;

  return {
    Sun: SunPosition(date).elon,
    Moon: EclipticGeoMoon(date).lon,
    Mercury: longitude(Body.Mercury),
    Venus: longitude(Body.Venus),
    Mars: longitude(Body.Mars),
    Jupiter: longitude(Body.Jupiter),
    Saturn: longitude(Body.Saturn),
    Uranus: longitude(Body.Uranus),
    Neptune: longitude(Body.Neptune),
    Pluto: longitude(Body.Pluto),
  };
}

export function checkRetrograde(todayDeg: number, tomorrowDeg: number): boolean {
  let diff = tomorrowDeg - todayDeg;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

export type PlanetPositionLookup = (
  planetName: string,
  dateObj: Date
) => Promise<{ longitude: number; isLiveNASA?: boolean } | null>;

/** Позиции на планетите за днес (JPL Horizons чрез lookup, с аналитичен резерв) + ретроградност */
export async function computePlanetaryPositions(
  lookup: PlanetPositionLookup,
  todayObj = new Date()
): Promise<DetailedPlanetPosition[]> {
  const planetNames = Object.keys(PLANET_METADATA);
  const tomorrowObj = new Date(todayObj.getTime() + 86400000);

  const fallbackLongsToday = getFallbackRawLongitudes(todayObj);
  const fallbackLongsTomorrow = getFallbackRawLongitudes(tomorrowObj);

  const safeLookup = (name: string, d: Date) => lookup(name, d).catch(() => null);
  const [resultsToday, resultsTomorrow] = await Promise.all([
    Promise.all(planetNames.map((name) => safeLookup(name, todayObj))),
    Promise.all(planetNames.map((name) => safeLookup(name, tomorrowObj))),
  ]);

  return planetNames.map((name, idx) => {
    const meta = PLANET_METADATA[name];
    const jplToday = resultsToday[idx];
    const jplTomorrow = resultsTomorrow[idx];

      const hasLivePair = Boolean(jplToday?.isLiveNASA && jplTomorrow?.isLiveNASA);
      const longitude = hasLivePair && jplToday
      ? jplToday.longitude
      : fallbackLongsToday[name as keyof typeof fallbackLongsToday];
      const tomorrowLong = hasLivePair && jplTomorrow
      ? jplTomorrow.longitude
      : fallbackLongsTomorrow[name as keyof typeof fallbackLongsTomorrow];

    const isRetrograde =
      name === 'Sun' || name === 'Moon' ? false : checkRetrograde(longitude, tomorrowLong);
    const zodiacInfo = getZodiacInfo(longitude);
    const degInSign = zodiacInfo.degree;
    const progressPercent = Math.min(100, Math.max(5, (degInSign / 30) * 100));

    return {
      planet: meta.symbol,
      name,
      signName: zodiacInfo.sign,
      degInSign,
      zodiacSymbol: zodiacInfo.symbol,
      progressPercent,
      isRetrograde,
      longitude,
        isLiveNASA: hasLivePair,
      meta,
    };
  });
}

/** Фаза на Луната + зодия на Луната за конкретна дата */
export function getMoonDayInfo(date: Date): { phase: MoonPhaseData; zodiac: ZodiacInfo } {
  return { phase: getMoonPhaseData(date), zodiac: getZodiacInfo(EclipticGeoMoon(date).lon) };
}
