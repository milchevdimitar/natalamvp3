import { Platform } from 'react-native';

/**
 * Where the API lives. Set EXPO_PUBLIC_API_URL in a `.env` file at the project
 * root, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 (your Mac's Wi-Fi IP)
 * when testing on a phone with Expo Go — `localhost` on a phone is the phone.
 */
const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/+$/, '');
export const API_URL = `${API_BASE}/v1`;

/** In development the app signs in automatically as this seeded test user. */
export const DEV_LOGIN_EMAIL = __DEV__ ? process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || 'ana@natala.local' : '';
