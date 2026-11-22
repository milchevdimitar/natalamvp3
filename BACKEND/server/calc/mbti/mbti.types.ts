export type MbtiDimension = 'EI' | 'SN' | 'TF' | 'JP';

export interface Question {
  id: number;
  text: string;
  dimension: MbtiDimension;
  direction: 1 | -1;
}

export interface TypeDescription {
  title: string;
  subtitle: string;
  desc: string;
  traits: string[];
}

export interface DimensionRatio {
  first: number;
  second: number;
}

export interface CognitiveRatios {
  EI: DimensionRatio;
  SN: DimensionRatio;
  TF: DimensionRatio;
  JP: DimensionRatio;
}

export interface MbtiScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export interface MbtiResultData {
  type: string;
  details: TypeDescription;
  ratios: CognitiveRatios;
  scores?: MbtiScores;
}