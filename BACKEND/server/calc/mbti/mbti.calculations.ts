import { QUESTIONS, TYPE_DESCRIPTIONS } from './mbti.data';
import { MbtiResultData } from './mbti.types';

const dimensions = {
  EI: { first: 'E', second: 'I', tie: 'E' },
  SN: { first: 'S', second: 'N', tie: 'N' },
  TF: { first: 'T', second: 'F', tie: 'F' },
  JP: { first: 'J', second: 'P', tie: 'P' },
} as const;

export function calculateMbtiResult(answers: Record<number, number>): MbtiResultData {
  const totals = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const maxima = { ...totals };

  for (const question of QUESTIONS) {
    const value = answers[question.id];
    const weight = Number.isInteger(value) && value >= 1 && value <= 7 ? value - 4 : 0;
    totals[question.dimension] += weight * question.direction;
    maxima[question.dimension] += 3;
  }

  const ratio = (dimension: keyof typeof dimensions) => {
    const first = Math.round(50 + 50 * totals[dimension] / maxima[dimension]);
    return { first, second: 100 - first };
  };
  const ratios = { EI: ratio('EI'), SN: ratio('SN'), TF: ratio('TF'), JP: ratio('JP') };
  const keys = Object.keys(dimensions) as (keyof typeof dimensions)[];
  const type = keys.map((dimension) => {
    const { first, second, tie } = dimensions[dimension];
    const total = totals[dimension];
    return total === 0 ? tie : total > 0 ? first : second;
  }).join('');

  return { type, details: TYPE_DESCRIPTIONS[type], ratios };
}

function savedRatio(first: unknown, second: unknown) {
  const valid = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
  const a = valid(first) ? first : valid(second) ? 100 - second : 50;
  const b = valid(second) ? second : 100 - a;
  const normalized = a + b > 0 ? Math.round(a / (a + b) * 100) : 50;
  return { first: normalized, second: 100 - normalized };
}

export function resolveCurrentResultData(
  showSavedResult: boolean,
  user: any,
  answers: Record<number, number>
): MbtiResultData {
  if (!showSavedResult || !user?.mbti?.type) return calculateMbtiResult(answers);
  const type = user.mbti.type;
  const p = user.mbti.percentages || {};

  return {
    type,
    details: TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP,
    ratios: {
      EI: savedRatio(p.extraversion, p.introversion),
      SN: savedRatio(p.observant, p.intuitive),
      TF: savedRatio(p.thinking, p.feeling),
      JP: savedRatio(p.judging, p.prospecting),
    },
  };
}
