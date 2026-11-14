import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
export const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export const FALLBACK_TAGS = ['astrology', 'tarot', 'numerology', 'mindfulness'];

export const ZODIAC_BG_MAP: Record<string, string> = {
  aries: 'Овен',
  taurus: 'Телец',
  gemini: 'Близнаци',
  cancer: 'Рак',
  leo: 'Лъв',
  virgo: 'Дева',
  libra: 'Везни',
  scorpio: 'Скорпион',
  sagittarius: 'Стрелец',
  capricorn: 'Козирог',
  aquarius: 'Водолей',
  pisces: 'Риби',
};