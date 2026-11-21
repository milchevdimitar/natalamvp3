import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/User';
import { cosmicTabColors, isCosmicPage } from '../theme/cosmic';

const SESSION_KEY = '@natala_active_user_session';
const THEME_KEY = '@natala_theme';
import { API_BASE_URL as API_URL } from '../services/api';

const API_BASE_URL = API_URL.replace(/\/api$/, '');

export interface AppStory {
  _id: string;
  userId: string;
  authorName: string;
  imageUrl: string;
  createdAt: string;
  likes?: string[];
  likesCount?: number;
}

export interface SharedStoryData {
  id: string;
  imageUrl: string;
  authorName: string;
}

export interface SelectedChatData {
  targetUser?: string;
  targetUserId?: string;
  sharedStory?: SharedStoryData;
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
  hideBottomNav: boolean;
  setHideBottomNav: (hide: boolean) => void;
  
  // Чат и взаимодействия със сторита
  selectedChat: SelectedChatData | null;
  setSelectedChat: (chat: SelectedChatData | null) => void;
  sendStoryReply: (storyId: string, authorEmail: string, text: string, storyImageUrl: string) => Promise<void>;
  toggleStoryLike: (storyId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<AppStory[]>([]);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [selectedChat, setSelectedChat] = useState<SelectedChatData | null>(null);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (active && (saved === 'light' || saved === 'dark')) setTheme(saved);
    }).catch(() => undefined).finally(() => {
      if (active) setThemeLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (themeLoaded) void AsyncStorage.setItem(THEME_KEY, theme).catch(() => undefined);
  }, [theme, themeLoaded]);

  const colors = isCosmicPage(page) ? cosmicTabColors[theme] : {
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

  const addStory = async (imageBase64: string) => {
    try {
      if (!imageBase64) {
        console.error('Грешка: Липсват base64 данни за снимката.');
        return;
      }

      const userIdVal = String(user?.email || user?.name || 'guest_id').toLowerCase().trim();
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

  // Изпращане на коментар / отговор на стори през чат рутовете
  const sendStoryReply = async (
    storyId: string,
    authorEmail: string,
    text: string,
    storyImageUrl: string
  ) => {
    try {
      const senderEmail = user?.email || '';
      if (!senderEmail || !authorEmail) {
        console.warn('Липсва имейл на изпращача или автора');
        return;
      }

      // 1. Старт / Намиране на съществуващ чат с автора
      const startRes = await fetch(`${API_BASE_URL}/api/chats/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: senderEmail,
          partnerEmail: authorEmail,
        }),
      });

      if (!startRes.ok) {
        console.warn('Не бе намерен/създаден чат с автора');
        return;
      }

      const chatData = await startRes.json();

      if (chatData?.id) {
        // 2. Публикуване на съобщението с отговор на сторито
        await fetch(`${API_BASE_URL}/api/chats/${chatData.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail,
            text: text || '💬 Отговор на стори',
            type: 'story_reply',
            storyData: {
              storyId,
              imageUrl: storyImageUrl,
            },
          }),
        });
      }
    } catch (err) {
      console.error('Грешка при изпращане на отговор на стори:', err);
    }
  };

  // Запазване и превключване на Like в MongoDB с моментално оптимистично обновяване
  const toggleStoryLike = async (storyId: string) => {
    try {
      const userIdVal = String(user?.email || user?.name || 'guest_id').toLowerCase().trim();

      // 1. Оптимистичен ъпдейт на UI състоянието
      setStories((prevStories) =>
        prevStories.map((story) => {
          if (story._id === storyId) {
            const currentLikes = (story.likes || []).map((id) => String(id).toLowerCase().trim());
            const hasLiked = currentLikes.includes(userIdVal);
            const updatedLikes = hasLiked
              ? currentLikes.filter((id) => id !== userIdVal)
              : [...currentLikes, userIdVal];
            return { ...story, likes: updatedLikes };
          }
          return story;
        })
      );

      // 2. Изпращане на заявка към MongoDB бекенда
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdVal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.likes) {
          setStories((prev) =>
            prev.map((s) => (s._id === storyId ? { ...s, likes: data.likes } : s))
          );
        }
      }
    } catch (err) {
      console.error('Грешка при изпращане на like към MongoDB:', err);
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
        hideBottomNav,
        setHideBottomNav,
        selectedChat,
        setSelectedChat,
        sendStoryReply,
        toggleStoryLike,
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
