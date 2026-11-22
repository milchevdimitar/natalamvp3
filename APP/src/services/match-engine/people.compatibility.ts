import * as MatchEngine from '../../services/match-engine';
import type {
  UserMatchInput,
  WesternElementVector,
} from '../../services/match-engine';
import {
  CompatibilityBreakdown,
  PersonProfile,
  ZodiacElement,
} from './people.types';

export const SIGN_ELEMENTS: Record<string, ZodiacElement> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

export const SIGN_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export const SIGN_SYMBOLS = SIGN_EMOJIS;
export const ZODIAC_EMOJIS = SIGN_EMOJIS;

export const ELEMENT_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Earth: '🌿',
  Air: '💨',
  Water: '🌊',
};

export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#F97316',
  Earth: '#22C55E',
  Air: '#38BDF8',
  Water: '#818CF8',
};

export function getSignEmoji(sign?: string): string {
  return (sign && SIGN_EMOJIS[sign]) || '✨';
}

export const getZodiacEmoji = getSignEmoji;
export const getSunSignEmoji = getSignEmoji;

export function getElementEmoji(element?: string): string {
  return (element && ELEMENT_EMOJIS[element]) || '✨';
}

export function getElementFromSign(sign?: string): ZodiacElement {
  return (sign && SIGN_ELEMENTS[sign]) || 'Water';
}

export function getCompatibilityColor(score?: number | null): string {
  if (typeof score !== 'number') return '#9CA3AF';
  if (score >= 80) return '#34D399';
  if (score >= 60) return '#A78BFA';
  if (score >= 40) return '#FBBF24';
  return '#F87171';
}

export const getScoreColor = getCompatibilityColor;
export const getResonanceColor = getCompatibilityColor;

export function getCompatibilityLabel(score?: number | null): string {
  if (typeof score !== 'number') return 'Няма данни';
  if (score >= 80) return 'Висок индекс';
  if (score >= 60) return 'Добра динамика';
  if (score >= 40) return 'Умерен баланс';
  return 'Различни полюси';
}

export const getResonanceLabel = getCompatibilityLabel;

export function getAgeFromBirthdate(birthdate?: string | Date): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age > 0 && age < 120 ? age : null;
}

export function getSunSignFromBirthdate(birthdate?: string | Date): string {
  if (!birthdate) return 'Scorpio';
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return 'Scorpio';
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

export function getLifePathFromBirthdate(birthdate?: string | Date): number {
  if (!birthdate) return 7;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return 7;
  const digits = `${d.getUTCDate()}${d.getUTCMonth() + 1}${d.getUTCFullYear()}`
    .split('')
    .map(Number);
  let sum = digits.reduce((acc, n) => acc + n, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum)
      .split('')
      .map(Number)
      .reduce((acc, n) => acc + n, 0);
  }
  return sum;
}

export function resolveSunSign(person: any): string {
  return person?.natalChart?.sunSign || getSunSignFromBirthdate(person?.birthdate);
}

export function resolveMoonSign(person: any): string {
  return person?.natalChart?.moonSign || '';
}

export function resolveAscendant(person: any): string {
  return person?.hasExactBirthTime ? person?.natalChart?.ascendant || '' : '';
}

export function resolveLifePath(person: any): number {
  return (
    person?.numerology?.lifePathNumber ||
    getLifePathFromBirthdate(person?.birthdate)
  );
}

export function resolveMbtiType(person: any): string {
  return person?.mbti?.type ? String(person.mbti.type).toUpperCase() : '';
}

function deriveFallbackElementShares(person: any): WesternElementVector {
  if (person?.westernElements?.shares) {
    return person.westernElements.shares;
  }
  const sunSign = resolveSunSign(person);
  const el = SIGN_ELEMENTS[sunSign] || 'Water';
  return {
    fire: el === 'Fire' ? 0.43 : 0.19,
    air: el === 'Air' ? 0.43 : 0.19,
    water: el === 'Water' ? 0.43 : 0.19,
    earth: el === 'Earth' ? 0.43 : 0.19,
  };
}

function deriveFallbackPolarity(person: any): {
  score: number;
  sourceCoverage: number;
  provenance: string;
} {
  if (typeof person?.polarity?.score === 'number') {
    return {
      score: person.polarity.score,
      sourceCoverage: person.polarity.sourceCoverage ?? 1.0,
      provenance: person.polarity.provenance || 'user_polarity_snapshot',
    };
  }
  const shares = deriveFallbackElementShares(person);
  const yang = (shares.fire || 0) + (shares.air || 0);
  const yin = (shares.water || 0) + (shares.earth || 0);
  const total = yang + yin;
  return {
    score: total > 0 ? (yang - yin) / total : 0,
    sourceCoverage: 0.65,
    provenance: 'western_elements_yin_yang_projection',
  };
}

export function toMatchEngineInput(person: any): UserMatchInput {
  const id = String(person?.id || person?._id || person?.email || '');
  const hasExact = Boolean(
    person?.hasExactBirthTime ||
      (typeof person?.birthTime === 'string' &&
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(person.birthTime.trim()))
  );

  return {
    id,
    profileVersion: person?.updatedAt || person?.profileVersion || '1',
    isActive: person?.isActive !== false,
    isDiscoverable: person?.isDiscoverable !== false,
    symbolicMatchConsent: person?.symbolicMatchConsent !== false,
    datingConsent: person?.datingConsent !== false,
    birthdate: person?.birthdate || null,
    birthTime: hasExact ? person.birthTime : null,
    hasExactBirthTime: hasExact,
    birthCity: person?.birthCity || null,
    currentLocation: person?.currentLocation || null,
    gender: person?.gender,
    seekingGenders: person?.seekingGenders,
    ageRangePreference: person?.ageRangePreference,
    maxDistanceKm: person?.maxDistanceKm ?? null,
    relationshipIntentions: person?.relationshipIntentions,
    strictIntentionMatch: person?.strictIntentionMatch,
    blockedUserIds: person?.blockedUserIds,
    reportedUserIds: person?.reportedUserIds,
    dislikedUserIds: person?.dislikedUserIds,
    preferences: person?.preferences,
    mbti: person?.mbti || null,
    natalChart: person?.natalChart || null,
    westernElements: {
      shares: deriveFallbackElementShares(person),
      includesAscendant: Boolean(hasExact && person?.natalChart?.ascendant),
      source: person?.westernElements?.shares ? 'weighted_planets' : 'birthdate_fallback',
    },
    polarity: deriveFallbackPolarity(person),
    bazi: person?.bazi || null,
    interests: Array.isArray(person?.interests) ? person.interests : [],
  };
}

export function isCandidateMutuallyEligible(
  currentUser: any,
  target: PersonProfile,
  requireDatingAdultCheck = true
): boolean {
  if (typeof MatchEngine.checkMutualEligibility !== 'function') {
    console.error('[MatchEngine] checkMutualEligibility is missing! Check src/services/match-engine/eligibility.ts');
    return true;
  }
  const a = toMatchEngineInput(currentUser);
  const b = toMatchEngineInput(target);
  return MatchEngine.checkMutualEligibility(a, b, { requireDatingAdultCheck }).eligible;
}

export function calculateCompatibility(
  currentUser: any,
  target: PersonProfile,
  options: { requireDatingAdultCheck?: boolean } = {}
): CompatibilityBreakdown {
  const disclaimer =
    MatchEngine.MATCH_I18N_BG?.['match.scientificDisclaimer'] ||
    'Символичен индекс за саморефлексия (0–100 т.).';

  if (typeof MatchEngine.calculatePairCompatibility !== 'function') {
    console.error('[MatchEngine] calculatePairCompatibility is missing! Check src/services/match-engine/ranker.ts');
    return {
      overall: 0,
      hasSymbolicScore: false,
      mbtiScore: null,
      astrologyScore: null,
      elementsScore: null,
      polarityScore: null,
      baziScore: null,
      practicalScore: null,
      sharedInterests: [],
      summary: 'Грешка при зареждане на match-engine.',
      highlights: [],
      tensions: [],
      disclaimer,
      rawResult: {} as any,
    };
  }

  const inputA = toMatchEngineInput(currentUser);
  const inputB = toMatchEngineInput(target);

  const result = MatchEngine.calculatePairCompatibility(inputA, inputB, undefined, {
    requireDatingAdultCheck: options.requireDatingAdultCheck ?? true,
  });

  const myInterests: string[] = Array.isArray(currentUser?.interests)
    ? currentUser.interests
    : [];
  const targetInterests = Array.isArray(target.interests) ? target.interests : [];
  const sharedInterests = targetInterests.filter((i) =>
    myInterests.some((m) => m.toLowerCase() === i.toLowerCase())
  );

  const toPct = (val: number | null) =>
    val !== null ? Math.round(val * 100) : null;

  const overall = result.total_score ?? 0;
  const highlights = result.top_supportive_factors.map((f) => f.textBg);
  const tensions = result.potential_tensions.map((f) => f.textBg);

  const summary =
    result.total_score === null
      ? 'Недостатъчно данни за символична оценка'
      : overall >= 80
      ? 'Висок индекс на символична съвместимост в активните системи.'
      : overall >= 60
      ? 'Балансирана символична динамика с ясно изразени допирни точки.'
      : 'Допълващи се различия, изискващи осъзната комуникация.';

  return {
    overall,
    hasSymbolicScore: result.total_score !== null,
    mbtiScore: toPct(result.components.mbti.score),
    astrologyScore: toPct(result.components.synastry.score),
    elementsScore: toPct(result.components.western_elements.score),
    polarityScore: toPct(result.components.polarity.score),
    baziScore: toPct(result.components.bazi.score),
    practicalScore: result.practical_alignment_score,
    sharedInterests:
      sharedInterests.length > 0 ? sharedInterests : targetInterests.slice(0, 2),
    summary,
    highlights:
      highlights.length > 0
        ? highlights
        : ['Недостатъчно данни за символична оценка'],
    tensions,
    disclaimer,
    rawResult: result,
  };
}