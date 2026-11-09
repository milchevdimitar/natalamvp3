import { UserProfile, MBTIPercentages } from '../models/User';
import { saveUserProfile } from './api';

export interface RawUserInput {
  name: string;
  email: string;
  birthDate: {
    day: number;
    month: number;
    year: number;
    hour?: number;
    minute?: number;
  };
  birthCity: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  mbtiScores?: {
    E: number; I: number;
    N: number; S: number;
    T: number; F: number;
    J: number; P: number;
  };
  ayurvedaScores?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  cardologyCard?: string;
}

/**
 * 1. Локално изчисление на Нумерологично Число на Пътя (Life Path Number)
 */
export function calculateLifePathNumber(
  day: number,
  month: number,
  year: number
): { lifePathNumber: number; isMasterNumber: boolean } {
  const reduceNumber = (num: number): number => {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num
        .toString()
        .split('')
        .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return num;
  };

  const reducedDay = reduceNumber(day);
  const reducedMonth = reduceNumber(month);
  const reducedYear = reduceNumber(year);

  const totalSum = reduceNumber(reducedDay + reducedMonth + reducedYear);

  return {
    lifePathNumber: totalSum,
    isMasterNumber: [11, 22, 33].includes(totalSum),
  };
}

/**
 * 2. Локално изчисление на MBTI проценти и 4-буквен тип
 */
export function calculateMBTI(scores: {
  E: number; I: number;
  N: number; S: number;
  T: number; F: number;
  J: number; P: number;
}) {
  const calcPct = (a: number, b: number) => {
    const total = a + b || 1;
    return Math.round((a / total) * 100);
  };

  const ePct = calcPct(scores.E, scores.I);
  const iPct = 100 - ePct;
  const nPct = calcPct(scores.N, scores.S);
  const sPct = 100 - nPct;
  const tPct = calcPct(scores.T, scores.F);
  const fPct = 100 - tPct;
  const jPct = calcPct(scores.J, scores.P);
  const pPct = 100 - jPct;

  const type = [
    ePct >= iPct ? 'E' : 'I',
    nPct >= sPct ? 'N' : 'S',
    tPct >= fPct ? 'T' : 'F',
    jPct >= pPct ? 'J' : 'P',
  ].join('');

  const percentages: MBTIPercentages = {
    extraversion: ePct,
    introversion: iPct,
    intuitive: nPct,
    observant: sPct,
    thinking: tPct,
    feeling: fPct,
    judging: jPct,
    prospecting: pPct,
  };

  return { type, percentages };
}

/**
 * 3. Локално изчисление на Аюрведична Доша (Vata, Pitta, Kapha)
 */
export function calculateAyurveda(scores: { vata: number; pitta: number; kapha: number }) {
  let dominant: 'vata' | 'pitta' | 'kapha' = 'vata';

  if (scores.pitta >= scores.vata && scores.pitta >= scores.kapha) {
    dominant = 'pitta';
  }
  if (scores.kapha >= scores.vata && scores.kapha >= scores.pitta) {
    dominant = 'kapha';
  }

  return {
    dominantDosha: dominant,
    scores,
  };
}

/**
 * 4. Формиране на Cardology карта по дата и месец
 */
export function calculateCardology(day: number, month: number): string {
  const cardIndex = (55 - (month * 2 + day)) % 52;
  const suits = ['H', 'C', 'D', 'S'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const normalizedIndex = cardIndex < 0 ? cardIndex + 52 : cardIndex;
  const value = values[normalizedIndex % 13];
  const suit = suits[Math.floor(normalizedIndex / 13)];

  return `${value}${suit}`;
}

/**
 * 5. Главен локален метод за асемблиране на пълния UserProfile обект
 */
export function buildFullUserProfile(
  input: RawUserInput,
  currentUser?: UserProfile | null
): UserProfile {
  const birthdateObj = new Date(
    input.birthDate.year,
    input.birthDate.month - 1,
    input.birthDate.day,
    input.birthDate.hour || 12,
    input.birthDate.minute || 0
  );

  const numerology = calculateLifePathNumber(
    input.birthDate.day,
    input.birthDate.month,
    input.birthDate.year
  );

  const cardologyCard =
    input.cardologyCard || calculateCardology(input.birthDate.day, input.birthDate.month);

  const profile: UserProfile = {
    ...currentUser,
    name: input.name || currentUser?.name || 'User',
    email: input.email.toLowerCase().trim(),
    birthdate: birthdateObj.toISOString(),
    birthCity: input.birthCity,
    bloodGroup: input.bloodGroup || currentUser?.bloodGroup,
    numerology,
    cardology: { birthCard: cardologyCard },
  };

  if (input.mbtiScores) {
    profile.mbti = calculateMBTI(input.mbtiScores);
  }

  if (input.ayurvedaScores) {
    profile.ayurveda = calculateAyurveda(input.ayurvedaScores);
  }

  return profile;
}

/**
 * 6. Изпълнение на изчисленията + синхронизация с MongoDB Atlas за активния потребител
 */
export async function saveAndSyncProfile(
  input: RawUserInput,
  currentUser?: UserProfile | null
): Promise<UserProfile> {
  const fullProfile = buildFullUserProfile(input, currentUser);

  try {
    await saveUserProfile(fullProfile);
    console.log(`✅ Данните за ${fullProfile.email} са синхронизирани с MongoDB Atlas.`);
  } catch (error) {
    console.warn(
      '⚠️ Офлайн режим: Данните са изчислени и налични локално на телефона.',
      error
    );
  }

  return fullProfile;
}