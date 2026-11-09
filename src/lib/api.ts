import { Platform } from 'react-native';
import { API_URL } from './config';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from './tokenStore';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

// The short-lived access token lives only in memory; the refresh token in secure storage.
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

type AuthListener = (signedIn: boolean) => void;
const listeners = new Set<AuthListener>();
export function onAuthChange(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function send(path: string, method: string, body: unknown, token: string | null) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(API_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function store(session: Session) {
  const wasSignedIn = accessToken !== null;
  accessToken = session.accessToken;
  await setRefreshToken(session.refreshToken);
  if (!wasSignedIn) listeners.forEach((l) => l(true));
}

async function forget() {
  accessToken = null;
  await clearRefreshToken();
  listeners.forEach((l) => l(false));
}

/**
 * Gets a new access token with the stored refresh token. Concurrent callers
 * share one request: the server rotates refresh tokens, so two parallel
 * refreshes with the same token would log the user out.
 */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    const res = await send('/auth/refresh', 'POST', { refreshToken }, null);
    if (res.status === 401) {
      await forget();
      return false;
    }
    if (!res.ok) throw new ApiError(res.status, 'Could not refresh the session');
    await store(await res.json());
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** On app start: resume the previous session if a refresh token is stored. */
export function restoreSession(): Promise<boolean> {
  return refresh();
}

/** Development only: sign in as a seeded test user (see backend/db/seeds). */
export async function devLogin(email: string): Promise<void> {
  const res = await send('/auth/dev', 'POST', { email, platform: Platform.OS === 'web' ? 'web' : Platform.OS }, null);
  if (!res.ok) throw new ApiError(res.status, `Dev login failed (${res.status})`);
  await store(await res.json());
}

export async function signOut(): Promise<void> {
  const refreshToken = await getRefreshToken();
  await forget();
  if (refreshToken) send('/auth/logout', 'POST', { refreshToken }, null).catch(() => {});
}

/** Calls the Natala API as the signed-in user; refreshes the token once on 401. */
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? 'GET';
  let res = await send(path, method, options.body, accessToken);
  if (res.status === 401 && (await refresh())) {
    res = await send(path, method, options.body, accessToken);
  }
  if (!res.ok) {
    let body: { message?: string } | undefined;
    try {
      body = await res.json();
    } catch {
      // empty or non-JSON error body
    }
    throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
