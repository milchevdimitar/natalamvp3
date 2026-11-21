import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DAY_MS = 86400000;
export const localDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

type Visit = { day: number; count: number; days: number[] };
let pending: Promise<unknown> = Promise.resolve();

function recordVisit(email: string, now: Date) {
  const key = 'natala:discovery-streak:' + email.trim().toLowerCase();
  const day = localDay(now);
  const task = pending.then(async () => {
    const stored = await AsyncStorage.getItem(key);
    let previous: Partial<Visit> | null = null;
    try { previous = stored ? JSON.parse(stored) : null; } catch { /* Start a fresh history. */ }
    if (previous?.day === day && Array.isArray(previous.days) && typeof previous.count === 'number') {
      return previous as Visit;
    }
    const days = new Set<number>(Array.isArray(previous?.days) ? previous.days.filter(Number.isSafeInteger) : []);
    if (!Array.isArray(previous?.days) && typeof previous?.day === 'number' && Number.isSafeInteger(previous.day)) {
      const count = typeof previous.count === 'number' && Number.isSafeInteger(previous.count) ? Math.min(36525, Math.max(1, previous.count)) : 1;
      for (let i = 0; i < count; i += 1) days.add(previous.day - i);
    }
    days.add(day);
    let count = 1;
    while (days.has(day - count)) count += 1;
    const visit = { day, count, days: [...days].sort((a, b) => a - b) };
    await AsyncStorage.setItem(key, JSON.stringify(visit));
    return visit;
  });
  pending = task.catch(() => undefined);
  return task;
}

export function useDiscoveryStreak(email?: string) {
  const [visit, setVisit] = useState<{ email: string; data: Visit } | null>(null);

  useEffect(() => {
    if (!email) return;
    let mounted = true;
    const update = () => {
      void recordVisit(email, new Date()).then(
        (data) => { if (mounted) setVisit((current) => current?.email === email && current.data.day === data.day ? current : { email, data }); },
        () => { if (mounted) setVisit(null); },
      );
    };
    update();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') update();
    }, 60000);
    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(timer);
    };
  }, [email]);

  return visit && visit.email === email ? visit.data : null;
}
