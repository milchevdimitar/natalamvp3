import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const primaryUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || 'https://navarzano.cloud/api';
const port = process.env.EXPO_PUBLIC_API_PORT || '5000';

function getLocalUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (Platform.OS === 'web') {
    return __DEV__ || globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1'
      ? `http://localhost:${port}/api` : null;
  }
  if (!__DEV__ && Constants.expoConfig?.extra?.lanTestBuild !== true) return null;
  if (host) return `http://${host}:${port}/api`;
  if (Platform.OS === 'ios') return `http://localhost:${port}/api`;
  return null;
}

const backendKey = 'natala.backend.override';
export let API_BASE_URL = primaryUrl;
export { API_BASE_URL as API_URL };

type BackendConnection = {
  kind: 'VPS' | 'Local' | 'Custom';
  status: 'checking' | 'connected' | 'database-unavailable' | 'unreachable';
};

let connection: BackendConnection = { kind: 'VPS', status: 'checking' };
const listeners = new Set<() => void>();

export const getBackendConnection = () => connection;
export function subscribeToBackendConnection(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function activateBackend(url: string, kind: BackendConnection['kind'], health: { dbConnected: boolean } | null) {
  API_BASE_URL = url;
  connection = { kind, status: health ? (health.dbConnected ? 'connected' : 'database-unavailable') : 'unreachable' };
  listeners.forEach((listener) => listener());
  return url;
}

async function readHealth(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${url}/health`, { signal: controller.signal, redirect: 'error' });
    if (!response.ok) return null;
    const health = await response.json();
    return health?.success === true && typeof health.dbConnected === 'boolean' ? health : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Choose a backend before restoring the session. Never replay writes or
// forward a session token to a different server when a request fails.
async function selectDefaultBackend() {
  const fallback = getLocalUrl();
  const primaryHealth = await readHealth(primaryUrl);
  if (!primaryHealth?.dbConnected && fallback && fallback !== primaryUrl) {
    const localHealth = await readHealth(fallback);
    if (localHealth?.dbConnected) return activateBackend(fallback, 'Local', localHealth);
  }
  return activateBackend(primaryUrl, 'VPS', primaryHealth);
}

export function parseBackendIp(input: string) {
  const match = /^(?:(https?):\/\/)?(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/i.exec(input.trim());
  if (!match) throw new Error('Enter an IPv4 address, optionally followed by :port.');
  const [, scheme, address, explicitPort] = match;
  const [a, b, c, d] = address.split('.').map(Number);
  if ([a, b, c, d].some((part) => part > 255) || address !== [a, b, c, d].join('.')) {
    throw new Error('Enter a valid IPv4 address.');
  }
  const protocol = scheme?.toLowerCase() ?? 'http';
  const local = a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  if (protocol === 'http' && !local) throw new Error('Use HTTPS for a public IP address.');
  const port = Number(explicitPort || (protocol === 'https' ? '443' : process.env.EXPO_PUBLIC_API_PORT || '5000'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Enter a port between 1 and 65535.');
  return `${protocol}://${address}:${port}/api`;
}

export async function loadBackendOverride() {
  const stored = await AsyncStorage.getItem(backendKey).catch(() => null);
  if (stored) {
    try {
      const url = parseBackendIp(stored);
      activateBackend(url, url === getLocalUrl() ? 'Local' : 'Custom', await readHealth(url));
      return;
    } catch {
      // Fall through to the standard addresses for invalid saved overrides.
    }
  }
  await selectDefaultBackend();
}

export async function saveBackendOverride(input: string | null) {
  if (input === null) {
    await AsyncStorage.removeItem(backendKey);
    return selectDefaultBackend();
  }

  const next = parseBackendIp(input);
  const health = await readHealth(next);
  if (!health) {
    throw new Error('Could not reach Natala at that address. Check the IP, port and Wi-Fi.');
  }
  await AsyncStorage.setItem(backendKey, input.trim());
  return activateBackend(next, next === getLocalUrl() ? 'Local' : 'Custom', health);
}
