import * as Astronomy from 'astronomy-engine';

export type ChartViewMode = '2D' | '3D';
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