import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import {
  ArrowLeft,
  RotateCcw,
  Layers,
  HelpCircle,
  Calendar,
  Eye,
  Shuffle,
  PlusCircle,
  Share2,
  Check,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

// Гръб на картата
const CARD_BACK_PNG = require('../data/tarotpng/card back.png');

// Точно съответствие с имената на файловете в папка src/data/tarotpng/
const TAROT_PNG_MAP: Record<string, any> = {
  // Major Arcana
  "00 The Fool": require('../data/tarotpng/00 The Fool.png'),
  "01 The Magician": require('../data/tarotpng/01 The Magician.png'),
  "02 The High Priestess": require('../data/tarotpng/02 The High Priestess.png'),
  "03 The Empress": require('../data/tarotpng/03 The Empress.png'),
  "04 The Emperor": require('../data/tarotpng/04 The Emperor.png'),
  "05 The Hierophant": require('../data/tarotpng/05 The Hierophant.png'),
  "06 The Lovers": require('../data/tarotpng/06 The Lovers.png'),
  "07 The Chariot": require('../data/tarotpng/07 The Chariot.png'),
  "08 Strength": require('../data/tarotpng/08 Strength.png'),
  "09 The Hermit": require('../data/tarotpng/09 The Hermit.png'),
  "10 Wheel of Fortune": require('../data/tarotpng/10 Wheel of Fortune.png'),
  "11 Justice": require('../data/tarotpng/11 Justice.png'),
  "12 Hanged Man": require('../data/tarotpng/12 Hanged Man.png'),
  "13 Death": require('../data/tarotpng/13 Death.png'),
  "14 Temperance": require('../data/tarotpng/14 Temperance.png'),
  "15 The devil": require('../data/tarotpng/15 The devil.png'),
  "16 The tower": require('../data/tarotpng/16 The tower.png'),
  "17 The star": require('../data/tarotpng/17 The star.png'),
  "18 The moon": require('../data/tarotpng/18 The moon.png'),
  "19 The sun": require('../data/tarotpng/19 The sun.png'),
  "20 judgement": require('../data/tarotpng/20 judgement.png'),
  "21 The world": require('../data/tarotpng/21 The world.png'),

  // Minor Arcana - Coins
  "Coins Ace": require('../data/tarotpng/Coins Ace.png'),
  "Coins 2": require('../data/tarotpng/Coins 2.png'),
  "Coins 3": require('../data/tarotpng/Coins 3.png'),
  "Coins 4": require('../data/tarotpng/Coins 4.png'),
  "Coins 5": require('../data/tarotpng/Coins 5.png'),
  "Coins 6": require('../data/tarotpng/Coins 6.png'),
  "Coins 7": require('../data/tarotpng/Coins 7.png'),
  "Coins 8": require('../data/tarotpng/Coins 8.png'),
  "Coins 9": require('../data/tarotpng/Coins 9.png'),
  "Coins 10": require('../data/tarotpng/Coins 10.png'),
  "Coins Princess": require('../data/tarotpng/Coins Princess.png'),
  "Coins Knight": require('../data/tarotpng/Coins Knight.png'),
  "Coins Queen": require('../data/tarotpng/Coins Queen.png'),
  "Coins King": require('../data/tarotpng/Coins King.png'),

  // Minor Arcana - Cups
  "Cups Ace": require('../data/tarotpng/Cups Ace.png'),
  "Cups 2": require('../data/tarotpng/Cups 2.png'),
  "Cups 3": require('../data/tarotpng/Cups 3.png'),
  "Cups 4": require('../data/tarotpng/Cups 4.png'),
  "Cups 5": require('../data/tarotpng/Cups 5.png'),
  "Cups 6": require('../data/tarotpng/Cups 6.png'),
  "Cups 7": require('../data/tarotpng/Cups 7.png'),
  "Cups 8": require('../data/tarotpng/Cups 8.png'),
  "Cups 9": require('../data/tarotpng/Cups 9.png'),
  "Cups 10": require('../data/tarotpng/Cups 10.png'),
  "Cups Princess": require('../data/tarotpng/Cups Princess.png'),
  "Cups Knight": require('../data/tarotpng/Cups Knight.png'),
  "Cups Queen": require('../data/tarotpng/Cups Queen.png'),
  "Cups King": require('../data/tarotpng/Cups King.png'),

  // Minor Arcana - Swords
  "Swords Ace": require('../data/tarotpng/Swords Ace.png'),
  "Swords 2": require('../data/tarotpng/Swords 2.png'),
  "Swords 3": require('../data/tarotpng/Swords 3.png'),
  "Swords 4": require('../data/tarotpng/Swords 4.png'),
  "Swords 5": require('../data/tarotpng/Swords 5.png'),
  "Swords 6": require('../data/tarotpng/Swords 6.png'),
  "Swords 7": require('../data/tarotpng/Swords 7.png'),
  "Swords 8": require('../data/tarotpng/Swords 8.png'),
  "Swords 9": require('../data/tarotpng/Swords 9.png'),
  "Swords 10": require('../data/tarotpng/Swords 10.png'),
  "Swords Princess": require('../data/tarotpng/Swords Princess.png'),
  "Swords Knight": require('../data/tarotpng/Swords Knight.png'),
  "Swords Queen": require('../data/tarotpng/Swords Queen.png'),
  "Swords King": require('../data/tarotpng/Swords King.png'),

  // Minor Arcana - Wands
  "Wands Ace": require('../data/tarotpng/Wands Ace.png'),
  "Wands 2": require('../data/tarotpng/Wands 2.png'),
  "Wands 3": require('../data/tarotpng/Wands 3.png'),
  "Wands 4": require('../data/tarotpng/Wands 4.png'),
  "Wands 5": require('../data/tarotpng/Wands 5.png'),
  "Wands 6": require('../data/tarotpng/Wands 6.png'),
  "Wands 7": require('../data/tarotpng/Wands 7.png'),
  "Wands 8": require('../data/tarotpng/Wands 8.png'),
  "Wands 9": require('../data/tarotpng/Wands 9.png'),
  "Wands 10": require('../data/tarotpng/Wands 10.png'),
  "Wands Princess": require('../data/tarotpng/Wands Princess.png'),
  "Wands Knight": require('../data/tarotpng/Wands Knight.png'),
  "Wands Queen": require('../data/tarotpng/Wands Queen.png'),
  "Wands King": require('../data/tarotpng/Wands King.png'),
};

interface TarotCardData {
  id: number;
  name: string;
  pngKey: string;
  symbol: string;
  arcana: 'Major' | 'Minor';
  suit?: string;
  message: string;
}

const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: "0. The Fool", pngKey: "00 The Fool", symbol: "🃏", arcana: "Major", message: "New beginnings, innocence, spontaneity, and infinite potential." },
  { id: 1, name: "I. The Magician", pngKey: "01 The Magician", symbol: "🪄", arcana: "Major", message: "Manifestation, resourcefulness, power, and inspired action." },
  { id: 2, name: "II. The High Priestess", pngKey: "02 The High Priestess", symbol: "🌙", arcana: "Major", message: "Intuition, sacred knowledge, divine feminine, and subconscious wisdom." },
  { id: 3, name: "III. The Empress", pngKey: "03 The Empress", symbol: "👑", arcana: "Major", message: "Femininity, beauty, nature, nurturing, and abundant creativity." },
  { id: 4, name: "IV. The Emperor", pngKey: "04 The Emperor", symbol: "🏛️", arcana: "Major", message: "Authority, structure, control, leadership, and a solid foundation." },
  { id: 5, name: "V. The Hierophant", pngKey: "05 The Hierophant", symbol: "📜", arcana: "Major", message: "Spiritual wisdom, tradition, institutions, and core belief systems." },
  { id: 6, name: "VI. The Lovers", pngKey: "06 The Lovers", symbol: "💕", arcana: "Major", message: "Love, harmony, meaningful partnerships, and alignment of values." },
  { id: 7, name: "VII. The Chariot", pngKey: "07 The Chariot", symbol: "🛞", arcana: "Major", message: "Control, willpower, success, action, and overcoming obstacles." },
  { id: 8, name: "VIII. Strength", pngKey: "08 Strength", symbol: "🦁", arcana: "Major", message: "Inner strength, courage, persuasion, compassion, and patience." },
  { id: 9, name: "IX. The Hermit", pngKey: "09 The Hermit", symbol: "🕯️", arcana: "Major", message: "Soul-searching, introspection, solitude, and inner enlightenment." },
  { id: 10, name: "X. Wheel of Fortune", pngKey: "10 Wheel of Fortune", symbol: "☸️", arcana: "Major", message: "Good luck, karma, life cycles, destiny, and pivotal turning points." },
  { id: 11, name: "XI. Justice", pngKey: "11 Justice", symbol: "⚖️", arcana: "Major", message: "Fairness, truth, cause and effect, law, and accountability." },
  { id: 12, name: "XII. The Hanged Man", pngKey: "12 Hanged Man", symbol: "🙃", arcana: "Major", message: "Surrender, letting go, new perspectives, and deliberate pause." },
  { id: 13, name: "XIII. Death", pngKey: "13 Death", symbol: "🦋", arcana: "Major", message: "Endings, deep transformation, transition, and making way for the new." },
  { id: 14, name: "XIV. Temperance", pngKey: "14 Temperance", symbol: "🌊", arcana: "Major", message: "Balance, moderation, patience, purpose, and inner peace." },
  { id: 15, name: "XV. The Devil", pngKey: "15 The devil", symbol: "⛓️", arcana: "Major", message: "Shadow self, attachment, restriction, and breaking mental chains." },
  { id: 16, name: "XVI. The Tower", pngKey: "16 The tower", symbol: "⚡", arcana: "Major", message: "Sudden upheaval, broken illusions, awakening, and breakthrough." },
  { id: 17, name: "XVII. The Star", pngKey: "17 The star", symbol: "⭐", arcana: "Major", message: "Hope, faith, purpose, renewal, and celestial guidance." },
  { id: 18, name: "XVIII. The Moon", pngKey: "18 The moon", symbol: "🌕", arcana: "Major", message: "Illusion, fear, anxiety, intuition, and diving into the unknown." },
  { id: 19, name: "XIX. The Sun", pngKey: "19 The sun", symbol: "☀️", arcana: "Major", message: "Positivity, fun, warmth, success, and radiant vitality." },
  { id: 20, name: "XX. Judgement", pngKey: "20 judgement", symbol: "🎺", arcana: "Major", message: "Judgement, rebirth, inner calling, absolution, and awakening." },
  { id: 21, name: "XXI. The World", pngKey: "21 The world", symbol: "🌍", arcana: "Major", message: "Completion, integration, accomplishment, travel, and wholeness." },
];

const SUITS = [
  { key: "Coins", name: "Coins", symbol: "🪙", theme: "material wealth & resources" },
  { key: "Cups", name: "Cups", symbol: "🍷", theme: "emotions & relationships" },
  { key: "Swords", name: "Swords", symbol: "⚔️", theme: "intellect & mental clarity" },
  { key: "Wands", name: "Wands", symbol: "🪄", theme: "inspiration & creative action" },
];

const RANKS = [
  { rankKey: "Ace", name: "Ace", msg: "New potential and fresh impulse" },
  { rankKey: "2", name: "2", msg: "Balance, choices, and partnership" },
  { rankKey: "3", name: "3", msg: "Growth, expansion, and early results" },
  { rankKey: "4", name: "4", msg: "Stability, security, and foundation" },
  { rankKey: "5", name: "5", msg: "Temporary friction and adaptation" },
  { rankKey: "6", name: "6", msg: "Restoration, victory, and harmony" },
  { rankKey: "7", name: "7", msg: "Assessment, strategy, and patience" },
  { rankKey: "8", name: "8", msg: "Momentum, speed, and swift progress" },
  { rankKey: "9", name: "9", msg: "Resilience, stamina, and fortitude" },
  { rankKey: "10", name: "10", msg: "Culmination, completion, and fruition" },
  { rankKey: "Princess", name: "Princess", msg: "Curiosity, news, and new ideas" },
  { rankKey: "Knight", name: "Knight", msg: "Focused drive and decisive pursuit" },
  { rankKey: "Queen", name: "Queen", msg: "Nurturing mastery and emotional wisdom" },
  { rankKey: "King", name: "King", msg: "Commanding authority and leadership" },
];

const getMinorArcana = (): TarotCardData[] => {
  const cards: TarotCardData[] = [];
  let idCounter = 22;
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      const pngKey = `${suit.key} ${rank.rankKey}`;
      cards.push({
        id: idCounter++,
        name: `${rank.name} of ${suit.name}`,
        pngKey,
        symbol: suit.symbol,
        arcana: "Minor",
        suit: suit.name,
        message: `${rank.msg} in the realm of ${suit.theme}.`,
      });
    });
  });
  return cards;
};

function LocalPngTarotCard({
  card,
  isRevealed,
  cardIndex,
  colors,
  size = 'medium',
}: {
  card?: TarotCardData;
  isRevealed: boolean;
  cardIndex?: number;
  colors: any;
  size?: 'small' | 'medium' | 'large';
}) {
  const dims = {
    small: { width: 90, height: 154 },
    medium: { width: 110, height: 188 },
    large: { width: 150, height: 256 },
  }[size];

  const imageSource = card ? TAROT_PNG_MAP[card.pngKey] : null;

  return (
    <View
      style={{
        width: size === 'medium' ? '100%' : dims.width,
        height: dims.height,
        borderRadius: 10,
        backgroundColor: '#161026',
        borderWidth: 1.5,
        borderColor: colors.purple,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
        elevation: 6,
      }}
    >
      {!isRevealed ? (
        <View style={{ flex: 1, position: 'relative', backgroundColor: '#1A1423' }}>
          <Image
            source={CARD_BACK_PNG}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {cardIndex !== undefined && (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                alignSelf: 'center',
                backgroundColor: 'rgba(26, 20, 35, 0.9)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.purple,
              }}
            >
              <T bold size={9} style={{ color: colors.purple }}>
                #{cardIndex + 1}
              </T>
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 2, alignItems: 'center', justifyContent: 'center' }}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <T size={32}>{card?.symbol || '🃏'}</T>
              <T bold size={11} style={{ textAlign: 'center', marginTop: 4, color: '#111' }}>
                {card?.name}
              </T>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function Tarot() {
  const { colors, setPage, addStory } = useApp();
  const [mode, setMode] = useState<'daily' | 'spread'>('daily');
  const [useFullDeck, setUseFullDeck] = useState(true);

  // Ref за заснемане на компонента в PNG
  const storyCardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shared, setShared] = useState(false);

  // Spread configuration
  const [rowsInput, setRowsInput] = useState("3");
  const [colsInput, setColsInput] = useState("3");
  const [question, setQuestion] = useState("");

  const [spreadDrawn, setSpreadDrawn] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCardData[]>([]);
  const [remainingDeck, setRemainingDeck] = useState<TarotCardData[]>([]);
  const [bottomCard, setBottomCard] = useState<TarotCardData | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [clarifyingCards, setClarifyingCards] = useState<Record<number, TarotCardData[]>>({});

  // Daily card mode
  const [dailyDrawn, setDailyDrawn] = useState(false);
  const [dailyCard, setDailyCard] = useState<TarotCardData | null>(null);

  // Генерира чист Base64 стринг (съвместим и с мобилни устройства, и с уеб)
  const handleShareToStory = async () => {
    try {
      setIsCapturing(true);

      const base64Image = await captureRef(storyCardRef, {
        format: 'png',
        quality: 0.9,
        result: 'base64',
      });

      await addStory(base64Image);

      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (error) {
      console.error("Грешка при заснемане или качване на снимката:", error);
      Alert.alert(
        "Грешка",
        "Не съумяхме да споделим сторито. Моля, проверете връзката си със сървъра."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const getDeck = () => {
    if (useFullDeck) {
      return [...MAJOR_ARCANA, ...getMinorArcana()];
    }
    return [...MAJOR_ARCANA];
  };

  const handleDrawSpread = () => {
    const rows = parseInt(rowsInput) || 1;
    const cols = parseInt(colsInput) || 1;
    const totalNeeded = rows * cols;

    const currentDeck = getDeck();

    if (totalNeeded < 1 || totalNeeded >= currentDeck.length) {
      Alert.alert("Selection Error", `Please enter a card count between 1 and ${currentDeck.length - 1}!`);
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
      Alert.alert("Empty Deck", "No more cards available in the deck!");
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
    drawnCards.forEach((_, i) => (allRevealed[i] = true));
    setRevealedIndices(allRevealed);
  };

  const handleDrawDaily = () => {
    const currentDeck = getDeck();
    const randomCard = currentDeck[Math.floor(Math.random() * currentDeck.length)];
    setDailyCard(randomCard);
    setDailyDrawn(true);
  };

  const rCount = parseInt(rowsInput) || 1;
  const cCount = parseInt(colsInput) || 1;

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="LOCAL PNG DECK · 78 CARDS"
        first="Tarot"
        accent="Sanctuary."
        description="High-definition PNG tarot cards rendered directly from local image assets."
      />

      {/* Deck Selection */}
      <Card style={{ marginBottom: 14, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T bold size={13}>Deck Selection:</T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill selected={useFullDeck} onPress={() => setUseFullDeck(true)}>
              Full Deck (78)
            </Pill>
            <Pill selected={!useFullDeck} onPress={() => setUseFullDeck(false)}>
              Major Arcana (22)
            </Pill>
          </View>
        </View>
      </Card>

      {/* Mode Switch */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Pill selected={mode === 'daily'} onPress={() => setMode('daily')}>
          ✦ Daily Card
        </Pill>
        <Pill selected={mode === 'spread'} onPress={() => setMode('spread')}>
          🔮 Custom Spread Matrix
        </Pill>
      </View>

      {/* MODE 1: DAILY CARD */}
      {mode === 'daily' && (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {!dailyDrawn ? (
            <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 16 }}>
              <LocalPngTarotCard isRevealed={false} colors={colors} size="large" />

              <T bold size={18} style={{ textAlign: 'center' }}>
                Draw Your Daily Card ({useFullDeck ? "78 Cards" : "22 Cards"})
              </T>
              <Pill selected onPress={handleDrawDaily}>
                ♠ Reveal Today's Arcana
              </Pill>
            </Card>
          ) : (
            dailyCard && (
              <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 14 }}>
                {/* Рамка, която се заснема като Снимка за Story */}
                <View
                  ref={storyCardRef}
                  collapsable={false}
                  style={{
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 16,
                    width: '100%',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Calendar size={14} color={colors.gold} />
                    <T muted size={11} style={{ letterSpacing: 1.5 }}>
                      NATALA TAROT GUIDANCE
                    </T>
                  </View>

                  <LocalPngTarotCard
                    card={dailyCard}
                    isRevealed={true}
                    colors={colors}
                    size="large"
                  />

                  <T bold size={22} style={{ color: colors.purple, marginTop: 12 }}>
                    {dailyCard.name}
                  </T>
                  <Pill>{dailyCard.arcana} Arcana {dailyCard.suit ? `· ${dailyCard.suit}` : ''}</Pill>

                  <T muted size={13} style={{ textAlign: 'center', maxWidth: 330, lineHeight: 20, marginTop: 8 }}>
                    {dailyCard.message}
                  </T>
                </View>

                {/* Управление и Споделяне */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Pill onPress={handleDrawDaily}>
                    <RotateCcw size={14} color={colors.purple} /> Draw Another Card
                  </Pill>

                  <Pill selected onPress={handleShareToStory}>
                    {isCapturing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : shared ? (
                      <Check size={14} color="#FFF" />
                    ) : (
                      <Share2 size={14} color="#FFF" />
                    )}
                    {shared ? 'Added!' : 'Add to Story'}
                  </Pill>
                </View>
              </Card>
            )
          )}
        </View>
      )}

      {/* MODE 2: CUSTOM SPREAD */}
      {mode === 'spread' && (
        <View style={{ gap: 18, marginBottom: 40 }}>
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <T muted size={11}>1. QUESTION / INTENTION</T>
              <View
                style={{
                  minHeight: 46,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 14,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
              >
                <TextInput
                  style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="e.g., What energy surrounds my career shift?"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <T muted size={11}>2. MATRIX SIZING (ROWS × COLUMNS)</T>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <T muted size={10} style={{ marginBottom: 4 }}>Rows:</T>
                  <View style={{ height: 44, backgroundColor: colors.surfaceAlt, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
                    <TextInput
                      keyboardType="numeric"
                      style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}
                      value={rowsInput}
                      onChangeText={setRowsInput}
                      placeholder="3"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <T muted size={10} style={{ marginBottom: 4 }}>Columns:</T>
                  <View style={{ height: 44, backgroundColor: colors.surfaceAlt, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
                    <TextInput
                      keyboardType="numeric"
                      style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}
                      value={colsInput}
                      onChangeText={setColsInput}
                      placeholder="3"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>
              </View>
              <T muted size={10} style={{ marginTop: 2 }}>
                Total Cards: {rCount * cCount} (of {useFullDeck ? 78 : 22} available)
              </T>
            </View>

            <Pill selected onPress={handleDrawSpread}>
              ✦ Shuffle & Deal Spread
            </Pill>
          </Card>

          {spreadDrawn && (
            <>
              {/* Рамка за заснемане на пълната подредба */}
              <View
                ref={storyCardRef}
                collapsable={false}
                style={{ gap: 14, padding: 10, backgroundColor: '#120C1F', borderRadius: 16 }}
              >
                {question.trim().length > 0 && (
                  <Card style={{ gap: 6, backgroundColor: colors.purpleSoft }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <HelpCircle size={16} color={colors.purple} />
                      <T bold size={13} style={{ color: colors.purple }}>
                        Intention Focus:
                      </T>
                    </View>
                    <T bold size={15}>"{question}"</T>
                  </Card>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Section>Spread Grid ({rCount}×{cCount})</Section>
                </View>

                <View style={{ gap: 14 }}>
                  {Array.from({ length: rCount }).map((_, rIdx) => (
                    <View key={`row-${rIdx}`} style={{ flexDirection: 'row', gap: 10 }}>
                      {Array.from({ length: cCount }).map((_, cIdx) => {
                        const cardIdx = rIdx * cCount + cIdx;
                        const card = drawnCards[cardIdx];
                        const isRevealed = !!revealedIndices[cardIdx];
                        const clarifications = clarifyingCards[cardIdx] || [];

                        if (!card) return null;

                        return (
                          <View key={`card-container-${cardIdx}`} style={{ flex: 1, gap: 6 }}>
                            <TouchableOpacity activeOpacity={0.88} onPress={() => toggleRevealCard(cardIdx)}>
                              <LocalPngTarotCard
                                card={card}
                                isRevealed={isRevealed}
                                cardIndex={cardIdx}
                                colors={colors}
                                size="medium"
                              />
                            </TouchableOpacity>

                            {isRevealed && (
                              <T bold size={11} style={{ textAlign: 'center', marginTop: 2, color: colors.text }}>
                                {card.name}
                              </T>
                            )}

                            <TouchableOpacity
                              onPress={() => handleAddClarification(cardIdx)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                backgroundColor: colors.purpleSoft,
                                borderRadius: 8,
                                paddingVertical: 6,
                              }}
                            >
                              <PlusCircle size={12} color={colors.purple} />
                              <T bold size={9} style={{ color: colors.purple }}>
                                Clarify
                              </T>
                            </TouchableOpacity>

                            {/* Clarification Cards */}
                            {clarifications.length > 0 && (
                              <View style={{ gap: 6, marginTop: 4 }}>
                                {clarifications.map((cCard, cI) => (
                                  <View
                                    key={`clarify-${cI}`}
                                    style={{
                                      backgroundColor: colors.surfaceAlt,
                                      padding: 4,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: colors.gold,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <LocalPngTarotCard
                                      card={cCard}
                                      isRevealed={true}
                                      colors={colors}
                                      size="small"
                                    />
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Subconscious Foundation */}
                <Section>Subconscious Foundation</Section>
                {bottomCard && (
                  <Card style={{ gap: 12, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.goldSoft }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Layers size={18} color={colors.gold} />
                        <T bold size={14} style={{ color: colors.gold }}>
                          Bottom of the Deck
                        </T>
                      </View>
                      <Pill>Foundation</Pill>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                      <LocalPngTarotCard
                        card={bottomCard}
                        isRevealed={true}
                        colors={colors}
                        size="small"
                      />
                      <View style={{ flex: 1 }}>
                        <T bold size={16}>
                          {bottomCard.name}
                        </T>
                        <T muted size={12} style={{ marginTop: 4, lineHeight: 18 }}>
                          {bottomCard.message}
                        </T>
                      </View>
                    </View>
                  </Card>
                )}
              </View>

              {/* Бутони за управление и Споделяне в Стори */}
              <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'center', marginTop: 14 }}>
                <TouchableOpacity onPress={handleRevealAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.purpleSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                  <Eye size={14} color={colors.purple} />
                  <T bold size={12} style={{ color: colors.purple }}>
                    Reveal All
                  </T>
                </TouchableOpacity>

                <Pill onPress={handleDrawSpread}>
                  <Shuffle size={14} color={colors.purple} /> Deal New Spread
                </Pill>

                <Pill selected onPress={handleShareToStory}>
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : shared ? (
                    <Check size={14} color="#FFF" />
                  ) : (
                    <Share2 size={14} color="#FFF" />
                  )}
                  {shared ? 'Added!' : 'Add to story'}
                </Pill>
              </View>
            </>
          )}
        </View>
      )}
    </>
  );
}