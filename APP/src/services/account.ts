import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '../models/User';
import { API_BASE_URL, loadBackendOverride, saveBackendOverride } from './apiBase';

const sessionKey = () => 'natala.account.session.' + API_BASE_URL.replace(/[^a-zA-Z0-9_.-]/g, '_');
let session: string | null = null;

export const tiers = ['free', 'plus', 'pro'] as const;
export type Tier = typeof tiers[number];
export const featureLabels = {
  astrology: 'Astrology', numerology: 'Numerology', mbti: '16 Archetypes', cardology: 'Cardology',
  ayurveda: 'Ayurveda', 'chinese-zodiac': 'Chinese Zodiac', tarot: 'Tarot', bazi: 'BaZi', 'pdf-report': 'PDF profile report',
} as const;
export type Feature = keyof typeof featureLabels;
export const isPlanFeature = (feature: string): feature is Feature => Object.hasOwn(featureLabels, feature);
export type AccountState = {
  tier: Tier | 'owner';
  features: Feature[];
  plans?: Record<Tier, Feature[]>;
  isOwner: boolean;
  previewTier?: Tier | null;
  subscription?: {
    tier: Tier;
    status: string;
    platform: 'ios' | 'android' | 'web' | 'none';
    expiresAt?: string | null;
  };
};
type AccountProfile = AccountState & { user: UserProfile };
type SignInResult = AccountProfile & { token: string };

export const hasFeature = (account: AccountState | null, feature: Feature) =>
  account?.tier === 'owner' || (account?.features?.includes(feature) ?? false);

export async function storeSession(token: string | null) {
  const key = sessionKey();
  session = token;
  if (Platform.OS === 'web') {
    if (token) globalThis.sessionStorage?.setItem(key, token);
    else globalThis.sessionStorage?.removeItem(key);
  } else if (token) await SecureStore.setItemAsync(key, token);
  else await SecureStore.deleteItemAsync(key);
}

export function authorizedFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (session && input.startsWith(`${API_BASE_URL}/`)) headers.set('Authorization', `Bearer ${session}`);
  return fetch(input, { ...init, headers });
}

class AccountError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(route: string, method = 'GET', payload?: object): Promise<T> {
  const response = await authorizedFetch(`${API_BASE_URL}/account${route}`, {
    method,
    ...(payload && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new AccountError(data?.error || (response.status === 401 ? 'Please sign in again.' : 'Could not complete the request.'), response.status);
  return data;
}

export async function restoreAccount(): Promise<AccountProfile | null> {
  await loadBackendOverride().catch(() => {});
  const key = sessionKey();
  session = Platform.OS === 'web' ? globalThis.sessionStorage?.getItem(key) ?? null : await SecureStore.getItemAsync(key);
  if (!session) return null;
  try {
    return await request<AccountProfile>('/me');
  } catch (error) {
    if (error instanceof AccountError && error.status === 401) await storeSession(null);
    throw error;
  }
}

export async function authenticate(route: '/email' | '/provider' | '/owner-test', payload: object) {
  const { token, ...result } = await request<SignInResult>(route, 'POST', payload);
  await storeSession(token);
  return result;
}

export async function changeBackend(input: string | null) {
  const current = API_BASE_URL;
  const next = await saveBackendOverride(input);
  if (next !== current) session = null;
  return next;
}

export const accountMethods = () => request<{ emailVerification: boolean }>('/methods');
export const sendEmailCode = (email: string) => request<void>('/email-code', 'POST', { email });
export const refreshAccount = () => request<AccountProfile>('/me');
export const previewTier = (tier: Tier | null) => request<AccountState>('/preview-tier', 'PUT', { tier });
export const updatePlan = (tier: Tier, features: Feature[]) => request<AccountState>(`/plans/${tier}`, 'PUT', { features });
export const unsubscribe = () => request<AccountState>('/unsubscribe', 'POST');
export const deleteAccount = () => request<void>('/me', 'DELETE');
export async function signOutAccount() {
  try {
    if (session) await request<void>('/logout', 'POST');
  } finally {
    await storeSession(null);
  }
}
