export const MATCH_I18N_BG = {
  'match.symbolicCompatibility': 'Индекс на символична съвместимост',
  'match.symbolicScoreUnit': 'т.',
  'match.communication': 'Комуникация',
  'match.attraction': 'Привличане и химия',
  'match.emotionalHarmony': 'Емоционална хармония',
  'match.stability': 'Стабилност',
  'match.friction': 'Динамика и напрежение',
  'match.complementaryElements': 'Допълване на елементите',
  'match.polarityBalance': 'Ин/Ян енергиен баланс',
  'match.mbtiSynergy': '16 Archetypes когнитивна динамика',
  'match.baziHarmony': 'Ба Дзъ (Четири стълба)',
  'match.goodAspects': 'Подкрепящи фактори',
  'match.growthAreas': 'Зони за осъзнаване',
  'match.insufficientData': 'Недостатъчно данни за символична оценка',
  'match.scientificDisclaimer':
    'Символичен индекс за саморефлексия (0–100 т.). Не представлява научна прогноза или вероятност за успех на връзката.',
} as const;

export type MatchI18nKey = keyof typeof MATCH_I18N_BG;
