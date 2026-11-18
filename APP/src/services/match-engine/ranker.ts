import { evaluateBaZiCompatibility } from './bazi-adapter';
import { DEFAULT_MATCH_ENGINE_CONFIG } from './config';
import { checkMutualEligibility, computeAgeYears } from './eligibility';
import { buildVerifiedExplanations } from './explanations';
import { evaluateMbtiCompatibility, normalizeMbtiType } from './mbti';
import { evaluatePolarity } from './polarity';
import { evaluateSynastry } from './synastry';
import {
  ExplanationFact,
  MatchEngineConfig,
  ModuleComponentResult,
  ModuleId,
  PairCompatibilityResult,
  ProfileFeatureSnapshot,
  RankedCandidateItem,
  RankedCandidatesPage,
  SynastryBody,
  UserMatchInput,
} from './types';
import {
  evaluateWesternElements,
  normalizeElementVector,
} from './western-elements';

const EXACT_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function hasValidatedExactBirthTime(user: UserMatchInput): boolean {
  if (user.hasExactBirthTime === false) return false;
  if (!user.birthTime || typeof user.birthTime !== 'string') return false;
  return EXACT_TIME_REGEX.test(user.birthTime.trim());
}

export function computeProfileFeatures(
  user: UserMatchInput,
  config: MatchEngineConfig = DEFAULT_MATCH_ENGINE_CONFIG
): ProfileFeatureSnapshot {
  const ageYears = computeAgeYears(user.birthdate);
  const isAdult18Plus = ageYears !== null && ageYears >= 18;
  const exactTime = hasValidatedExactBirthTime(user);
  const hasBirthLocation = Boolean(
    user.birthCity &&
      typeof user.birthCity.latitude === 'number' &&
      typeof user.birthCity.longitude === 'number' &&
      user.birthCity.timezone
  );

  const mbtiType = normalizeMbtiType(user.mbti?.type);

  // Western elements
  const normVec = normalizeElementVector(user.westernElements?.shares);
  const westernElements = normVec
    ? {
        vector: normVec,
        shares: {
          fire: normVec[0],
          air: normVec[1],
          water: normVec[2],
          earth: normVec[3],
        },
        source: user.westernElements?.source || 'weighted_planets',
        includesAscendant: Boolean(
          exactTime && hasBirthLocation && user.westernElements?.includesAscendant
        ),
      }
    : null;

  // Polarity
  const polarity =
    typeof user.polarity?.score === 'number' && !Number.isNaN(user.polarity.score)
      ? {
          score: Math.max(-1, Math.min(1, user.polarity.score)),
          sourceCoverage: user.polarity.sourceCoverage ?? 1.0,
          provenance: user.polarity.provenance || 'existing_polarity_engine',
        }
      : null;

  // Synastry placements: omit Ascendant/MC when exact birth time or location is missing;
  // omit Moon when exact birth time is missing and moonUncertaintyMode === 'omit'.
  const synastryBodies: Partial<Record<SynastryBody, number>> = {};
  const rawPlanets = user.natalChart?.planets || {};
  const allowedBaseBodies: SynastryBody[] = [
    'sun',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
  ];

  for (const b of allowedBaseBodies) {
    const val = rawPlanets[b];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      synastryBodies[b] = ((val % 360) + 360) % 360;
    }
  }

  if (exactTime && typeof rawPlanets.moon === 'number' && !Number.isNaN(rawPlanets.moon)) {
    synastryBodies.moon = ((rawPlanets.moon % 360) + 360) % 360;
  }

  if (exactTime && hasBirthLocation) {
    if (typeof rawPlanets.asc === 'number' && !Number.isNaN(rawPlanets.asc)) {
      synastryBodies.asc = ((rawPlanets.asc % 360) + 360) % 360;
    }
    if (typeof rawPlanets.mc === 'number' && !Number.isNaN(rawPlanets.mc)) {
      synastryBodies.mc = ((rawPlanets.mc % 360) + 360) % 360;
    }
  }

  const synastryReliableBodyCount = Object.keys(synastryBodies).length;

  // Ba Zi: enforce 3-pillar fallback if exact birth time is absent
  const bazi = user.bazi
    ? {
        ...user.bazi,
        hasHourPillar: Boolean(exactTime && user.bazi.pillars.hour),
        pillars: {
          year: user.bazi.pillars.year,
          month: user.bazi.pillars.month,
          day: user.bazi.pillars.day,
          hour: exactTime ? user.bazi.pillars.hour || null : null,
        },
      }
    : null;

  // Completeness score
  let availableCount = 0;
  if (synastryReliableBodyCount >= 2) availableCount += 1;
  if (bazi) availableCount += 1;
  if (mbtiType) availableCount += 1;
  if (westernElements) availableCount += 1;
  if (polarity) availableCount += 1;

  const completenessScore = Math.round((availableCount / 5) * 100) / 100;
  const completenessLabel =
    completenessScore >= 0.95
      ? 'complete'
      : completenessScore >= 0.6
      ? 'high'
      : completenessScore >= 0.4
      ? 'partial'
      : 'minimal';

  return {
    userId: user.id,
    profileVersion: String(user.profileVersion ?? '1'),
    rulesVersion: config.rulesVersion,
    computedAt: new Date().toISOString(),
    ageYears,
    isAdult18Plus,
    hasExactBirthTime: exactTime,
    hasBirthLocation,
    mbtiType,
    westernElements,
    polarity,
    synastryBodies,
    synastryReliableBodyCount,
    bazi,
    completenessScore,
    completenessLabel,
  };
}

function computePracticalAlignment(
  userA: UserMatchInput,
  userB: UserMatchInput
): { score: number | null; facts: ExplanationFact[] } {
  const intA = Array.isArray(userA.interests) ? userA.interests : [];
  const intB = Array.isArray(userB.interests) ? userB.interests : [];
  if (intA.length === 0 || intB.length === 0) {
    return { score: null, facts: [] };
  }
  const setB = new Set(intB.map((s) => s.trim().toLowerCase()));
  const shared = intA.filter((s) => setB.has(s.trim().toLowerCase()));
  const denom = Math.max(1, Math.min(intA.length, intB.length));
  const ratio = Math.min(1, shared.length / denom);
  const score = Math.round(ratio * 100);

  const facts: ExplanationFact[] =
    shared.length > 0
      ? [
          {
            key: 'practical.shared_interests',
            module: 'practical',
            polarity: 'supportive',
            weight: ratio,
            evidence: { sharedCount: shared.length },
            textBg: `Споделени реални интереси: ${shared.slice(0, 3).join(', ')}.`,
            textEn: `Shared stated interests: ${shared.slice(0, 3).join(', ')}.`,
          },
        ]
      : [];

  return { score, facts };
}

export function calculatePairCompatibilityFromSnapshots(
  userA: UserMatchInput,
  snapA: ProfileFeatureSnapshot,
  userB: UserMatchInput,
  snapB: ProfileFeatureSnapshot,
  config: MatchEngineConfig = DEFAULT_MATCH_ENGINE_CONFIG,
  options: { requireDatingAdultCheck?: boolean } = {}
): PairCompatibilityResult {
  const [minId, maxId] = [userA.id, userB.id].sort();
  const pairId = `${minId}::${maxId}`;

  // 1. Enforce mutual eligibility BEFORE any scoring
  const eligibility = checkMutualEligibility(userA, userB, {
    requireDatingAdultCheck: options.requireDatingAdultCheck ?? true,
  });

  if (!eligibility.eligible) {
    const emptyComp = (name: ModuleId): ModuleComponentResult => ({
      name,
      score: null,
      configuredWeight: config.moduleWeights[name],
      effectiveWeight: 0,
      available: false,
      confidence: 0,
      unavailableReason: 'INELIGIBLE_PAIR',
    });

    return {
      pairId,
      userAId: userA.id,
      userBId: userB.id,
      eligible: false,
      eligibilityReasons: eligibility.reasons,
      total_score: null,
      raw_symbolic_score: null,
      practical_alignment_score: null,
      components: {
        synastry: emptyComp('synastry'),
        bazi: emptyComp('bazi'),
        mbti: emptyComp('mbti'),
        western_elements: emptyComp('western_elements'),
        polarity: emptyComp('polarity'),
      },
      synastry_domains: {
        emotional_harmony: null,
        communication: null,
        attraction: null,
        stability: null,
        friction: null,
      },
      significant_aspects: [],
      explanation_facts: [],
      top_supportive_factors: [],
      potential_tensions: [],
      data_completeness: {
        score: 0,
        label: 'minimal',
        availableModules: [],
        missingModules: ['synastry', 'bazi', 'mbti', 'western_elements', 'polarity'],
      },
      rules_version: config.rulesVersion,
      computed_at: new Date().toISOString(),
    };
  }

  // 2. Evaluate each symbolic module independently
  const synEnabled =
    userA.preferences?.enableSynastry !== false &&
    userB.preferences?.enableSynastry !== false;
  const synRes = evaluateSynastry(
    snapA.synastryBodies,
    snapB.synastryBodies,
    config.moduleWeights.synastry,
    config.synastry,
    synEnabled
  );

  const baziEnabled =
    config.featureFlags.enableBazi &&
    userA.preferences?.enableBazi !== false &&
    userB.preferences?.enableBazi !== false;
  const baziRes = evaluateBaZiCompatibility(
    snapA.bazi,
    snapB.bazi,
    config.moduleWeights.bazi,
    config.bazi,
    baziEnabled
  );

  const mbtiEnabled =
    userA.preferences?.enableMbti !== false &&
    userB.preferences?.enableMbti !== false;
  const mbtiRes = evaluateMbtiCompatibility(
    snapA.mbtiType,
    snapB.mbtiType,
    config.moduleWeights.mbti,
    mbtiEnabled
  );

  const elemEnabled =
    userA.preferences?.enableWesternElements !== false &&
    userB.preferences?.enableWesternElements !== false;
  const elemRes = evaluateWesternElements(
    snapA.westernElements?.vector ?? null,
    snapB.westernElements?.vector ?? null,
    config.moduleWeights.western_elements,
    elemEnabled
  );

  const polEnabled =
    config.featureFlags.enablePolarity &&
    userA.preferences?.enablePolarity !== false &&
    userB.preferences?.enablePolarity !== false;
  const polRes = evaluatePolarity(
    snapA.polarity,
    snapB.polarity,
    config.moduleWeights.polarity,
    polEnabled
  );

  const rawComponents: Record<ModuleId, ModuleComponentResult> = {
    synastry: synRes.component,
    bazi: baziRes.component,
    mbti: mbtiRes.component,
    western_elements: elemRes.component,
    polarity: polRes.component,
  };

  // 3. Renormalize weights across available modules (never score missing as 0)
  const allIds: ModuleId[] = [
    'synastry',
    'bazi',
    'mbti',
    'western_elements',
    'polarity',
  ];
  const availableModules = allIds.filter(
    (id) => rawComponents[id].available && rawComponents[id].score !== null
  );
  const missingModules = allIds.filter((id) => !availableModules.includes(id));

  const activeWeightSum = availableModules.reduce(
    (acc, id) => acc + rawComponents[id].configuredWeight,
    0
  );

  let rawSymbolicScore: number | null = null;
  let totalScore: number | null = null;

  if (availableModules.length > 0 && activeWeightSum > 0) {
    let weightedSum = 0;
    for (const id of allIds) {
      if (availableModules.includes(id)) {
        const effWeight = rawComponents[id].configuredWeight / activeWeightSum;
        rawComponents[id] = {
          ...rawComponents[id],
          effectiveWeight: Math.round(effWeight * 10000) / 10000,
        };
        weightedSum += rawComponents[id].score! * effWeight;
      } else {
        rawComponents[id] = {
          ...rawComponents[id],
          effectiveWeight: 0,
        };
      }
    }
    rawSymbolicScore = Math.round(weightedSum * 10000) / 100; // 0..100
    totalScore = Math.round(rawSymbolicScore);
  }

  // 4. Separate non-symbolic practical alignment (interests/intentions)
  const practical = config.featureFlags.enablePracticalOverlay
    ? computePracticalAlignment(userA, userB)
    : { score: null, facts: [] };

  const allRawFacts: ExplanationFact[] = [
    ...synRes.facts,
    ...baziRes.facts,
    ...mbtiRes.facts,
    ...elemRes.facts,
    ...polRes.facts,
    ...practical.facts,
  ];
  const { allFacts, topSupportive, potentialTensions } =
    buildVerifiedExplanations(allRawFacts);

  const pairCompletenessScore =
    Math.round(
      Math.min(snapA.completenessScore, snapB.completenessScore) * 100
    ) / 100;
  const pairCompletenessLabel =
    availableModules.length === 5
      ? 'complete'
      : availableModules.length >= 3
      ? 'high'
      : availableModules.length >= 2
      ? 'partial'
      : 'minimal';

  return {
    pairId,
    userAId: userA.id,
    userBId: userB.id,
    eligible: true,
    eligibilityReasons: [],
    total_score: totalScore,
    raw_symbolic_score: rawSymbolicScore,
    practical_alignment_score: practical.score,
    components: rawComponents,
    synastry_domains: synRes.domains,
    significant_aspects: synRes.significantAspects,
    explanation_facts: allFacts,
    top_supportive_factors: topSupportive,
    potential_tensions: potentialTensions,
    data_completeness: {
      score: pairCompletenessScore,
      label: pairCompletenessLabel,
      availableModules,
      missingModules,
    },
    rules_version: config.rulesVersion,
    computed_at: new Date().toISOString(),
  };
}

export function calculatePairCompatibility(
  userA: UserMatchInput,
  userB: UserMatchInput,
  config: MatchEngineConfig = DEFAULT_MATCH_ENGINE_CONFIG,
  options: { requireDatingAdultCheck?: boolean } = {}
): PairCompatibilityResult {
  const snapA = computeProfileFeatures(userA, config);
  const snapB = computeProfileFeatures(userB, config);
  return calculatePairCompatibilityFromSnapshots(
    userA,
    snapA,
    userB,
    snapB,
    config,
    options
  );
}

export function getEligibleRankedCandidates(
  currentUser: UserMatchInput,
  candidates: UserMatchInput[],
  options: {
    limit?: number;
    cursor?: string | null;
    requireDatingAdultCheck?: boolean;
    config?: MatchEngineConfig;
  } = {}
): RankedCandidatesPage {
  const config = options.config ?? DEFAULT_MATCH_ENGINE_CONFIG;
  const limit = Math.max(1, Math.min(100, options.limit ?? 20));
  const offset = options.cursor ? Math.max(0, parseInt(options.cursor, 10) || 0) : 0;

  const snapA = computeProfileFeatures(currentUser, config);
  const eligibleItems: Omit<RankedCandidateItem, 'rank'>[] = [];

  for (const candidate of candidates) {
    const preCheck = checkMutualEligibility(currentUser, candidate, {
      requireDatingAdultCheck: options.requireDatingAdultCheck ?? true,
    });
    if (!preCheck.eligible) continue;

    const snapB = computeProfileFeatures(candidate, config);
    const compatibility = calculatePairCompatibilityFromSnapshots(
      currentUser,
      snapA,
      candidate,
      snapB,
      config,
      { requireDatingAdultCheck: options.requireDatingAdultCheck ?? true }
    );

    if (!compatibility.eligible) continue;

    const rankingTier: RankedCandidateItem['rankingTier'] =
      compatibility.total_score === null
        ? 'discovery_fallback'
        : compatibility.practical_alignment_score !== null
        ? 'practical_and_symbolic'
        : 'symbolic_only';

    eligibleItems.push({
      candidate,
      compatibility,
      rankingTier,
    });
  }

  eligibleItems.sort((a, b) => {
    const symA = a.compatibility.raw_symbolic_score ?? -1;
    const symB = b.compatibility.raw_symbolic_score ?? -1;
    const pracA = a.compatibility.practical_alignment_score ?? 0;
    const pracB = b.compatibility.practical_alignment_score ?? 0;

    const compositeA = symA >= 0 ? symA * 0.75 + pracA * 0.25 : pracA * 0.25;
    const compositeB = symB >= 0 ? symB * 0.75 + pracB * 0.25 : pracB * 0.25;

    if (Math.abs(compositeB - compositeA) > 1e-6) {
      return compositeB - compositeA;
    }
    return a.candidate.id.localeCompare(b.candidate.id);
  });

  const sliced = eligibleItems.slice(offset, offset + limit).map((item, idx) => ({
    ...item,
    rank: offset + idx + 1,
  }));

  const nextOffset = offset + limit;
  const nextCursor = nextOffset < eligibleItems.length ? String(nextOffset) : null;

  return {
    items: sliced,
    nextCursor,
    totalEvaluated: candidates.length,
    totalEligible: eligibleItems.length,
    rulesVersion: config.rulesVersion,
  };
}