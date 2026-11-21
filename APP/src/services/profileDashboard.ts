import { SunPosition } from 'astronomy-engine';
import { CARDOLOGY_TABLE } from '../data/cardologyData';
import { chineseZodiacForYear } from '../data/chineseZodiac';
import { exploreRoutes, type ExploreRoute } from '../data/exploreRoutes';
import { getZodiacInfo } from '../screens/Home/home.calculations';
import { calculateLifePathNumber } from './profileManager';
import type { SystemActivity } from './systemActivity';

type BirthParts = { year: number; month: number; day: number };
type BirthProfile = {
  birthdate?: unknown; birthDate?: unknown; dateOfBirth?: unknown; dob?: unknown; birth_date?: unknown;
  profile?: { birthDate?: unknown; dateOfBirth?: unknown; dob?: unknown; birth_date?: unknown };
};
type DashboardProfile = BirthProfile & {
  natalChart?: { sunSign?: string; moonSign?: string; ascendant?: string; elements?: { shares?: ElementShares } & ElementShares };
  westernElements?: { shares?: ElementShares };
  numerology?: { lifePathNumber?: number; isMasterNumber?: boolean };
  cardology?: { birthCard?: string };
  mbti?: { type?: string };
  ayurveda?: { dominantDosha?: string; scores?: { vata?: number; pitta?: number; kapha?: number } };
  bazi?: { dayMaster?: string; zodiacAnimal?: string };
};

type ElementShares = Partial<Record<'fire' | 'earth' | 'air' | 'water', number>>;

function normalizedShares(values: Array<number | undefined>): number[] | undefined {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const total = numeric.reduce((sum, value) => sum + value, 0);
  if (numeric.length !== values.length || !total) return undefined;
  const exact = numeric.map((value) => value * 100 / total);
  const rounded = exact.map(Math.floor);
  const remainders = exact.map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  const remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  for (const { index } of remainders.slice(0, remaining)) rounded[index] += 1;
  return rounded;
}

export function getDashboardBalances(user: DashboardProfile | null, activity?: SystemActivity) {
  const western = user?.westernElements?.shares;
  const natal = user?.natalChart?.elements;
  const readElements = (shares?: ElementShares) => normalizedShares([shares?.fire, shares?.earth, shares?.air, shares?.water]);
  const local = activity?.ayurveda?.scores;
  const saved = user?.ayurveda?.scores;
  return {
    elements: readElements(western) ?? readElements(natal?.shares) ?? readElements(natal),
    doshas: normalizedShares([local?.Vata, local?.Pitta, local?.Kapha]) ?? normalizedShares([saved?.vata, saved?.pitta, saved?.kapha]),
  };
}

export const systemNames: Record<ExploreRoute, string> = {
  astrology: 'Astrology', numerology: 'Numerology', mbti: '16 Archetypes',
  cardology: 'Cardology', tarot: 'Tarot', ayurveda: 'Ayurveda', bazi: 'BaZi',
  'chinese-zodiac': 'Chinese Zodiac',
};

export type DashboardSystem = {
  route: ExploreRoute;
  name: string;
  value?: string;
  detail: string;
};

function validateDate(parts: BirthParts): BirthParts | undefined {
  const { year, month, day } = parts;
  if (![year, month, day].every(Number.isInteger) || year < 1000 || year > 9999) return;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() === year && check.getUTCMonth() + 1 === month && check.getUTCDate() === day) return parts;
}

function parseBirth(value: unknown): BirthParts | undefined {
  if (typeof value === 'string') {
    const input = value.trim();
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|T| )/.exec(input);
    if (iso) return validateDate({ year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) });
    const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(input);
    if (local) return validateDate({ year: Number(local[3]), month: Number(local[2]), day: Number(local[1]) });
  }
  if (value instanceof Date || typeof value === 'number') {
    const date = value instanceof Date ? value : new Date(value);
    return validateDate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
  }
  if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    return validateDate({ year: Number(value.year), month: Number(value.month), day: Number(value.day) });
  }
}

export function getBirthParts(user?: BirthProfile | null) {
  const candidates = [user?.birthdate, user?.birthDate, user?.dateOfBirth, user?.dob, user?.birth_date, user?.profile?.birthDate, user?.profile?.dateOfBirth, user?.profile?.dob, user?.profile?.birth_date];
  for (const value of candidates) {
    const date = parseBirth(value);
    if (date) return date;
  }
}

export function getDashboardSystems(user: DashboardProfile | null, activity?: SystemActivity): DashboardSystem[] {
  const birth = getBirthParts(user);
  const natal = user?.natalChart;
  const sun = natal?.sunSign || (birth && getZodiacInfo(SunPosition(new Date(Date.UTC(birth.year, birth.month - 1, birth.day, 12))).elon).sign);
  const lifePath = user?.numerology?.lifePathNumber ? user.numerology : birth && calculateLifePathNumber(birth.day, birth.month, birth.year);
  const card = birth && CARDOLOGY_TABLE.find((row) => row.Dates.split(';').some((token) => {
    const [day, month] = token.trim().split('.').map(Number);
    return day === birth.day && month === birth.month;
  }))?.Card;
  const type = user?.mbti?.type;
  const dosha = user?.ayurveda?.dominantDosha;
  const bazi = activity?.bazi ?? user?.bazi;
  const chinese = birth && chineseZodiacForYear(birth.year);
  const entries: Record<ExploreRoute, Pick<DashboardSystem, 'value' | 'detail'>> = {
    astrology: { value: sun, detail: sun ? ['Sun sign', natal?.moonSign && 'Moon in ' + natal.moonSign, natal?.ascendant && natal.ascendant + ' rising'].filter(Boolean).join(' · ') : 'Add a birth date to discover your Sun sign.' },
    numerology: { value: lifePath?.lifePathNumber ? String(lifePath.lifePathNumber) : undefined, detail: lifePath?.isMasterNumber ? 'Life path · Master number' : lifePath ? 'Life path number' : 'Add a birth date to calculate your life path.' },
    mbti: { value: type && /^[EI][SN][TF][JP]$/.test(type) ? type : undefined, detail: type ? 'Personality archetype' : 'Complete the questionnaire.' },
    cardology: { value: card || user?.cardology?.birthCard, detail: card || user?.cardology?.birthCard ? 'Birth card' : 'Add a birth date to find your birth card.' },
    ayurveda: { value: activity?.ayurveda?.constitution || (dosha && dosha.charAt(0).toUpperCase() + dosha.slice(1)), detail: activity?.ayurveda || dosha ? 'Dosha constitution' : 'Complete the dosha assessment.' },
    tarot: { value: activity?.tarot?.value, detail: activity?.tarot?.detail ?? 'Draw a daily card or reveal a spread.' },
    bazi: { value: bazi?.dayMaster || bazi?.zodiacAnimal, detail: bazi?.dayMaster && bazi.zodiacAnimal ? 'Day master · ' + bazi.zodiacAnimal : bazi?.dayMaster || bazi?.zodiacAnimal ? 'Four Pillars' : 'Save a Four Pillars reading for your profile.' },
    'chinese-zodiac': { value: chinese && chinese.element + ' ' + chinese.animal.name, detail: chinese ? chinese.polarity + ' · Birth-year sign' : 'Add a birth date to discover your birth-year animal.' },
  };
  return exploreRoutes.map((route) => ({ route, name: systemNames[route], ...entries[route] }));
}
