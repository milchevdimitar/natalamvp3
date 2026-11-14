import { API_BASE_URL, ZODIAC_SIGNS_DATA } from './home.constants';
import { MoonPhaseData, ZodiacInfo } from './home.types';

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

/** Извлича еклиптична дължина за планета през собствения Express бекенд */
export async function fetchJPLPlanetPosition(
  planetName: string,
  dateObj = new Date()
): Promise<{ longitude: number; sign: string; degree: number; symbol: string } | null> {
  try {
    const dateStr = dateObj.toISOString().split('T')[0];
    const response = await fetch(
      `${API_BASE_URL}/api/horizons?planet=${planetName}&date=${dateStr}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data && typeof data.longitude === 'number') {
      return {
        longitude: data.longitude,
        sign: data.sign,
        degree: data.degree,
        symbol: data.symbol,
      };
    }
    return null;
  } catch (error) {
    console.warn(`[JPL Horizons Proxy Error] ${planetName}:`, error);
    return null;
  }
}

/** Изчислява прецизно фазата, осветеността и възрастта на Луната */
export function getMoonPhaseData(date = new Date()): MoonPhaseData {
  const synodicMonth = 29.53058770576;
  const knownNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  const cyclePosition = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;

  const phasePercent = (cyclePosition / synodicMonth) * 100;
  const illuminated = Math.round(
    ((1 - Math.cos((cyclePosition / synodicMonth) * 2 * Math.PI)) / 2) * 100
  );

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
    ageInDays: cyclePosition.toFixed(1),
  };
}

/** Алгоритмичен резервен изчислетел (Fallback при офлайн режим) */
export function getFallbackRawLongitudes(dObj: Date) {
  const julianDate = dObj.getTime() / 86400000 + 2440587.5;
  const d = julianDate - 2451545.0;

  const g = (((357.529 + 0.98560028 * d) % 360) * Math.PI) / 180;
  const sunLong =
    (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360;

  const Lm = (218.316 + 13.176396 * d) % 360;
  const Mm = (((134.963 + 13.064993 * d) % 360) * Math.PI) / 180;
  const Fm = (((93.272 + 13.22935 * d) % 360) * Math.PI) / 180;
  const moonLong =
    (Lm + 6.289 * Math.sin(Mm) - 1.274 * Math.sin(Mm - 2 * Fm)) % 360;

  const earthLong = (sunLong + 180) % 360;

  const mercMean = (252.251 + 4.0923344 * d) % 360;
  const mercLong =
    (sunLong + 23 * Math.sin((((mercMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  const venusMean = (181.979 + 1.6021302 * d) % 360;
  const venusLong =
    (sunLong + 42 * Math.sin((((venusMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  const calcOuterGeocentric = (helioMeanLong: number, semiMajorAxis: number) => {
    const alpha = (((earthLong - helioMeanLong) % 360) * Math.PI) / 180;
    const theta = Math.atan2(Math.sin(alpha), semiMajorAxis - Math.cos(alpha));
    return (((helioMeanLong + (theta * 180) / Math.PI) % 360) + 360) % 360;
  };

  const marsHelio = (355.433 + 0.524033 * d) % 360;
  const jupHelio = (34.351 + 0.0830853 * d) % 360;
  const satHelio = (50.077 + 0.0334442 * d) % 360;
  const uranHelio = (314.055 + 0.01172834 * d) % 360;
  const nepHelio = (304.349 + 0.00598106 * d) % 360;
  const plutoHelio = (238.96 + 0.0039757 * d) % 360;

  return {
    Sun: sunLong,
    Moon: moonLong,
    Mercury: mercLong,
    Venus: venusLong,
    Mars: calcOuterGeocentric(marsHelio, 1.524),
    Jupiter: calcOuterGeocentric(jupHelio, 5.204),
    Saturn: calcOuterGeocentric(satHelio, 9.582),
    Uranus: calcOuterGeocentric(uranHelio, 19.201),
    Neptune: calcOuterGeocentric(nepHelio, 30.047),
    Pluto: calcOuterGeocentric(plutoHelio, 39.482),
  };
}

export function checkRetrograde(todayDeg: number, tomorrowDeg: number): boolean {
  let diff = tomorrowDeg - todayDeg;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

export function getElementColor(element: string, fallbackColor: string): string {
  switch (element) {
    case 'Fire':
      return '#EF4444';
    case 'Earth':
      return '#10B981';
    case 'Air':
      return '#3B82F6';
    case 'Water':
      return '#8B5CF6';
    default:
      return fallbackColor;
  }
}