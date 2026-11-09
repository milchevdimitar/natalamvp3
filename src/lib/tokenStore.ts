import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The refresh token survives app restarts: Keychain (iOS) / Keystore (Android).
// SecureStore has no web support, so the web build falls back to localStorage.
const KEY = 'natala.refreshToken';
const web = (): Storage | undefined => (globalThis as { localStorage?: Storage }).localStorage;

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return web()?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return web()?.setItem(KEY, token);
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') return web()?.removeItem(KEY);
  await SecureStore.deleteItemAsync(KEY);
}
