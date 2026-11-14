import {
  BaZiChart,
  BaZiPillar,
  DayMasterProfile,
  EarthlyBranch,
  HeavenlyStem,
  WuXingElement,
} from './bazi.types';

export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { index: 0, hanzi: '甲', pinyin: 'Jia', element: 'Wood', polarity: 'Yang' },
  { index: 1, hanzi: '乙', pinyin: 'Yi', element: 'Wood', polarity: 'Yin' },
  { index: 2, hanzi: '丙', pinyin: 'Bing', element: 'Fire', polarity: 'Yang' },
  { index: 3, hanzi: '丁', pinyin: 'Ding', element: 'Fire', polarity: 'Yin' },
  { index: 4, hanzi: '戊', pinyin: 'Wu', element: 'Earth', polarity: 'Yang' },
  { index: 5, hanzi: '己', pinyin: 'Ji', element: 'Earth', polarity: 'Yin' },
  { index: 6, hanzi: '庚', pinyin: 'Geng', element: 'Metal', polarity: 'Yang' },
  { index: 7, hanzi: '辛', pinyin: 'Xin', element: 'Metal', polarity: 'Yin' },
  { index: 8, hanzi: '壬', pinyin: 'Ren', element: 'Water', polarity: 'Yang' },
  { index: 9, hanzi: '癸', pinyin: 'Gui', element: 'Water', polarity: 'Yin' },
];

export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { index: 0, hanzi: '子', pinyin: 'Zi', animal: 'Rat', element: 'Water', polarity: 'Yang', hiddenStems: [9] },
  { index: 1, hanzi: '丑', pinyin: 'Chou', animal: 'Ox', element: 'Earth', polarity: 'Yin', hiddenStems: [5, 9, 7] },
  { index: 2, hanzi: '寅', pinyin: 'Yin', animal: 'Tiger', element: 'Wood', polarity: 'Yang', hiddenStems: [0, 2, 4] },
  { index: 3, hanzi: '卯', pinyin: 'Mao', animal: 'Rabbit', element: 'Wood', polarity: 'Yin', hiddenStems: [1] },
  { index: 4, hanzi: '辰', pinyin: 'Chen', animal: 'Dragon', element: 'Earth', polarity: 'Yang', hiddenStems: [4, 1, 9] },
  { index: 5, hanzi: '巳', pinyin: 'Si', animal: 'Snake', element: 'Fire', polarity: 'Yin', hiddenStems: [2, 6, 4] },
  { index: 6, hanzi: '午', pinyin: 'Wu', animal: 'Horse', element: 'Fire', polarity: 'Yang', hiddenStems: [3, 5] },
  { index: 7, hanzi: '未', pinyin: 'Wei', animal: 'Goat', element: 'Earth', polarity: 'Yin', hiddenStems: [5, 3, 1] },
  { index: 8, hanzi: '申', pinyin: 'Shen', animal: 'Monkey', element: 'Metal', polarity: 'Yang', hiddenStems: [6, 8, 4] },
  { index: 9, hanzi: '酉', pinyin: 'You', animal: 'Rooster', element: 'Metal', polarity: 'Yin', hiddenStems: [7] },
  { index: 10, hanzi: '戌', pinyin: 'Xu', animal: 'Dog', element: 'Earth', polarity: 'Yang', hiddenStems: [4, 7, 3] },
  { index: 11, hanzi: '亥', pinyin: 'Hai', animal: 'Pig', element: 'Water', polarity: 'Yin', hiddenStems: [8, 0] },
];

export const CHINESE_HOURS: { branchIndex: number | null; label: string; range: string }[] = [
  { branchIndex: null, label: 'Unknown', range: 'No time' },
  { branchIndex: 0, label: 'Zi · Rat', range: '23:00–00:59' },
  { branchIndex: 1, label: 'Chou · Ox', range: '01:00–02:59' },
  { branchIndex: 2, label: 'Yin · Tiger', range: '03:00–04:59' },
  { branchIndex: 3, label: 'Mao · Rabbit', range: '05:00–06:59' },
  { branchIndex: 4, label: 'Chen · Dragon', range: '07:00–08:59' },
  { branchIndex: 5, label: 'Si · Snake', range: '09:00–10:59' },
  { branchIndex: 6, label: 'Wu · Horse', range: '11:00–12:59' },
  { branchIndex: 7, label: 'Wei · Goat', range: '13:00–14:59' },
  { branchIndex: 8, label: 'Shen · Monkey', range: '15:00–16:59' },
  { branchIndex: 9, label: 'You · Rooster', range: '17:00–18:59' },
  { branchIndex: 10, label: 'Xu · Dog', range: '19:00–20:59' },
  { branchIndex: 11, label: 'Hai · Pig', range: '21:00–22:59' },
];

const DAY_MASTER_DESCRIPTIONS: Record<
  number,
  Omit<DayMasterProfile, 'stem' | 'favorableElement'>
> = {
  0: {
    title: 'Jia Wood · The Towering Tree',
    archetype: 'Principled pioneer with upright integrity and steady upward vision.',
    strengths: 'Leadership, resilience, generosity, and long-term strategic growth.',
    balanceAdvice: 'Stay flexible when winds shift; pruning excess commitments unlocks faster breakthroughs.',
  },
  1: {
    title: 'Yi Wood · The Flexible Vine',
    archetype: 'Adaptive strategist who thrives through diplomacy, intuition, and grace.',
    strengths: 'Emotional intelligence, artistic sensitivity, networking, and quiet persistence.',
    balanceAdvice: 'Anchor your roots with clear personal boundaries so you do not over-adapt to others.',
  },
  2: {
    title: 'Bing Fire · The Radiant Sun',
    archetype: 'Warm, expressive catalyst who illuminates rooms and inspires collective action.',
    strengths: 'Charisma, optimism, generosity, and fearless creative momentum.',
    balanceAdvice: 'Pace your output and protect quiet evening hours to avoid burnout.',
  },
  3: {
    title: 'Ding Fire · The Sacred Candlelight',
    archetype: 'Focused, perceptive torchbearer who sees subtle truths in the dark.',
    strengths: 'Deep devotion, precision, spiritual insight, and transformative mentorship.',
    balanceAdvice: 'Feed your inner flame with meaningful projects rather than scattered distractions.',
  },
  4: {
    title: 'Wu Earth · The Great Mountain',
    archetype: 'Grounded, reliable sanctuary whom others trust in times of turbulence.',
    strengths: 'Stability, loyalty, endurance, and calm executive presence.',
    balanceAdvice: 'Welcome fresh movement and new ideas so stability does not turn into stagnation.',
  },
  5: {
    title: 'Ji Earth · The Fertile Garden',
    archetype: 'Nurturing cultivator capable of turning raw potential into tangible abundance.',
    strengths: 'Resourcefulness, empathy, practical wisdom, and attentive care.',
    balanceAdvice: 'Reserve energy for your own dreams before tending everyone else’s garden.',
  },
  6: {
    title: 'Geng Metal · The Forged Blade',
    archetype: 'Decisive reformer driven by justice, clarity, and direct execution.',
    strengths: 'Courage, loyalty, sharp discernment, and high standards.',
    balanceAdvice: 'Temper sharp honesty with warmth to turn allies into lifelong partners.',
  },
  7: {
    title: 'Xin Metal · The Refined Jewel',
    archetype: 'Articulate aesthete who values elegance, authenticity, and inner refinement.',
    strengths: 'Sensitivity to beauty, persuasive charm, self-awareness, and precision.',
    balanceAdvice: 'Release perfectionism and let your natural brilliance shine without over-polishing.',
  },
  8: {
    title: 'Ren Water · The Flowing Ocean',
    archetype: 'Expansive thinker with unstoppable curiosity, wisdom, and adaptability.',
    strengths: 'Visionary intellect, fearlessness, fluid communication, and big-picture insight.',
    balanceAdvice: 'Channel your vast momentum into structured milestones to maximize impact.',
  },
  9: {
    title: 'Gui Water · The Morning Mist',
    archetype: 'Intuitive mystic attuned to hidden currents, dreams, and subtle emotions.',
    strengths: 'Empathy, imagination, spiritual receptivity, and quiet insight.',
    balanceAdvice: 'Ground intuitive downloads into daily rituals so your energy stays clear.',
  },
};

// Определя слънчевия месец в BaZi (0 = Yin/Февруари ... 11 = Chou/Януари) според Jieqi границите
function getSolarMonthOffset(month: number, day: number): number {
  if (month === 1) return day >= 6 ? 11 : 10; // Xiaohan ~ Jan 6 -> Chou (11), иначе Zi (10)
  if (month === 2) return day >= 4 ? 0 : 11;  // Lichun ~ Feb 4 -> Yin (0)
  if (month === 3) return day >= 6 ? 1 : 0;   // Jingzhe ~ Mar 6 -> Mao (1)
  if (month === 4) return day >= 5 ? 2 : 1;   // Qingming ~ Apr 5 -> Chen (2)
  if (month === 5) return day >= 6 ? 3 : 2;   // Lixia ~ May 6 -> Si (3)
  if (month === 6) return day >= 6 ? 4 : 3;   // Mangzhong ~ Jun 6 -> Wu (4)
  if (month === 7) return day >= 7 ? 5 : 4;   // Xiaoshu ~ Jul 7 -> Wei (5)
  if (month === 8) return day >= 8 ? 6 : 5;   // Liqiu ~ Aug 8 -> Shen (6)
  if (month === 9) return day >= 8 ? 7 : 6;   // Bailu ~ Sep 8 -> You (7)
  if (month === 10) return day >= 8 ? 8 : 7;  // Hanlu ~ Oct 8 -> Xu (8)
  if (month === 11) return day >= 7 ? 9 : 8;  // Lidong ~ Nov 7 -> Hai (9)
  return day >= 7 ? 10 : 9;                   // Daxue ~ Dec 7 -> Zi (10)
}

function makePillar(
  label: BaZiPillar['label'],
  bgLabel: string,
  stemIndex: number,
  branchIndex: number
): BaZiPillar {
  const stem = HEAVENLY_STEMS[((stemIndex % 10) + 10) % 10];
  const branch = EARTHLY_BRANCHES[((branchIndex % 12) + 12) % 12];
  return {
    label,
    bgLabel,
    stem,
    branch,
    hiddenStems: branch.hiddenStems.map((idx) => HEAVENLY_STEMS[idx]),
  };
}

export function calculateBaZiChart(
  year: number,
  month: number,
  day: number,
  hourBranchIndex: number | null = null
): BaZiChart {
  // 1. Годишен стълб (сменя се на Lichun ~ 4 февруари)
  const baziYear = month < 2 || (month === 2 && day < 4) ? year - 1 : year;
  const yearStemIdx = (((baziYear - 4) % 10) + 10) % 10;
  const yearBranchIdx = (((baziYear - 4) % 12) + 12) % 12;
  const yearPillar = makePillar('Year', 'Година', yearStemIdx, yearBranchIdx);

  // 2. Месечен стълб (Правило на Петте тигъра / 五虎遁)
  const monthOffset = getSolarMonthOffset(month, day);
  const yinMonthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (yinMonthStemStart + monthOffset) % 10;
  const monthBranchIdx = (2 + monthOffset) % 12;
  const monthPillar = makePillar('Month', 'Месец', monthStemIdx, monthBranchIdx);

  // 3. Дневен стълб (60 Jia-Zi цикъл спрямо 1900-01-01 = Jia-Xu #10)
  const utcBase = Date.UTC(1900, 0, 1);
  const utcTarget = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((utcTarget - utcBase) / 86400000);
  const dayCycleIdx = (((10 + diffDays) % 60) + 60) % 60;
  const dayStemIdx = dayCycleIdx % 10;
  const dayBranchIdx = dayCycleIdx % 12;
  const dayPillar = makePillar('Day', 'Ден', dayStemIdx, dayBranchIdx);

  // 4. Часови стълб (Правило на Петте плъха / 五鼠遁)
  let hourPillar: BaZiPillar | null = null;
  if (hourBranchIndex !== null && hourBranchIndex >= 0 && hourBranchIndex <= 11) {
    const ziHourStemStart = ((dayStemIdx % 5) * 2) % 10;
    const hourStemIdx = (ziHourStemStart + hourBranchIndex) % 10;
    hourPillar = makePillar('Hour', 'Час', hourStemIdx, hourBranchIndex);
  }

  // 5. Изчисляване на теглата на 5-те елемента (Wu Xing)
  const elementScores: Record<WuXingElement, number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0,
  };

  const activePillars = [yearPillar, monthPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])];

  activePillars.forEach((p, idx) => {
    // Основни небесни стволове и земни клони (месечният клон има най-висока сезонна тежест)
    const seasonMultiplier = p.label === 'Month' ? 1.5 : 1.0;
    elementScores[p.stem.element] += 12;
    elementScores[p.branch.element] += 14 * seasonMultiplier;

    // Скрити стволове в земните клони
    p.hiddenStems.forEach((hs, hIdx) => {
      const weight = hIdx === 0 ? 6 : hIdx === 1 ? 3 : 2;
      elementScores[hs.element] += weight;
    });
  });

  const totalScore =
    Object.values(elementScores).reduce((sum, val) => sum + val, 0) || 1;

  const elements: WuXingElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  const elementPercentages = {} as Record<WuXingElement, number>;
  elements.forEach((el) => {
    elementPercentages[el] = Math.round((elementScores[el] / totalScore) * 100);
  });

  const sortedByScore = [...elements].sort(
    (a, b) => elementScores[b] - elementScores[a]
  );
  const dominantElement = sortedByScore[0];
  const weakestElement = sortedByScore[sortedByScore.length - 1];

  // 6. Профил на Day Master (Господарят на деня)
  const dmStem = dayPillar.stem;
  const dmBase = DAY_MASTER_DESCRIPTIONS[dmStem.index];
  const dayMaster: DayMasterProfile = {
    stem: dmStem,
    ...dmBase,
    favorableElement: weakestElement,
  };

  // 7. Годишен транзит 2026: Bing-Wu (丙午 · Yang Fire Horse)
  const transitByElement: Record<WuXingElement, { relation: string; guidance: string }> = {
    Wood: {
      relation: 'Output & Expression Year (Wood feeds Fire)',
      guidance:
        '2026 Bing-Wu Fire amplifies your creative voice, visibility, and bold self-expression. Share your ideas openly.',
    },
    Fire: {
      relation: 'Companion & Momentum Year (Fire meets Fire)',
      guidance:
        'Double Fire energy accelerates alliances, passion, and rapid decisions. Stay grounded to keep focus sharp.',
    },
    Earth: {
      relation: 'Resource & Renewal Year (Fire nurtures Earth)',
      guidance:
        '2026 brings mentorship, fresh inspiration, and inner recharge. An ideal year for study, healing, and planning.',
    },
    Metal: {
      relation: 'Refinement & Leadership Year (Fire tempers Metal)',
      guidance:
        'High-energy breakthroughs push you into visible leadership. Embrace transformation and clear priorities.',
    },
    Water: {
      relation: 'Wealth & Action Year (Water masters Fire)',
      guidance:
        'Dynamic opportunities for tangible results, career expansion, and decisive action throughout 2026.',
    },
  };

  const transitInfo = transitByElement[dmStem.element];

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    zodiacAnimal: yearPillar.branch.animal,
    elementScores,
    elementPercentages,
    dominantElement,
    weakestElement,
    annualTransit2026: {
      pillarName: '丙午 Bing-Wu · Yang Fire Horse (2026)',
      elementRelation: transitInfo.relation,
      guidance: transitInfo.guidance,
    },
  };
}