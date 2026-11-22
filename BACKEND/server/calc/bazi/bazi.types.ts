export type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type SixBoostElement =
  | 'Wood'
  | 'Fire'
  | 'Dry Earth'
  | 'Wet Earth'
  | 'Metal'
  | 'Water';
export type Polarity = 'Yang' | 'Yin';
export type Gender = 'male' | 'female';
export type BaZiViewComplexity = 'simple' | 'pro';
export type BaZiTabId = 'chart' | 'live' | 'diagnostics' | 'luck' | 'match';

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
  hiddenStems: number[];
}

export type TenGodName =
  | 'Friend'
  | 'Rob Wealth'
  | 'Eating God'
  | 'Hurting Officer'
  | 'Direct Wealth'
  | 'Indirect Wealth'
  | 'Direct Officer'
  | 'Seven Killings'
  | 'Direct Resource'
  | 'Indirect Resource';

export type FiveComponentName =
  | 'Body'
  | 'Output'
  | 'Wealth'
  | 'Power'
  | 'Intellect';

export interface BaZiPillar {
  label: 'Hour' | 'Day' | 'Month' | 'Year';
  subtitle: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  hiddenStems: HeavenlyStem[];
  stemTenGod: TenGodName | 'Day Master';
  hiddenTenGods: TenGodName[];
}

export interface CityPreset {
  name: string;
  country: string;
  longitude: number;
  tzOffsetHours: number;
}

export interface TrueSolarTimeResult {
  localTimeStr: string;
  solarTimeStr: string;
  solarDateStr: string;
  totalOffsetMinutes: number;
  longitudeOffsetMinutes: number;
  eotMinutes: number;
  city: CityPreset;
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  solarHour: number;
  solarMinute: number;
  shichenBranchIndex: number;
  shichenLabel: string;
}

export interface DayMasterStrengthAnalysis {
  status: 'Strong' | 'Balanced' | 'Weak';
  statusLabel: string;
  score: number; // 0 - 100
  inSeason: boolean; // De Ling
  hasRoots: boolean; // De Di
  hasStemSupport: boolean; // De Shi
  summary: string;
  detailedAnalysis: string;
}

export interface FiveComponentScore {
  key: FiveComponentName;
  title: string;
  subtitle: string;
  element: WuXingElement;
  percentage: number;
  description: string;
}

export interface TenGodProfileItem {
  name: TenGodName;
  pinyinName: string;
  component: FiveComponentName;
  percentage: number;
  isPrimary: boolean;
  archetype: string;
  talentSummary: string;
}

export interface SupergodItem {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  strength: number; // 0 - 100
  summary: string;
  deepDive: string;
}

export interface TalentBridgeMetric {
  key:
    | 'ambition'
    | 'productivity'
    | 'entrepreneurship'
    | 'expression'
    | 'recovery'
    | 'strategy'
    | 'leadership'
    | 'influence';
  label: string;
  score: number; // 0 - 100
  formulaHint: string;
  description: string;
}

export interface QiTemperatureAnalysis {
  score: number; // -100 (Very Cold) to +100 (Very Warm)
  warmPercent: number; // 0 - 100
  coldPercent: number; // 0 - 100
  label: 'Cold Qi' | 'Cool-Balanced Qi' | 'Harmonious Qi' | 'Warm-Balanced Qi' | 'Warm Qi';
  headline: string;
  summary: string;
  detailedAdvice: string;
}

export interface QiBoostElementScore {
  element: SixBoostElement;
  label: string;
  hanzi: string;
  score: number; // 0.0 - 10.0
  role: 'Primary Yong Shen' | 'Secondary Support' | 'Neutral' | 'Low Priority';
  color: string;
  actionTip: string;
}

export interface LuckPillarItem {
  index: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemTenGod: TenGodName;
  branchTenGod: TenGodName;
  isCurrent: boolean;
  headline: string;
  summary: string;
  detailedForecast: string;
  dynamicTalentBridge: Array<TalentBridgeMetric & { delta: number }>;
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
  dayMasterStrength: DayMasterStrengthAnalysis;
  zodiacAnimal: string;
  gender: Gender;
  birthYear: number;
  elementScores: Record<WuXingElement, number>;
  elementPercentages: Record<WuXingElement, number>;
  dominantElement: WuXingElement;
  weakestElement: WuXingElement;
  fiveComponents: FiveComponentScore[];
  tenGodProfiles: TenGodProfileItem[];
  primaryProfile: TenGodProfileItem;
  supergods: SupergodItem[];
  talentBridge: TalentBridgeMetric[];
  qiTemperature: QiTemperatureAnalysis;
  qiBoost: QiBoostElementScore[];
  luckPillars: LuckPillarItem[];
  annualTransit2026: {
    pillarName: string;
    elementRelation: string;
    guidance: string;
  };
}

export type MatchType = 'romantic' | 'business' | 'friendship';

export interface MatchMakerResult {
  matchType: MatchType;
  overallScore: number;
  elementHarmonyScore: number;
  dayMasterChemistryScore: number;
  yongShenSupportScore: number;
  headline: string;
  summary: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}