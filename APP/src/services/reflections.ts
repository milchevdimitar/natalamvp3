import { authorizedFetch } from './account';
import { API_BASE_URL } from './apiBase';

export type ReflectionEntry = {
  date: string;
  prompt: { id: string; version: number; title: string; question: string; options: string[]; reason: string };
  answer: number | null;
};

export async function getReflections(cursor?: string, signal?: AbortSignal): Promise<{ entries: ReflectionEntry[]; nextCursor: string | null }> {
  const query = cursor ? '?cursor=' + encodeURIComponent(cursor) : '';
  const response = await authorizedFetch(API_BASE_URL + '/me/reflections' + query, { signal });
  if (!response.ok) throw new Error('Could not load reflections.');
  return response.json();
}
