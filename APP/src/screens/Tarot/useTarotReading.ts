import { useState, useRef, type ComponentRef } from 'react';
import { View, Alert } from 'react-native';
import { captureStory } from '../../components/StoryCanvas';
import { useDailyTarotCard } from './useDailyTarotCard';
import { getDeck } from './tarot.data';
import { API_BASE_URL } from '../../services/apiBase';
import { TarotCardData, TarotMode } from './tarot.types';

export const SPREAD_MAX_ROWS = 3;
export const SPREAD_MAX_COLUMNS = 4;
export const MAX_CLARIFIERS = 3;
export type SpreadLayout = { rows: number; columns: number };

type SpreadReading = {
  layout: SpreadLayout;
  question: string;
  useFullDeck: boolean;
  cards: TarotCardData[];
  bottomCard: TarotCardData;
  remainingDeck: TarotCardData[];
  revealed: Record<number, boolean>;
  clarifiers: Record<number, TarotCardData[]>;
};

// The Tarot screen unmounts when navigating away. Keep each account's spread
// together so reopening it restores the cards, reveals and remaining deck.
const spreads = new Map<string, SpreadReading>();
const emptyCards: TarotCardData[] = [];
const defaultLayout = { rows: 1, columns: 3 };

export function useTarotReading(
  addStory: (base64Image: string) => Promise<void>,
  recordReading: (value: string, detail: string) => void,
  email?: string,
) {
  const key = email ? JSON.stringify([API_BASE_URL, email.trim().toLowerCase()]) : '';
  const [saved, setSaved] = useState(() => ({ key, spread: key ? spreads.get(key) : undefined }));
  const spread = saved.key === key ? saved.spread : key ? spreads.get(key) : undefined;
  const [mode, setMode] = useState<TarotMode>(() => spread ? 'spread' : 'daily');
  const [useFullDeck, setUseFullDeck] = useState(() => spread?.useFullDeck ?? true);
  const [layout, setLayout] = useState<SpreadLayout>(() => spread?.layout ?? defaultLayout);
  const [question, setQuestion] = useState(() => spread?.question ?? '');

  const tarotAltarStoryRef = useRef<ComponentRef<typeof View>>(null);
  const currentSessionSpread = useRef(saved);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shared, setShared] = useState(false);
  const getSpread = () => currentSessionSpread.current.key === key ? currentSessionSpread.current.spread : spread;
  const saveSpread = (next: SpreadReading) => {
    if (key) spreads.set(key, next);
    const state = { key, spread: next };
    currentSessionSpread.current = state;
    setSaved(state);
  };

  // Daily card mode
  const { card: dailyCard, busy: dailyBusy, error: dailyError, draw } = useDailyTarotCard(email);

  const handleShareToStory = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);

      const base64Image = await captureStory(tarotAltarStoryRef);

      await addStory(base64Image);

      setShared(true);
      if (mode === 'spread') setTimeout(() => setShared(false), 2500);
    } catch (error) {
      console.error('Грешка при заснемане или качване на снимката:', error);
      Alert.alert(
        'Грешка',
        'Не съумяхме да споделим сторито. Моля, проверете връзката си със сървъра.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDrawSpread = () => {
    const { rows, columns } = layout;
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || rows > SPREAD_MAX_ROWS ||
        columns < 1 || columns > SPREAD_MAX_COLUMNS || isCapturing) return;
    const totalNeeded = rows * columns;
    const shuffled = [...getDeck(useFullDeck)];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mainCards = shuffled.slice(0, totalNeeded);
    const bottom = shuffled[totalNeeded];
    const rest = shuffled.slice(totalNeeded + 1);

    saveSpread({
      layout,
      question: question.trim(),
      useFullDeck,
      cards: mainCards,
      bottomCard: bottom,
      remainingDeck: rest,
      revealed: {},
      clarifiers: {},
    });
    setShared(false);
  };

  const handleAddClarification = (cardIdx: number) => {
    const reading = getSpread();
    if (!reading?.cards[cardIdx] || !reading.revealed[cardIdx]) return null;
    const stack = reading.clarifiers[cardIdx] ?? [];
    const [nextCard, ...rest] = reading.remainingDeck;
    if (!nextCard || stack.length >= MAX_CLARIFIERS) return null;
    saveSpread({ ...reading, remainingDeck: rest, clarifiers: { ...reading.clarifiers, [cardIdx]: [...stack, nextCard] } });
    setShared(false);
    recordReading('Tarot spread', 'Clarifying card drawn');
    return stack.length + 1;
  };

  const revealCard = (idx: number) => {
    const reading = getSpread();
    if (!reading?.cards[idx] || reading.revealed[idx]) return;
    saveSpread({ ...reading, revealed: { ...reading.revealed, [idx]: true } });
    recordReading('Tarot spread', 'Card revealed');
  };

  const handleRevealAll = () => {
    const reading = getSpread();
    if (!reading) return;
    const revealed = Object.fromEntries(reading.cards.map((_, index) => [index, true]));
    saveSpread({ ...reading, revealed });
    recordReading('Tarot spread', reading.cards.length + ' cards revealed');
  };

  const handleDrawDaily = async () => {
    const card = await draw();
    if (!card) return;
    setShared(false);
    recordReading(card.name, 'Last daily draw');
  };

  const { rows: rCount, columns: cCount } = spread?.layout ?? defaultLayout;
  const drawnCards = spread?.cards ?? emptyCards;
  const singleCardForStory = mode === 'daily' ? dailyCard : drawnCards[0] || dailyCard;

  return {
    mode,
    setMode,
    useFullDeck,
    setUseFullDeck,
    tarotAltarStoryRef,
    isCapturing,
    shared,
    layout,
    setLayout,
    remainingCount: spread?.remainingDeck.length ?? 0,
    question,
    dealtQuestion: spread?.question ?? '',
    setQuestion,
    spreadDrawn: Boolean(spread),
    drawnCards,
    bottomCard: spread?.bottomCard ?? null,
    revealedIndices: spread?.revealed ?? {},
    clarifyingCards: spread?.clarifiers ?? {},
    dailyCard,
    dailyBusy,
    dailyError,
    rCount,
    cCount,
    singleCardForStory,
    handleShareToStory,
    handleDrawSpread,
    handleAddClarification,
    revealCard,
    handleRevealAll,
    handleDrawDaily,
  };
}
