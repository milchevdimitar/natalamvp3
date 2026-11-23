import { useState, useRef, type ComponentRef } from 'react';
import { View, Alert } from 'react-native';
import { captureStory } from '../../components/StoryCanvas';
import { useDailyTarotCard } from './useDailyTarotCard';
import { getDeck } from './tarot.data';
import { TarotCardData, TarotMode } from './tarot.types';

export const SPREAD_MAX_ROWS = 3;
export const SPREAD_MAX_COLUMNS = 4;
export const MAX_CLARIFIERS = 3;
export type SpreadLayout = { rows: number; columns: number };

export function useTarotReading(
  addStory: (base64Image: string) => Promise<void>,
  recordReading: (value: string, detail: string) => void,
  email?: string,
) {
  const [mode, setMode] = useState<TarotMode>('daily');
  const [useFullDeck, setUseFullDeck] = useState(true);

  const tarotAltarStoryRef = useRef<ComponentRef<typeof View>>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shared, setShared] = useState(false);

  const [layout, setLayout] = useState<SpreadLayout>({ rows: 1, columns: 3 });
  const [dealtLayout, setDealtLayout] = useState<SpreadLayout>(layout);
  const [question, setQuestion] = useState('');
  const [dealtQuestion, setDealtQuestion] = useState('');

  const [spreadDrawn, setSpreadDrawn] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCardData[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const remainingDeck = useRef<TarotCardData[]>([]);
  const clarifierCounts = useRef<Record<number, number>>({});
  const [bottomCard, setBottomCard] = useState<TarotCardData | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [clarifyingCards, setClarifyingCards] = useState<Record<number, TarotCardData[]>>({});

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

    setDrawnCards(mainCards);
    setBottomCard(bottom);
    remainingDeck.current = rest;
    setRemainingCount(rest.length);
    setDealtLayout(layout);
    setDealtQuestion(question.trim());
    clarifierCounts.current = {};
    setShared(false);
    setRevealedIndices({});
    setClarifyingCards({});
    setSpreadDrawn(true);
  };

  const handleAddClarification = (cardIdx: number) => {
    const count = clarifierCounts.current[cardIdx] ?? 0;
    if (!drawnCards[cardIdx] || !revealedIndices[cardIdx] || count >= MAX_CLARIFIERS) return null;
    const nextCard = remainingDeck.current.shift();
    if (!nextCard) return null;
    clarifierCounts.current[cardIdx] = count + 1;
    setRemainingCount(remainingDeck.current.length);
    setClarifyingCards((prev) => ({ ...prev, [cardIdx]: [...(prev[cardIdx] || []), nextCard] }));
    setShared(false);
    recordReading('Tarot spread', 'Clarifying card drawn');
    return count + 1;
  };

  const revealCard = (idx: number) => {
    if (!drawnCards[idx] || revealedIndices[idx]) return;
    setRevealedIndices((prev) => ({ ...prev, [idx]: true }));
    recordReading('Tarot spread', 'Card revealed');
  };

  const handleRevealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    drawnCards.forEach((_, i) => {
      allRevealed[i] = true;
    });
    setRevealedIndices(allRevealed);
    if (drawnCards.length) recordReading('Tarot spread', drawnCards.length + ' cards revealed');
  };

  const handleDrawDaily = async () => {
    const card = await draw();
    if (!card) return;
    setShared(false);
    recordReading(card.name, 'Last daily draw');
  };

  const { rows: rCount, columns: cCount } = dealtLayout;
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
    remainingCount,
    question,
    dealtQuestion,
    setQuestion,
    spreadDrawn,
    drawnCards,
    bottomCard,
    revealedIndices,
    clarifyingCards,
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
