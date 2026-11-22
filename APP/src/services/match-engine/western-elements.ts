import {
  ExplanationFact,
  ModuleComponentResult,
  WesternElementVector,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalizes a Western element object into canonical order:
 * [fire, air, water, earth], non-negative, summing to 1.
 */
export function normalizeElementVector(
  shares?: WesternElementVector | null
): [number, number, number, number] | null {
  if (!shares) return null;
  const raw = [
    Math.max(0, Number(shares.fire) || 0),
    Math.max(0, Number(shares.air) || 0),
    Math.max(0, Number(shares.water) || 0),
    Math.max(0, Number(shares.earth) || 0),
  ];
  const sum = raw.reduce((acc, v) => acc + v, 0);
  if (sum <= 0) return null;
  return [raw[0] / sum, raw[1] / sum, raw[2] / sum, raw[3] / sum];
}

/**
 * Involutive complement transform T(e) = [e.air, e.fire, e.earth, e.water]
 * (Fire <-> Air, Water <-> Earth)
 */
export function complementTransform(
  e: [number, number, number, number]
): [number, number, number, number] {
  return [e[1], e[0], e[3], e[2]];
}

export function evaluateWesternElements(
  vecA: [number, number, number, number] | null,
  vecB: [number, number, number, number] | null,
  configuredWeight: number,
  enabled = true,
  confidence = 1.0
): {
  component: ModuleComponentResult<{
    vectorA: [number, number, number, number];
    vectorB: [number, number, number, number];
    complementOfB: [number, number, number, number];
    perSlotDelta: [number, number, number, number];
    pattern: 'reciprocal_complement' | 'balanced_harmony' | 'mixed';
  }>;
  facts: ExplanationFact[];
} {
  if (!enabled) {
    return {
      component: {
        name: 'western_elements',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MODULE_OPTED_OUT',
      },
      facts: [],
    };
  }

  if (!vecA || !vecB) {
    return {
      component: {
        name: 'western_elements',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MISSING_ELEMENT_SHARES',
      },
      facts: [],
    };
  }

  const tB = complementTransform(vecB);
  const perSlotDelta: [number, number, number, number] = [
    Math.abs(vecA[0] - tB[0]),
    Math.abs(vecA[1] - tB[1]),
    Math.abs(vecA[2] - tB[2]),
    Math.abs(vecA[3] - tB[3]),
  ];

  const l1Diff = perSlotDelta[0] + perSlotDelta[1] + perSlotDelta[2] + perSlotDelta[3];
  const score = clamp(1 - 0.5 * l1Diff, 0, 1);

  const isBalancedA = vecA.every((v) => Math.abs(v - 0.25) <= 0.08);
  const isBalancedB = vecB.every((v) => Math.abs(v - 0.25) <= 0.08);
  const pattern =
    isBalancedA && isBalancedB
      ? 'balanced_harmony'
      : score >= 0.78
      ? 'reciprocal_complement'
      : 'mixed';

  const elementLabelsBg = ['Огън', 'Въздух', 'Вода', 'Земя'];
  const domAIdx = vecA.indexOf(Math.max(...vecA));
  const domBIdx = vecB.indexOf(Math.max(...vecB));

  const facts: ExplanationFact[] = [];
  if (score >= 0.72) {
    facts.push({
      key: `elements.${pattern}`,
      module: 'western_elements',
      polarity: 'supportive',
      weight: score,
      evidence: {
        dominantA: elementLabelsBg[domAIdx],
        dominantB: elementLabelsBg[domBIdx],
        score: Math.round(score * 100) / 100,
      },
      textBg:
        pattern === 'balanced_harmony'
          ? 'И двата профила имат равномерно разпределение на четирите елемента (Огън, Въздух, Вода, Земя).'
          : `Взаимно допълване на елементите: водещ ${elementLabelsBg[domAIdx]} при единия профил и ${elementLabelsBg[domBIdx]} при другия (ос Огън↔Въздух / Вода↔Земя).`,
      textEn:
        pattern === 'balanced_harmony'
          ? 'Both profiles exhibit a balanced distribution across Fire, Air, Water, and Earth.'
          : `Reciprocal element complementarity between ${elementLabelsBg[domAIdx]} and ${elementLabelsBg[domBIdx]} (Fire↔Air / Water↔Earth).`,
    });
  }

  return {
    component: {
      name: 'western_elements',
      score,
      configuredWeight,
      effectiveWeight: configuredWeight,
      available: true,
      confidence,
      details: {
        vectorA: vecA,
        vectorB: vecB,
        complementOfB: tB,
        perSlotDelta,
        pattern,
      },
    },
    facts,
  };
}