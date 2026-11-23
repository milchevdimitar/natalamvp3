import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  const port = process.env.EXPO_PUBLIC_API_PORT || '5000';
  const hostUri = Constants.expoConfig?.hostUri;
  const hostIp = hostUri ? hostUri.split(':')[0] : null;

  if (hostIp) {
    return `http://${hostIp}:${port}/api`;
  }

  const FALLBACK_IP = '10.159.206.3';

  return (
    Platform.select({
      android: `http://${FALLBACK_IP}:${port}/api`,
      ios: `http://${FALLBACK_IP}:${port}/api`,
      default: `http://localhost:${port}/api`,
    }) || `http://localhost:${port}/api`
  );
};

const backendKey = 'natala.backend.override';
const defaultUrl = getBaseUrl();
export let API_BASE_URL = defaultUrl;
export { API_BASE_URL as API_URL };

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
  const stored = await AsyncStorage.getItem(backendKey);
  if (stored) API_BASE_URL = parseBackendIp(stored);
}

export async function saveBackendOverride(input: string | null) {
  const next = input === null ? defaultUrl : parseBackendIp(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(`${next}/health`, { signal: controller.signal, redirect: 'error' });
    const health = await response.json();
    if (!response.ok || health.success !== true || typeof health.dbConnected !== 'boolean') throw new Error();
  } catch {
    throw new Error('Could not reach Natala at that address. Check the IP, port and Wi-Fi.');
  } finally {
    clearTimeout(timeout);
  }
  if (input === null) await AsyncStorage.removeItem(backendKey);
  else await AsyncStorage.setItem(backendKey, input.trim());
  API_BASE_URL = next;
  return next;
}
