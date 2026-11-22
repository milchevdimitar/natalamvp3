import { ExplanationFact, ModuleComponentResult } from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function evaluatePolarity(
  polarityA: { score: number; sourceCoverage: number; provenance: string } | null,
  polarityB: { score: number; sourceCoverage: number; provenance: string } | null,
  configuredWeight: number,
  enabled = true
): {
  component: ModuleComponentResult<{
    pA: number;
    pB: number;
    provenanceA: string;
    provenanceB: string;
    dynamicType: 'complementary_polarity' | 'balanced_center' | 'same_pole_intensity';
  }>;
  facts: ExplanationFact[];
} {
  if (!enabled) {
    return {
      component: {
        name: 'polarity',
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

  if (!polarityA || !polarityB) {
    return {
      component: {
        name: 'polarity',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MISSING_POLARITY_SCORE',
      },
      facts: [],
    };
  }

  const pA = clamp(polarityA.score, -1, 1);
  const pB = clamp(polarityB.score, -1, 1);
  const score = clamp(1 - Math.abs(pA + pB) / 2, 0, 1);
  const confidence = clamp(
    Math.min(polarityA.sourceCoverage, polarityB.sourceCoverage),
    0,
    1
  );

  const dynamicType =
    Math.abs(pA) <= 0.2 && Math.abs(pB) <= 0.2
      ? 'balanced_center'
      : pA * pB < 0
      ? 'complementary_polarity'
      : 'same_pole_intensity';

  const facts: ExplanationFact[] = [];
  if (score >= 0.75) {
    facts.push({
      key: `polarity.${dynamicType}`,
      module: 'polarity',
      polarity: 'supportive',
      weight: score,
      evidence: { pA: Math.round(pA * 100) / 100, pB: Math.round(pB * 100) / 100 },
      textBg:
        dynamicType === 'balanced_center'
          ? 'Символичен баланс между активна (Ян) и възприемчива (Ин) енергия и при двамата.'
          : 'Допълваща се символична полярност между активен (Ян) и възприемчив (Ин) темперамент.',
      textEn:
        dynamicType === 'balanced_center'
          ? 'Symbolic equilibrium between active (Yang) and receptive (Yin) energy in both profiles.'
          : 'Complementary symbolic energetic polarity between active (Yang) and receptive (Yin) tendencies.',
    });
  } else if (score <= 0.35) {
    facts.push({
      key: 'polarity.same_pole_intensity',
      module: 'polarity',
      polarity: 'tension',
      weight: 1 - score,
      evidence: { pA: Math.round(pA * 100) / 100, pB: Math.round(pB * 100) / 100 },
      textBg:
        'Силно изразен сходен енергиен полюс (и двамата са силно Ян или силно Ин) — изисква осъзнато редуване на инициативата.',
      textEn:
        'Strongly concentrated shared energetic pole (both strongly Yang or strongly Yin), requiring conscious pacing.',
    });
  }

  return {
    component: {
      name: 'polarity',
      score,
      configuredWeight,
      effectiveWeight: configuredWeight,
      available: true,
      confidence,
      details: {
        pA,
        pB,
        provenanceA: polarityA.provenance,
        provenanceB: polarityB.provenance,
        dynamicType,
      },
    },
    facts,
  };
}