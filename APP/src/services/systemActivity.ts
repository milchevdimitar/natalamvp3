import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DoshaName } from '../screens/Ayurveda/ayurveda.types';

export type AyurvedaActivity = {
  answers: Record<string, DoshaName>;
  stress: 'low' | 'moderate' | 'high';
  constitution: string;
  scores: { Vata: number; Pitta: number; Kapha: number };
};

type TarotActivity = { value: string; detail: string };

export type SystemActivity = { ayurveda?: AyurvedaActivity; tarot?: TarotActivity; bazi?: { dayMaster: string; zodiacAnimal: string } };

const accountKey = (email: string, system: keyof SystemActivity) =>
  'natala:system:' + email.trim().toLowerCase() + ':' + system;

export async function saveSystemActivity<K extends keyof SystemActivity>(email: string, system: K, data: NonNullable<SystemActivity[K]>) {
  await AsyncStorage.setItem(accountKey(email, system), JSON.stringify(data));
}

async function load<K extends keyof SystemActivity>(email: string, system: K): Promise<SystemActivity[K] | undefined> {
  try {
    const value = await AsyncStorage.getItem(accountKey(email, system));
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

export function useSystemActivity(email?: string) {
  const [state, setState] = useState<{ email: string; data: SystemActivity } | null>(null);
  useEffect(() => {
    if (!email) return;
    let active = true;
    void Promise.all([load(email, 'ayurveda'), load(email, 'tarot'), load(email, 'bazi')]).then(([ayurveda, tarot, bazi]) => {
      if (active) setState({ email, data: { ayurveda, tarot, bazi } });
    });
    return () => { active = false; };
  }, [email]);
  return state?.email === email ? state?.data : undefined;
}
