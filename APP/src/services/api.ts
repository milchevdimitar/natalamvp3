import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { UserProfile } from '../models/User';

const getBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  const hostIp = hostUri ? hostUri.split(':')[0] : null;

  if (hostIp) {
    return `http://${hostIp}:5000/api`;
  }

  const FALLBACK_IP = '10.159.206.3';

  return (
    Platform.select({
      android: `http://${FALLBACK_IP}:5000/api`,
      ios: `http://${FALLBACK_IP}:5000/api`,
      default: 'http://localhost:5000/api',
    }) || `http://localhost:5000/api`
  );
};

const API_BASE_URL = getBaseUrl();

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
  userData: UserProfile
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