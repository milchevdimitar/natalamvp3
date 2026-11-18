import {
  BaZiChart,
  BaZiPillar,
  DayMasterProfile,
  DayMasterStrengthAnalysis,
  EarthlyBranch,
  FiveComponentName,
  FiveComponentScore,
  Gender,
  HeavenlyStem,
  LuckPillarItem,
  MatchMakerResult,
  MatchType,
  QiBoostElementScore,
  QiTemperatureAnalysis,
  SixBoostElement,
  SupergodItem,
  TalentBridgeMetric,
  TenGodName,
  TenGodProfileItem,
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

const ELEMENT_CYCLE: WuXingElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function getElementIndex(el: WuXingElement): number {
  return ELEMENT_CYCLE.indexOf(el);
}

function getResourceElement(dmEl: WuXingElement): WuXingElement {
  return ELEMENT_CYCLE[(getElementIndex(dmEl) + 4) % 5];
}

function getOutputElement(dmEl: WuXingElement): WuXingElement {
  return ELEMENT_CYCLE[(getElementIndex(dmEl) + 1) % 5];
}

function getWealthElement(dmEl: WuXingElement): WuXingElement {
  return ELEMENT_CYCLE[(getElementIndex(dmEl) + 2) % 5];
}

function getPowerElement(dmEl: WuXingElement): WuXingElement {
  return ELEMENT_CYCLE[(getElementIndex(dmEl) + 3) % 5];
}

export function getTenGod(dm: HeavenlyStem, target: HeavenlyStem): TenGodName {
  const samePolarity = dm.polarity === target.polarity;
  const rel = (getElementIndex(target.element) - getElementIndex(dm.element) + 5) % 5;

  if (rel === 0) return samePolarity ? 'Friend' : 'Rob Wealth';
  if (rel === 1) return samePolarity ? 'Eating God' : 'Hurting Officer';
  if (rel === 2) return samePolarity ? 'Indirect Wealth' : 'Direct Wealth';
  if (rel === 3) return samePolarity ? 'Seven Killings' : 'Direct Officer';
  return samePolarity ? 'Indirect Resource' : 'Direct Resource';
}

const TEN_GOD_META: Record<
  TenGodName,
  { pinyinName: string; component: FiveComponentName; archetype: string; talentSummary: string }
> = {
  Friend: {
    pinyinName: 'Bi Jian · 比肩',
    component: 'Body',
    archetype: 'Independent Self-Starter',
    talentSummary: 'Strong personal boundaries, autonomy, and loyalty among equals.',
  },
  'Rob Wealth': {
    pinyinName: 'Jie Cai · 劫财',
    component: 'Body',
    archetype: 'Charismatic Connector',
    talentSummary: 'Social magnetism, adaptability in groups, and competitive drive.',
  },
  'Eating God': {
    pinyinName: 'Shi Shen · 食神',
    component: 'Output',
    archetype: 'Refined Creator & Connoisseur',
    talentSummary: 'Effortless creative flow, warmth, storytelling, and joyful mastery.',
  },
  'Hurting Officer': {
    pinyinName: 'Shang Guan · 伤官',
    component: 'Output',
    archetype: 'Disruptive Visionary',
    talentSummary: 'Sharp intellect, expressive brilliance, originality, and bold expression.',
  },
  'Direct Wealth': {
    pinyinName: 'Zheng Cai · 正财',
    component: 'Wealth',
    archetype: 'Steady Value Builder',
    talentSummary: 'Reliability, financial discipline, tangible results, and commitment.',
  },
  'Indirect Wealth': {
    pinyinName: 'Pian Cai · 偏财',
    component: 'Wealth',
    archetype: 'Opportunistic Deal-Maker',
    talentSummary: 'Big-picture vision, generosity, speed, and instinct for high-leverage opportunities.',
  },
  'Direct Officer': {
    pinyinName: 'Zheng Guan · 正官',
    component: 'Power',
    archetype: 'Principled Leader',
    talentSummary: 'Integrity, structure, executive credibility, and respect for systems.',
  },
  'Seven Killings': {
    pinyinName: 'Qi Sha · 七杀',
    component: 'Power',
    archetype: 'Fearless Commander',
    talentSummary: 'Decisive action under pressure, crisis leadership, and transformative willpower.',
  },
  'Direct Resource': {
    pinyinName: 'Zheng Yin · 正印',
    component: 'Intellect',
    archetype: 'Nurturing Scholar',
    talentSummary: 'Deep synthesis, empathy, patience, and structured knowledge.',
  },
  'Indirect Resource': {
    pinyinName: 'Pian Yin · 偏印',
    component: 'Intellect',
    archetype: 'Unconventional Strategist',
    talentSummary: 'Pattern recognition, lateral thinking, intuition, and metaphysical insight.',
  },
};

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

// Determines the solar month offset in BaZi (0 = Yin/Feb ... 11 = Chou/Jan) based on Jieqi solar terms
function getSolarMonthOffset(month: number, day: number): number {
  if (month === 1) return day >= 6 ? 11 : 10;
  if (month === 2) return day >= 4 ? 0 : 11;
  if (month === 3) return day >= 6 ? 1 : 0;
  if (month === 4) return day >= 5 ? 2 : 1;
  if (month === 5) return day >= 6 ? 3 : 2;
  if (month === 6) return day >= 6 ? 4 : 3;
  if (month === 7) return day >= 7 ? 5 : 4;
  if (month === 8) return day >= 8 ? 6 : 5;
  if (month === 9) return day >= 8 ? 7 : 6;
  if (month === 10) return day >= 8 ? 8 : 7;
  if (month === 11) return day >= 7 ? 9 : 8;
  return day >= 7 ? 10 : 9;
}

function makePillar(
  label: BaZiPillar['label'],
  subtitle: string,
  stemIndex: number,
  branchIndex: number,
  dmStem?: HeavenlyStem
): BaZiPillar {
  const stem = HEAVENLY_STEMS[((stemIndex % 10) + 10) % 10];
  const branch = EARTHLY_BRANCHES[((branchIndex % 12) + 12) % 12];
  const hiddenStems = branch.hiddenStems.map((idx) => HEAVENLY_STEMS[idx]);
  const effectiveDm = dmStem || stem;

  return {
    label,
    subtitle,
    stem,
    branch,
    hiddenStems,
    stemTenGod: label === 'Day' ? 'Day Master' : getTenGod(effectiveDm, stem),
    hiddenTenGods: hiddenStems.map((hs) => getTenGod(effectiveDm, hs)),
  };
}

function computeTalentBridgeFromShares(
  shares: Record<FiveComponentName, number>,
  tenGodShares: Record<TenGodName, number>,
  dmStrengthScore: number
): TalentBridgeMetric[] {
  const clamp = (v: number) => Math.max(12, Math.min(98, Math.round(v)));

  return [
    {
      key: 'ambition',
      label: 'Ambition',
      score: clamp(shares.Power * 1.45 + shares.Body * 0.75 + 22),
      formulaHint: 'Power + Body',
      description: 'Drive for achievement, upward mobility, and conquering meaningful goals.',
    },
    {
      key: 'productivity',
      label: 'Productivity',
      score: clamp(shares.Output * 1.35 + shares.Wealth * 1.05 + 20),
      formulaHint: 'Output → Wealth',
      description: 'Ability to convert creative ideas into consistent, tangible execution.',
    },
    {
      key: 'entrepreneurship',
      label: 'Entrepreneurship',
      score: clamp(
        tenGodShares['Indirect Wealth'] * 2.1 +
          tenGodShares['Hurting Officer'] * 1.4 +
          tenGodShares['Seven Killings'] * 1.1 +
          24
      ),
      formulaHint: 'Indirect Wealth + Output/Power',
      description: 'Instinct for spotting market gaps, taking calculated risks, and scaling.',
    },
    {
      key: 'expression',
      label: 'Expression',
      score: clamp(shares.Output * 2.15 + 22),
      formulaHint: 'Eating God + Hurting Officer',
      description: 'Clarity of voice, artistic presence, storytelling, and creative persuasion.',
    },
    {
      key: 'recovery',
      label: 'Recovery',
      score: clamp(shares.Intellect * 2.05 + 24),
      formulaHint: 'Direct & Indirect Resource',
      description: 'Capacity to recharge, reflect, absorb wisdom, and bounce back from stress.',
    },
    {
      key: 'strategy',
      label: 'Strategy',
      score: clamp(
        shares.Intellect * 1.15 +
          shares.Power * 1.05 +
          tenGodShares['Indirect Resource'] * 0.9 +
          22
      ),
      formulaHint: 'Intellect + Power',
      description: 'Long-range planning, systems thinking, and turning pressure into leverage.',
    },
    {
      key: 'leadership',
      label: 'Leadership',
      score: clamp(shares.Power * 1.2 + dmStrengthScore * 0.45 + 18),
      formulaHint: 'Power + Day Master Strength',
      description: 'Natural authority, accountability, and capacity to guide teams forward.',
    },
    {
      key: 'influence',
      label: 'Influence',
      score: clamp(
        shares.Output * 1.1 +
          tenGodShares['Rob Wealth'] * 1.4 +
          tenGodShares['Direct Officer'] * 1.1 +
          24
      ),
      formulaHint: 'Output + Social Magnetism',
      description: 'Charisma, persuasive presence, and ability to inspire collective momentum.',
    },
  ];
}

export function calculateBaZiChart(
  year: number,
  month: number,
  day: number,
  hourBranchIndex: number | null = null,
  gender: Gender = 'female'
): BaZiChart {
  // 1. Day Pillar (computed first to derive Ten Gods across all pillars)
  const utcBase = Date.UTC(1900, 0, 1);
  const utcTarget = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((utcTarget - utcBase) / 86400000);
  const dayCycleIdx = (((10 + diffDays) % 60) + 60) % 60;
  const dayStemIdx = dayCycleIdx % 10;
  const dayBranchIdx = dayCycleIdx % 12;
  const dmStem = HEAVENLY_STEMS[dayStemIdx];
  const dayPillar = makePillar('Day', 'Self & Core', dayStemIdx, dayBranchIdx, dmStem);

  // 2. Year Pillar (transitions at Lichun ~ Feb 4)
  const baziYear = month < 2 || (month === 2 && day < 4) ? year - 1 : year;
  const yearStemIdx = (((baziYear - 4) % 10) + 10) % 10;
  const yearBranchIdx = (((baziYear - 4) % 12) + 12) % 12;
  const yearPillar = makePillar('Year', 'Roots & Heritage', yearStemIdx, yearBranchIdx, dmStem);

  // 3. Month Pillar (Five Tigers Escape Rule / 五虎遁)
  const monthOffset = getSolarMonthOffset(month, day);
  const yinMonthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (yinMonthStemStart + monthOffset) % 10;
  const monthBranchIdx = (2 + monthOffset) % 12;
  const monthPillar = makePillar('Month', 'Season & Career', monthStemIdx, monthBranchIdx, dmStem);

  // 4. Hour Pillar (Five Rats Escape Rule / 五鼠遁)
  let hourPillar: BaZiPillar | null = null;
  if (hourBranchIndex !== null && hourBranchIndex >= 0 && hourBranchIndex <= 11) {
    const ziHourStemStart = ((dayStemIdx % 5) * 2) % 10;
    const hourStemIdx = (ziHourStemStart + hourBranchIndex) % 10;
    hourPillar = makePillar('Hour', 'Legacy & Inner Drive', hourStemIdx, hourBranchIndex, dmStem);
  }

  // 5. Five Elements & Ten Gods weighting
  const elementScores: Record<WuXingElement, number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0,
  };

  const tenGodRawScores: Record<TenGodName, number> = {
    Friend: 0,
    'Rob Wealth': 0,
    'Eating God': 0,
    'Hurting Officer': 0,
    'Direct Wealth': 0,
    'Indirect Wealth': 0,
    'Direct Officer': 0,
    'Seven Killings': 0,
    'Direct Resource': 0,
    'Indirect Resource': 0,
  };

  const activePillars = [yearPillar, monthPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])];

  activePillars.forEach((p) => {
    const seasonMultiplier = p.label === 'Month' ? 1.55 : 1.0;
    elementScores[p.stem.element] += 12;
    elementScores[p.branch.element] += 14 * seasonMultiplier;

    if (p.label !== 'Day') {
      const tg = getTenGod(dmStem, p.stem);
      tenGodRawScores[tg] += 13;
    }

    p.hiddenStems.forEach((hs, hIdx) => {
      const weight = hIdx === 0 ? 7 * seasonMultiplier : hIdx === 1 ? 3.5 : 2;
      elementScores[hs.element] += weight;
      const hTg = getTenGod(dmStem, hs);
      tenGodRawScores[hTg] += weight;
    });
  });

  const totalElementScore =
    Object.values(elementScores).reduce((sum, val) => sum + val, 0) || 1;

  const elementPercentages = {} as Record<WuXingElement, number>;
  ELEMENT_CYCLE.forEach((el) => {
    elementPercentages[el] = Math.round((elementScores[el] / totalElementScore) * 100);
  });

  const sortedByScore = [...ELEMENT_CYCLE].sort(
    (a, b) => elementScores[b] - elementScores[a]
  );
  const dominantElement = sortedByScore[0];
  const weakestElement = sortedByScore[sortedByScore.length - 1];

  // 6. Day Master Strength (De Ling, De Di, De Shi)
  const resourceEl = getResourceElement(dmStem.element);
  const supportingElements: WuXingElement[] = [dmStem.element, resourceEl];

  const inSeason =
    supportingElements.includes(monthPillar.branch.element) ||
    monthPillar.hiddenStems.some((hs, idx) => idx === 0 && supportingElements.includes(hs.element));

  const hasRoots = [yearPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])].some((p) =>
    p.hiddenStems.some((hs) => supportingElements.includes(hs.element))
  );

  const hasStemSupport = [yearPillar, monthPillar, ...(hourPillar ? [hourPillar] : [])].some((p) =>
    supportingElements.includes(p.stem.element)
  );

  const supportPct = elementPercentages[dmStem.element] + elementPercentages[resourceEl];
  const rawDmStrength =
    supportPct * 0.72 + (inSeason ? 22 : 0) + (hasRoots ? 12 : 0) + (hasStemSupport ? 10 : 0);
  const dmStrengthScore = Math.max(15, Math.min(92, Math.round(rawDmStrength)));

  const dmStatus: DayMasterStrengthAnalysis['status'] =
    dmStrengthScore >= 56 ? 'Strong' : dmStrengthScore >= 44 ? 'Balanced' : 'Weak';
  const dmStatusLabel =
    dmStatus === 'Strong'
      ? 'Strong Day Master'
      : dmStatus === 'Balanced'
      ? 'Balanced Day Master'
      : 'Weak Day Master';

  const dayMasterStrength: DayMasterStrengthAnalysis = {
    status: dmStatus,
    statusLabel: dmStatusLabel,
    score: dmStrengthScore,
    inSeason,
    hasRoots,
    hasStemSupport,
    summary:
      dmStatus === 'Strong'
        ? `Your ${dmStem.pinyin} ${dmStem.element} Day Master (${dmStrengthScore}%) has abundant seasonal and root backing, thriving through action, output, and tangible goals.`
        : dmStatus === 'Balanced'
        ? `Your ${dmStem.pinyin} ${dmStem.element} Day Master (${dmStrengthScore}%) sits in natural equilibrium, adapting smoothly between reflection and outward execution.`
        : `Your ${dmStem.pinyin} ${dmStem.element} Day Master (${dmStrengthScore}%) is refined and sensitive, blossoming through mentors, strategy, and supportive allies.`,
    detailedAnalysis: `Seasonal Backing (De Ling): ${
      inSeason ? 'Supported by the Month Branch.' : 'Month season drains or challenges your core element.'
    } Root Support (De Di): ${
      hasRoots ? 'Anchored in earthly hidden stems.' : 'Light earthly roots — relies on agility.'
    } Stem Support (De Shi): ${
      hasStemSupport ? 'Allied Heavenly Stems visible.' : 'Independent Heavenly Stem stance.'
    }`,
  };

  // 7. Five Character Components (Body, Output, Wealth, Power, Intellect)
  const componentMap: {
    key: FiveComponentName;
    title: string;
    subtitle: string;
    element: WuXingElement;
    description: string;
  }[] = [
    {
      key: 'Body',
      title: 'Body & Self',
      subtitle: 'Companion Element',
      element: dmStem.element,
      description: 'Self-reliance, willpower, physical vitality, and peer networks.',
    },
    {
      key: 'Output',
      title: 'Output & Expression',
      subtitle: 'Expression Element',
      element: getOutputElement(dmStem.element),
      description: 'Creativity, communication, performance, and how you shape the world.',
    },
    {
      key: 'Wealth',
      title: 'Wealth & Value',
      subtitle: 'Results Element',
      element: getWealthElement(dmStem.element),
      description: 'Resource management, tangible execution, and material mastery.',
    },
    {
      key: 'Power',
      title: 'Power & Influence',
      subtitle: 'Authority Element',
      element: getPowerElement(dmStem.element),
      description: 'Leadership, discipline, social standing, and strategic responsibility.',
    },
    {
      key: 'Intellect',
      title: 'Intellect & Resource',
      subtitle: 'Wisdom Element',
      element: resourceEl,
      description: 'Knowledge, intuition, inner recovery, and nurturing support.',
    },
  ];

  const fiveComponents: FiveComponentScore[] = componentMap.map((c) => ({
    ...c,
    percentage: elementPercentages[c.element],
  }));

  const componentShares = fiveComponents.reduce((acc, item) => {
    acc[item.key] = item.percentage;
    return acc;
  }, {} as Record<FiveComponentName, number>);

  // 8. Profiles / Ten Gods (10 Gods)
  const totalTgScore =
    Object.values(tenGodRawScores).reduce((sum, v) => sum + v, 0) || 1;
  const tenGodShares = {} as Record<TenGodName, number>;
  (Object.keys(tenGodRawScores) as TenGodName[]).forEach((k) => {
    tenGodShares[k] = Math.round((tenGodRawScores[k] / totalTgScore) * 100);
  });

  const sortedTenGods = (Object.keys(tenGodRawScores) as TenGodName[]).sort(
    (a, b) => tenGodRawScores[b] - tenGodRawScores[a]
  );

  const tenGodProfiles: TenGodProfileItem[] = sortedTenGods.map((tg, idx) => ({
    name: tg,
    pinyinName: TEN_GOD_META[tg].pinyinName,
    component: TEN_GOD_META[tg].component,
    percentage: tenGodShares[tg],
    isPrimary: idx === 0,
    archetype: TEN_GOD_META[tg].archetype,
    talentSummary: TEN_GOD_META[tg].talentSummary,
  }));

  const primaryProfile = tenGodProfiles[0];

  // 9. Supergods / Supertalents
  const supergods: SupergodItem[] = [];

  if (tenGodShares['Eating God'] >= 12 || (componentShares.Output >= 22 && componentShares.Intellect >= 16)) {
    supergods.push({
      id: 'sg_artist',
      title: 'The Artist',
      shortTitle: 'Artist',
      badge: 'CREATIVE FLOW',
      strength: Math.min(97, 68 + tenGodShares['Eating God'] + Math.round(componentShares.Output / 2)),
      summary: 'Rare aesthetic sensitivity that turns inner emotion into captivating creative form.',
      deepDive:
        'Your Output and Resource/Eating God currents harmonize naturally, giving you refined taste, storytelling instinct, and emotional resonance.',
    });
  }

  if (tenGodShares['Hurting Officer'] >= 12 || dmStem.element === 'Fire') {
    supergods.push({
      id: 'sg_performer',
      title: 'The Performer',
      shortTitle: 'Performer',
      badge: 'MAGNETIC STAGE',
      strength: Math.min(96, 66 + tenGodShares['Hurting Officer'] * 2),
      summary: 'High-voltage charisma capable of capturing attention and inspiring audiences.',
      deepDive:
        'Expressive brilliance combined with fearless presence makes you a natural communicator, presenter, and cultural catalyst.',
    });
  }

  if (
    tenGodShares['Seven Killings'] >= 11 ||
    tenGodShares['Indirect Wealth'] >= 12 ||
    dmStem.polarity === 'Yang'
  ) {
    supergods.push({
      id: 'sg_pioneer',
      title: 'The Pioneer',
      shortTitle: 'Pioneer',
      badge: 'TRAILBLAZER',
      strength: Math.min(
        96,
        65 + tenGodShares['Seven Killings'] + tenGodShares['Indirect Wealth']
      ),
      summary: 'Bold trailblazing instinct that thrives in uncharted territory and rapid breakthroughs.',
      deepDive:
        'You spot opportunities before the crowd and possess the courage to initiate bold ventures under uncertainty.',
    });
  }

  if (
    tenGodShares['Direct Officer'] >= 11 ||
    tenGodShares['Direct Resource'] >= 12 ||
    dmStem.polarity === 'Yin'
  ) {
    supergods.push({
      id: 'sg_diplomat',
      title: 'The Diplomat',
      shortTitle: 'Diplomat',
      badge: 'STRATEGIC HARMONY',
      strength: Math.min(
        95,
        65 + tenGodShares['Direct Officer'] + tenGodShares['Direct Resource']
      ),
      summary: 'Tactful bridge-builder who aligns diverse people and builds lasting trust.',
      deepDive:
        'By combining empathy with structural clarity, you resolve tension gracefully and turn alliances into long-term success.',
    });
  }

  if (componentShares.Output >= 18 && componentShares.Wealth >= 18) {
    supergods.push({
      id: 'sg_architect',
      title: 'The Wealth Alchemist',
      shortTitle: 'Value Creator',
      badge: 'OUTPUT → WEALTH',
      strength: Math.min(98, 64 + componentShares.Output + componentShares.Wealth),
      summary: 'Direct channel from original ideas to sustainable financial and material abundance.',
      deepDive:
        'In classical BaZi (食神生财), Output generating Wealth is the signature of self-made innovators and brand builders.',
    });
  }

  // 10. Talent Bridge
  const talentBridge = computeTalentBridgeFromShares(
    componentShares,
    tenGodShares,
    dmStrengthScore
  );

  // 11. Qi Temperature Analysis: Warm vs. Cold Qi
  const seasonTempByBranch: Record<number, number> = {
    0: -28, // Zi (Dec)
    1: -22, // Chou (Jan)
    2: 6,   // Yin (Feb)
    3: 10,  // Mao (Mar)
    4: 8,   // Chen (Apr)
    5: 24,  // Si (May)
    6: 30,  // Wu (Jun)
    7: 25,  // Wei (Jul)
    8: -10, // Shen (Aug)
    9: -14, // You (Sep)
    10: 8,  // Xu (Oct)
    11: -24, // Hai (Nov)
  };

  let tempBalance = seasonTempByBranch[monthPillar.branch.index] || 0;
  tempBalance += (elementPercentages.Fire - elementPercentages.Water) * 0.95;
  tempBalance += (elementPercentages.Wood - elementPercentages.Metal) * 0.3;

  const clampedTemp = Math.max(-90, Math.min(90, Math.round(tempBalance)));
  const warmPercent = Math.round(((clampedTemp + 100) / 200) * 100);
  const coldPercent = 100 - warmPercent;

  const qiLabel: QiTemperatureAnalysis['label'] =
    clampedTemp <= -28
      ? 'Cold Qi'
      : clampedTemp <= -8
      ? 'Cool-Balanced Qi'
      : clampedTemp < 12
      ? 'Harmonious Qi'
      : clampedTemp < 30
      ? 'Warm-Balanced Qi'
      : 'Warm Qi';

  const qiHeadline =
    clampedTemp <= -28
      ? 'Cold Qi Dominant'
      : clampedTemp <= -8
      ? 'Cool-Balanced Qi'
      : clampedTemp < 12
      ? 'Harmonious Thermal Qi'
      : clampedTemp < 30
      ? 'Warm-Balanced Qi'
      : 'Warm Qi Dominant';

  const qiTemperature: QiTemperatureAnalysis = {
    score: clampedTemp,
    warmPercent,
    coldPercent,
    label: qiLabel,
    headline: qiHeadline,
    summary:
      clampedTemp < -8
        ? `Your chart carries ${coldPercent}% Cool/Water-Metal Qi — calm, deep, and analytical, thriving when warmed by Fire and passion.`
        : clampedTemp > 12
        ? `Your chart carries ${warmPercent}% Warm/Fire-Wood Qi — radiant, expressive, and fast-moving, balanced by cooling Water and stillness.`
        : `Your chart enjoys rare thermal harmony (${warmPercent}% Warm / ${coldPercent}% Cool), allowing steady flow across seasons.`,
    detailedAdvice:
      clampedTemp < -8
        ? 'Climate Regulation (Tiao Hou): Introduce Fire & Dry Earth — warm environments, sunlight, bold creative expression, and proactive movement.'
        : clampedTemp > 12
        ? 'Climate Regulation (Tiao Hou): Introduce Water & Wet Earth — hydration, evening quiet, strategic reflection, and cooling environments.'
        : 'Climate Regulation (Tiao Hou): Maintain seasonal rhythm; minor adjustments in Fire or Water keep your momentum effortless.',
  };

  // 12. Qi Boost / Useful Elements (Yong Shen 0 - 10 scale)
  const isColdChart = clampedTemp < -6;
  const isWarmChart = clampedTemp > 10;
  const isWeakDm = dmStatus === 'Weak';
  const isStrongDm = dmStatus === 'Strong';

  const boostNeed = (el: WuXingElement, subType?: 'dry' | 'wet'): number => {
    let score = 5.0;
    score += (20 - elementPercentages[el]) * 0.16;

    if (isWeakDm && supportingElements.includes(el)) score += 2.2;
    if (isStrongDm && !supportingElements.includes(el)) score += 1.9;

    if (isColdChart) {
      if (el === 'Fire') score += 2.6;
      if (subType === 'dry') score += 1.9;
      if (el === 'Water' || subType === 'wet') score -= 1.8;
    }
    if (isWarmChart) {
      if (el === 'Water') score += 2.6;
      if (subType === 'wet') score += 1.9;
      if (el === 'Fire' || subType === 'dry') score -= 1.8;
    }

    return Math.max(1.2, Math.min(9.8, Number(score.toFixed(1))));
  };

  const rawQiBoost: Array<{
    element: SixBoostElement;
    label: string;
    hanzi: string;
    score: number;
    color: string;
    actionTip: string;
  }> = [
    {
      element: 'Wood',
      label: 'Wood',
      hanzi: '木',
      score: boostNeed('Wood'),
      color: '#22C55E',
      actionTip: 'Morning walks in nature, learning new skills, green tones, and long-term planning.',
    },
    {
      element: 'Fire',
      label: 'Fire',
      hanzi: '火',
      score: boostNeed('Fire'),
      color: '#EF4444',
      actionTip: 'Sunlight exposure, public speaking, cardio movement, warm lighting, and joyful social connection.',
    },
    {
      element: 'Dry Earth',
      label: 'Dry Earth',
      hanzi: '戌未',
      score: boostNeed('Earth', 'dry'),
      color: '#D97706',
      actionTip: 'Structured routines, grounding breathwork, ceramics/stone, and decisive boundaries.',
    },
    {
      element: 'Wet Earth',
      label: 'Wet Earth',
      hanzi: '辰丑',
      score: boostNeed('Earth', 'wet'),
      color: '#EAB308',
      actionTip: 'Nurturing community, restorative nutrition, emotional receptivity, and steady cultivation.',
    },
    {
      element: 'Metal',
      label: 'Metal',
      hanzi: '金',
      score: boostNeed('Metal'),
      color: '#94A3B8',
      actionTip: 'Decluttering your workspace, precision scheduling, breathwork, and decisive prioritization.',
    },
    {
      element: 'Water',
      label: 'Water',
      hanzi: '水',
      score: boostNeed('Water'),
      color: '#3B82F6',
      actionTip: 'Deep hydration, swimming or time near water, meditation, travel, and fluid adaptability.',
    },
  ];

  const sortedBoostScores = [...rawQiBoost].sort((a, b) => b.score - a.score);
  const top1 = sortedBoostScores[0]?.element;
  const top2 = sortedBoostScores[1]?.element;

  const qiBoost: QiBoostElementScore[] = rawQiBoost.map((item) => ({
    ...item,
    role:
      item.element === top1
        ? 'Primary Yong Shen'
        : item.element === top2
        ? 'Secondary Support'
        : item.score >= 5.2
        ? 'Neutral'
        : 'Low Priority',
  }));

  // 13. 10-Year Luck Pillars (Da Yun) + Dynamic Talent Bridge
  const isYangYear = yearPillar.stem.polarity === 'Yang';
  const isForward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');
  const direction = isForward ? 1 : -1;

  // Starting age derived from days to the nearest Jieqi solar boundary (3 days = 1 year)
  const daysToBoundary = isForward ? Math.max(3, 30 - day) : Math.max(3, day);
  const startAge = Math.max(1, Math.min(10, Math.round(daysToBoundary / 3)));
  const currentAge = Math.max(0, new Date().getFullYear() - year);

  const luckPillars: LuckPillarItem[] = Array.from({ length: 8 }, (_, idx) => {
    const step = idx + 1;
    const lpStemIdx = (((monthStemIdx + direction * step) % 10) + 10) % 10;
    const lpBranchIdx = (((monthBranchIdx + direction * step) % 12) + 12) % 12;
    const lpStem = HEAVENLY_STEMS[lpStemIdx];
    const lpBranch = EARTHLY_BRANCHES[lpBranchIdx];

    const lpStartAge = startAge + idx * 10;
    const lpEndAge = lpStartAge + 9;
    const lpStartYear = year + lpStartAge;
    const lpEndYear = year + lpEndAge;
    const isCurrent = currentAge >= lpStartAge && currentAge <= lpEndAge;

    const stemTenGod = getTenGod(dmStem, lpStem);
    const branchMainStem = HEAVENLY_STEMS[lpBranch.hiddenStems[0]];
    const branchTenGod = getTenGod(dmStem, branchMainStem);

    // Dynamic Talent Bridge shifts for this 10-year cycle
    const boostedComponentShares = { ...componentShares };
    const stemComp = TEN_GOD_META[stemTenGod].component;
    const branchComp = TEN_GOD_META[branchTenGod].component;
    boostedComponentShares[stemComp] = Math.min(65, boostedComponentShares[stemComp] + 9);
    boostedComponentShares[branchComp] = Math.min(65, boostedComponentShares[branchComp] + 12);

    const boostedTenGodShares = { ...tenGodShares };
    boostedTenGodShares[stemTenGod] = Math.min(60, boostedTenGodShares[stemTenGod] + 8);
    boostedTenGodShares[branchTenGod] = Math.min(60, boostedTenGodShares[branchTenGod] + 10);

    const lpBridgeRaw = computeTalentBridgeFromShares(
      boostedComponentShares,
      boostedTenGodShares,
      dmStrengthScore
    );

    const dynamicTalentBridge = lpBridgeRaw.map((m, mIdx) => ({
      ...m,
      delta: m.score - talentBridge[mIdx].score,
    }));

    const isFavorableCycle =
      lpStem.element === top1 ||
      lpBranch.element === top1 ||
      lpStem.element === weakestElement;

    return {
      index: idx,
      startAge: lpStartAge,
      endAge: lpEndAge,
      startYear: lpStartYear,
      endYear: lpEndYear,
      stem: lpStem,
      branch: lpBranch,
      stemTenGod,
      branchTenGod,
      isCurrent,
      headline: `${lpStem.pinyin}-${lpBranch.pinyin} · ${TEN_GOD_META[branchTenGod].archetype}`,
      summary: `Ages ${lpStartAge}–${lpEndAge} (${lpStartYear}–${lpEndYear}): ${lpStem.element} over ${lpBranch.element} activates ${stemTenGod} and ${branchTenGod}.`,
      detailedForecast: isFavorableCycle
        ? `High-alignment decade: ${lpStem.pinyin} ${lpStem.element} and ${lpBranch.pinyin} (${lpBranch.animal}) bring strong ${top1} nourishment to your chart, accelerating breakthroughs in ${TEN_GOD_META[branchTenGod].component.toLowerCase()}.`
        : `Growth-through-mastery decade: ${lpStem.pinyin} ${lpStem.element} and ${lpBranch.pinyin} (${lpBranch.animal}) spotlight ${stemTenGod} (${TEN_GOD_META[stemTenGod].pinyinName}) and ${branchTenGod} (${TEN_GOD_META[branchTenGod].pinyinName}), inviting conscious balance with ${top1}.`,
      dynamicTalentBridge,
    };
  });

  // 14. 2026 Annual Transit: Bing-Wu (丙午)
  const dmBase = DAY_MASTER_DESCRIPTIONS[dmStem.index];
  const dayMaster: DayMasterProfile = {
    stem: dmStem,
    ...dmBase,
    favorableElement: weakestElement,
  };

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
    dayMasterStrength,
    zodiacAnimal: yearPillar.branch.animal,
    gender,
    birthYear: year,
    elementScores,
    elementPercentages,
    dominantElement,
    weakestElement,
    fiveComponents,
    tenGodProfiles,
    primaryProfile,
    supergods,
    talentBridge,
    qiTemperature,
    qiBoost,
    luckPillars,
    annualTransit2026: {
      pillarName: '丙午 Bing-Wu · Yang Fire Horse (2026)',
      elementRelation: transitInfo.relation,
      guidance: transitInfo.guidance,
    },
  };
}

// MatchMaker — Elemental Compatibility Between Two Charts (Love, Business, Friendship)
export function compareBaZiCharts(
  chartA: BaZiChart,
  chartB: BaZiChart,
  matchType: MatchType
): MatchMakerResult {
  const dmA = chartA.dayMaster.stem;
  const dmB = chartB.dayMaster.stem;

  // Heavenly Stem Five Combinations (五合: 0-5, 1-6, 2-7, 3-8, 4-9)
  const isStemCombination = Math.abs(dmA.index - dmB.index) === 5;
  const isSameElement = dmA.element === dmB.element;
  const relAB = (getElementIndex(dmB.element) - getElementIndex(dmA.element) + 5) % 5;
  const isProductivePair = relAB === 1 || relAB === 4;

  const dayMasterChemistryScore = isStemCombination
    ? 95
    : isProductivePair
    ? 86
    : isSameElement
    ? 78
    : 68;

  // Mutual Yong Shen support
  const topBoostA = chartA.qiBoost.slice(0, 2).map((b) => b.element);
  const topBoostB = chartB.qiBoost.slice(0, 2).map((b) => b.element);
  const bFeedsA = topBoostA.some((el) => el.includes(chartB.dominantElement));
  const aFeedsB = topBoostB.some((el) => el.includes(chartA.dominantElement));

  const yongShenSupportScore =
    bFeedsA && aFeedsB ? 94 : bFeedsA || aFeedsB ? 83 : 70;

  // Earthly Branches (Six Harmonies 六合: sum % 12 === 1, Clashes 六冲: diff === 6)
  const dayBranchA = chartA.dayPillar.branch.index;
  const dayBranchB = chartB.dayPillar.branch.index;
  const isBranchHarmony = (dayBranchA + dayBranchB) % 12 === 1;
  const isBranchClash = Math.abs(dayBranchA - dayBranchB) === 6;

  const elementHarmonyScore = isBranchHarmony
    ? 92
    : isBranchClash
    ? 64
    : 80;

  const weights =
    matchType === 'romantic'
      ? { dm: 0.4, ys: 0.35, el: 0.25 }
      : matchType === 'business'
      ? { dm: 0.25, ys: 0.45, el: 0.3 }
      : { dm: 0.35, ys: 0.25, el: 0.4 };

  const overallScore = Math.round(
    dayMasterChemistryScore * weights.dm +
      yongShenSupportScore * weights.ys +
      elementHarmonyScore * weights.el
  );

  const strengths: string[] = [];
  if (isStemCombination) {
    strengths.push(
      `Magnetic Heavenly Stem Combination (${dmA.pinyin} + ${dmB.pinyin}) creates natural mutual attraction.`
    );
  }
  if (bFeedsA || aFeedsB) {
    strengths.push(
      `Complementary Qi: your dominant elements supply each other's useful Yong Shen balance.`
    );
  }
  if (isBranchHarmony) {
    strengths.push(
      `Day Branch Six Harmony (${chartA.dayPillar.branch.animal} & ${chartB.dayPillar.branch.animal}) supports daily ease.`
    );
  }
  if (strengths.length === 0) {
    strengths.push(
      `${dmA.element} and ${dmB.element} bring distinct perspectives that expand each other's horizons.`
    );
  }

  const challenges: string[] = [];
  if (isBranchClash) {
    challenges.push(
      `Day Branch Clash (${chartA.dayPillar.branch.animal} vs. ${chartB.dayPillar.branch.animal}) requires conscious space during stress.`
    );
  }
  if (chartA.qiTemperature.label === chartB.qiTemperature.label && Math.abs(chartA.qiTemperature.score) > 25) {
    challenges.push(
      `Both charts share strong ${chartA.qiTemperature.label} — intentionally cultivate grounding breaks together.`
    );
  }
  if (challenges.length === 0) {
    challenges.push(
      `Align expectations early around pacing (${chartA.dominantElement} rhythm vs. ${chartB.dominantElement} rhythm).`
    );
  }

  const contextAdvice =
    matchType === 'romantic'
      ? 'Honor both emotional intimacy and personal autonomy; shared rituals anchor your bond.'
      : matchType === 'business'
      ? `Divide roles by strength: let ${chartA.primaryProfile.archetype} lead vision while ${chartB.primaryProfile.archetype} anchors execution.`
      : 'Keep communication open and playful — your friendship thrives on shared curiosity and mutual encouragement.';

  return {
    matchType,
    overallScore,
    elementHarmonyScore,
    dayMasterChemistryScore,
    yongShenSupportScore,
    headline: `${dmA.pinyin} ${dmA.element} × ${dmB.pinyin} ${dmB.element}`,
    summary:
      overallScore >= 85
        ? `High elemental synergy (${overallScore}%): natural chemistry backed by strong Yong Shen mutual support.`
        : `Balanced dynamic (${overallScore}%): complementary talents that flourish with clear communication.`,
    strengths,
    challenges,
    advice: contextAdvice,
  };
}