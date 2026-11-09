import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
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

interface TarotCardData {
  id: number;
  name: string;
  symbol: string;
  arcana: 'Major' | 'Minor';
  suit?: string;
  message: string;
}

const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: "0. Шутът", symbol: "🃏", arcana: "Major", message: "Ново начало, спонтанност, чист потенциал и вяра в непознатото." },
  { id: 1, name: "I. Магьосникът", symbol: "🪄", arcana: "Major", message: "Ресурси, воля, задвижване на намеренията в реалността." },
  { id: 2, name: "II. Висшата жрица", symbol: "🌙", arcana: "Major", message: "Интуиция, тайни знания, подсъзнание и дълбока мъдрост." },
  { id: 3, name: "III. Императрицата", symbol: "👑", arcana: "Major", message: "Изобилие, творчество, природа, грижа и растеж." },
  { id: 4, name: "IV. Императорът", symbol: "🏛️", arcana: "Major", message: "Структура, авторитет, дисциплина, граници и стабилност." },
  { id: 5, name: "V. Жрецът", symbol: "📜", arcana: "Major", message: "Традиция, духовно обучение, ценности и търсене на истина." },
  { id: 6, name: "VI. Влюбените", symbol: "💕", arcana: "Major", message: "Хармония, избор от сърцето, съюз и съвместимост." },
  { id: 7, name: "VII. Колесницата", symbol: "🛞", arcana: "Major", message: "Победа чрез воля, фокус, контрол над противоположностите." },
  { id: 8, name: "VIII. Силата", symbol: "🦁", arcana: "Major", message: "Вътрешна сила, търпение, укротяване на страстите с благини." },
  { id: 9, name: "IX. Отшелникът", symbol: "🕯️", arcana: "Major", message: "Вътрешно търсене, уединение, саморефлексия и духовен водач." },
  { id: 10, name: "X. Колелото на съдбата", symbol: "☸️", arcana: "Major", message: "Промяна, цикличност, съдбоносни обрати и нов късмет." },
  { id: 11, name: "XI. Справедливостта", symbol: "⚖️", arcana: "Major", message: "Истина, карма, отговорност за решенията и честност." },
  { id: 12, name: "XII. Обесеният", symbol: "🙃", arcana: "Major", message: "Нова перспектива, пауза, доброволно отказване от контрол." },
  { id: 13, name: "XIII. Смъртта", symbol: "🦋", arcana: "Major", message: "Дълбока трансформация, край на стар етап и ново раждане." },
  { id: 14, name: "XIV. Умереността", symbol: "🌊", arcana: "Major", message: "Баланс, хармония, търпение и умерен подход във всичко." },
  { id: 15, name: "XV. Дяволът", symbol: "⛓️", arcana: "Major", message: "Привързаност, илюзии, материализъм и осъзнаване на оковите." },
  { id: 16, name: "XVI. Кулата", symbol: "⚡", arcana: "Major", message: "Внезапна промяна, разбуждане от илюзии, прогледване." },
  { id: 17, name: "XVII. Звездата", symbol: "⭐", arcana: "Major", message: "Надежда, яснота, изцеление, вдъхновение и спокойствие." },
  { id: 18, name: "XVIII. Луната", symbol: "🌕", arcana: "Major", message: "Подсъзнание, сънища, потапяне в неизвестното и илюзии." },
  { id: 19, name: "XIX. Слънцето", symbol: "☀️", arcana: "Major", message: "Радост, успех, жизненост, яснота и позитивна енергия." },
  { id: 20, name: "XX. Страшният съд", symbol: "🎺", arcana: "Major", message: "Прераждане, пробуждане, прошка и равносметка." },
  { id: 21, name: "XXI. Светът", symbol: "🌍", arcana: "Major", message: "Завършеност, триумф, завършване на пътя и хармония." },
];

const SUITS = [
  { key: "Wands", name: "Жезли", symbol: "🪄", theme: "вдъхновение и енергия" },
  { key: "Cups", name: "Чаши", symbol: "🍷", theme: "емоции и връзки" },
  { key: "Swords", name: "Мечове", symbol: "⚔️", theme: "разум и истина" },
  { key: "Pentacles", name: "Пентакли", symbol: "🪙", theme: "материални блага и работа" },
];

const RANKS = [
  { name: "Асо", msg: "Нова възможност и импулс" },
  { name: "2", msg: "Баланс и избор" },
  { name: "3", msg: "Растеж и първи резултати" },
  { name: "4", msg: "Стабилност и граници" },
  { name: "5", msg: "Временно предизвикателство" },
  { name: "6", msg: "Възстановяване и хармония" },
  { name: "7", msg: "Оценка на постигнатото" },
  { name: "8", msg: "Динамика и напредък" },
  { name: "9", msg: "Устойчивост и опит" },
  { name: "10", msg: "Завършек на цикъла" },
  { name: "Паж", msg: "Нови вести и любопитство" },
  { name: "Рицар", msg: "Устрем и действие" },
  { name: "Кралица", msg: "Вътрешна зрялост и грижа" },
  { name: "Крале", msg: "Авторитет и контрол" },
];

// Функция за генериране на 56 Малки Аркана
const getMinorArcana = (): TarotCardData[] => {
  const cards: TarotCardData[] = [];
  let idCounter = 22;
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      cards.push({
        id: idCounter++,
        name: `${rank.name} ${suit.name}`,
        symbol: suit.symbol,
        arcana: "Minor",
        suit: suit.name,
        message: `${rank.msg} в сферата на ${suit.theme}.`,
      });
    });
  });
  return cards;
};

export default function Tarot() {
  const { colors, setPage } = useApp();
  const [mode, setMode] = useState<'daily' | 'spread'>('daily');
  const [useFullDeck, setUseFullDeck] = useState(true);

  // Режим 1
  const [rowsInput, setRowsInput] = useState("3");
  const [colsInput, setColsInput] = useState("3");
  const [question, setQuestion] = useState("");

  const [spreadDrawn, setSpreadDrawn] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCardData[]>([]);
  const [remainingDeck, setRemainingDeck] = useState<TarotCardData[]>([]);
  const [bottomCard, setBottomCard] = useState<TarotCardData | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [clarifyingCards, setClarifyingCards] = useState<Record<number, TarotCardData[]>>({});

  // Режим 2
  const [dailyDrawn, setDailyDrawn] = useState(false);
  const [dailyCard, setDailyCard] = useState<TarotCardData | null>(null);

  // Генериране на тестето според избрания режим (78 или 22 карти)
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
      alert(`Моля въведете брой карти между 1 и ${currentDeck.length - 1}!`);
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
      alert("Няма повече карти в тестето за теглене!");
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
          Назад към Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="FULL TAROT DECK · 78 CARDS"
        first="Таро"
        accent="Санктуарий."
        description="Персонализирани подредби, доизтегляне на поясняващи карти и дневен архетип."
      />

      {/* Опция за избор на колода */}
      <Card style={{ marginBottom: 14, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T bold size={13}>Тесте карти:</T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill selected={useFullDeck} onPress={() => setUseFullDeck(true)}>
              Пълно (78)
            </Pill>
            <Pill selected={!useFullDeck} onPress={() => setUseFullDeck(false)}>
              Само Големи (22)
            </Pill>
          </View>
        </View>
      </Card>

      {/* Режими */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Pill selected={mode === 'daily'} onPress={() => setMode('daily')}>
          ✦ Дневна Карта
        </Pill>
        <Pill selected={mode === 'spread'} onPress={() => setMode('spread')}>
          🔮 Персонализирана Подредба
        </Pill>
      </View>

      {/* РЕЖИМ 2: ДНЕВНА КАРТА */}
      {mode === 'daily' && (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {!dailyDrawn ? (
            <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 14 }}>
              <View
                style={{
                  width: 90,
                  height: 130,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.gold,
                  backgroundColor: colors.purpleSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T size={42} style={{ color: colors.gold }}>
                  ☾
                </T>
              </View>
              <T bold size={18} style={{ textAlign: 'center' }}>
                Вашата карта за днес ({useFullDeck ? "78 карти" : "22 карти"})
              </T>
              <Pill selected onPress={handleDrawDaily}>
                ♠ Изтегли за днес
              </Pill>
            </Card>
          ) : (
            dailyCard && (
              <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color={colors.gold} />
                  <T muted size={11} style={{ letterSpacing: 1.5 }}>
                    КАРТА НА ДЕНЯ
                  </T>
                </View>

                <View
                  style={{
                    width: 100,
                    height: 144,
                    borderRadius: 20,
                    backgroundColor: colors.purpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginVertical: 6,
                    borderWidth: 1.5,
                    borderColor: colors.purple,
                  }}
                >
                  <T size={54}>{dailyCard.symbol}</T>
                </View>

                <T bold size={22} style={{ color: colors.purple }}>
                  {dailyCard.name}
                </T>
                <Pill>{dailyCard.arcana} Arcana {dailyCard.suit ? `· ${dailyCard.suit}` : ''}</Pill>

                <T muted size={13} style={{ textAlign: 'center', maxWidth: 330, marginTop: 6, lineHeight: 20 }}>
                  {dailyCard.message}
                </T>

                <View style={{ marginTop: 10 }}>
                  <Pill onPress={handleDrawDaily}>
                    <RotateCcw size={14} color={colors.purple} /> Изтегли друга
                  </Pill>
                </View>
              </Card>
            )
          )}
        </View>
      )}

      {/* РЕЖИМ 1: ПЕРСОНАЛИЗИРАНА РЕШЕТКА */}
      {mode === 'spread' && (
        <View style={{ gap: 18, marginBottom: 40 }}>
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <T muted size={11}>1. ВЪПРОС / ТЕМА НА ТЕГЛЕНЕТО</T>
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
                  placeholder="Напр. Какво да очаквам от новия проект?"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <T muted size={11}>2. РАЗМЕР НА РЕШЕТКАТА (РЕДОВЕ × КОЛОНИ)</T>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <T muted size={10} style={{ marginBottom: 4 }}>Редове:</T>
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
                  <T muted size={10} style={{ marginBottom: 4 }}>Колони:</T>
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
                Общо карти: {rCount * cCount} (от {useFullDeck ? 78 : 22} налични)
              </T>
            </View>

            <Pill selected onPress={handleDrawSpread}>
              ✦ Разбъркай и изтегли карти
            </Pill>
          </Card>

          {spreadDrawn && (
            <>
              {question.trim().length > 0 && (
                <Card style={{ gap: 6, backgroundColor: colors.purpleSoft }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <HelpCircle size={16} color={colors.purple} />
                    <T bold size={13} style={{ color: colors.purple }}>
                      Зададен въпрос:
                    </T>
                  </View>
                  <T bold size={15}>"{question}"</T>
                </Card>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Section>Решетка {rCount}×{cCount}</Section>
                <TouchableOpacity onPress={handleRevealAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Eye size={14} color={colors.purple} />
                  <T bold size={12} style={{ color: colors.purple }}>
                    Разкрий всички
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
                          <TouchableOpacity onPress={() => toggleRevealCard(cardIdx)}>
                            <Card
                              style={{
                                padding: 8,
                                minHeight: 110,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isRevealed ? colors.surface : colors.surfaceAlt,
                                borderWidth: isRevealed ? 1.5 : 1,
                                borderColor: isRevealed ? colors.purple : colors.line,
                              }}
                            >
                              {isRevealed ? (
                                <View style={{ alignItems: 'center', gap: 4 }}>
                                  <T size={24}>{card.symbol}</T>
                                  <T bold size={11} style={{ textAlign: 'center' }}>
                                    {card.name}
                                  </T>
                                </View>
                              ) : (
                                <View style={{ alignItems: 'center', gap: 4 }}>
                                  <T size={20} style={{ color: colors.muted }}>
                                    ☾
                                  </T>
                                  <T bold size={10} style={{ color: colors.muted }}>
                                    #{cardIdx + 1}
                                  </T>
                                </View>
                              )}
                            </Card>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleAddClarification(cardIdx)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              backgroundColor: colors.purpleSoft,
                              borderRadius: 8,
                              paddingVertical: 5,
                            }}
                          >
                            <PlusCircle size={12} color={colors.purple} />
                            <T bold size={9} style={{ color: colors.purple }}>
                              Поясни
                            </T>
                          </TouchableOpacity>

                          {clarifications.length > 0 && (
                            <View style={{ gap: 4, marginTop: 2 }}>
                              {clarifications.map((cCard, cI) => (
                                <View
                                  key={`clarify-${cI}`}
                                  style={{
                                    backgroundColor: colors.goldSoft,
                                    padding: 6,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: colors.gold,
                                    alignItems: 'center',
                                  }}
                                >
                                  <T size={12}>{cCard.symbol}</T>
                                  <T bold size={9} style={{ textAlign: 'center', color: colors.gold }}>
                                    + {cCard.name}
                                  </T>
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

              {/* КАРТА ПОД ТЕСТЕТО */}
              <Section>Подсъзнателна Енергия</Section>
              {bottomCard && (
                <Card style={{ gap: 12, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.goldSoft }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Layers size={18} color={colors.gold} />
                      <T bold size={14} style={{ color: colors.gold }}>
                        Картата под тестето (Bottom of Deck)
                      </T>
                    </View>
                    <Pill>Основа</Pill>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <T size={28}>{bottomCard.symbol}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T bold size={16}>
                        {bottomCard.name}
                      </T>
                      <T muted size={12} style={{ marginTop: 2 }}>
                        {bottomCard.message}
                      </T>
                    </View>
                  </View>
                </Card>
              )}

              <View style={{ marginTop: 10 }}>
                <Pill onPress={handleDrawSpread}>
                  <Shuffle size={14} color={colors.purple} /> Ново теглене
                </Pill>
              </View>
            </>
          )}
        </View>
      )}
    </>
  );
}