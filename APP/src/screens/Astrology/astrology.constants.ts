import * as Astronomy from 'astronomy-engine';
import {
  AspectHarmony,
  DignityType,
  PlanetBodyConfig,
  ZodiacSignInfo,
} from './astrology.types';

export const DEFAULT_LAT = 42.6977;
export const DEFAULT_LON = 23.3219;
export const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180;

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  {
    name: 'Aries',
    latin: 'ARIES',
    symbol: '♈',
    bgName: 'Овен',
    element: 'Fire',
    modality: 'Cardinal',
    polarity: 'Yang',
    traditionalRuler: 'Mars',
    modernRuler: 'Mars',
  },
  {
    name: 'Taurus',
    latin: 'TAURUS',
    symbol: '♉',
    bgName: 'Телец',
    element: 'Earth',
    modality: 'Fixed',
    polarity: 'Yin',
    traditionalRuler: 'Venus',
    modernRuler: 'Venus',
  },
  {
    name: 'Gemini',
    latin: 'GEMINI',
    symbol: '♊',
    bgName: 'Близнаци',
    element: 'Air',
    modality: 'Mutable',
    polarity: 'Yang',
    traditionalRuler: 'Mercury',
    modernRuler: 'Mercury',
  },
  {
    name: 'Cancer',
    latin: 'CANCER',
    symbol: '♋',
    bgName: 'Рак',
    element: 'Water',
    modality: 'Cardinal',
    polarity: 'Yin',
    traditionalRuler: 'Moon',
    modernRuler: 'Moon',
  },
  {
    name: 'Leo',
    latin: 'LEO',
    symbol: '♌',
    bgName: 'Лъв',
    element: 'Fire',
    modality: 'Fixed',
    polarity: 'Yang',
    traditionalRuler: 'Sun',
    modernRuler: 'Sun',
  },
  {
    name: 'Virgo',
    latin: 'VIRGO',
    symbol: '♍',
    bgName: 'Дева',
    element: 'Earth',
    modality: 'Mutable',
    polarity: 'Yin',
    traditionalRuler: 'Mercury',
    modernRuler: 'Mercury',
  },
  {
    name: 'Libra',
    latin: 'LIBRA',
    symbol: '♎',
    bgName: 'Везни',
    element: 'Air',
    modality: 'Cardinal',
    polarity: 'Yang',
    traditionalRuler: 'Venus',
    modernRuler: 'Venus',
  },
  {
    name: 'Scorpio',
    latin: 'SCORPIO',
    symbol: '♏',
    bgName: 'Скорпион',
    element: 'Water',
    modality: 'Fixed',
    polarity: 'Yin',
    traditionalRuler: 'Mars',
    modernRuler: 'Pluto',
  },
  {
    name: 'Sagittarius',
    latin: 'SAGITTARIUS',
    symbol: '♐',
    bgName: 'Стрелец',
    element: 'Fire',
    modality: 'Mutable',
    polarity: 'Yang',
    traditionalRuler: 'Jupiter',
    modernRuler: 'Jupiter',
  },
  {
    name: 'Capricorn',
    latin: 'CAPRICORN',
    symbol: '♑',
    bgName: 'Козирог',
    element: 'Earth',
    modality: 'Cardinal',
    polarity: 'Yin',
    traditionalRuler: 'Saturn',
    modernRuler: 'Saturn',
  },
  {
    name: 'Aquarius',
    latin: 'AQUARIUS',
    symbol: '♒',
    bgName: 'Водолей',
    element: 'Air',
    modality: 'Fixed',
    polarity: 'Yang',
    traditionalRuler: 'Saturn',
    modernRuler: 'Uranus',
  },
  {
    name: 'Pisces',
    latin: 'PISCES',
    symbol: '♓',
    bgName: 'Риби',
    element: 'Water',
    modality: 'Mutable',
    polarity: 'Yin',
    traditionalRuler: 'Jupiter',
    modernRuler: 'Neptune',
  },
];

export const PLANET_BODIES: PlanetBodyConfig[] = [
  { key: 'sun', name: 'Sun', symbol: '☉', body: Astronomy.Body.Sun, weight: 3.0 },
  { key: 'moon', name: 'Moon', symbol: '☾', body: Astronomy.Body.Moon, weight: 3.0 },
  { key: 'mercury', name: 'Mercury', symbol: '☿', body: Astronomy.Body.Mercury, weight: 2.0 },
  { key: 'venus', name: 'Venus', symbol: '♀', body: Astronomy.Body.Venus, weight: 2.0 },
  { key: 'mars', name: 'Mars', symbol: '♂', body: Astronomy.Body.Mars, weight: 2.0 },
  { key: 'jupiter', name: 'Jupiter', symbol: '♃', body: Astronomy.Body.Jupiter, weight: 1.5 },
  { key: 'saturn', name: 'Saturn', symbol: '♄', body: Astronomy.Body.Saturn, weight: 1.5 },
  { key: 'uranus', name: 'Uranus', symbol: '♅', body: Astronomy.Body.Uranus, weight: 1.0 },
  { key: 'neptune', name: 'Neptune', symbol: '♆', body: Astronomy.Body.Neptune, weight: 1.0 },
  { key: 'pluto', name: 'Pluto', symbol: '♇', body: Astronomy.Body.Pluto, weight: 1.0 },
  { key: 'northNode', name: 'North Node', symbol: '☊', specialType: 'north_node', weight: 0.5 },
  { key: 'southNode', name: 'South Node', symbol: '☋', specialType: 'south_node', weight: 0.5 },
  { key: 'lilith', name: 'Lilith', symbol: '⚸', specialType: 'lilith', weight: 0.5 },
  {
    key: 'partOfFortune',
    name: 'Part of Fortune',
    symbol: '⊗',
    specialType: 'part_of_fortune',
    weight: 0.5,
  },
];

export interface AspectDefinition {
  type: string;
  symbol: string;
  angle: number;
  orb: number;
  harmony: AspectHarmony;
  weight: number;
}

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
  { type: 'Conjunction', symbol: '☌', angle: 0, orb: 8, harmony: 'neutral', weight: 1.0 },
  { type: 'Opposition', symbol: '☍', angle: 180, orb: 8, harmony: 'challenging', weight: 0.95 },
  { type: 'Trine', symbol: '△', angle: 120, orb: 7, harmony: 'harmonious', weight: 0.9 },
  { type: 'Square', symbol: '□', angle: 90, orb: 7, harmony: 'challenging', weight: 0.9 },
  { type: 'Sextile', symbol: '⚹', angle: 60, orb: 5, harmony: 'harmonious', weight: 0.75 },
  { type: 'Quincunx', symbol: '⚻', angle: 150, orb: 3, harmony: 'challenging', weight: 0.55 },
  { type: 'Semi-sextile', symbol: '⚺', angle: 30, orb: 2, harmony: 'neutral', weight: 0.4 },
];

export const PLANET_DIGNITIES: Record<
  string,
  Partial<Record<DignityType, string[]>>
> = {
  Sun: {
    Domicile: ['Leo'],
    Exaltation: ['Aries'],
    Detriment: ['Aquarius'],
    Fall: ['Libra'],
  },
  Moon: {
    Domicile: ['Cancer'],
    Exaltation: ['Taurus'],
    Detriment: ['Capricorn'],
    Fall: ['Scorpio'],
  },
  Mercury: {
    Domicile: ['Gemini', 'Virgo'],
    Exaltation: ['Virgo'],
    Detriment: ['Sagittarius', 'Pisces'],
    Fall: ['Pisces'],
  },
  Venus: {
    Domicile: ['Taurus', 'Libra'],
    Exaltation: ['Pisces'],
    Detriment: ['Scorpio', 'Aries'],
    Fall: ['Virgo'],
  },
  Mars: {
    Domicile: ['Aries', 'Scorpio'],
    Exaltation: ['Capricorn'],
    Detriment: ['Libra', 'Taurus'],
    Fall: ['Cancer'],
  },
  Jupiter: {
    Domicile: ['Sagittarius', 'Pisces'],
    Exaltation: ['Cancer'],
    Detriment: ['Gemini', 'Virgo'],
    Fall: ['Capricorn'],
  },
  Saturn: {
    Domicile: ['Capricorn', 'Aquarius'],
    Exaltation: ['Libra'],
    Detriment: ['Cancer', 'Leo'],
    Fall: ['Aries'],
  },
  Uranus: {
    Domicile: ['Aquarius'],
    Exaltation: ['Scorpio'],
    Detriment: ['Leo'],
    Fall: ['Taurus'],
  },
  Neptune: {
    Domicile: ['Pisces'],
    Exaltation: ['Cancer'],
    Detriment: ['Virgo'],
    Fall: ['Capricorn'],
  },
  Pluto: {
    Domicile: ['Scorpio'],
    Exaltation: ['Aries'],
    Detriment: ['Taurus'],
    Fall: ['Libra'],
  },
};