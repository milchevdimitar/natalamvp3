export const exploreRoutes = [
  'astrology', 'numerology', 'mbti', 'cardology', 'tarot', 'ayurveda', 'bazi', 'chinese-zodiac',
] as const;

export type ExploreRoute = typeof exploreRoutes[number];

export function isExploreRoute(page: string): page is ExploreRoute {
  return exploreRoutes.some((route) => route === page);
}
