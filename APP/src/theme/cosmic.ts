import { isExploreRoute } from '../data/exploreRoutes';

export const cosmic = {
  bg: '#03091e',
  surface: '#142450',
  surfaceAlt: '#1d3063',
  text: '#f8faff',
  muted: '#b9c8ea',
  purple: '#b49cff',
  gold: '#f6c66d',
  line: 'rgba(177,195,255,0.24)',
};

export const glassPanel = {
  border: 'rgba(177,195,255,0.19)',
  background: 'rgba(16,27,68,0.14)',
  colors: ['rgba(24,53,121,0.40)', 'rgba(34,32,100,0.41)'] as const,
  start: { x: 0, y: 0.25 },
  end: { x: 1, y: 0.75 },
};

export const lightGlassPanel = {
  ...glassPanel,
  border: 'rgba(65,89,151,0.26)',
  background: 'rgba(247,249,255,0.40)',
  colors: ['rgba(255,255,255,0.80)', 'rgba(222,227,255,0.66)'] as const,
};

export const cosmicTabColors = {
  dark: { ...cosmic, purpleSoft: 'rgba(137,118,236,0.22)', goldSoft: 'rgba(246,198,109,0.15)', action: '#6449aa' },
  light: {
    bg: '#eef2ff',
    surface: '#f6f8ff',
    surfaceAlt: '#e1e8fb',
    text: '#162446',
    muted: '#43547b',
    purple: '#57429e',
    purpleSoft: '#dcd6f9',
    gold: '#77500f',
    goldSoft: '#f6e6c3',
    line: 'rgba(65,89,151,0.26)',
    action: '#6449aa',
  },
};

export function isCosmicPage(page: string) {
  return page === 'explore' || page === 'atlas-step' || page === 'chat' || page === 'people' || page === 'constellation' || page === 'dating' || page === 'notifications' || page === 'mirror' || page === 'mirror-session' || page === 'mirror-invite' || page === 'profile' || page === 'profile-showcase' || page === 'reflections' || page === 'shared-profile' || isExploreRoute(page);
}
