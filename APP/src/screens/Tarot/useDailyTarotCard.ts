import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../services/apiBase';
import { getDeck } from './tarot.data';
import type { TarotCardData } from './tarot.types';

const deck = getDeck(true);
const pendingDraws = new Map<string, Promise<TarotCardData>>();
const localDay = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');

async function loadCard(key: string, date: string) {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;
  try {
    const saved = JSON.parse(value);
    return saved?.date === date ? deck.find(({ id }) => id === saved.id) ?? null : null;
  } catch {
    return null;
  }
}

function drawCard(key: string, date: string) {
  const existing = pendingDraws.get(key);
  if (existing) return existing;
  const draw = (async () => {
    const saved = await loadCard(key, date);
    if (saved) return saved;
    const card = deck[Math.floor(Math.random() * deck.length)];
    await AsyncStorage.setItem(key, JSON.stringify({ date, id: card.id }));
    return card;
  })();
  pendingDraws.set(key, draw);
  const clear = () => { if (pendingDraws.get(key) === draw) pendingDraws.delete(key); };
  void draw.then(clear, clear);
  return draw;
}

export function useDailyTarotCard(email?: string) {
  const [date, setDate] = useState(() => localDay(new Date()));
  const [saved, setSaved] = useState<{ key: string; date: string; card: TarotCardData | null } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');
  const key = email ? `natala:system:${email.trim().toLowerCase()}:tarot-daily:${API_BASE_URL}` : '';
  const current = saved?.key === key && saved.date === date ? saved : null;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refreshDate = () => {
      clearTimeout(timer);
      const now = new Date();
      setDate(localDay(now));
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refreshDate, midnight.getTime() - now.getTime() + 25);
    };
    refreshDate();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refreshDate(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);

  useEffect(() => {
    setError('');
    if (!key) return;
    let active = true;
    void (async () => {
      try {
        await pendingDraws.get(key);
        const card = await loadCard(key, date);
        if (active) setSaved({ key, date, card });
      } catch {
        if (active) {
          setSaved({ key, date, card: null });
          setError('Could not load today’s card. Tap the card to try again.');
        }
      }
    })();
    return () => { active = false; };
  }, [key, date]);

  const draw = async () => {
    if (!key || !current || current.card || drawing) return null;
    const today = localDay(new Date());
    if (today !== date) { setDate(today); return null; }
    setDrawing(true);
    setError('');
    try {
      const card = await drawCard(key, date);
      if (localDay(new Date()) !== date) return null;
      setSaved({ key, date, card });
      return card;
    } catch {
      setError('Could not save today’s card. Tap again to retry.');
      return null;
    } finally {
      setDrawing(false);
    }
  };

  return { card: current?.card ?? null, busy: !current || drawing, error, draw };
}
