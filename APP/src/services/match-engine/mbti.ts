import matrixData from './mbti_compatibility_matrix.json';
import { ExplanationFact, ModuleComponentResult } from './types';

export type MbtiSymbol = 'R' | 'Y' | 'L' | 'G' | 'B';

export interface MbtiMatrixValidation {
  valid: boolean;
  errors: string[];
}

export function validateMbtiMatrix(data = matrixData): MbtiMatrixValidation {
  const errors: string[] = [];
  const order = data.type_order;

  if (!Array.isArray(order) || order.length !== 16) {
    errors.push(`Expected 16 types in type_order, got ${order?.length ?? 0}`);
    return { valid: false, errors };
  }

  const validSymbols = new Set(Object.keys(data.legend));

  for (let i = 0; i < 16; i++) {
    const typeI = order[i];
    const rowI = (data.rows as Record<string, string>)[typeI];
    if (typeof rowI !== 'string' || rowI.length !== 16) {
      errors.push(`Row for ${typeI} must have length 16`);
      continue;
    }

    for (let j = 0; j < 16; j++) {
      const symIJ = rowI[j];
      if (!validSymbols.has(symIJ)) {
        errors.push(`Invalid symbol '${symIJ}' at (${typeI}, ${order[j]})`);
      }
      const typeJ = order[j];
      const rowJ = (data.rows as Record<string, string>)[typeJ];
      if (rowJ && rowJ[i] !== symIJ) {
        errors.push(`Matrix asymmetry between (${typeI},${typeJ})='${symIJ}' and (${typeJ},${typeI})='${rowJ[i]}'`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeMbtiType(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase().slice(0, 4);
  return matrixData.type_order.includes(upper) ? upper : null;
}

export function evaluateMbtiCompatibility(
  rawTypeA: string | null | undefined,
  rawTypeB: string | null | undefined,
  configuredWeight: number,
  enabled = true
): {
  component: ModuleComponentResult<{
    typeA: string;
    typeB: string;
    symbol: MbtiSymbol;
    labelBg: string;
    labelEn: string;
    sharedAxes: string[];
    complementaryAxes: string[];
  }>;
  facts: ExplanationFact[];
} {
  if (!enabled) {
    return {
      component: {
        name: 'mbti',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MODULE_OPTED_OUT',
      },
      facts: [],
    };
  }

  const validation = validateMbtiMatrix();
  if (!validation.valid) {
    throw new Error(`Invalid MBTI matrix configuration: ${validation.errors.join('; ')}`);
  }

  const typeA = normalizeMbtiType(rawTypeA);
  const typeB = normalizeMbtiType(rawTypeB);

  if (!typeA || !typeB) {
    return {
      component: {
        name: 'mbti',
        score: null,
        configuredWeight,
        effectiveWeight: 0,
        available: false,
        confidence: 0,
        unavailableReason: 'MISSING_OR_INVALID_MBTI',
      },
      facts: [],
    };
  }

  const idxB = matrixData.type_order.indexOf(typeB);
  const rowA = (matrixData.rows as Record<string, string>)[typeA];
  const symbol = rowA[idxB] as MbtiSymbol;
  const legendEntry = matrixData.legend[symbol];

  const axesNames = [
    ['E/I (Енергия)', typeA[0], typeB[0]],
    ['N/S (Възприятие)', typeA[1], typeB[1]],
    ['T/F (Решения)', typeA[2], typeB[2]],
    ['J/P (Стил)', typeA[3], typeB[3]],
  ];

  const sharedAxes = axesNames
    .filter(([, a, b]) => a === b)
    .map(([label, a]) => `${label}: ${a}`);
  const complementaryAxes = axesNames
    .filter(([, a, b]) => a !== b)
    .map(([label, a, b]) => `${label}: ${a}↔${b}`);

  const polarity: 'supportive' | 'tension' | 'neutral' =
    legendEntry.score >= 0.8
      ? 'supportive'
      : legendEntry.score <= 0.45
      ? 'tension'
      : 'neutral';

  const facts: ExplanationFact[] = [
    {
      key: `mbti.pair.${symbol}`,
      module: 'mbti',
      polarity,
      weight: legendEntry.score,
      evidence: {
        typeA,
        typeB,
        symbol,
        matrixVersion: matrixData.version,
      },
      textBg: `MBTI съчетание ${typeA} и ${typeB} (${legendEntry.label_bg}) — споделени предпочитания: ${
        sharedAxes.length > 0 ? sharedAxes.join(', ') : 'няма'
      }; допълващи оси: ${
        complementaryAxes.length > 0 ? complementaryAxes.join(', ') : 'няма'
      }.`,
      textEn: `MBTI pairing ${typeA} and ${typeB} (${legendEntry.label_en}) — shared preferences: ${
        sharedAxes.length > 0 ? sharedAxes.join(', ') : 'none'
      }; complementary axes: ${
        complementaryAxes.length > 0 ? complementaryAxes.join(', ') : 'none'
      }.`,
    },
  ];

  return {
    component: {
      name: 'mbti',
      score: legendEntry.score,
      configuredWeight,
      effectiveWeight: configuredWeight,
      available: true,
      confidence: 1.0,
      details: {
        typeA,
        typeB,
        symbol,
        labelBg: legendEntry.label_bg,
        labelEn: legendEntry.label_en,
        sharedAxes,
        complementaryAxes,
      },
    },
    facts,
  };
}