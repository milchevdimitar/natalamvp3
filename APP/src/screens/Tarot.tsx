import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Layers,
  HelpCircle,
  Calendar,
  Eye,
  Shuffle,
  PlusCircle,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

// Импорти от src/data/tarotsvg
import FoolSvg from '../data/tarotsvg/00 The fool.svg';
import MagicianSvg from '../data/tarotsvg/01 The magician.svg';
import HighPriestessSvg from '../data/tarotsvg/02 The high priestess.svg';
import EmpressSvg from '../data/tarotsvg/03 The empress.svg';
import EmperorSvg from '../data/tarotsvg/04 The emperor.svg';
import HierophantSvg from '../data/tarotsvg/05 Hierophant.svg';
import LoversSvg from '../data/tarotsvg/06 The lovers.svg';
import ChariotSvg from '../data/tarotsvg/07 The chariot.svg';
import StrengthSvg from '../data/tarotsvg/08 Strength.svg';
import HermitSvg from '../data/tarotsvg/09 The hermit.svg';
import WheelOfFortuneSvg from '../data/tarotsvg/10 Wheel of fortune.svg';
import JusticeSvg from '../data/tarotsvg/11 Justice.svg';
import HangedManSvg from '../data/tarotsvg/12 The hanged man.svg';
import DeathSvg from '../data/tarotsvg/13 Death.svg';
import TemperanceSvg from '../data/tarotsvg/14 Temperance.svg';
import DevilSvg from '../data/tarotsvg/15 The Devil.svg';
import TowerSvg from '../data/tarotsvg/16 The Tower.svg';
import StarSvg from '../data/tarotsvg/17 The star.svg';
import MoonSvg from '../data/tarotsvg/18 The moon.svg';
import SunSvg from '../data/tarotsvg/19 The sun.svg';
import JudgementSvg from '../data/tarotsvg/20 Judgement.svg';
import WorldSvg from '../data/tarotsvg/21 The world.svg';

// Minor Arcana - Coins
import AceCoinsSvg from '../data/tarotsvg/Ace Coins.svg';
import TwoCoinsSvg from '../data/tarotsvg/2 Coins.svg';
import ThreeCoinsSvg from '../data/tarotsvg/3 Coins.svg';
import FourCoinsSvg from '../data/tarotsvg/4 Coins.svg';
import FiveCoinsSvg from '../data/tarotsvg/5 Coins.svg';
import SixCoinsSvg from '../data/tarotsvg/6 Coins.svg';
import SevenCoinsSvg from '../data/tarotsvg/7 Coins.svg';
import EightCoinsSvg from '../data/tarotsvg/8 Coins.svg';
import NineCoinsSvg from '../data/tarotsvg/9 Coins.svg';
import TenCoinsSvg from '../data/tarotsvg/10 Coins.svg';
import PrincessCoinsSvg from '../data/tarotsvg/Princess Coins.svg';
import KnightCoinsSvg from '../data/tarotsvg/Knight Coins.svg';
import QueenCoinsSvg from '../data/tarotsvg/Queen Coins.svg';
import KingCoinsSvg from '../data/tarotsvg/King Coins.svg';

// Minor Arcana - Cups
import AceCupsSvg from '../data/tarotsvg/Ace Cups.svg';
import TwoCupsSvg from '../data/tarotsvg/2 Cups.svg';
import ThreeCupsSvg from '../data/tarotsvg/3 Cups.svg';
import FourCupsSvg from '../data/tarotsvg/4 Cups.svg';
import FiveCupsSvg from '../data/tarotsvg/5 Cups.svg';
import SixCupsSvg from '../data/tarotsvg/6 Cups.svg';
import SevenCupsSvg from '../data/tarotsvg/7 Cups.svg';
import EightCupsSvg from '../data/tarotsvg/8 Cups.svg';
import NineCupsSvg from '../data/tarotsvg/9 Cups.svg';
import TenCupsSvg from '../data/tarotsvg/10 Cups.svg';
import PrincessCupsSvg from '../data/tarotsvg/Princess Cups.svg';
import KnightCupsSvg from '../data/tarotsvg/Knight Cups.svg';
import QueenCupsSvg from '../data/tarotsvg/Queen Cups.svg';
import KingCupsSvg from '../data/tarotsvg/King Cups.svg';

// Minor Arcana - Swords
import AceSwordsSvg from '../data/tarotsvg/Ace Swords.svg';
import TwoSwordsSvg from '../data/tarotsvg/2 Swords.svg';
import ThreeSwordsSvg from '../data/tarotsvg/3 Swords.svg';
import FourSwordsSvg from '../data/tarotsvg/4 Swords.svg';
import FiveSwordsSvg from '../data/tarotsvg/5 Swords.svg';
import SixSwordsSvg from '../data/tarotsvg/6 Swords.svg';
import SevenSwordsSvg from '../data/tarotsvg/7 Swords.svg';
import EightSwordsSvg from '../data/tarotsvg/8 Swords.svg';
import NineSwordsSvg from '../data/tarotsvg/9 Swords.svg';
import TenSwordsSvg from '../data/tarotsvg/10 Swords.svg';
import PrincessSwordsSvg from '../data/tarotsvg/Princess Swords.svg';
import KnightSwordsSvg from '../data/tarotsvg/Knight Swords.svg';
import QueenSwordsSvg from '../data/tarotsvg/Queen Swords.svg';
import KingSwordsSvg from '../data/tarotsvg/King Swords.svg';

// Minor Arcana - Wands
import AceWandsSvg from '../data/tarotsvg/Ace Wands.svg';
import TwoWandsSvg from '../data/tarotsvg/2 Wands.svg';
import ThreeWandsSvg from '../data/tarotsvg/3 Wands.svg';
import FourWandsSvg from '../data/tarotsvg/4 Wands.svg';
import FiveWandsSvg from '../data/tarotsvg/5 Wands.svg';
import SixWandsSvg from '../data/tarotsvg/6 Wands.svg';
import SevenWandsSvg from '../data/tarotsvg/7 Wands.svg';
import EightWandsSvg from '../data/tarotsvg/8 Wands.svg';
import NineWandsSvg from '../data/tarotsvg/9 Wands.svg';
import TenWandsSvg from '../data/tarotsvg/10 Wands.svg';
import PrincessWandsSvg from '../data/tarotsvg/Princess Wands.svg';
import KnightWandsSvg from '../data/tarotsvg/Knight Wands.svg';
import QueenWandsSvg from '../data/tarotsvg/Queen Wands.svg';
import KingWandsSvg from '../data/tarotsvg/King Wands.svg';

const TAROT_SVG_MAP: Record<string, any> = {
  "00 The fool": FoolSvg,
  "01 The magician": MagicianSvg,
  "02 The high priestess": HighPriestessSvg,
  "03 The empress": EmpressSvg,
  "04 The emperor": EmperorSvg,
  "05 Hierophant": HierophantSvg,
  "06 The lovers": LoversSvg,
  "07 The chariot": ChariotSvg,
  "08 Strength": StrengthSvg,
  "09 The hermit": HermitSvg,
  "10 Wheel of fortune": WheelOfFortuneSvg,
  "11 Justice": JusticeSvg,
  "12 The hanged man": HangedManSvg,
  "13 Death": DeathSvg,
  "14 Temperance": TemperanceSvg,
  "15 The Devil": DevilSvg,
  "16 The Tower": TowerSvg,
  "17 The star": StarSvg,
  "18 The moon": MoonSvg,
  "19 The sun": SunSvg,
  "20 Judgement": JudgementSvg,
  "21 The world": WorldSvg,

  "Ace Coins": AceCoinsSvg,
  "2 Coins": TwoCoinsSvg,
  "3 Coins": ThreeCoinsSvg,
  "4 Coins": FourCoinsSvg,
  "5 Coins": FiveCoinsSvg,
  "6 Coins": SixCoinsSvg,
  "7 Coins": SevenCoinsSvg,
  "8 Coins": EightCoinsSvg,
  "9 Coins": NineCoinsSvg,
  "10 Coins": TenCoinsSvg,
  "Princess Coins": PrincessCoinsSvg,
  "Knight Coins": KnightCoinsSvg,
  "Queen Coins": QueenCoinsSvg,
  "King Coins": KingCoinsSvg,

  "Ace Cups": AceCupsSvg,
  "2 Cups": TwoCupsSvg,
  "3 Cups": ThreeCupsSvg,
  "4 Cups": FourCupsSvg,
  "5 Cups": FiveCupsSvg,
  "6 Cups": SixCupsSvg,
  "7 Cups": SevenCupsSvg,
  "8 Cups": EightCupsSvg,
  "9 Cups": NineCupsSvg,
  "10 Cups": TenCupsSvg,
  "Princess Cups": PrincessCupsSvg,
  "Knight Cups": KnightCupsSvg,
  "Queen Cups": QueenCupsSvg,
  "King Cups": KingCupsSvg,

  "Ace Swords": AceSwordsSvg,
  "2 Swords": TwoSwordsSvg,
  "3 Swords": ThreeSwordsSvg,
  "4 Swords": FourSwordsSvg,
  "5 Swords": FiveSwordsSvg,
  "6 Swords": SixSwordsSvg,
  "7 Swords": SevenSwordsSvg,
  "8 Swords": EightSwordsSvg,
  "9 Swords": NineSwordsSvg,
  "10 Swords": TenSwordsSvg,
  "Princess Swords": PrincessSwordsSvg,
  "Knight Swords": KnightSwordsSvg,
  "Queen Swords": QueenSwordsSvg,
  "King Swords": KingSwordsSvg,

  "Ace Wands": AceWandsSvg,
  "2 Wands": TwoWandsSvg,
  "3 Wands": ThreeWandsSvg,
  "4 Wands": FourWandsSvg,
  "5 Wands": FiveWandsSvg,
  "6 Wands": SixWandsSvg,
  "7 Wands": SevenWandsSvg,
  "8 Wands": EightWandsSvg,
  "9 Wands": NineWandsSvg,
  "10 Wands": TenWandsSvg,
  "Princess Wands": PrincessWandsSvg,
  "Knight Wands": KnightWandsSvg,
  "Queen Wands": QueenWandsSvg,
  "King Wands": KingWandsSvg,
};

interface TarotCardData {
  id: number;
  name: string;
  svgKey: string;
  symbol: string;
  arcana: 'Major' | 'Minor';
  suit?: string;
  message: string;
}

const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: "0. The Fool", svgKey: "00 The fool", symbol: "🃏", arcana: "Major", message: "New beginnings, innocence, spontaneity, and infinite potential." },
  { id: 1, name: "I. The Magician", svgKey: "01 The magician", symbol: "🪄", arcana: "Major", message: "Manifestation, resourcefulness, power, and inspired action." },
  { id: 2, name: "II. The High Priestess", svgKey: "02 The high priestess", symbol: "🌙", arcana: "Major", message: "Intuition, sacred knowledge, divine feminine, and subconscious wisdom." },
  { id: 3, name: "III. The Empress", svgKey: "03 The empress", symbol: "👑", arcana: "Major", message: "Femininity, beauty, nature, nurturing, and abundant creativity." },
  { id: 4, name: "IV. The Emperor", svgKey: "04 The emperor", symbol: "🏛️", arcana: "Major", message: "Authority, structure, control, leadership, and a solid foundation." },
  { id: 5, name: "V. The Hierophant", svgKey: "05 Hierophant", symbol: "📜", arcana: "Major", message: "Spiritual wisdom, tradition, institutions, and core belief systems." },
  { id: 6, name: "VI. The Lovers", svgKey: "06 The lovers", symbol: "💕", arcana: "Major", message: "Love, harmony, meaningful partnerships, and alignment of values." },
  { id: 7, name: "VII. The Chariot", svgKey: "07 The chariot", symbol: "🛞", arcana: "Major", message: "Control, willpower, success, action, and overcoming obstacles." },
  { id: 8, name: "VIII. Strength", svgKey: "08 Strength", symbol: "🦁", arcana: "Major", message: "Inner strength, courage, persuasion, compassion, and patience." },
  { id: 9, name: "IX. The Hermit", svgKey: "09 The hermit", symbol: "🕯️", arcana: "Major", message: "Soul-searching, introspection, solitude, and inner enlightenment." },
  { id: 10, name: "X. Wheel of Fortune", svgKey: "10 Wheel of fortune", symbol: "☸️", arcana: "Major", message: "Good luck, karma, life cycles, destiny, and pivotal turning points." },
  { id: 11, name: "XI. Justice", svgKey: "11 Justice", symbol: "⚖️", arcana: "Major", message: "Fairness, truth, cause and effect, law, and accountability." },
  { id: 12, name: "XII. The Hanged Man", svgKey: "12 The hanged man", symbol: "🙃", arcana: "Major", message: "Surrender, letting go, new perspectives, and deliberate pause." },
  { id: 13, name: "XIII. Death", svgKey: "13 Death", symbol: "🦋", arcana: "Major", message: "Endings, deep transformation, transition, and making way for the new." },
  { id: 14, name: "XIV. Temperance", svgKey: "14 Temperance", symbol: "🌊", arcana: "Major", message: "Balance, moderation, patience, purpose, and inner peace." },
  { id: 15, name: "XV. The Devil", svgKey: "15 The Devil", symbol: "⛓️", arcana: "Major", message: "Shadow self, attachment, restriction, and breaking mental chains." },
  { id: 16, name: "XVI. The Tower", svgKey: "16 The Tower", symbol: "⚡", arcana: "Major", message: "Sudden upheaval, broken illusions, awakening, and breakthrough." },
  { id: 17, name: "XVII. The Star", svgKey: "17 The star", symbol: "⭐", arcana: "Major", message: "Hope, faith, purpose, renewal, and celestial guidance." },
  { id: 18, name: "XVIII. The Moon", svgKey: "18 The moon", symbol: "🌕", arcana: "Major", message: "Illusion, fear, anxiety, intuition, and diving into the unknown." },
  { id: 19, name: "XIX. The Sun", svgKey: "19 The sun", symbol: "☀️", arcana: "Major", message: "Positivity, fun, warmth, success, and radiant vitality." },
  { id: 20, name: "XX. Judgement", svgKey: "20 Judgement", symbol: "🎺", arcana: "Major", message: "Judgement, rebirth, inner calling, absolution, and awakening." },
  { id: 21, name: "XXI. The World", svgKey: "21 The world", symbol: "🌍", arcana: "Major", message: "Completion, integration, accomplishment, travel, and wholeness." },
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
      const svgKey = `${rank.rankKey} ${suit.key}`;
      cards.push({
        id: idCounter++,
        name: `${rank.name} of ${suit.name}`,
        svgKey,
        symbol: suit.symbol,
        arcana: "Minor",
        suit: suit.name,
        message: `${rank.msg} in the realm of ${suit.theme}.`,
      });
    });
  });
  return cards;
};

// Защитен компонент за безопасно рендиране на SVG / Картинки на уеб и мобайл
function SafeSvgRender({ rawImport, card }: { rawImport: any; card?: TarotCardData }) {
  if (!rawImport) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        <T size={32}>{card?.symbol || '☾'}</T>
        <T bold size={11} style={{ textAlign: 'center', marginTop: 4, color: '#111' }}>
          {card?.name || 'Tarot Card'}
        </T>
      </View>
    );
  }

  // 1. Ако е React Component
  const Component = typeof rawImport === 'function' ? rawImport : rawImport?.default;
  if (typeof Component === 'function') {
    return <Component width="100%" height="100%" />;
  }

  // 2. Ако уеб бандлърът го е превърнал в URL string или require() asset number
  const imageSource = typeof rawImport === 'string' ? { uri: rawImport } : (rawImport?.default || rawImport);
  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
      <T size={32}>{card?.symbol}</T>
      <T bold size={11} style={{ textAlign: 'center', marginTop: 4, color: '#111' }}>
        {card?.name}
      </T>
    </View>
  );
}

function LocalSvgTarotCard({
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

  const rawImport = card ? TAROT_SVG_MAP[card.svgKey] : null;

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
        <View style={{ flex: 1, position: 'relative', backgroundColor: '#1A1423', alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: '86%',
              height: '90%',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.gold,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.purpleSoft,
            }}
          >
            <T size={28} style={{ color: colors.gold }}>☾</T>
          </View>
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
          <SafeSvgRender rawImport={rawImport} card={card} />
        </View>
      )}
    </View>
  );
}

export default function Tarot() {
  const { colors, setPage } = useApp();
  const [mode, setMode] = useState<'daily' | 'spread'>('daily');
  const [useFullDeck, setUseFullDeck] = useState(true);

  // Spread config
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
        eyebrow="LOCAL VECTOR SVG DECK · 78 CARDS"
        first="Tarot"
        accent="Sanctuary."
        description="High-definition vector tarot cards rendered directly from local SVG files."
      />

      {/* Deck selection */}
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

      {/* Mode switch */}
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
              <LocalSvgTarotCard isRevealed={false} colors={colors} size="large" />

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color={colors.gold} />
                  <T muted size={11} style={{ letterSpacing: 1.5 }}>
                    DAILY TAROT GUIDANCE
                  </T>
                </View>

                <LocalSvgTarotCard
                  card={dailyCard}
                  isRevealed={true}
                  colors={colors}
                  size="large"
                />

                <T bold size={22} style={{ color: colors.purple, marginTop: 4 }}>
                  {dailyCard.name}
                </T>
                <Pill>{dailyCard.arcana} Arcana {dailyCard.suit ? `· ${dailyCard.suit}` : ''}</Pill>

                <T muted size={13} style={{ textAlign: 'center', maxWidth: 330, lineHeight: 20 }}>
                  {dailyCard.message}
                </T>

                <View style={{ marginTop: 10 }}>
                  <Pill onPress={handleDrawDaily}>
                    <RotateCcw size={14} color={colors.purple} /> Draw Another Card
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
                <TouchableOpacity onPress={handleRevealAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Eye size={14} color={colors.purple} />
                  <T bold size={12} style={{ color: colors.purple }}>
                    Reveal All Cards
                  </T>
                </TouchableOpacity>
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
                            <LocalSvgTarotCard
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

                          {/* Clarification cards */}
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
                                  <LocalSvgTarotCard
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

              {/* BOTTOM OF THE DECK */}
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
                    <LocalSvgTarotCard
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

              <View style={{ marginTop: 10, alignSelf: 'center' }}>
                <Pill onPress={handleDrawSpread}>
                  <Shuffle size={14} color={colors.purple} /> Deal New Spread
                </Pill>
              </View>
            </>
          )}
        </View>
      )}
    </>
  );
}