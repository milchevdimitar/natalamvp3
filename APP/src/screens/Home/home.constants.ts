import { Dimensions } from 'react-native';
import { PlanetMeta, ZodiacSignData } from './home.types';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const API_BASE_URL = 'http://10.159.206.3:5000';

export const ZODIAC_SIGNS_DATA: ZodiacSignData[] = [
  { name: 'Aries', symbol: '♈', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', element: 'Earth' },
  { name: 'Gemini', symbol: '♊', element: 'Air' },
  { name: 'Cancer', symbol: '♋', element: 'Water' },
  { name: 'Leo', symbol: '♌', element: 'Fire' },
  { name: 'Virgo', symbol: '♍', element: 'Earth' },
  { name: 'Libra', symbol: '♎', element: 'Air' },
  { name: 'Scorpio', symbol: '♏', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', element: 'Air' },
  { name: 'Pisces', symbol: '♓', element: 'Water' },
];

export const PLANET_METADATA: Record<string, PlanetMeta> = {
  Sun: {
    symbol: '☉',
    image:
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop',
    ruler: 'Leo',
    element: 'Fire',
    topic: 'Identity & Core Essence',
    description:
      'Our cosmic heart and source of vitality. Defines our willpower, self-expression, and core identity.',
  },
  Moon: {
    symbol: '☾',
    image:
      'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop',
    ruler: 'Cancer',
    element: 'Water',
    topic: 'Emotions & Intuition',
    description:
      'Guardian of the subconscious, emotional realm, inner comfort, and intuitive reactions.',
  },
  Mercury: {
    symbol: '☿',
    image:
      'https://images.unsplash.com/photo-1545156521-77bd85671d30?q=80&w=600&auto=format&fit=crop',
    ruler: 'Gemini / Virgo',
    element: 'Air',
    topic: 'Mind & Communication',
    description:
      'Planet of thought, speech, logic, and mental agility. Governs how we process information.',
  },
  Venus: {
    symbol: '♀',
    image:
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop',
    ruler: 'Taurus / Libra',
    element: 'Earth',
    topic: 'Love, Beauty & Values',
    description:
      'Goddess of beauty, love, harmony, art, and what we truly value in relationships.',
  },
  Mars: {
    symbol: '♂',
    image:
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop',
    ruler: 'Aries',
    element: 'Fire',
    topic: 'Drive, Action & Courage',
    description:
      'The zodiac warrior – defines how we assert ourselves, direct our passion, and overcome obstacles.',
  },
  Jupiter: {
    symbol: '♃',
    image:
      'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop',
    ruler: 'Sagittarius',
    element: 'Fire',
    topic: 'Expansion & Wisdom',
    description:
      'The great benefactor – brings growth, abundance, philosophical depth, and new horizons.',
  },
  Saturn: {
    symbol: '♄',
    image:
      'https://images.unsplash.com/photo-1614732484003-ef9881555dc3?q=80&w=600&auto=format&fit=crop',
    ruler: 'Capricorn',
    element: 'Earth',
    topic: 'Discipline & Time',
    description:
      'The great teacher – builds boundaries, structure, discipline, maturity, and karmic lessons.',
  },
  Uranus: {
    symbol: '♅',
    image:
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop',
    ruler: 'Aquarius',
    element: 'Air',
    topic: 'Awakening & Innovation',
    description:
      'Catalyst for change, genius, freedom, originality, and sudden revolutionary breakthroughs.',
  },
  Neptune: {
    symbol: '♆',
    image:
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
    ruler: 'Pisces',
    element: 'Water',
    topic: 'Dreams & Mysticism',
    description:
      'Planet of illusions, higher spirituality, creative inspiration, dreams, and cosmic oneness.',
  },
  Pluto: {
    symbol: '♇',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    ruler: 'Scorpio',
    element: 'Water',
    topic: 'Rebirth & Transformation',
    description:
      'Ruler of deep transformation, rebirth, hidden power, and releasing the old.',
  },
};

export const DAILY_FORTUNES: string[] = [
  'A quiet step today will open an unexpected door tomorrow.',
  'Trust the small steps. They are taking you somewhere meaningful.',
  'You are allowed to grow beyond the version of yourself you once knew.',
  'The universe is preparing a delightful surprise for you this week.',
  'Your intuition is stronger than ever today — listen closely.',
  'A fresh surge of cosmic energy and inspiration is entering your life.',
  'The harmony you seek is already blooming within you.',
];