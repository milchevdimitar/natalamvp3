import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/User';

const SESSION_KEY = '@natala_active_user_session';
const API_BASE_URL = 'http://10.159.206.3:5000';

export interface AppStory {
  _id: string;
  userId: string;
  authorName: string;
  imageUrl: string;
  createdAt: string;
}

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
  stories: AppStory[];
  addStory: (imageBase64: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  fetchActiveStories: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<AppStory[]>([]);

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

  const fetchActiveStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/active`);
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Грешка при извличане на сторита от MongoDB:', err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const savedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (savedSession) {
          setUserState(JSON.parse(savedSession));
        }
      } catch (err) {
        console.warn('Грешка при зареждане на сесията:', err);
      }
    })();

    fetchActiveStories();
  }, []);

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

  const logout = async () => {
    await setUser(null);
    setPage('login');
  };

  const updateCurrentUserProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    const merged = { ...user, ...updatedData };
    await setUser(merged);
  };

  // Качване чрез чист Base64 JSON (100% стабилно за Expo/Hermes)
  const addStory = async (imageBase64: string) => {
    try {
      if (!imageBase64) {
        console.error('Грешка: Липсват base64 данни за снимката.');
        return;
      }

      const userIdVal = String(user?.email || user?.name || 'guest_id');
      const authorNameVal = String(user?.name || user?.email || 'Stargazer');

      const response = await fetch(`${API_BASE_URL}/api/stories/upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          userId: userIdVal,
          authorName: authorNameVal,
        }),
      });

      if (response.ok) {
        const savedStory: AppStory = await response.json();
        setStories((prev) => [savedStory, ...prev]);
      } else {
        const errText = await response.text();
        console.error('Грешка от сървъра при качване на стори:', response.status, errText);
      }
    } catch (error) {
      console.error('Грешка при запис в MongoDB:', error);
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStories((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error('Грешка при изтриване на сторито:', err);
    }
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
        stories,
        addStory,
        deleteStory,
        fetchActiveStories,
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