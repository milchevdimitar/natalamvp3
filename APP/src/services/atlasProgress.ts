import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from './apiBase';
import { authorizedFetch } from './account';

type AtlasProgress = { completed: { stepId: string; choice?: number }[]; nextStepId: string | null };

async function request(path: string, init?: RequestInit): Promise<AtlasProgress> {
  const response = await authorizedFetch(API_BASE_URL + '/atlas' + path, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Atlas progress is unavailable.');
  return data;
}

export function useAtlasProgress() {
  const { user } = useApp();
  const accountId = user?._id ?? user?.id ?? user?.email;
  const [progress, setProgress] = useState<AtlasProgress>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!accountId) return;
    const abort = new AbortController();
    setError('');
    request('/progress', { signal: abort.signal }).then((result) => {
      if (!abort.signal.aborted) setProgress(result);
    }).catch((failure) => {
      if (!abort.signal.aborted) setError(failure.message);
    });
    return () => abort.abort();
  }, [accountId, attempt]);

  const complete = useCallback(async (id: string, choice?: number) => {
    const updated = await request('/steps/' + id + '/completion', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }),
    });
    setProgress(updated);
    return updated;
  }, []);

  return { progress, error, refresh: () => setAttempt((previous) => previous + 1), complete };
}
