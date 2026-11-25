import { useTabActivity, type InboxNotification } from '../services/tabActivity';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/User';
import { cosmicTabColors, isCosmicPage } from '../theme/cosmic';

import { authorizedFetch, restoreAccount, signOutAccount, type AccountState } from '../services/account';
const THEME_KEY = '@natala_theme';
import { API_BASE_URL } from '../services/api';


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
  chatId?: string;
  targetUser?: string;
  targetUserId?: string;
  sharedStory?: SharedStoryData;
  draftMessage?: string;
}

interface AppContextType {
  page: string;
  tabActivity: { chat: boolean; people: boolean };
  notifications: InboxNotification[] | null;
  hasUnreadNotifications: boolean;
  notificationsUnavailable: boolean;
  setPage: (page: string, profileId?: string, returnChatId?: string) => void;
  sharedProfileId?: string;
  resumeChatId?: string;
  goBack: (fallback?: string) => boolean;
  handleBack: () => boolean;
  handleLocalBack: () => boolean;
  registerBack: (handler: () => boolean) => () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: any;
  user: UserProfile | null;
  account: AccountState | null;
  setAccount: (account: AccountState | null) => void;
  restoring: boolean;
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
  const [routes, setRoutes] = useState<{ page: string; profileId?: string; chatId?: string }[]>([{ page: 'home' }]);
  const routeHistory = useRef(routes);
  const backHandlers = useRef(new Set<() => boolean>());
  const { page, profileId: sharedProfileId, chatId: resumeChatId } = routes[routes.length - 1];
  const updateRoutes = useCallback((next: typeof routes) => {
    routeHistory.current = next;
    setRoutes(next);
  }, []);
  const setPage = useCallback((next: string, profileId?: string, returnChatId?: string) => {
    const history = routeHistory.current;
    const current = history[history.length - 1];
    if (next === 'login' || current.page === 'login') {
      updateRoutes([{ page: next, profileId }]);
    } else if (next !== current.page || profileId !== current.profileId) {
      const previous = returnChatId && current.page === 'chat'
        ? [...history.slice(0, -1), { ...current, chatId: returnChatId }] : history;
      updateRoutes([...previous.slice(-49), { page: next, profileId }]);
    }
  }, [updateRoutes]);
  const goBack = useCallback((fallback?: string) => {
    const history = routeHistory.current;
    if (history.length > 1) {
      updateRoutes(history.slice(0, -1));
      return true;
    }
    if (fallback && fallback !== history[0].page) {
      updateRoutes([{ page: fallback }]);
      return true;
    }
    return false;
  }, [updateRoutes]);
  const registerBack = useCallback((handler: () => boolean) => {
    backHandlers.current.add(handler);
    return () => { backHandlers.current.delete(handler); };
  }, []);
  const handleLocalBack = useCallback(() => {
    for (const handler of [...backHandlers.current].reverse()) {
      if (handler()) return true;
    }
    return false;
  }, []);
  const handleBack = useCallback(() => handleLocalBack() || goBack(), [handleLocalBack, goBack]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [restoring, setRestoring] = useState(true);
  const { tabActivity, notifications, notificationsUnavailable, hasUnreadNotifications } = useTabActivity(user?.email, page);
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

  const colors = isCosmicPage(page === 'subscription' ? 'profile' : page) ? cosmicTabColors[theme] : {
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
      const response = await authorizedFetch(`${API_BASE_URL}/stories/active`);
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Грешка при извличане на сторита от MongoDB:', err);
    }
  };

  useEffect(() => {
    let active = true;
    void restoreAccount().then((result) => {
      if (!active || !result) return;
      setUserState(result.user);
      setAccount(result);
    }).catch(() => {}).finally(() => {
      if (active) setRestoring(false);
    });
    void AsyncStorage.removeItem('@natala_active_user_session').catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user?.email) void fetchActiveStories();
  }, [user?.email]);

  const setUser = setUserState;

  const logout = async () => {
    await signOutAccount().catch(() => {});
    setUser(null);
    setAccount(null);
    setStories([]);
    setSelectedChat(null);
    setHideBottomNav(false);
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

      const response = await authorizedFetch(`${API_BASE_URL}/stories/upload-base64`, {
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
      const response = await authorizedFetch(`${API_BASE_URL}/stories/${id}`, {
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
      const startRes = await authorizedFetch(`${API_BASE_URL}/chats/start`, {
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
        await authorizedFetch(`${API_BASE_URL}/chats/${chatData.id}/messages`, {
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
      const response = await authorizedFetch(`${API_BASE_URL}/stories/${storyId}/like`, {
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
        sharedProfileId,
        resumeChatId,
        goBack,
        handleBack,
        handleLocalBack,
        registerBack,
        tabActivity,
        notifications,
        notificationsUnavailable,
        hasUnreadNotifications,
        theme,
        toggleTheme,
        colors,
        user,
        setUser,
        logout,
        account,
        setAccount,
        restoring,
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
