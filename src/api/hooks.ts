import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

// ---- Types (mirror backend responses) --------------------------------------

export interface Me {
  id: string;
  username: string | null;
  displayName: string;
  locale: string;
  timezone: string;
  streak: { current: number; longest: number; lastActiveDate: string | null };
}

export type DailyKind = 'tarot' | 'fortune' | 'sky';

export interface DailyItem {
  id: string;
  kind: DailyKind;
  key: string;
  title: string;
  body: string;
  meta: Record<string, unknown>;
}

export interface TestQuestion {
  id: string;
  position: number;
  text: string;
}

export interface Test {
  id: string;
  title: string;
  locale: string;
  scalePoints: number;
  questions: TestQuestion[];
}

export interface TestResult {
  type: string;
  /** pct = share toward the first letter of each pair (E, S, T, J), 0–100 */
  dimensions: Record<'EI' | 'SN' | 'TF' | 'JP', { score: number; pct: number }>;
}

// ---- Hooks ------------------------------------------------------------------

export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
    enabled: status === 'signedIn',
  });
}

/** Opens today's gift. The server returns the same item all day, so calling it again is safe. */
export function useOpenDailyGift(kind: DailyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<DailyItem>(`/daily/${kind}/open`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }), // streak changed
  });
}

export function useTest(system: string, locale: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['test', system, locale],
    queryFn: () => api<Test>(`/tests/${system}?locale=${encodeURIComponent(locale)}`),
    enabled: status === 'signedIn',
    staleTime: Infinity, // questions don't change during a session
  });
}

export function useSubmitTest(system: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { testId: string; answers: { questionId: string; value: number }[] }) =>
      api<TestResult>(`/tests/${input.testId}/submissions`, { method: 'POST', body: { answers: input.answers } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['result', system] }),
  });
}

export function useMyResult(system: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['result', system],
    queryFn: () =>
      api<{ result: { summary: string; data: TestResult; computedAt: string } | null }>(`/me/results/${system}`),
    enabled: status === 'signedIn',
  });
}
