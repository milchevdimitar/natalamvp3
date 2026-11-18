export type ModuleId =
  | 'synastry'
  | 'bazi'
  | 'mbti'
  | 'western_elements'
  | 'polarity';

export type SynastryBody =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'asc'
  | 'mc';

export type AspectType =
  | 'conjunction'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'opposition';

export type SynastryDomain =
  | 'emotional_harmony'
  | 'communication'
  | 'attraction'
  | 'stability'
  | 'friction';

export type BaZiElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface BaZiPillar {
  stem: string;   // e.g. 'Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'
  branch: string; // e.g. 'Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'
  stemElement: BaZiElement;
  branchElement: BaZiElement;
  polarity: 'Yang' | 'Yin';
}

export interface BaZiChartSnapshot {
  pillars: {
    year: BaZiPillar;
    month: BaZiPillar;
    day: BaZiPillar;
    hour?: BaZiPillar | null;
  };
  hasHourPillar: boolean;
  favorableElements?: BaZiElement[];
  ruleSet: {
    solarTerms: 'li_chun_jie_exact';
    ziDayBoundary: '23:00' | '00:00';
    solarTimeMode: 'civil' | 'true_solar';
    version: string;
  };
}

export interface WesternElementVector {
  fire: number;
  air: number;
  water: number;
  earth: number;
}

export interface UserMatchInput {
  id: string;
  profileVersion?: string | number;
  isActive?: boolean;
  isDiscoverable?: boolean;
  symbolicMatchConsent?: boolean;
  datingConsent?: boolean;
  birthdate?: string | Date | null;
  birthTime?: string | null; // "HH:MM" when known; never fabricated
  hasExactBirthTime?: boolean;
  birthCity?: {
    name?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  } | null;
  currentLocation?: {
    latitude?: number;
    longitude?: number;
  } | null;
  gender?: string;
  seekingGenders?: string[];
  ageRangePreference?: { min?: number; max?: number };
  maxDistanceKm?: number | null;
  relationshipIntentions?: string[];
  strictIntentionMatch?: boolean;
  blockedUserIds?: string[];
  reportedUserIds?: string[];
  dislikedUserIds?: string[];
  preferences?: {
    enablePolarity?: boolean;
    enableBazi?: boolean;
    enableSynastry?: boolean;
    enableMbti?: boolean;
    enableWesternElements?: boolean;
  };
  mbti?: {
    type?: string | null;
    certainty?: number;
  } | null;
  natalChart?: {
    sunSign?: string;
    moonSign?: string;
    ascendant?: string;
    planets?: Partial<Record<SynastryBody, number>>; // geocentric tropical [0, 360)
    houseSystem?: string;
    ephemerisVersion?: string;
  } | null;
  westernElements?: {
    shares?: WesternElementVector | null;
    includesAscendant?: boolean;
    source?: 'weighted_planets' | 'birthdate_fallback' | 'manual';
  } | null;
  polarity?: {
    score?: number | null; // [-1, 1], -1 = Yin/receptive, +1 = Yang/active
    sourceCoverage?: number; // [0, 1]
    provenance?: string;
  } | null;
  bazi?: BaZiChartSnapshot | null;
  interests?: string[];
}

export interface ProfileFeatureSnapshot {
  userId: string;
  profileVersion: string;
  rulesVersion: string;
  computedAt: string;
  ageYears: number | null;
  isAdult18Plus: boolean;
  hasExactBirthTime: boolean;
  hasBirthLocation: boolean;
  mbtiType: string | null;
  westernElements: {
    vector: [number, number, number, number]; // [fire, air, water, earth]
    shares: WesternElementVector;
    source: string;
    includesAscendant: boolean;
  } | null;
  polarity: {
    score: number; // [-1, 1]
    sourceCoverage: number;
    provenance: string;
  } | null;
  synastryBodies: Partial<Record<SynastryBody, number>>;
  synastryReliableBodyCount: number;
  bazi: BaZiChartSnapshot | null;
  completenessScore: number; // [0, 1]
  completenessLabel: 'minimal' | 'partial' | 'high' | 'complete';
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  distanceKm: number | null;
}

export interface ModuleComponentResult<TDetails = Record<string, unknown>> {
  name: ModuleId;
  score: number | null; // [0, 1] when available, null when unavailable
  configuredWeight: number;
  effectiveWeight: number; // normalized weight after omitting unavailable modules
  available: boolean;
  confidence: number; // [0, 1]
  unavailableReason?: string;
  details?: TDetails;
}

export interface SignificantAspectFact {
  bodyA: SynastryBody;
  bodyB: SynastryBody;
  aspect: AspectType;
  exactAngle: number;
  observedAngle: number;
  orb: number;
  orbLimit: number;
  closeness: number; // [0, 1]
  valence: 'supportive' | 'dynamic' | 'challenging';
  domains: SynastryDomain[];
  explanationKey: string;
}

export interface ExplanationFact {
  key: string;
  module: ModuleId | 'practical';
  polarity: 'supportive' | 'tension' | 'neutral';
  weight: number;
  evidence: Record<string, string | number | boolean>;
  textBg: string;
  textEn: string;
}

export interface PairCompatibilityResult {
  pairId: string; // sorted `${minId}::${maxId}`
  userAId: string;
  userBId: string;
  eligible: boolean;
  eligibilityReasons: string[];
  total_score: number | null; // 0..100 rounded for display, null if no symbolic modules available
  raw_symbolic_score: number | null; // 0..100 unrounded
  practical_alignment_score: number | null; // 0..100 separate non-symbolic score
  components: Record<ModuleId, ModuleComponentResult>;
  synastry_domains: Record<SynastryDomain, number | null>;
  significant_aspects: SignificantAspectFact[];
  explanation_facts: ExplanationFact[];
  top_supportive_factors: ExplanationFact[];
  potential_tensions: ExplanationFact[];
  data_completeness: {
    score: number;
    label: 'minimal' | 'partial' | 'high' | 'complete';
    availableModules: ModuleId[];
    missingModules: ModuleId[];
  };
  rules_version: string;
  computed_at: string;
}

export interface MatchEngineConfig {
  rulesVersion: string;
  ephemerisVersion: string;
  houseSystem: string;
  moduleWeights: Record<ModuleId, number>;
  featureFlags: {
    enableBazi: boolean;
    enablePolarity: boolean;
    enablePracticalOverlay: boolean;
  };
  synastry: {
    kappa: number;
    orbLimits: {
      conjunctionLuminaries: number;
      conjunctionDefault: number;
      sextile: number;
      square: number;
      trine: number;
      opposition: number;
      anglesMax: number;
    };
    moonUncertaintyMode: 'omit' | 'bounded';
    domainWeights: Record<Exclude<SynastryDomain, 'friction'>, number>;
    frictionPenaltyFactor: number;
  };
  bazi: {
    subfeatureWeights: {
      dayBranchSpousePalace: number;
      dayMasterRelation: number;
      favorableElementSupply: number;
      stemRelations: number;
      otherBranches: number;
    };
    ziDayBoundary: '23:00' | '00:00';
    solarTimeMode: 'civil' | 'true_solar';
  };
}

export interface RankedCandidateItem {
  candidate: UserMatchInput;
  compatibility: PairCompatibilityResult;
  rank: number;
  rankingTier: 'practical_and_symbolic' | 'symbolic_only' | 'discovery_fallback';
}

export interface RankedCandidatesPage {
  items: RankedCandidateItem[];
  nextCursor: string | null;
  totalEvaluated: number;
  totalEligible: number;
  rulesVersion: string;
}