export type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type Polarity = 'Yang' | 'Yin';

export interface HeavenlyStem {
  index: number;
  hanzi: string;
  pinyin: string;
  element: WuXingElement;
  polarity: Polarity;
}

export interface EarthlyBranch {
  index: number;
  hanzi: string;
  pinyin: string;
  animal: string;
  element: WuXingElement;
  polarity: Polarity;
  hiddenStems: number[]; // индекси в HEAVENLY_STEMS
}

export interface BaZiPillar {
  label: 'Hour' | 'Day' | 'Month' | 'Year';
  bgLabel: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  hiddenStems: HeavenlyStem[];
}

export interface DayMasterProfile {
  stem: HeavenlyStem;
  title: string;
  archetype: string;
  strengths: string;
  balanceAdvice: string;
  favorableElement: WuXingElement;
}

export interface BaZiChart {
  yearPillar: BaZiPillar;
  monthPillar: BaZiPillar;
  dayPillar: BaZiPillar;
  hourPillar: BaZiPillar | null;
  dayMaster: DayMasterProfile;
  zodiacAnimal: string;
  elementScores: Record<WuXingElement, number>;
  elementPercentages: Record<WuXingElement, number>;
  dominantElement: WuXingElement;
  weakestElement: WuXingElement;
  annualTransit2026: {
    pillarName: string;
    elementRelation: string;
    guidance: string;
  };
}