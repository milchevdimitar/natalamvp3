import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { UserProfile } from '../models/User';

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

export const API_BASE_URL = getBaseUrl();
export const API_URL = API_BASE_URL;

/**
 * Проверка на връзката между мобилното приложение, Express бекенда и MongoDB Atlas
 */
export async function checkHealth(): Promise<{
  success: boolean;
  dbConnected: boolean;
  status: string;
  databaseName?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Healthcheck провали се със статус: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`API Warning [checkHealth]: Няма връзка с бекенд сървъра на ${API_BASE_URL}`);
    return { success: false, dbConnected: false, status: 'offline' };
  }
}

/**
 * Изпраща имейл (и незадължително име) за вход или автоматично създаване на профил
 */
export async function loginUser(
  email: string,
  name?: string
): Promise<{ success: boolean; user: UserProfile }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name?.trim(),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Грешка при вход: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [loginUser]:', error);
    throw error;
  }
}

/**
 * Изпраща пълния изчислен профил (MBTI, Аюрведа, Нумерология, Cardology) за синхронизация в MongoDB Atlas
 */
export async function saveUserProfile(
  userData: Partial<UserProfile> & { email: string }
): Promise<{ success: boolean; user: UserProfile }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Грешка при запис на профил: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Профилът е синхронизиран успешно в MongoDB Atlas:', data.user?.email);
    return data;
  } catch (error) {
    console.error('API Error [saveUserProfile]:', error);
    throw error;
  }
}

/**
 * Извлича запис на потребителския профил от MongoDB Atlas по имейл
 */
export async function getUserProfile(
  email: string
): Promise<{ success: boolean; user: UserProfile }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/profile/${encodeURIComponent(email.toLowerCase().trim())}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Грешка при извличане: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [getUserProfile]:', error);
    throw error;
  }
}

/**
 * Запазва отделни четения или диагностични резултати (Таро, Натални карти и др.) в историята
 */
export async function saveReadingHistory(readingData: {
  userId: string;
  type: 'tarot' | 'astrology' | 'cardology' | 'ayurveda' | 'numerology' | 'mbti';
  title: string;
  resultData: any;
}): Promise<{ success: boolean; reading: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(readingData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Грешка при запис на история: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [saveReadingHistory]:', error);
    throw error;
  }
}

/**
 * Извлича всички активни разговори за даден потребител
 */
export async function fetchUserConversations(userEmail: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chats?email=${encodeURIComponent(userEmail.toLowerCase().trim())}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch chats with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API Warning [fetchUserConversations]: Няма връзка с бекенда.', error);
    return [];
  }
}

/**
 * Проверява за съществуващ потребител и стартира/взима разговор по имейл
 */
export async function createOrGetConversation(
  userEmail: string,
  partnerEmail: string
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: userEmail.toLowerCase().trim(),
        partnerEmail: partnerEmail.toLowerCase().trim(),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.message || errData.error || 'Потребителят с този имейл не бе открит.'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [createOrGetConversation]:', error);
    throw error;
  }
}

/**
 * Изпраща ново съобщение в конкретен чат (с поддръжка за тип съобщение и прикачено стори)
 */
export async function sendMessageApi(
  chatId: string,
  senderEmail: string,
  text: string,
  type: string = 'text',
  storyData?: { storyId?: string; imageUrl?: string; authorName?: string },
  replyTo?: { messageId: string; text: string; senderEmail: string }
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderEmail: senderEmail.toLowerCase().trim(),
        text: text.trim(),
        type,
        storyData,
        replyTo,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Грешка при изпращане на съобщението.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [sendMessageApi]:', error);
    throw error;
  }
}

/**
 * Взима списъка с нови съобщения за конкретен чат (за Polling / Real-time updates)
 */
export async function fetchChatMessages(chatId: string): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
    if (!response.ok) {
      throw new Error(`Failed to fetch messages for chat ${chatId}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API Warning [fetchChatMessages]: Няма връзка с бекенда.', error);
    return null;
  }
}
