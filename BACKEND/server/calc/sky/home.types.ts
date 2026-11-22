export type AstroElement = 'Fire' | 'Earth' | 'Air' | 'Water';

export interface ZodiacSignData {
  name: string;
  symbol: string;
  element: AstroElement;
}

export interface ZodiacInfo {
  sign: string;
  symbol: string;
  element: AstroElement;
  degree: number;
}

export interface MoonPhaseData {
  cyclePosition: number;
  phasePercent: number;
  illuminated: number;
  phaseName: string;
  symbol: string;
  isSpecial: boolean;
  ageInDays: string;
}

export interface PlanetMeta {
  image: string;
  ruler: string;
  element: AstroElement;
  topic: string;
  description: string;
  symbol: string;
}

export interface DetailedPlanetPosition {
  planet: string;
  name: string;
  signName: string;
  degInSign: number;
  zodiacSymbol: string;
  progressPercent: number;
  isRetrograde: boolean;
  longitude: number;
  isLiveNASA?: boolean;
  meta: PlanetMeta;
}