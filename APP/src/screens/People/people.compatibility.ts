import { CompatibilityBreakdown, PersonProfile, ZodiacElement } from './people.types';

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

export function resolveLifePath(person: any): number {
  return person?.numerology?.lifePathNumber || getLifePathFromBirthdate(person?.birthdate);
}

export function resolveMbtiType(person: any): string {
  return person?.mbti?.type ? String(person.mbti.type).toUpperCase() : '';
}

function computeMbtiScore(uMbti: string, tMbti: string): number {
  if (uMbti.length !== 4 || tMbti.length !== 4) return 78;

  let score = 68;
  if (uMbti[1] === tMbti[1]) score += 16; // N/S споделено възприятие
  if (uMbti[2] === tMbti[2]) score += 8;  // T/F ценностна ос
  if (uMbti[0] !== tMbti[0]) score += 5;  // E/I баланс
  if (uMbti[3] !== tMbti[3]) score += 4;  // J/P динамика
  return Math.min(98, score);
}

function computeAstrologyScore(uSign: string, tSign: string, uMoon?: string, tMoon?: string): number {
  const uEl = SIGN_ELEMENTS[uSign] || 'Water';
  const tEl = SIGN_ELEMENTS[tSign] || 'Water';

  let score = 74;
  if (uEl === tEl) score = 91;
  else if (
    (uEl === 'Water' && tEl === 'Earth') ||
    (uEl === 'Earth' && tEl === 'Water') ||
    (uEl === 'Fire' && tEl === 'Air') ||
    (uEl === 'Air' && tEl === 'Fire')
  ) {
    score = 88;
  }

  // Бонус ако и лунните знаци от наталната карта хармонират
  if (uMoon && tMoon && SIGN_ELEMENTS[uMoon] && SIGN_ELEMENTS[uMoon] === SIGN_ELEMENTS[tMoon]) {
    score = Math.min(98, score + 5);
  }
  return score;
}

function computeNumerologyScore(uLp: number, tLp: number): number {
  if (uLp === tLp) return 94;
  const diff = Math.abs(uLp - tLp);
  if (diff === 2 || diff === 4 || uLp + tLp === 10 || uLp + tLp === 11) return 88;
  return 76;
}

export function calculateCompatibility(
  currentUser: any,
  target: PersonProfile
): CompatibilityBreakdown {
  if (target.compatibility) return target.compatibility;
  const uMbti = resolveMbtiType(currentUser);
  const tMbti = resolveMbtiType(target);

  const uSign = resolveSunSign(currentUser);
  const tSign = resolveSunSign(target);
  const uEl = SIGN_ELEMENTS[uSign] || 'Water';
  const tEl = SIGN_ELEMENTS[tSign] || 'Water';

  const uLp = resolveLifePath(currentUser);
  const tLp = resolveLifePath(target);

  const mbtiScore = computeMbtiScore(uMbti, tMbti);
  const astrologyScore = computeAstrologyScore(
    uSign,
    tSign,
    currentUser?.natalChart?.moonSign,
    target?.natalChart?.moonSign
  );
  const numerologyScore = computeNumerologyScore(uLp, tLp);

  const myInterests: string[] = Array.isArray(currentUser?.interests)
    ? currentUser.interests
    : ['Astrology', 'Tarot', 'Numerology'];
  const targetInterests = Array.isArray(target.interests) ? target.interests : [];

  const sharedInterests = targetInterests.filter((i) =>
    myInterests.some((m) => m.toLowerCase() === i.toLowerCase())
  );
  const interestsScore = Math.min(97, 72 + sharedInterests.length * 8);

  const overall = Math.round(
    mbtiScore * 0.32 +
      astrologyScore * 0.28 +
      numerologyScore * 0.2 +
      interestsScore * 0.2
  );

  const highlights: string[] = [];

  if (uMbti && tMbti) {
    highlights.push(
      uMbti[1] === tMbti[1]
        ? `Shared ${uMbti[1] === 'N' ? 'Intuitive' : 'Observant'} lens (${uMbti} & ${tMbti}).`
        : `Complementary ${uMbti} × ${tMbti} cognitive dynamic.`
    );
  } else if (tMbti) {
    highlights.push(`${target.name}'s ${tMbti} archetype brings fresh perspective.`);
  }

  highlights.push(
    `${uSign} (${uEl}) & ${tSign} (${tEl}) solar synergy (${astrologyScore}%).`
  );

  if (currentUser?.natalChart?.moonSign && target?.natalChart?.moonSign) {
    highlights.push(
      `Moon in ${currentUser.natalChart.moonSign} resonates with Moon in ${target.natalChart.moonSign}.`
    );
  } else {
    highlights.push(`Life Path ${uLp} aligns with Life Path ${tLp} (${numerologyScore}%).`);
  }

  if (currentUser?.ayurveda?.dominantDosha && target?.ayurveda?.dominantDosha) {
    highlights.push(
      `Ayurvedic balance: ${currentUser.ayurveda.dominantDosha.toUpperCase()} & ${target.ayurveda.dominantDosha.toUpperCase()}.`
    );
  }

  const summary =
    overall >= 88
      ? 'Rare high-frequency cosmic & psychological synergy.'
      : overall >= 80
      ? 'Strong natural harmony across mind, intuition, and natal chart.'
      : 'Balanced complementary dynamic with room for mutual discovery.';

  return {
    overall,
    mbtiScore,
    astrologyScore,
    numerologyScore,
    interestsScore,
    sharedInterests:
      sharedInterests.length > 0 ? sharedInterests : targetInterests.slice(0, 2),
    summary,
    highlights,
  };
}
