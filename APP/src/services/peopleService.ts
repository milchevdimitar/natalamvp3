import { API_BASE_URL } from './api';
import { PersonProfile } from '../screens/People/people.types';

const BASE_URL = API_BASE_URL;

export type SharedProfile = {
  avatarUrl?: string;
  id: string;
  name: string;
  bio?: string;
  interests?: string[];
  relationship: 'self' | 'friend' | 'pending' | 'available';
  chatEmail?: string;
  stories: { id: string; imageUrl: string; createdAt: string }[];
};

export async function fetchSharedProfile(user: any, id: string): Promise<SharedProfile> {
  const { userId, email } = getAuthPayload(user);
  const query = new URLSearchParams({ userId: String(userId), email: String(email) });
  const response = await fetch(`${BASE_URL}/people/shared/${encodeURIComponent(id)}?${query}`);
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) throw new Error(result?.message || 'Could not load this profile.');
  return result.profile;
}

export interface PeopleHubResponse {
  success: boolean;
  myCosmicId: string;
  friends: PersonProfile[];
  incomingRequests: PersonProfile[];
  requestedIds: string[];
  potentialMatches: PersonProfile[];
  discover: PersonProfile[];
  rankedOnServer?: boolean;
  message?: string;
}

function getAuthPayload(user: any) {
  return {
    userId: user?._id || user?.id || '',
    email: user?.email || '',
  };
}

export async function fetchPeopleHub(user: any): Promise<PeopleHubResponse> {
  const { userId, email } = getAuthPayload(user);
  const params = new URLSearchParams();
  if (userId) params.append('userId', String(userId));
  if (email) params.append('email', String(email));

  const res = await fetch(`${BASE_URL}/people/hub?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load people');
  }
  return data;
}

export async function likeOrRequestPerson(
  user: any,
  targetId: string
): Promise<{ success: boolean; matched: boolean; person?: PersonProfile }> {
  const res = await fetch(`${BASE_URL}/people/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to connect');
  }
  return data;
}

export async function cancelConnectionRequest(user: any, targetId: string) {
  const res = await fetch(`${BASE_URL}/people/cancel-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId }),
  });
  return res.json();
}

export async function acceptConnectionRequest(
  user: any,
  targetId: string
): Promise<{ success: boolean; person?: PersonProfile }> {
  const res = await fetch(`${BASE_URL}/people/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to accept request');
  }
  return data;
}

export async function declineConnectionRequest(user: any, targetId: string) {
  const res = await fetch(`${BASE_URL}/people/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId }),
  });
  return res.json();
}

export async function skipMatchPerson(
  user: any,
  targetId: string,
  undo = false
) {
  const res = await fetch(`${BASE_URL}/people/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId, undo }),
  });
  return res.json();
}

export async function removeFriendPerson(user: any, targetId: string) {
  const res = await fetch(`${BASE_URL}/people/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), targetId }),
  });
  return res.json();
}

export async function connectByCosmicCode(
  user: any,
  codeOrEmail: string
): Promise<{
  success: boolean;
  matched?: boolean;
  alreadyFriend?: boolean;
  person?: PersonProfile;
  message?: string;
}> {
  const res = await fetch(`${BASE_URL}/people/connect-by-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...getAuthPayload(user), codeOrEmail }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'User not found');
  }
  return data;
}
