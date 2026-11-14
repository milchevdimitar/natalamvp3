import * as Astronomy from 'astronomy-engine';
import { PlanetBodyConfig, ZodiacSignInfo } from './astrology.types';

export const DEFAULT_LAT = 42.6977; // София по подразбиране
export const DEFAULT_LON = 23.3219;
export const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180;

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { name: 'Aries', latin: 'ARIES', symbol: '♈', bgName: 'Овен' },
  { name: 'Taurus', latin: 'TAURUS', symbol: '♉', bgName: 'Телец' },
  { name: 'Gemini', latin: 'GEMINI', symbol: '♊', bgName: 'Близнаци' },
  { name: 'Cancer', latin: 'CANCER', symbol: '♋', bgName: 'Рак' },
  { name: 'Leo', latin: 'LEO', symbol: '♌', bgName: 'Лъв' },
  { name: 'Virgo', latin: 'VIRGO', symbol: '♍', bgName: 'Дева' },
  { name: 'Libra', latin: 'LIBRA', symbol: '♎', bgName: 'Везни' },
  { name: 'Scorpio', latin: 'SCORPIO', symbol: '♏', bgName: 'Скорпион' },
  { name: 'Sagittarius', latin: 'SAGITTARIUS', symbol: '♐', bgName: 'Стрелец' },
  { name: 'Capricorn', latin: 'CAPRICORN', symbol: '♑', bgName: 'Козирог' },
  { name: 'Aquarius', latin: 'AQUARIUS', symbol: '♒', bgName: 'Водолей' },
  { name: 'Pisces', latin: 'PISCES', symbol: '♓', bgName: 'Риби' },
];

export const PLANET_BODIES: PlanetBodyConfig[] = [
  { name: 'Sun', symbol: '☉', body: Astronomy.Body.Sun },
  { name: 'Moon', symbol: '☾', body: Astronomy.Body.Moon },
  { name: 'Mercury', symbol: '☿', body: Astronomy.Body.Mercury },
  { name: 'Venus', symbol: '♀', body: Astronomy.Body.Venus },
  { name: 'Mars', symbol: '♂', body: Astronomy.Body.Mars },
  { name: 'Jupiter', symbol: '♃', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', symbol: '♄', body: Astronomy.Body.Saturn },
  { name: 'Uranus', symbol: '♅', body: Astronomy.Body.Uranus },
  { name: 'Neptune', symbol: '♆', body: Astronomy.Body.Neptune },
  { name: 'Pluto', symbol: '♇', body: Astronomy.Body.Pluto },
  { name: 'North Node', symbol: '☊', isNode: true },
];