import {
  PairCompatibilityResult,
  SynastryBody,
  WesternElementVector,
  BaZiChartSnapshot,
} from '../../services/match-engine';

export type ZodiacElement = 'Fire' | 'Earth' | 'Air' | 'Water';

export type PeopleFilterId =
  | 'all'
  | 'high_match'
  | 'intuitives'
  | 'water_air'
  | 'tarot_astro';

export interface MbtiPercentages {
  extraversion?: number;
  introversion?: number;
  intuitive?: number;
  observant?: number;
  thinking?: number;
  feeling?: number;
  judging?: number;
  prospecting?: number;
}

export interface PersonProfile {
  _id?: string;
  id: string;
  cosmicId?: string;
  name: string;
  email: string;
  birthdate?: string;
  birthTime?: string | null;
  hasExactBirthTime?: boolean;
  birthCity: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  gender?: string;
  seekingGenders?: string[];
  ageRangePreference?: { min?: number; max?: number };
  maxDistanceKm?: number | null;
  isActive?: boolean;
  isDiscoverable?: boolean;
  symbolicMatchConsent?: boolean;
  datingConsent?: boolean;
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
  bloodGroup?: string | null;
  mbti?: {
    type?: string;
    percentages?: MbtiPercentages;
  };
  natalChart?: {
    sunSign?: string;
    moonSign?: string;
    ascendant?: string;
    planets?: Partial<Record<SynastryBody, number>>;
  };
  westernElements?: {
    shares?: WesternElementVector;
    includesAscendant?: boolean;
    source?: 'weighted_planets' | 'birthdate_fallback' | 'manual';
  };
  polarity?: {
    score?: number;
    sourceCoverage?: number;
    provenance?: string;
  };
  bazi?: BaZiChartSnapshot | null;
  cardology?: {
    birthCard?: string;
    planetaryCard?: string;
  };
  ayurveda?: {
    dominantDosha?: 'vata' | 'pitta' | 'kapha';
    scores?: {
      vata?: number;
      pitta?: number;
      kapha?: number;
    };
  };
  numerology?: {
    lifePathNumber?: number;
    isMasterNumber?: boolean;
  };
  bio?: string;
  interests: string[];
  isOnline?: boolean;
  mutualLikesYou?: boolean;
  category: 'match' | 'friend' | 'discover';
}

export interface CompatibilityBreakdown {
  overall: number; // 0..100 Symbolic Compatibility Index (display rounded)
  hasSymbolicScore: boolean;
  mbtiScore: number | null;
  astrologyScore: number | null;
  elementsScore: number | null;
  polarityScore: number | null;
  baziScore: number | null;
  practicalScore: number | null;
  sharedInterests: string[];
  summary: string;
  highlights: string[];
  tensions: string[];
  disclaimer: string;
  rawResult: PairCompatibilityResult;
}

export const PEOPLE_FILTERS: { id: PeopleFilterId; label: string }[] = [
  { id: 'all', label: '✦ Всички' },
  { id: 'high_match', label: '🔥 80+ Индекс' },
  { id: 'intuitives', label: '🔮 Интуитивни (N)' },
  { id: 'water_air', label: '🌊 Вода и Въздух' },
  { id: 'tarot_astro', label: '🃏 Таро и Астро' },
];