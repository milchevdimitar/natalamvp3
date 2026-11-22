import {
  BaZiChartSnapshot,
  BaZiElement,
  BaZiPillar,
  ExplanationFact,
  MatchEngineConfig,
  ModuleComponentResult,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Traditional Five-Element Generating (相生) & Controlling (相克) Cycles
const GENERATES: Record<BaZiElement, BaZiElement> = {
  Wood: 'Fire',
  Fire: 'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
};

const CONTROLS: Record<BaZiElement, BaZiElement> = {
  Wood: 'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
};

// Five Heavenly Stem Combinations (五合)
const STEM_COMBINATIONS = new Set([
  'Jia::Ji',
  'Yi::Geng',
  'Bing::Xin',
  'Ding::Ren',
  'Wu::Gui',
]);

// Four Heavenly Stem Clashes (四冲)
const STEM_CLASHES = new Set([
  'Jia::Geng',
  'Yi::Xin',
  'Bing::Ren',
  'Ding::Gui',
]);

// Earthly Branch Six Harmonies (六合)
const BRANCH_SIX_HARMONIES = new Set([
  'Chou::Zi',
  'Hai::Yin',
  'Mao::Xu',
  'Chen::You',
  'Se::Shen',
  'Si::Shen',
  'Wei::Wu',
]);

// Earthly Branch Six Clashes (六冲)
const BRANCH_SIX_CLASHES = new Set([
  'Wu::Zi',
  'Chou::Wei',
  'Shen::Yin',
  'Mao::You',
  'Chen::Xu',
  'Hai::Si',
]);

// Earthly Branch Three Harmonies (三合) pairs
const BRANCH_THREE_HARMONY_PAIRS = new Set([
  'Shen::Zi', 'Chen::Zi', 'Chen::Shen', // Water frame
  'Hai::Mao', 'Hai::Wei', 'Mao::Wei',   // Wood frame
  'Yin::Wu', 'Wu::Xu', 'Yin::Xu',       // Fire frame
  'Si::You', 'Chou::Si', 'Chou::You',   // Metal frame
]);

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

function scoreStemPair(pA: BaZiPillar, pB: BaZiPillar): { score: number; relation: string } {
  const k = pairKey(pA.stem, pB.stem);
  if (STEM_COMBINATIONS.has(k)) {
    return { score: 0.92, relation: 'five_stem_combination' };
  }
  if (STEM_CLASHES.has(k)) {
    return { score: 0.42, relation: 'stem_clash' };
  }
  if (pA.stemElement === pB.stemElement) {
    return { score: pA.polarity !== pB.polarity ? 0.80 : 0.72, relation: 'same_element' };
  }
  if (
    GENERATES[pA.stemElement] === pB.stemElement ||
    GENERATES[pB.stemElement] === pA.stemElement
  ) {
    return { score: 0.84, relation: 'generating_cycle' };
  }
  if (
    CONTROLS[pA.stemElement] === pB.stemElement ||
    CONTROLS[pB.stemElement] === pA.stemElement
  ) {
    return { score: 0.55, relation: 'controlling_cycle' };
  }
  return { score: 0.65, relation: 'neutral' };
}

function scoreBranchPair(bA: string, bB: string): { score: number; relation: string } {
  if (bA === bB) return { score: 0.72, relation: 'same_branch' };
  const k = pairKey(bA, bB);
  if (BRANCH_SIX_HARMONIES.has(k)) {
    return { score: 0.95, relation: 'six_harmony' };
  }
  if (BRANCH_THREE_HARMONY_PAIRS.has(k)) {
    return { score: 0.85, relation: 'three_harmony_affinity' };
  }
  if (BRANCH_SIX_CLASHES.has(k)) {
    // Clash = activating dynamic tension, never binary failure
    return { score: 0.42, relation: 'six_clash' };
  }
  return { score: 0.62, relation: 'neutral' };
}

function collectChartElements(chart: BaZiChartSnapshot): Set<BaZiElement> {
  const present = new Set<BaZiElement>();
  const list = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    ...(chart.hasHourPillar && chart.pillars.hour ? [chart.pillars.hour] : []),
  ];
  for (const p of list) {
    if (p?.stemElement) present.add(p.stemElement);
    if (p?.branchElement) present.add(p.branchElement);
  }
  return present;
}

export function evaluateBaZiCompatibility(
  chartA: BaZiChartSnapshot | null | undefined,
  chartB: BaZiChartSnapshot | null | undefined,
  configuredWeight: number,
  config: MatchEngineConfig['bazi'],
  enabled = true
): {
  component: ModuleComponentResult<{
    pillarsUsedA: 3 | 4;
    pillarsUsedB: 3 | 4;
    dayMasterRelation: string;
    dayBranchRelation: string;
    subfeatureScores: Record<string, number | null>;
    ruleVersionA: string;
    ruleVersionB: string;
  }>;
  facts: ExplanationFact[];
} {
  if (!enabled) {
    return {
      component: {
        name: 'bazi',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MODULE_OPTED_OUT_OR_FLAGGED_OFF',
      },
      facts: [],
    };
  }

  if (
    !chartA?.pillars?.year ||
    !chartA?.pillars?.month ||
    !chartA?.pillars?.day ||
    !chartB?.pillars?.year ||
    !chartB?.pillars?.month ||
    !chartB?.pillars?.day
  ) {
    return {
      component: {
        name: 'bazi',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'BAZI_CHART_UNAVAILABLE',
      },
      facts: [],
    };
  }

  // 1. Day Master relation (25%)
  const dm = scoreStemPair(chartA.pillars.day, chartB.pillars.day);

  // 2. Day Branch / Spouse Palace interaction (30%)
  const db = scoreBranchPair(chartA.pillars.day.branch, chartB.pillars.day.branch);

  // 3. Favorable element supply (25%) — only when explicit favorable elements exist
  let favScore: number | null = null;
  const favA = chartA.favorableElements || [];
  const favB = chartB.favorableElements || [];
  if (favA.length > 0 && favB.length > 0) {
    const elemA = collectChartElements(chartA);
    const elemB = collectChartElements(chartB);
    const bSuppliesA = favA.filter((el) => elemB.has(el)).length / favA.length;
    const aSuppliesB = favB.filter((el) => elemA.has(el)).length / favB.length;
    favScore = Math.round(clamp(0.45 + 0.55 * ((bSuppliesA + aSuppliesB) / 2), 0, 1) * 100) / 100;
  }

  // 4. Cross-chart Stem relations across Year/Month/(Hour) (15%)
  const yearStem = scoreStemPair(chartA.pillars.year, chartB.pillars.year);
  const monthStem = scoreStemPair(chartA.pillars.month, chartB.pillars.month);
  const stemRelScore = Math.round(((yearStem.score + monthStem.score) / 2) * 100) / 100;

  // 5. Other Branches (Year & Month) (5%)
  const yearBranch = scoreBranchPair(chartA.pillars.year.branch, chartB.pillars.year.branch);
  const monthBranch = scoreBranchPair(chartA.pillars.month.branch, chartB.pillars.month.branch);
  const otherBranchScore = Math.round(((yearBranch.score + monthBranch.score) / 2) * 100) / 100;

  // Redistribute subfeature weights if favorableElementSupply is unavailable
  const subWeights: Array<{ key: string; score: number | null; weight: number }> = [
    { key: 'dayBranchSpousePalace', score: db.score, weight: config.subfeatureWeights.dayBranchSpousePalace },
    { key: 'dayMasterRelation', score: dm.score, weight: config.subfeatureWeights.dayMasterRelation },
    { key: 'favorableElementSupply', score: favScore, weight: config.subfeatureWeights.favorableElementSupply },
    { key: 'stemRelations', score: stemRelScore, weight: config.subfeatureWeights.stemRelations },
    { key: 'otherBranches', score: otherBranchScore, weight: config.subfeatureWeights.otherBranches },
  ];

  const activeSubs = subWeights.filter((s) => s.score !== null);
  const totalSubWeight = activeSubs.reduce((acc, s) => acc + s.weight, 0);
  const weightedScore =
    totalSubWeight > 0
      ? activeSubs.reduce((acc, s) => acc + (s.score! * s.weight) / totalSubWeight, 0)
      : 0.5;

  const pillarsUsedA: 3 | 4 = chartA.hasHourPillar && chartA.pillars.hour ? 4 : 3;
  const pillarsUsedB: 3 | 4 = chartB.hasHourPillar && chartB.pillars.hour ? 4 : 3;
  const confidence = pillarsUsedA === 4 && pillarsUsedB === 4 ? 1.0 : 0.78;

  const facts: ExplanationFact[] = [];
  if (db.relation === 'six_harmony' || db.relation === 'three_harmony_affinity') {
    facts.push({
      key: `bazi.dayBranch.${db.relation}`,
      module: 'bazi',
      polarity: 'supportive',
      weight: db.score,
      evidence: {
        dayBranchA: chartA.pillars.day.branch,
        dayBranchB: chartB.pillars.day.branch,
        relation: db.relation,
      },
      textBg: `Ба Дзъ дневните земни клонки (${chartA.pillars.day.branch} и ${chartB.pillars.day.branch}) образуват традиционна хармония (${db.relation}).`,
      textEn: `Ba Zi Day Branches (${chartA.pillars.day.branch} and ${chartB.pillars.day.branch}) form a traditional harmony (${db.relation}).`,
    });
  } else if (db.relation === 'six_clash') {
    facts.push({
      key: 'bazi.dayBranch.six_clash',
      module: 'bazi',
      polarity: 'tension',
      weight: 0.6,
      evidence: {
        dayBranchA: chartA.pillars.day.branch,
        dayBranchB: chartB.pillars.day.branch,
      },
      textBg: `Ба Дзъ дневните клонки (${chartA.pillars.day.branch} и ${chartB.pillars.day.branch}) са в сблъсък (Six Clash) — носи динамика и нужда от адаптивност.`,
      textEn: `Ba Zi Day Branches (${chartA.pillars.day.branch} and ${chartB.pillars.day.branch}) form a Six Clash — signaling active dynamic tension and adaptability.`,
    });
  }

  if (dm.relation === 'five_stem_combination' || dm.relation === 'generating_cycle') {
    facts.push({
      key: `bazi.dayMaster.${dm.relation}`,
      module: 'bazi',
      polarity: 'supportive',
      weight: dm.score,
      evidence: {
        dayMasterA: `${chartA.pillars.day.stem} (${chartA.pillars.day.stemElement})`,
        dayMasterB: `${chartB.pillars.day.stem} (${chartB.pillars.day.stemElement})`,
        relation: dm.relation,
      },
      textBg: `Дневните господари в Ба Дзъ (${chartA.pillars.day.stemElement} и ${chartB.pillars.day.stemElement}) се намират в подкрепящо взаимодействие (${dm.relation}).`,
      textEn: `Ba Zi Day Masters (${chartA.pillars.day.stemElement} and ${chartB.pillars.day.stemElement}) share a supportive interaction (${dm.relation}).`,
    });
  }

  return {
    component: {
      name: 'bazi',
      score: Math.round(clamp(weightedScore, 0, 1) * 10000) / 10000,
      configuredWeight,
      effectiveWeight: configuredWeight,
      available: true,
      confidence,
      details: {
        pillarsUsedA,
        pillarsUsedB,
        dayMasterRelation: dm.relation,
        dayBranchRelation: db.relation,
        subfeatureScores: {
          dayBranchSpousePalace: db.score,
          dayMasterRelation: dm.score,
          favorableElementSupply: favScore,
          stemRelations: stemRelScore,
          otherBranches: otherBranchScore,
        },
        ruleVersionA: chartA.ruleSet?.version || 'unversioned',
        ruleVersionB: chartB.ruleSet?.version || 'unversioned',
      },
    },
    facts,
  };
}