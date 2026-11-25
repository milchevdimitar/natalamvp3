import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorizedFetch } from './account';
import { API_BASE_URL } from './apiBase';

const tabs = ['chat', 'people'] as const;
type Tab = typeof tabs[number];
export type InboxNotification = {
  id: string;
  kind: 'chat' | 'request' | 'friend' | 'match' | 'mirror_invited' | 'mirror_revealed' | 'memory_proposed' | 'memory_saved';
  title: string;
  body: string;
  date?: string;
  chatId?: string;
  mirrorId?: string;
  friendId?: string;
};
type Activity = Record<Tab, string[]> & { notifications?: InboxNotification[] };

function legacyNotifications(snapshot: Activity): InboxNotification[] {
  return [
    ...snapshot.chat.map((id): InboxNotification => ({ id, kind: 'chat', title: 'Message', body: 'Open Messages to see the conversation.' })),
    ...snapshot.people.map((id): InboxNotification => id.startsWith('request:')
      ? { id, kind: 'request', title: 'Connection request', body: 'Someone wants to connect with you.' }
      : { id, kind: 'friend', title: 'New connection', body: 'View your connections in People.' }),
  ];
}
const empty = (): Activity => ({ chat: [], people: [] });

export function useTabActivity(email: string | undefined, page: string) {
  const currentTab = page === 'shared-profile' ? 'people' : page;
  const openTab = useRef(currentTab);
  openTab.current = currentTab;
  const refresh = useRef<() => void>(() => {});
  const [unread, setUnread] = useState({ chat: false, people: false });

  const [notifications, setNotifications] = useState<InboxNotification[] | null>(null);
  const [notificationsUnavailable, setNotificationsUnavailable] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    setUnread({ chat: false, people: false });
    setNotifications(null);
    setNotificationsUnavailable(false);
    setHasUnreadNotifications(false);
    if (!email) return;
    const storageKey = `natala:tab-activity:${API_BASE_URL}:${email.toLowerCase()}`;
    let active = true;
    let known = empty();
    let latest: Activity | undefined;
    let seenInbox: string[] = [];
    const inboxKey = storageKey + ':inbox';
    let controller: AbortController | undefined;
    let ready = false;
    let initialized = false;
    const syncDots = () => {
      if (!active || !latest) return;
      const inbox = latest.notifications ?? legacyNotifications(latest);
      setNotifications(inbox);
      if (openTab.current === 'notifications') {
        const currentIds = inbox.map(({ id }) => id);
        if (currentIds.length !== seenInbox.length || currentIds.some((id) => !seenInbox.includes(id))) {
          seenInbox = currentIds;
          void AsyncStorage.setItem(inboxKey, JSON.stringify(seenInbox)).catch(() => {});
        }
      }
      setHasUnreadNotifications(inbox.some(({ id }) => !seenInbox.includes(id)));
      const tab = tabs.find((value) => value === openTab.current);
      const nextKnown = {
        chat: tab === 'chat' ? latest.chat : known.chat.filter((id) => latest?.chat.includes(id)),
        people: tab === 'people' ? latest.people : known.people.filter((id) => latest?.people.includes(id)),
      };
      if (tabs.some((value) => nextKnown[value].length !== known[value].length ||
          nextKnown[value].some((id) => !known[value].includes(id)))) {
        known = nextKnown;
        void AsyncStorage.setItem(storageKey, JSON.stringify(known)).catch(() => {});
      }
      const next = {
        chat: openTab.current !== 'chat' && latest.chat.some((id) => !known.chat.includes(id)),
        people: openTab.current !== 'people' && latest.people.some((id) => !known.people.includes(id)),
      };
      setUnread((previous) => previous.chat === next.chat && previous.people === next.people ? previous : next);
    };
    const poll = async () => {
      if (!active || !ready || controller || (AppState.currentState && AppState.currentState !== 'active')) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 7000);
      try {
        const response = await authorizedFetch(`${API_BASE_URL}/account/tab-activity`, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load activity');
        if (active) {
          setNotificationsUnavailable(false);
          const snapshot: Activity = await response.json();
          if (!active) return;
          latest = snapshot;
          if (!initialized) {
            initialized = true;
            known = { chat: snapshot.chat, people: snapshot.people.filter((id) => id.startsWith('friend:')) };
            void AsyncStorage.setItem(storageKey, JSON.stringify(known)).catch(() => {});
          }
          syncDots();
        }
      } catch {
        if (active) setNotificationsUnavailable(true);
      } finally {
        clearTimeout(timeout);
        controller = undefined;
      }
    };
    refresh.current = () => { syncDots(); void poll(); };
    void Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(inboxKey)]).then(([value, savedInbox]) => {
      if (savedInbox) {
        const parsed = JSON.parse(savedInbox);
        if (Array.isArray(parsed)) seenInbox = parsed.filter((id) => typeof id === 'string');
      }
      if (!value) return;
      const saved = JSON.parse(value) as Activity;
      initialized = tabs.every((tab) => Array.isArray(saved[tab]));
      if (initialized) known = saved;
    }).catch(() => {}).finally(() => { ready = true; void poll(); });
    const interval = setInterval(() => { void poll(); }, 12000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void poll();
    });
    return () => {
      active = false;
      controller?.abort();
      clearInterval(interval);
      listener.remove();
      refresh.current = () => {};
    };
  }, [email]);

  useEffect(() => { refresh.current(); }, [currentTab]);
  return { notifications, notificationsUnavailable, hasUnreadNotifications, tabActivity: { chat: currentTab !== 'chat' && unread.chat, people: currentTab !== 'people' && unread.people } };
}
