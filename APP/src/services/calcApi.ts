import { useEffect, useState } from 'react';
import { API_BASE_URL } from './api';

/**
 * Клиент за Calc API на бекенда (POST /api/calc/:domain/:action).
 * Всички изчисления (натална карта, транзити, BaZi, Аюрведа, MBTI, небе, нумерология,
 * кардиология) се правят на сървъра — приложението само показва резултата.
 */

const CACHE_LIMIT = 200;
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function remember(key: string, value: unknown) {
  if (cache.size >= CACHE_LIMIT) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, value);
}

export async function calc<T>(path: string, body: object = {}): Promise<T> {
  const key = `${path}|${JSON.stringify(body)}`;
  if (cache.has(key)) return cache.get(key) as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${API_BASE_URL}/calc/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Calc ${path} failed with status ${response.status}`);
      }
      remember(key, data.result);
      return data.result as T;
    } finally {
      clearTimeout(timeout);
    }
  })();

  inflight.set(key, request);
  try {
    return await request;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Зарежда изчисление от бекенда и го презарежда при промяна на `body`.
 * Подайте `null`, за да пропуснете заявката. Пази последния резултат по време на презареждане.
 */
export function useCalc<T>(path: string, body: object | null) {
  const key = body ? `${path}|${JSON.stringify(body)}` : null;
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null; loading: boolean }>(
    () => ({
      key,
      data: key && cache.has(key) ? (cache.get(key) as T) : null,
      error: null,
      loading: Boolean(key && !cache.has(key)),
    })
  );
  useEffect(() => {
    if (!key || !body) {
      setState({ key: null, data: null, error: null, loading: false });
      return;
    }

    if (cache.has(key)) {
      setState({ key, data: cache.get(key) as T, error: null, loading: false });
      return;
    }

    let active = true;
    setState({ key, data: null, loading: true, error: null });
    calc<T>(path, body)
      .then((data) => {
        if (active) setState({ key, data, error: null, loading: false });
      })
      .catch((err: Error) => {
        console.warn(`API Warning [calc ${path}]:`, err.message);
        if (active) setState({ key, data: null, error: err.message, loading: false });
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state : { data: null, error: null, loading: key !== null };
}

/** Рождени данни, които бекендът използва, за да преизчисли (и кешира) наталната карта. */
export interface BirthPayload {
  dStr: string;
  tStr: string;
  lat: number;
  lon: number;
  timezone?: string;
  hasExactBirthTime: boolean;
}

export function birthFromChart(
  chart: {
    dateStr: string;
    timeStr: string;
    lat: number;
    lon: number;
    timezone?: string;
    hasExactBirthTime: boolean;
  } | null
): BirthPayload | null {
  if (!chart) return null;
  return {
    dStr: chart.dateStr,
    tStr: chart.timeStr,
    lat: chart.lat,
    lon: chart.lon,
    timezone: chart.timezone,
    hasExactBirthTime: chart.hasExactBirthTime,
  };
}

/** Локално (стенно) време на устройството като "YYYY-MM-DDTHH:mm" — за часовници и сезони. */
export function toLocalWallClock(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const BIRTH_DATE_KEYS = ['birthdate', 'birthDate', 'dateOfBirth', 'dob', 'birth_date', 'birthday'];
const BIRTH_TIME_KEYS = ['birthTime', 'timeOfBirth', 'birth_time', 'birthtime'];
const BIRTH_PLACE_KEYS = ['birthCity', 'birthLocation', 'birthPlace', 'city'];

/**
 * ISO/Date стойности за час се свеждат до локално "HH:mm" на устройството,
 * за да не зависи резултатът от часовата зона на сървъра.
 */
function normalizeBirthTime(raw: any): any {
  const asLocalHHmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (raw instanceof Date && !isNaN(raw.getTime())) return asLocalHHmm(raw);
  if (typeof raw === 'string' && raw.includes('T')) {
    const d = new Date(raw.trim());
    if (!isNaN(d.getTime())) return asLocalHHmm(d);
  }
  return raw;
}

function pickBirthFields(source: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!source || typeof source !== 'object') return out;
  for (const k of [...BIRTH_DATE_KEYS, ...BIRTH_PLACE_KEYS]) {
    if (source[k] !== undefined && source[k] !== null) out[k] = source[k];
  }
  for (const k of BIRTH_TIME_KEYS) {
    if (source[k] !== undefined && source[k] !== null) out[k] = normalizeBirthTime(source[k]);
  }
  if (source.hasExactBirthTime !== undefined) out.hasExactBirthTime = source.hasExactBirthTime;
  return out;
}

/** Само полетата за раждане от профила — малък и стабилен payload за /calc. */
export function birthFieldsOf(user: any): Record<string, any> | null {
  if (!user || typeof user !== 'object') return null;
  const fields = pickBirthFields(user);
  const profile = pickBirthFields(user.profile);
  if (Object.keys(profile).length > 0) fields.profile = profile;
  return fields;
}
