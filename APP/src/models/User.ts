export interface MBTIPercentages {
  extraversion: number;
  introversion: number;
  intuitive: number;
  observant: number;
  thinking: number;
  feeling: number;
  judging: number;
  prospecting: number;
}

export interface UserProfile {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  birthdate?: string;
  birthDate?: { time?: string };
  birthTime?: string | null;
  hasExactBirthTime?: boolean;
  birthCity?: string | { name: string; country?: string; latitude?: number; longitude?: number; timezone?: string };
  avatarUrl?: string;
  gender?: string;
  mbti?: { type?: string; percentages?: MBTIPercentages };
  numerology?: { lifePathNumber: number; isMasterNumber?: boolean };
  cardology?: { birthCard?: string };
  ayurveda?: {
    dominantDosha: string;
    constitution?: string;
    scores: { vata: number; pitta: number; kapha: number };
    answers?: Record<string, 'Vata' | 'Pitta' | 'Kapha'>;
    stress?: 'low' | 'moderate' | 'high';
  };
  bazi?: { dayMaster?: string; zodiacAnimal?: string; [field: string]: unknown } | null;
  [field: string]: unknown;
}
