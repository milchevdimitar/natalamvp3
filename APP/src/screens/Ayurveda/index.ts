export { default } from './Ayurveda';
export {
  calculateAyurvedaProfile,
  compareAyurvedaProfiles,
  getActiveDoshaClock,
  getSeasonalRitucharya,
} from './ayurveda.calculator';
export { DOSHA_META, PRAKRITI_QUIZ_QUESTIONS } from './ayurveda.data';
export type {
  AyurvedaProfile,
  DoshaName,
  DoshaScores,
  ConstitutionCode,
  AgniAnalysis,
  AyurvedaMatchResult,
} from './ayurveda.types';