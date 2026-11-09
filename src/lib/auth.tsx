import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { devLogin, onAuthChange, restoreSession } from './api';
import { API_URL, DEV_LOGIN_EMAIL } from './config';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'offline';

interface AuthState {
  status: AuthStatus;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Resumes the stored session on launch. In development, if there is none,
 * signs in as the seeded test user so every screen has real data right away.
 * Never blocks rendering: screens that don't need the API keep working offline.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      if (await restoreSession()) return setStatus('signedIn');
      if (DEV_LOGIN_EMAIL) {
        await devLogin(DEV_LOGIN_EMAIL);
        return setStatus('signedIn');
      }
      setStatus('signedOut');
    } catch (e) {
      setError(`Can't reach the Natala API at ${API_URL} (${e instanceof Error ? e.message : String(e)})`);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    boot();
    return onAuthChange((signedIn) => setStatus(signedIn ? 'signedIn' : 'signedOut'));
  }, [boot]);

  return <AuthContext.Provider value={{ status, error, retry: boot }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
