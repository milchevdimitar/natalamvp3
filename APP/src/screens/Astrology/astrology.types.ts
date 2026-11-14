import * as Astronomy from 'astronomy-engine';

export type ChartViewMode = '2D' | '3D';

export interface ZodiacSignInfo {
  name: string;
  latin: string;
  symbol: string;
  bgName: string;
}

export interface PlanetBodyConfig {
  name: string;
  symbol: string;
  body?: Astronomy.Body;
  isNode?: boolean;
}

export interface ZodiacPosition {
  degFormatted: string;
  sign: string;
  latinSign: string;
  symbol: string;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  deg: number;
  house: number;
}

export interface NatalChartResults {
  asc: number;
  mc: number;
  cusps: number[];
  planetPositions: PlanetPosition[];
  dateStr: string;
  timeStr: string;
  lat: number;
  lon: number;
}

export interface UserBirthDateTime {
  date: Date;
  dStr: string;
  tStr: string;
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