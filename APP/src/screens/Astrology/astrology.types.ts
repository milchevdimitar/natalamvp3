import * as Astronomy from 'astronomy-engine';

export type ChartViewMode = '2D' | '3D';
export type AstrologyAppTab = 'chart' | 'today' | 'patterns' | 'bonds' | 'universe';
export type ElementType = 'Fire' | 'Earth' | 'Air' | 'Water';
export type ModalityType = 'Cardinal' | 'Fixed' | 'Mutable';
export type PolarityType = 'Yang' | 'Yin';
export type DignityType = 'Domicile' | 'Exaltation' | 'Detriment' | 'Fall' | 'Peregrine';
export type AspectHarmony = 'harmonious' | 'challenging' | 'neutral';

export interface ZodiacSignInfo {
  name: string;
  latin: string;
  symbol: string;
  bgName: string;
  element: ElementType;
  modality: ModalityType;
  polarity: PolarityType;
  traditionalRuler: string;
  modernRuler: string;
}

export interface PlanetBodyConfig {
  key: string;
  name: string;
  symbol: string;
  body?: Astronomy.Body;
  specialType?: 'north_node' | 'south_node' | 'lilith' | 'part_of_fortune';
  weight: number;
}

export interface ZodiacPosition {
  deg: number;
  signDeg: number;
  degFormatted: string;
  sign: string;
  latinSign: string;
  symbol: string;
  bgName: string;
  element: ElementType;
  modality: ModalityType;
  polarity: PolarityType;
}

export interface PlanetPosition {
  key: string;
  name: string;
  symbol: string;
  deg: number;
  signDeg: number;
  degFormatted: string;
  sign: string;
  latinSign: string;
  signSymbol: string;
  signBg: string;
  house: number;
  element: ElementType;
  modality: ModalityType;
  polarity: PolarityType;
  isRetrograde: boolean;
  speedDegPerDay: number;
  dignity: DignityType;
}

export interface HouseCuspInfo {
  house: number;
  cuspDeg: number;
  signDeg: number;
  degFormatted: string;
  sign: string;
  latinSign: string;
  symbol: string;
  bgName: string;
  element: ElementType;
  modality: ModalityType;
  traditionalRuler: string;
  modernRuler: string;
  planetsInHouse: string[];
}

export interface NatalAspect {
  id: string;
  body1: string;
  body1Key: string;
  body2: string;
  body2Key: string;
  aspectType: string;
  symbol: string;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  maxOrb: number;
  isApplying: boolean;
  harmony: AspectHarmony;
  weight: number;
}

export interface ChartPattern {
  id: string;
  type: 'Stellium' | 'T-Square' | 'Grand Trine' | 'Grand Cross' | 'Yod';
  bodies: string[];
  sign?: string;
  house?: number;
  element?: ElementType;
  apexBody?: string;
}

export interface ElementDistribution {
  fire: number;
  earth: number;
  air: number;
  water: number;
  shares: {
    fire: number;
    air: number;
    water: number;
    earth: number;
  };
  dominantElement: ElementType;
  lackingElement: ElementType | null;
}

export interface ModalityDistribution {
  cardinal: number;
  fixed: number;
  mutable: number;
  dominantModality: ModalityType;
}

export interface PolarityBalance {
  yang: number;
  yin: number;
  score: number;
  dominantPolarity: PolarityType;
}

export interface HemisphereBalance {
  eastern: number;
  western: number;
  northern: number;
  southern: number;
}

export interface ChartRulerInfo {
  ascSign: string;
  traditionalRuler: string;
  modernRuler: string;
  rulerSign: string;
  rulerHouse: number;
  isRulerRetrograde: boolean;
}

export interface NatalChartResults {
  signature: string;
  calculatedAt: string;
  zodiacType: 'Tropical';
  houseSystem: 'Placidus';
  ephemerisSource: 'astronomy-engine-jpl';
  hasExactBirthTime: boolean;

  dateStr: string;
  timeStr: string;
  birthDateTimeUtc: string;
  lat: number;
  lon: number;
  timezone?: string;

  asc: number;
  mc: number;
  dsc: number;
  ic: number;
  angles: {
    asc: ZodiacPosition;
    mc: ZodiacPosition;
    dsc: ZodiacPosition;
    ic: ZodiacPosition;
  };

  cusps: number[];
  houses: HouseCuspInfo[];

  planetPositions: PlanetPosition[];
  planetsByKey: Record<string, PlanetPosition>;

  aspects: NatalAspect[];
  patterns: ChartPattern[];

  elements: ElementDistribution;
  modalities: ModalityDistribution;
  polarity: PolarityBalance;
  hemispheres: HemisphereBalance;

  isDayChart: boolean;
  chartRuler: ChartRulerInfo;
}

export interface UserBirthDateTime {
  date: Date;
  dStr: string;
  tStr: string;
  hasExactBirthTime: boolean;
  lat: number;
  lon: number;
  cityName: string;
  timezone?: string;
}

export interface AspectLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  isMajor: boolean;
}

// --- Модули 3, 4, 5: Daily Updates, Transits & Time Travel ---

export interface SkyBodySnapshot {
  key: string;
  name: string;
  symbol: string;
  deg: number;
  sign: string;
  signSymbol: string;
  degFormatted: string;
  isRetrograde: boolean;
}

export interface TransitAspectItem {
  id: string;
  transitPlanet: string;
  transitKey: string;
  transitSymbol: string;
  transitSign: string;
  aspectType: string;
  aspectSymbol: string;
  natalPlanet: string;
  natalKey: string;
  natalSymbol: string;
  natalSign: string;
  natalHouse: number;
  orb: number;
  maxOrb: number;
  isApplying: boolean;
  intensity: number; // 0..100
  progress: number; // 0..1 (0 = начало на цикъла, 0.5 = пик, 1 = край)
  harmony: AspectHarmony;
  timeframeLabel: 'Short-term' | 'Medium Cycle' | 'Deep Outer Cycle';
  startDateStr: string;
  peakDateStr: string;
  endDateStr: string;
  title: string;
  summary: string;
  guidance: string;
}

export interface LifeCycleItem {
  id: string;
  title: string;
  subtitle: string;
  ageRange: string;
  status: 'active' | 'upcoming' | 'completed';
  progress: number; // 0..100
  description: string;
}

export interface TimeTravelSnapshot {
  targetDate: Date;
  dateStr: string;
  skyPositions: SkyBodySnapshot[];
  activeTransits: TransitAspectItem[];
  lifeCycles: LifeCycleItem[];
  periodInsight: {
    title: string;
    theme: string;
    advice: string;
  };
}

export interface MoonPhaseInfo {
  name: string;
  symbol: string;
  illumination: number;
  sign: string;
  signSymbol: string;
  guidance: string;
}

export interface DailyUpdatePackage {
  dateStr: string;
  moonPhase: MoonPhaseInfo;
  cosmicScore: number;
  dailyMessage: string;
  activeInfluences: string[];
  emotionalTheme: string;
  potentialChallenge: string;
  activatedProcess: string;
  mindfulGuidance: string;
}

// --- Модули 1 и 2: Психологически анализи и личностни модели ---

export interface PsychologicalInsightBlock {
  id: string;
  code: string;
  category:
    | 'personality'
    | 'emotional'
    | 'strengths'
    | 'challenges'
    | 'conflicts'
    | 'insight';
  title: string;
  placementTag: string;
  body: string;
  actionTip: string;
}

export interface PatternAnalysisItem {
  id: string;
  code: string;
  title: string;
  placementBasis: string;
  summary: string;
  deepDive: string;
  growthKey: string;
}

// --- Модули 6, 7, 8, 9, 15: Bonds, Bond Transits, Custom Friends & Public Figures ---

export type BondRelationshipType =
  | 'romantic'
  | 'ex_partner'
  | 'friend'
  | 'family'
  | 'other'
  | 'public_figure';

export interface BondProfileInput {
  id: string;
  name: string;
  relationshipType: BondRelationshipType;
  birthdate: string;
  birthTime?: string;
  birthCity?: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  bio?: string;
  isPublicFigure?: boolean;
}

export interface SynastryAspectItem {
  id: string;
  person1Body: string;
  person1Symbol: string;
  person2Body: string;
  person2Symbol: string;
  aspectType: string;
  aspectSymbol: string;
  orb: number;
  harmony: AspectHarmony;
  domain: 'romantic' | 'emotional' | 'psychological' | 'communication' | 'growth';
  interpretation: string;
}

export interface BondAnalysisResult {
  partner: BondProfileInput;
  partnerChart: NatalChartResults;
  scores: {
    overall: number;
    romantic: number;
    emotional: number;
    psychological: number;
    communication: number;
  };
  strengths: string[];
  conflicts: string[];
  challenges: string[];
  sharedThemes: string[];
  mutualInfluence: string;
  repeatingPatterns: string[];
  personalizedSummary: string;
  synastryAspects: SynastryAspectItem[];
  bondTransits: TransitAspectItem[];
  romanticTiming: {
    score: number;
    phaseLabel: string;
    closenessWindows: string[];
    tensionWindows: string[];
    dynamicShift: string;
  };
}

// --- Модули 10, 11, 12, 13, 14, 18: Universe, Audio, Classes, Collections ---

export type CollectionCategory =
  | 'insights'
  | 'transits'
  | 'patterns'
  | 'bonds'
  | 'library'
  | 'audio'
  | 'classes';

export interface UserCollectionItem {
  itemId: string;
  itemType: string;
  title: string;
  subtitle?: string;
  savedAt?: string;
}

export interface UserCollectionGroup {
  _id?: string;
  title: string;
  category: CollectionCategory;
  items: UserCollectionItem[];
}

export interface LibraryArticleItem {
  id: string;
  category:
    | 'Cosmic Climate'
    | 'Personal'
    | 'Education'
    | 'Relationships'
    | 'Personal Growth'
    | 'Life Themes'
    | 'Bonus Chapter';
  readTime: string;
  title: string;
  subtitle: string;
  body: string;
}

export interface AudioSessionItem {
  id: string;
  type: 'Personal Interpretation' | '360° Immersive' | 'Sound Meditation' | 'Moon Journey';
  durationSec: number;
  durationLabel: string;
  title: string;
  subtitle: string;
  frequencyHz: string;
  scriptPreview: string;
}

export interface AstrologyClassItem {
  id: string;
  code: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  title: string;
  concept: string;
  personalExample: string;
  takeaway: string;
}

export interface SharedExperienceItem {
  id: string;
  author: string;
  bigThree: string;
  topicTag: string;
  timeAgo: string;
  content: string;
  resonatesCount: number;
}