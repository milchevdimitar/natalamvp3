import { authorizedFetch } from '../../services/account';
import { API_BASE_URL } from '../../services/apiBase';

export type DatingSettings = {
  enabled: boolean; bio: string; prompt: string; city: string; interests: string[];
  preference: 'any' | 'female' | 'male' | 'other'; minAge: number; maxAge: number;
};
export type DatingPerson = {
  id: string; name: string; age: number; city?: string; photo?: string;
  bio: string; prompt: string; interests: string[]; shared: string[]; sharedMoon?: string;
};
type DatingHub = { eligible: boolean; hasPhoto: boolean; settings: DatingSettings; discover: DatingPerson[]; matches: DatingPerson[] };

async function datingRequest<T>(path = '', method = 'GET', payload?: object): Promise<T> {
  const response = await authorizedFetch(API_BASE_URL + '/people/dating' + path, {
    method, headers: { 'Content-Type': 'application/json' }, ...(payload && { body: JSON.stringify(payload) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Dating is currently unavailable.');
  return data;
}
export const getDating = () => datingRequest<DatingHub>();
export const saveDating = (settings: DatingSettings | { enabled: false }) => datingRequest('', 'PUT', settings);
export const datingAction = (id: string, action: 'like' | 'pass' | 'chat' | 'block' | 'report' | 'unmatch') =>
  datingRequest<{ chatId?: string; match?: DatingPerson }>(`/${encodeURIComponent(id)}/action`, 'POST', { action });
