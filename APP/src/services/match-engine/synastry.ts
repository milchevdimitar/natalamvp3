import {
  AspectType,
  ExplanationFact,
  MatchEngineConfig,
  ModuleComponentResult,
  SignificantAspectFact,
  SynastryBody,
  SynastryDomain,
} from './types';

const ASPECT_EXACT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

const ASPECT_TIE_ORDER: AspectType[] = [
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile',
];

const BODY_NAMES_BG: Record<SynastryBody, string> = {
  sun: 'Слънце',
  moon: 'Луна',
  mercury: 'Меркурий',
  venus: 'Венера',
  mars: 'Марс',
  jupiter: 'Юпитер',
  saturn: 'Сатурн',
  asc: 'Асцендент',
  mc: 'Медиум Цели (MC)',
};

const ASPECT_NAMES_BG: Record<AspectType, string> = {
  conjunction: 'съвпад (0°)',
  sextile: 'секстил (60°)',
  square: 'квадратура (90°)',
  trine: 'тригон (120°)',
  opposition: 'опозиция (180°)',
};

interface PairAspectRule {
  weight: number;
  valence: 'supportive' | 'dynamic' | 'challenging';
  domains: Partial<Record<SynastryDomain, number>>; // coefficients in [-1, 1]
}

// Symmetric pair key: `${minBody}::${maxBody}`
const SYNASTRY_RULES: Record<string, Partial<Record<AspectType, PairAspectRule>>> = {
  'moon::sun': {
    conjunction: { weight: 1.5, valence: 'supportive', domains: { emotional_harmony: 0.85, stability: 0.70 } },
    trine: { weight: 1.4, valence: 'supportive', domains: { emotional_harmony: 0.90, stability: 0.75 } },
    sextile: { weight: 1.3, valence: 'supportive', domains: { emotional_harmony: 0.75, communication: 0.55 } },
    square: { weight: 1.3, valence: 'challenging', domains: { emotional_harmony: -0.45, friction: 0.65, attraction: 0.30 } },
    opposition: { weight: 1.4, valence: 'dynamic', domains: { attraction: 0.65, emotional_harmony: 0.25, friction: 0.50 } },
  },
  'moon::moon': {
    conjunction: { weight: 1.4, valence: 'supportive', domains: { emotional_harmony: 0.85, stability: 0.65 } },
    trine: { weight: 1.4, valence: 'supportive', domains: { emotional_harmony: 0.90, stability: 0.70 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { emotional_harmony: 0.75 } },
    square: { weight: 1.2, valence: 'challenging', domains: { emotional_harmony: -0.55, friction: 0.65 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { emotional_harmony: -0.25, friction: 0.45 } },
  },
  'moon::venus': {
    conjunction: { weight: 1.4, valence: 'supportive', domains: { emotional_harmony: 0.85, attraction: 0.70 } },
    trine: { weight: 1.3, valence: 'supportive', domains: { emotional_harmony: 0.85, attraction: 0.65 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { emotional_harmony: 0.75, attraction: 0.55 } },
    square: { weight: 1.1, valence: 'dynamic', domains: { attraction: 0.40, emotional_harmony: -0.30, friction: 0.45 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { attraction: 0.60, emotional_harmony: 0.30, friction: 0.40 } },
  },
  'mars::venus': {
    conjunction: { weight: 1.5, valence: 'supportive', domains: { attraction: 0.95, emotional_harmony: 0.45 } },
    trine: { weight: 1.4, valence: 'supportive', domains: { attraction: 0.85, emotional_harmony: 0.60 } },
    sextile: { weight: 1.3, valence: 'supportive', domains: { attraction: 0.80, emotional_harmony: 0.50 } },
    square: { weight: 1.4, valence: 'dynamic', domains: { attraction: 0.80, friction: 0.65 } },
    opposition: { weight: 1.5, valence: 'dynamic', domains: { attraction: 0.85, friction: 0.55 } },
  },
  'venus::venus': {
    conjunction: { weight: 1.2, valence: 'supportive', domains: { emotional_harmony: 0.80, attraction: 0.65 } },
    trine: { weight: 1.2, valence: 'supportive', domains: { emotional_harmony: 0.80, attraction: 0.60 } },
    sextile: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.70 } },
    square: { weight: 1.1, valence: 'challenging', domains: { emotional_harmony: -0.45, friction: 0.55 } },
    opposition: { weight: 1.1, valence: 'dynamic', domains: { attraction: 0.50, friction: 0.45 } },
  },
  'mercury::mercury': {
    conjunction: { weight: 1.3, valence: 'supportive', domains: { communication: 0.85 } },
    trine: { weight: 1.3, valence: 'supportive', domains: { communication: 0.90 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { communication: 0.80 } },
    square: { weight: 1.2, valence: 'challenging', domains: { communication: -0.65, friction: 0.60 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { communication: -0.25, friction: 0.50 } },
  },
  'mercury::moon': {
    conjunction: { weight: 1.3, valence: 'supportive', domains: { communication: 0.80, emotional_harmony: 0.65 } },
    trine: { weight: 1.3, valence: 'supportive', domains: { communication: 0.85, emotional_harmony: 0.70 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { communication: 0.75, emotional_harmony: 0.60 } },
    square: { weight: 1.2, valence: 'challenging', domains: { communication: -0.55, emotional_harmony: -0.45, friction: 0.60 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { communication: -0.35, friction: 0.45 } },
  },
  'sun::venus': {
    conjunction: { weight: 1.4, valence: 'supportive', domains: { attraction: 0.80, emotional_harmony: 0.75 } },
    trine: { weight: 1.3, valence: 'supportive', domains: { attraction: 0.70, emotional_harmony: 0.75 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { attraction: 0.65, emotional_harmony: 0.65 } },
    square: { weight: 1.1, valence: 'dynamic', domains: { attraction: 0.45, friction: 0.40 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { attraction: 0.65, friction: 0.35 } },
  },
  'sun::sun': {
    conjunction: { weight: 1.2, valence: 'dynamic', domains: { stability: 0.60, friction: 0.35 } },
    trine: { weight: 1.3, valence: 'supportive', domains: { emotional_harmony: 0.75, stability: 0.70 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { communication: 0.65, stability: 0.60 } },
    square: { weight: 1.2, valence: 'challenging', domains: { friction: 0.70, stability: -0.35 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { attraction: 0.55, friction: 0.55 } },
  },
  'jupiter::sun': {
    conjunction: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.75, stability: 0.60 } },
    trine: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.75, stability: 0.65 } },
    sextile: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.75, stability: 0.65 } },
    opposition: { weight: 1.1, valence: 'dynamic', domains: { attraction: 0.45, friction: 0.35 } },
  },
  'jupiter::venus': {
    conjunction: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.80, attraction: 0.65 } },
    trine: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.75, attraction: 0.60 } },
    sextile: { weight: 1.1, valence: 'supportive', domains: { emotional_harmony: 0.75, attraction: 0.60 } },
  },
  'moon::saturn': {
    conjunction: { weight: 1.2, valence: 'dynamic', domains: { stability: 0.75, emotional_harmony: -0.35, friction: 0.50 } },
    trine: { weight: 1.2, valence: 'supportive', domains: { stability: 0.85, emotional_harmony: 0.50 } },
    sextile: { weight: 1.2, valence: 'supportive', domains: { stability: 0.85, emotional_harmony: 0.40 } },
    square: { weight: 1.3, valence: 'challenging', domains: { emotional_harmony: -0.70, friction: 0.75, stability: 0.20 } },
    opposition: { weight: 1.2, valence: 'challenging', domains: { emotional_harmony: -0.55, friction: 0.65, stability: 0.25 } },
  },
  'saturn::sun': {
    conjunction: { weight: 1.2, valence: 'dynamic', domains: { stability: 0.80, friction: 0.45 } },
    trine: { weight: 1.2, valence: 'supportive', domains: { stability: 0.85, emotional_harmony: 0.45 } },
    sextile: { weight: 1.1, valence: 'supportive', domains: { stability: 0.75 } },
    square: { weight: 1.2, valence: 'challenging', domains: { friction: 0.70, stability: -0.25 } },
    opposition: { weight: 1.2, valence: 'challenging', domains: { friction: 0.65, stability: -0.20 } },
  },
  'mercury::saturn': {
    trine: { weight: 1.1, valence: 'supportive', domains: { communication: 0.65, stability: 0.60 } },
    sextile: { weight: 1.0, valence: 'supportive', domains: { communication: 0.55, stability: 0.50 } },
    square: { weight: 1.1, valence: 'challenging', domains: { communication: -0.60, friction: 0.65, stability: 0.25 } },
    opposition: { weight: 1.1, valence: 'challenging', domains: { communication: -0.50, friction: 0.55 } },
  },
  'mars::sun': {
    conjunction: { weight: 1.2, valence: 'dynamic', domains: { attraction: 0.70, friction: 0.50 } },
    trine: { weight: 1.2, valence: 'supportive', domains: { attraction: 0.65, stability: 0.50 } },
    sextile: { weight: 1.1, valence: 'supportive', domains: { attraction: 0.55, communication: 0.45 } },
    square: { weight: 1.2, valence: 'challenging', domains: { attraction: 0.35, friction: 0.70 } },
    opposition: { weight: 1.2, valence: 'dynamic', domains: { attraction: 0.50, friction: 0.60 } },
  },
  'asc::venus': {
    conjunction: { weight: 1.1, valence: 'supportive', domains: { attraction: 0.80, emotional_harmony: 0.65 } },
    trine: { weight: 1.0, valence: 'supportive', domains: { attraction: 0.65, emotional_harmony: 0.60 } },
  },
  'asc::saturn': {
    conjunction: { weight: 1.0, valence: 'dynamic', domains: { stability: 0.75, friction: 0.40 } },
    trine: { weight: 0.9, valence: 'supportive', domains: { stability: 0.65 } },
  },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Exact angular wrap-around separation in [0, 180].
 * E.g. (359°, 1°) => 2°.
 */
export function angularSeparation(lambdaA: number, lambdaB: number): number {
  const diff = (((lambdaA - lambdaB + 180) % 360) + 360) % 360 - 180;
  return Math.abs(diff);
}

export function getConfiguredOrbLimit(
  bodyA: SynastryBody,
  bodyB: SynastryBody,
  aspect: AspectType,
  config: MatchEngineConfig['synastry']
): number {
  if (bodyA === 'asc' || bodyA === 'mc' || bodyB === 'asc' || bodyB === 'mc') {
    return config.orbLimits.anglesMax;
  }
  switch (aspect) {
    case 'conjunction':
      return bodyA === 'sun' || bodyA === 'moon' || bodyB === 'sun' || bodyB === 'moon'
        ? config.orbLimits.conjunctionLuminaries
        : config.orbLimits.conjunctionDefault;
    case 'sextile':
      return config.orbLimits.sextile;
    case 'square':
      return config.orbLimits.square;
    case 'trine':
      return config.orbLimits.trine;
    case 'opposition':
      return config.orbLimits.opposition;
  }
}

export function evaluateSynastry(
  bodiesA: Partial<Record<SynastryBody, number>>,
  bodiesB: Partial<Record<SynastryBody, number>>,
  configuredWeight: number,
  config: MatchEngineConfig['synastry'],
  enabled = true
): {
  component: ModuleComponentResult<{
    directionalAToBCount: number;
    directionalBToACount: number;
    totalAspectsCount: number;
  }>;
  domains: Record<SynastryDomain, number | null>;
  significantAspects: SignificantAspectFact[];
  facts: ExplanationFact[];
} {
  const emptyDomains: Record<SynastryDomain, number | null> = {
    emotional_harmony: null,
    communication: null,
    attraction: null,
    stability: null,
    friction: null,
  };

  if (!enabled) {
    return {
      component: {
        name: 'synastry',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MODULE_OPTED_OUT',
      },
      domains: emptyDomains,
      significantAspects: [],
      facts: [],
    };
  }

  const keysA = Object.keys(bodiesA) as SynastryBody[];
  const keysB = Object.keys(bodiesB) as SynastryBody[];

  if (keysA.length < 2 || keysB.length < 2) {
    return {
      component: {
        name: 'synastry',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'INSUFFICIENT_RELIABLE_PLACEMENTS',
      },
      domains: emptyDomains,
      significantAspects: [],
      facts: [],
    };
  }

  const allDomains: SynastryDomain[] = [
    'emotional_harmony',
    'communication',
    'attraction',
    'stability',
    'friction',
  ];

  const strengthSum: Record<SynastryDomain, number> = {
    emotional_harmony: 0,
    communication: 0,
    attraction: 0,
    stability: 0,
    friction: 0,
  };
  const weightSum: Record<SynastryDomain, number> = {
    emotional_harmony: 0,
    communication: 0,
    attraction: 0,
    stability: 0,
    friction: 0,
  };

  const detected: SignificantAspectFact[] = [];
  let directionalAToBCount = 0;
  let directionalBToACount = 0;

  for (const bA of keysA) {
    const lonA = bodiesA[bA];
    if (typeof lonA !== 'number' || Number.isNaN(lonA)) continue;

    for (const bB of keysB) {
      const lonB = bodiesB[bB];
      if (typeof lonB !== 'number' || Number.isNaN(lonB)) continue;

      const pairKey = [bA, bB].sort().join('::');
      const pairRuleSet = SYNASTRY_RULES[pairKey];
      if (!pairRuleSet) continue;

      const d = angularSeparation(lonA, lonB);

      let bestMatch: {
        aspect: AspectType;
        orb: number;
        orbLimit: number;
        closeness: number;
        rule: PairAspectRule;
      } | null = null;

      for (const aspect of ASPECT_TIE_ORDER) {
        const rule = pairRuleSet[aspect];
        if (!rule) continue;

        const orbLimit = getConfiguredOrbLimit(bA, bB, aspect, config);
        if (orbLimit <= 0) continue;

        const orb = Math.abs(d - ASPECT_EXACT_ANGLES[aspect]);
        if (orb <= orbLimit) {
          const closeness = Math.max(0, 1 - orb / orbLimit);
          if (
            !bestMatch ||
            closeness > bestMatch.closeness ||
            (closeness === bestMatch.closeness && orb < bestMatch.orb)
          ) {
            bestMatch = { aspect, orb, orbLimit, closeness, rule };
          }
        }
      }

      if (!bestMatch) continue;

      if (bA <= bB) directionalAToBCount += 1;
      else directionalBToACount += 1;

      const involvedDomains = Object.keys(bestMatch.rule.domains) as SynastryDomain[];
      for (const dom of involvedDomains) {
        const coeff = bestMatch.rule.domains[dom] ?? 0;
        const w = bestMatch.rule.weight * bestMatch.closeness;
        strengthSum[dom] += w * coeff;
        weightSum[dom] += w;
      }

      detected.push({
        bodyA: bA,
        bodyB: bB,
        aspect: bestMatch.aspect,
        exactAngle: ASPECT_EXACT_ANGLES[bestMatch.aspect],
        observedAngle: Math.round(d * 100) / 100,
        orb: Math.round(bestMatch.orb * 100) / 100,
        orbLimit: bestMatch.orbLimit,
        closeness: Math.round(bestMatch.closeness * 10000) / 10000,
        valence: bestMatch.rule.valence,
        domains: involvedDomains,
        explanationKey: `synastry.${pairKey}.${bestMatch.aspect}`,
      });
    }
  }

  // Deterministic sort: highest closeness first, then canonical body names
  detected.sort((a, b) => {
    if (b.closeness !== a.closeness) return b.closeness - a.closeness;
    return `${a.bodyA}-${a.bodyB}`.localeCompare(`${b.bodyA}-${b.bodyB}`);
  });

  const domainScores: Record<SynastryDomain, number | null> = { ...emptyDomains };
  for (const dom of allDomains) {
    const raw =
      0.5 + 0.5 * (strengthSum[dom] / (weightSum[dom] + config.kappa));
    domainScores[dom] = Math.round(clamp(raw, 0, 1) * 10000) / 10000;
  }

  const positiveComposite =
    (domainScores.emotional_harmony ?? 0.5) * config.domainWeights.emotional_harmony +
    (domainScores.communication ?? 0.5) * config.domainWeights.communication +
    (domainScores.attraction ?? 0.5) * config.domainWeights.attraction +
    (domainScores.stability ?? 0.5) * config.domainWeights.stability;

  const excessFriction = Math.max(0, (domainScores.friction ?? 0.5) - 0.5);
  const overallScore = clamp(
    positiveComposite - excessFriction * config.frictionPenaltyFactor,
    0,
    1
  );

  // Confidence reflects body coverage (up to 8 bodies including Moon & Ascendant)
  const avgBodies = (keysA.length + keysB.length) / 2;
  const confidence = clamp(avgBodies / 8, 0.5, 1.0);

  const facts: ExplanationFact[] = detected.slice(0, 6).map((asp) => {
    const nameA = BODY_NAMES_BG[asp.bodyA];
    const nameB = BODY_NAMES_BG[asp.bodyB];
    const aspName = ASPECT_NAMES_BG[asp.aspect];
    return {
      key: asp.explanationKey,
      module: 'synastry',
      polarity:
        asp.valence === 'supportive'
          ? 'supportive'
          : asp.valence === 'challenging'
          ? 'tension'
          : 'neutral',
      weight: asp.closeness,
      evidence: {
        bodyA: asp.bodyA,
        bodyB: asp.bodyB,
        aspect: asp.aspect,
        observedAngle: asp.observedAngle,
        orb: asp.orb,
      },
      textBg: `Позициите на ${nameA} и ${nameB} образуват точен ${aspName} (орбис ${asp.orb.toFixed(1)}°).`,
      textEn: `Your ${asp.bodyA} and ${asp.bodyB} placements form a close ${asp.aspect} (orb ${asp.orb.toFixed(1)}°).`,
    };
  });

  return {
    component: {
      name: 'synastry',
      score: Math.round(overallScore * 10000) / 10000,
      configuredWeight,
      effectiveWeight: configuredWeight,
      available: true,
      confidence: Math.round(confidence * 100) / 100,
      details: {
        directionalAToBCount,
        directionalBToACount,
        totalAspectsCount: detected.length,
      },
    },
    domains: domainScores,
    significantAspects: detected.slice(0, 8),
    facts,
  };
}