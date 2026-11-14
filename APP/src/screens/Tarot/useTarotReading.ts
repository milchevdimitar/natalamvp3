import { useState, useRef } from 'react';
import { View, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { getDeck } from './tarot.data';
import { TarotCardData, TarotMode } from './tarot.types';

export function useTarotReading(addStory: (base64Image: string) => Promise<void>) {
  const [mode, setMode] = useState<TarotMode>('daily');
  const [useFullDeck, setUseFullDeck] = useState(true);

  const tarotAltarStoryRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shared, setShared] = useState(false);

  // Spread configuration
  const [rowsInput, setRowsInput] = useState('3');
  const [colsInput, setColsInput] = useState('3');
  const [question, setQuestion] = useState('');

  const [spreadDrawn, setSpreadDrawn] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCardData[]>([]);
  const [remainingDeck, setRemainingDeck] = useState<TarotCardData[]>([]);
  const [bottomCard, setBottomCard] = useState<TarotCardData | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [clarifyingCards, setClarifyingCards] = useState<Record<number, TarotCardData[]>>({});

  // Daily card mode
  const [dailyDrawn, setDailyDrawn] = useState(false);
  const [dailyCard, setDailyCard] = useState<TarotCardData | null>(null);

  const handleShareToStory = async () => {
    try {
      setIsCapturing(true);

      const base64Image = await captureRef(tarotAltarStoryRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      await addStory(base64Image);

      setShared(true);
      setTimeout(() => setShared(false), 2500);
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
    const rows = parseInt(rowsInput, 10) || 1;
    const cols = parseInt(colsInput, 10) || 1;
    const totalNeeded = rows * cols;

    const currentDeck = getDeck(useFullDeck);

    if (totalNeeded < 1 || totalNeeded >= currentDeck.length) {
      Alert.alert(
        'Selection Error',
        `Please enter a card count between 1 and ${currentDeck.length - 1}!`
      );
      return;
    }

    const shuffled = [...currentDeck].sort(() => Math.random() - 0.5);

    const mainCards = shuffled.slice(0, totalNeeded);
    const bottom = shuffled[totalNeeded];
    const rest = shuffled.slice(totalNeeded + 1);

    setDrawnCards(mainCards);
    setBottomCard(bottom);
    setRemainingDeck(rest);
    setRevealedIndices({});
    setClarifyingCards({});
    setSpreadDrawn(true);
  };

  const handleAddClarification = (cardIdx: number) => {
    if (remainingDeck.length === 0) {
      Alert.alert('Empty Deck', 'No more cards available in the deck!');
      return;
    }

    const nextCard = remainingDeck[0];
    const newRest = remainingDeck.slice(1);

    setRemainingDeck(newRest);
    setClarifyingCards((prev) => ({
      ...prev,
      [cardIdx]: [...(prev[cardIdx] || []), nextCard],
    }));

    setRevealedIndices((prev) => ({ ...prev, [cardIdx]: true }));
  };

  const toggleRevealCard = (idx: number) => {
    setRevealedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleRevealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    drawnCards.forEach((_, i) => {
      allRevealed[i] = true;
    });
    setRevealedIndices(allRevealed);
  };

  const handleDrawDaily = () => {
    const currentDeck = getDeck(useFullDeck);
    const randomCard = currentDeck[Math.floor(Math.random() * currentDeck.length)];
    setDailyCard(randomCard);
    setDailyDrawn(true);
  };

  const rCount = parseInt(rowsInput, 10) || 1;
  const cCount = parseInt(colsInput, 10) || 1;
  const singleCardForStory = mode === 'daily' ? dailyCard : drawnCards[0] || dailyCard;

  return {
    mode,
    setMode,
    useFullDeck,
    setUseFullDeck,
    tarotAltarStoryRef,
    isCapturing,
    shared,
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    question,
    setQuestion,
    spreadDrawn,
    drawnCards,
    bottomCard,
    revealedIndices,
    clarifyingCards,
    dailyDrawn,
    dailyCard,
    rCount,
    cCount,
    singleCardForStory,
    handleShareToStory,
    handleDrawSpread,
    handleAddClarification,
    toggleRevealCard,
    handleRevealAll,
    handleDrawDaily,
  };
}