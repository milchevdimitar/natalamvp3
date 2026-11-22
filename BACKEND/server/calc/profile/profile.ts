// Profile engines — moved from APP/src/services/profileManager.ts and APP/src/screens/Profile.tsx

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
 * 1. Изчисление на Нумерологично Число на Пътя (Life Path Number)
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
 * 2. Изчисление на MBTI проценти и 4-буквен тип
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

  const percentages = {
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
 * 3. Изчисление на Аюрведична Доша (Vata, Pitta, Kapha)
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
 * 5. Изчислените полета на профила при вход/регистрация.
 * `birthdateIso` идва от устройството (локален час на раждане), за да не зависи от зоната на сървъра.
 */
export function buildProfileFields(
  input: RawUserInput,
  birthdateIso: string,
  currentUser?: { name?: string; bloodGroup?: string } | null
) {
  const numerology = calculateLifePathNumber(
    input.birthDate.day,
    input.birthDate.month,
    input.birthDate.year
  );

  const cardologyCard =
    input.cardologyCard || calculateCardology(input.birthDate.day, input.birthDate.month);

  const profile: Record<string, any> = {
    name: input.name || currentUser?.name || 'User',
    email: input.email.toLowerCase().trim(),
    birthdate: birthdateIso,
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

// ---------------------------------------------------------------------------
// ✦ АЛГОРИТЪМ ЗА ИЗЧИСЛЯВАНЕ НА ЕЛЕМЕНТНИЯ БАЛАНС ОТ РОЖДЕНАТА ДАТА
// ---------------------------------------------------------------------------
export function calculateElementsFromBirthDate(rawDate?: any) {
  if (!rawDate) {
    return [
      { name: 'Fire', symbol: '🜂', value: 28, color: '#FF6B6B' },
      { name: 'Earth', symbol: '🜃', value: 24, color: '#4ECDC4' },
      { name: 'Air', symbol: '🜁', value: 26, color: '#FFE66D' },
      { name: 'Water', symbol: '🜄', value: 22, color: '#4A90E2' },
    ];
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    return [
      { name: 'Fire', symbol: '🜂', value: 25, color: '#FF6B6B' },
      { name: 'Earth', symbol: '🜃', value: 25, color: '#4ECDC4' },
      { name: 'Air', symbol: '🜁', value: 25, color: '#FFE66D' },
      { name: 'Water', symbol: '🜄', value: 25, color: '#4A90E2' },
    ];
  }

  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();

  const zodiacCutoffs = [20, 19, 21, 20, 21, 22, 23, 23, 23, 23, 22, 22];
  const zodiacElements = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]; // 0: Fire, 1: Earth, 2: Air, 3: Water

  let signIdx = month - 1;
  if (day < zodiacCutoffs[signIdx]) {
    signIdx = (signIdx + 11) % 12;
  }
  const mainElementIdx = zodiacElements[signIdx];

  let fireScore = 15;
  let earthScore = 15;
  let airScore = 15;
  let waterScore = 15;

  if (mainElementIdx === 0) fireScore += 30;
  if (mainElementIdx === 1) earthScore += 30;
  if (mainElementIdx === 2) airScore += 30;
  if (mainElementIdx === 3) waterScore += 30;

  fireScore += day % 4 === 1 ? 15 : 5;
  earthScore += day % 4 === 2 ? 15 : 5;
  airScore += day % 4 === 3 ? 15 : 5;
  waterScore += day % 4 === 0 ? 15 : 5;

  fireScore += month % 4 === 1 ? 12 : 4;
  earthScore += month % 4 === 2 ? 12 : 4;
  airScore += month % 4 === 3 ? 12 : 4;
  waterScore += month % 4 === 0 ? 12 : 4;

  const yearSum = String(year)
    .split('')
    .reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);

  fireScore += yearSum % 4 === 1 ? 13 : 4;
  earthScore += yearSum % 4 === 2 ? 13 : 4;
  airScore += yearSum % 4 === 3 ? 13 : 4;
  waterScore += yearSum % 4 === 0 ? 13 : 4;

  const total = fireScore + earthScore + airScore + waterScore;
  const firePct = Math.round((fireScore / total) * 100);
  const earthPct = Math.round((earthScore / total) * 100);
  const airPct = Math.round((airScore / total) * 100);
  const waterPct = 100 - (firePct + earthPct + airPct);

  return [
    { name: 'Fire', symbol: '🜂', value: firePct, color: '#FF6B6B' },
    { name: 'Earth', symbol: '🜃', value: earthPct, color: '#4ECDC4' },
    { name: 'Air', symbol: '🜁', value: airPct, color: '#FFE66D' },
    { name: 'Water', symbol: '🜄', value: waterPct, color: '#4A90E2' },
  ];
}
