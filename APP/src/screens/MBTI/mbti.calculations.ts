import { QUESTIONS, TYPE_DESCRIPTIONS } from './mbti.data';
import { MbtiResultData, MbtiScores } from './mbti.types';

function getPct(a: number, b: number) {
  const total = a + b || 1;
  return {
    first: Math.round((a / total) * 100),
    second: Math.round((b / total) * 100),
  };
}

export function calculateMbtiResult(answers: Record<number, number>): MbtiResultData {
  const scores: MbtiScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  QUESTIONS.forEach((q) => {
    const val = answers[q.id] || 4;
    const scoreWeight = val - 4;

    if (q.dimension === 'EI') {
      if (q.direction === 1) {
        scoreWeight > 0 ? (scores.E += scoreWeight) : (scores.I += Math.abs(scoreWeight));
      } else {
        scoreWeight > 0 ? (scores.I += scoreWeight) : (scores.E += Math.abs(scoreWeight));
      }
    } else if (q.dimension === 'SN') {
      if (q.direction === 1) {
        scoreWeight > 0 ? (scores.S += scoreWeight) : (scores.N += Math.abs(scoreWeight));
      } else {
        scoreWeight > 0 ? (scores.N += scoreWeight) : (scores.S += Math.abs(scoreWeight));
      }
    } else if (q.dimension === 'TF') {
      if (q.direction === 1) {
        scoreWeight > 0 ? (scores.T += scoreWeight) : (scores.F += Math.abs(scoreWeight));
      } else {
        scoreWeight > 0 ? (scores.F += scoreWeight) : (scores.T += Math.abs(scoreWeight));
      }
    } else if (q.dimension === 'JP') {
      if (q.direction === 1) {
        scoreWeight > 0 ? (scores.J += scoreWeight) : (scores.P += Math.abs(scoreWeight));
      } else {
        scoreWeight > 0 ? (scores.P += scoreWeight) : (scores.J += Math.abs(scoreWeight));
      }
    }
  });

  const type = [
    scores.E >= scores.I ? 'E' : 'I',
    scores.N >= scores.S ? 'N' : 'S',
    scores.F >= scores.T ? 'F' : 'T',
    scores.P >= scores.J ? 'P' : 'J',
  ].join('');

  const ratios = {
    EI: getPct(scores.E, scores.I),
    SN: getPct(scores.S, scores.N),
    TF: getPct(scores.T, scores.F),
    JP: getPct(scores.J, scores.P),
  };

  return {
    type,
    details: TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP,
    ratios,
    scores,
  };
}

export function resolveCurrentResultData(
  showSavedResult: boolean,
  user: any,
  answers: Record<number, number>
): MbtiResultData {
  if (showSavedResult && user?.mbti) {
    const type = user.mbti.type;
    const details = TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP;
    const p = user.mbti.percentages || {};

    return {
      type,
      details,
      ratios: {
        EI: { first: p.extraversion ?? 50, second: p.introversion ?? 50 },
        SN: { first: p.observant ?? 50, second: p.intuitive ?? 50 },
        TF: { first: p.thinking ?? 50, second: p.feeling ?? 50 },
        JP: { first: p.judging ?? 50, second: p.prospecting ?? 50 },
      },
    };
  }

  return calculateMbtiResult(answers);
}