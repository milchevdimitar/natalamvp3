import { ExplanationFact } from './types';

/**
 * Selects top supportive factors and potential tensions strictly from verified
 * deterministic facts. Never exposes exact private birth coordinates or birth time.
 */
export function buildVerifiedExplanations(facts: ExplanationFact[]): {
  allFacts: ExplanationFact[];
  topSupportive: ExplanationFact[];
  potentialTensions: ExplanationFact[];
} {
  const sorted = [...facts].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.key.localeCompare(b.key);
  });

  const topSupportive = sorted
    .filter((f) => f.polarity === 'supportive' || f.polarity === 'neutral')
    .slice(0, 4);

  const potentialTensions = sorted
    .filter((f) => f.polarity === 'tension')
    .slice(0, 3);

  return {
    allFacts: sorted,
    topSupportive,
    potentialTensions,
  };
}