import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/User';

const SESSION_KEY = '@natala_active_user_session';

interface AppContextType {
  page: string;
  setPage: (page: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: any;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
  updateCurrentUserProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUserState] = useState<UserProfile | null>(null);

  const colors = {
    bg: theme === 'dark' ? '#0F0D15' : '#F7F6FB',
    surface: theme === 'dark' ? '#1A1726' : '#FFFFFF',
    surfaceAlt: theme === 'dark' ? '#252136' : '#F0EEF8',
    purple: '#A855F7',
    purpleSoft: 'rgba(168, 85, 247, 0.15)',
    gold: '#EAB308',
    line: theme === 'dark' ? '#2E2942' : '#E2E0EC',
    text: theme === 'dark' ? '#F3F0FF' : '#1E1B2E',
    muted: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  };

  // 1. При старт зареждаме запазената сесия от AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const savedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          setUserState(parsedUser);
        }
      } catch (err) {
        console.warn('Грешка при зареждане на сесията:', err);
      }
    })();
  }, []);

  // 2. Функция за задаване на нов потребител и запис в AsyncStorage
  const setUser = async (newUser: UserProfile | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } catch (err) {
      console.error('Грешка при запис на сесията:', err);
    }
  };

  // 3. Изход от профила
  const logout = async () => {
    await setUser(null);
    setPage('login');
  };

  // 4. Помощен метод за частично обновяване на текущия профил
  const updateCurrentUserProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    const merged = { ...user, ...updatedData };
    await setUser(merged);
  };

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <AppContext.Provider
      value={{
        page,
        setPage,
        theme,
        toggleTheme,
        colors,
        user,
        setUser,
        logout,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}