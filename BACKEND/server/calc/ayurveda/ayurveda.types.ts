export type DoshaName = 'Vata' | 'Pitta' | 'Kapha';
export type MahabhutaElement = 'Ether' | 'Air' | 'Fire' | 'Water' | 'Earth';
export type GunaName = 'Sattva' | 'Rajas' | 'Tamas';
export type TasteName = 'Sweet' | 'Sour' | 'Salty' | 'Pungent' | 'Bitter' | 'Astringent';
export type AyurvedaViewComplexity = 'simple' | 'pro';
export type AyurvedaTabId = 'prakriti' | 'clock' | 'diagnostics' | 'ahara' | 'match';
export type AyurvedaMatchType = 'romantic' | 'business' | 'friendship';

export type ConstitutionCode =
  | 'Vata'
  | 'Pitta'
  | 'Kapha'
  | 'Vata-Pitta'
  | 'Pitta-Vata'
  | 'Pitta-Kapha'
  | 'Kapha-Pitta'
  | 'Vata-Kapha'
  | 'Kapha-Vata'
  | 'Tridoshic';

export interface DoshaScores {
  Vata: number; // percentage 0-100
  Pitta: number; // percentage 0-100
  Kapha: number; // percentage 0-100
}

export interface ElementScores {
  Ether: number;
  Air: number;
  Fire: number;
  Water: number;
  Earth: number;
}

export interface GunaScores {
  Sattva: number;
  Rajas: number;
  Tamas: number;
}

export type AgniType = 'Sama Agni' | 'Vishama Agni' | 'Tikshna Agni' | 'Manda Agni';

export interface AgniAnalysis {
  type: AgniType;
  englishTitle: string;
  efficiencyScore: number; // 0 - 100
  summary: string;
  balancingProtocol: string;
}

export interface VitalEssenceMetrics {
  ojas: number; // 0.0 - 10.0 (Vitality & Immunity)
  tejas: number; // 0.0 - 10.0 (Cellular Intelligence & Radiance)
  prana: number; // 0.0 - 10.0 (Life Force & Mental Clarity)
  amaIndex: number; // 0.0 - 10.0 (Metabolic Stagnation - lower is cleaner)
  summary: string;
  deepGuidance: string;
}

export interface SubdoshaItem {
  name: string;
  dosha: DoshaName;
  domain: string;
  status: 'Harmonious' | 'Elevated' | 'Needs Grounding';
  tip: string;
}

export interface TasteRecommendation {
  taste: TasteName;
  sanskrit: string;
  elements: string;
  score: number; // 0.0 - 10.0 priority
  action: 'Favor Daily' | 'Include Moderately' | 'Minimize';
  examples: string;
}

export interface HerbAndSpiceItem {
  name: string;
  sanskrit: string;
  targetDoshas: string;
  benefit: string;
  usage: string;
}

export interface PracticeItem {
  category: 'Pranayama' | 'Yoga Asana' | 'Marma & Sensory';
  title: string;
  sanskrit: string;
  duration: string;
  description: string;
}

export interface DinacharyaStep {
  id: string;
  window: 'Morning' | 'Midday' | 'Evening';
  timeRange: string;
  title: string;
  sanskrit: string;
  description: string;
}

export interface ActiveDoshaClockInfo {
  currentTimeStr: string;
  activeDosha: DoshaName;
  periodLabel: string;
  timeRange: string;
  energyQuality: string;
  bestActivities: string;
  avoidActivities: string;
}

export interface SeasonalRitucharya {
  seasonName: string;
  sanskritName: string;
  dominantDosha: DoshaName;
  summary: string;
  keyAdjustments: string;
}

export interface AyurvedaQuizQuestion {
  id: string;
  category: 'Body Frame' | 'Digestion' | 'Mind & Focus' | 'Sleep' | 'Temperature' | 'Stress';
  prompt: string;
  options: {
    dosha: DoshaName;
    label: string;
  }[];
}

export interface AyurvedaProfile {
  personName: string;
  prakriti: DoshaScores;
  vikriti: DoshaScores;
  constitutionType: ConstitutionCode;
  primaryDosha: DoshaName;
  secondaryDosha: DoshaName;
  imbalancedDosha: DoshaName;
  hasActiveImbalance: boolean;
  elements: ElementScores;
  gunas: GunaScores;
  primaryGuna: GunaName;
  archetypeHeadline: string;
  archetypeSummary: string;
  strengths: string;
  watchOuts: string;
  agni: AgniAnalysis;
  vitalEssences: VitalEssenceMetrics;
  subdoshas: SubdoshaItem[];
  tastes: TasteRecommendation[];
  foodsToFavor: { category: string; items: string }[];
  foodsToReduce: { category: string; items: string }[];
  herbsAndSpices: HerbAndSpiceItem[];
  practices: PracticeItem[];
  dinacharya: DinacharyaStep[];
  season: SeasonalRitucharya;
}

export interface AyurvedaMatchResult {
  matchType: AyurvedaMatchType;
  overallScore: number;
  doshaChemistryScore: number;
  gunaHarmonyScore: number;
  elementalBalanceScore: number;
  headline: string;
  summary: string;
  strengths: string[];
  frictionPoints: string[];
  ritualAdvice: string;
}