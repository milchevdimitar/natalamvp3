import { Body, Ecliptic, EclipticGeoMoon, GeoVector, Illumination, MoonPhase, SearchMoonPhase, SunPosition } from 'astronomy-engine';
import { API_BASE_URL } from '../../services/api';
import { ZODIAC_SIGNS_DATA } from './home.constants';
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
      `${API_BASE_URL}/horizons?planet=${planetName}&date=${dateStr}`
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
