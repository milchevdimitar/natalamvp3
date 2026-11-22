export type ZodiacElement = 'Fire' | 'Earth' | 'Air' | 'Water';

export type PeopleFilterId = 'all' | 'high_match' | 'intuitives' | 'water_air' | 'tarot_astro';

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
  compatibility?: CompatibilityBreakdown;
  _id?: string;
  id: string;
  cosmicId?: string;
  name: string;
  email: string;
  birthdate: string;
  birthCity: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
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
  };
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
  overall: number;
  mbtiScore: number;
  astrologyScore: number;
  numerologyScore: number;
  interestsScore: number;
  sharedInterests: string[];
  summary: string;
  highlights: string[];
}

export const PEOPLE_FILTERS: { id: PeopleFilterId; label: string }[] = [
  { id: 'all', label: '✦ All' },
  { id: 'high_match', label: '🔥 85%+ Resonance' },
  { id: 'intuitives', label: '🔮 Intuitives (N)' },
  { id: 'water_air', label: '🌊 Water & Air' },
  { id: 'tarot_astro', label: '🃏 Tarot & Astro' },
];
