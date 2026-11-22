import { MatchEngineConfig } from './types';

export const DEFAULT_MATCH_ENGINE_CONFIG: MatchEngineConfig = {
  rulesVersion: 'natala-match-v1.0.0',
  ephemerisVersion: 'tropical-j2000-v1',
  houseSystem: 'placidus',
  moduleWeights: {
    synastry: 0.30,
    bazi: 0.20,
    mbti: 0.20,
    western_elements: 0.20,
    polarity: 0.10,
  },
  featureFlags: {
    enableBazi: true,
    enablePolarity: true,
    enablePracticalOverlay: true,
  },
  synastry: {
    kappa: 3.0,
    orbLimits: {
      conjunctionLuminaries: 8.0,
      conjunctionDefault: 6.0,
      sextile: 4.0,
      square: 6.0,
      trine: 6.0,
      opposition: 7.0,
      anglesMax: 3.0,
    },
    moonUncertaintyMode: 'omit',
    domainWeights: {
      emotional_harmony: 0.30,
      communication: 0.25,
      attraction: 0.25,
      stability: 0.20,
    },
    frictionPenaltyFactor: 0.25,
  },
  bazi: {
    subfeatureWeights: {
      dayBranchSpousePalace: 0.30,
      dayMasterRelation: 0.25,
      favorableElementSupply: 0.25,
      stemRelations: 0.15,
      otherBranches: 0.05,
    },
    ziDayBoundary: '23:00',
    solarTimeMode: 'civil',
  },
};