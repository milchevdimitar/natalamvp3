import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Visit = { day: number; count: number };
let pending: Promise<unknown> = Promise.resolve();

function recordVisit(email: string, now: Date) {
  const key = 'natala:discovery-streak:' + email.trim().toLowerCase();
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000;
  const task = pending.then(async () => {
    const stored = await AsyncStorage.getItem(key);
    const previous: Visit | null = stored ? JSON.parse(stored) : null;
    if (previous?.day === day) return previous.count;
    const count = previous?.day === day - 1 ? previous.count + 1 : 1;
    await AsyncStorage.setItem(key, JSON.stringify({ day, count }));
    return count;
  });
  pending = task.catch(() => undefined);
  return task;
}

export function useDiscoveryStreak(email?: string) {
  const [visit, setVisit] = useState<{ email: string; count: number } | null>(null);

  useEffect(() => {
    if (!email) return;
    let mounted = true;
    const update = () => {
      void recordVisit(email, new Date()).then(
        (count) => { if (mounted) setVisit({ email, count }); },
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

  return visit && visit.email === email ? visit.count : null;
}
