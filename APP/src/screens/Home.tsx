import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  Sun,
  Stars,
  X,
  Globe,
  Sparkles,
  PlusCircle,
  CheckCircle,
  RotateCcw,
  Zap,
  Calendar,
  Compass,
} from "lucide-react-native";
import { Brand, Card, T, Section, Pill } from "../components/UI";
import { stories as demoStories } from "../data/demo";
import { useApp } from "../context/AppContext";
import { StoryViewer } from "../components/StoryViewer";

const { width, height } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// ✦ АСТРОНОМИЧЕСКИ ИЗЧИСЛЕНИЯ И АПИ ЗА РЕТРОГРАДНИ ПЛАНЕТИ
// ---------------------------------------------------------------------------

/** Изчислява прецизно фазата, осветеността и възрастта на Луната */
export function getMoonPhaseData(date = new Date()) {
  const synodicMonth = 29.53058770576; // Дължина на синодичния месец в дни
  const knownNewMoon = new Date("2024-01-11T11:57:00Z").getTime();
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  const cyclePosition = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;

  const phasePercent = (cyclePosition / synodicMonth) * 100;
  const illuminated = Math.round(
    ((1 - Math.cos((cyclePosition / synodicMonth) * 2 * Math.PI)) / 2) * 100
  );

  let phaseName = "";
  let symbol = "";
  let isSpecial = false;

  if (cyclePosition < 1.84 || cyclePosition >= 27.68) {
    phaseName = "New Moon";
    symbol = "🌑";
    isSpecial = true;
  } else if (cyclePosition < 5.53) {
    phaseName = "Waxing Crescent";
    symbol = "🌒";
  } else if (cyclePosition < 9.22) {
    phaseName = "First Quarter";
    symbol = "🌓";
  } else if (cyclePosition < 12.91) {
    phaseName = "Waxing Gibbous";
    symbol = "🌔";
  } else if (cyclePosition < 16.61) {
    phaseName = "Full Moon";
    symbol = "🌕";
    isSpecial = true;
  } else if (cyclePosition < 20.30) {
    phaseName = "Waning Gibbous";
    symbol = "🌖";
  } else if (cyclePosition < 23.99) {
    phaseName = "Last Quarter";
    symbol = "🌗";
  } else {
    phaseName = "Waning Crescent";
    symbol = "🌘";
  }

  return {
    cyclePosition,
    phasePercent,
    illuminated,
    phaseName,
    symbol,
    isSpecial,
    ageInDays: cyclePosition.toFixed(1),
  };
}

/** 
 * Астрономически алгоритъм за изчисляване на реалните геоцентрични дължини 
 * на всички планети с орбитален паралакс за откриване на Ретроградност
 */
function getRawLongitudes(dObj: Date) {
  const julianDate = dObj.getTime() / 86400000 + 2440587.5;
  const d = julianDate - 2451545.0; // Дни от епоха J2000.0

  // Слънце
  const g = ((357.529 + 0.98560028 * d) % 360 * Math.PI) / 180;
  const sunLong =
    (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360;

  // Луна
  const Lm = (218.316 + 13.176396 * d) % 360;
  const Mm = ((134.963 + 13.064993 * d) % 360 * Math.PI) / 180;
  const Fm = ((93.272 + 13.22935 * d) % 360 * Math.PI) / 180;
  const moonLong =
    (Lm + 6.289 * Math.sin(Mm) - 1.274 * Math.sin(Mm - 2 * Fm)) % 360;

  // Земна орбитaлна геоцентрична координата
  const earthLong = (sunLong + 180) % 360;

  // Вътрешни планети (Меркурий & Венера)
  const mercMean = (252.251 + 4.0923344 * d) % 360;
  const mercLong =
    (sunLong + 23 * Math.sin((((mercMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  const venusMean = (181.979 + 1.6021302 * d) % 360;
  const venusLong =
    (sunLong + 42 * Math.sin((((venusMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  // Функция за изчисляване на геоцентричния паралакс на външните планети
  const calcOuterGeocentric = (helioMeanLong: number, semiMajorAxis: number) => {
    const alpha = (((earthLong - helioMeanLong) % 360) * Math.PI) / 180;
    const theta = Math.atan2(Math.sin(alpha), semiMajorAxis - Math.cos(alpha));
    return ((helioMeanLong + (theta * 180) / Math.PI) % 360 + 360) % 360;
  };

  const marsHelio = (355.433 + 0.524033 * d) % 360;
  const jupHelio = (34.351 + 0.0830853 * d) % 360;
  const satHelio = (50.077 + 0.0334442 * d) % 360;
  const uranHelio = (314.055 + 0.01172834 * d) % 360;
  const nepHelio = (304.349 + 0.00598106 * d) % 360;
  const plutoHelio = (238.96 + 0.0039757 * d) % 360;

  return {
    Sun: sunLong,
    Moon: moonLong,
    Mercury: mercLong,
    Venus: venusLong,
    Mars: calcOuterGeocentric(marsHelio, 1.524),
    Jupiter: calcOuterGeocentric(jupHelio, 5.204),
    Saturn: calcOuterGeocentric(satHelio, 9.582),
    Uranus: calcOuterGeocentric(uranHelio, 19.201),
    Neptune: calcOuterGeocentric(nepHelio, 30.047),
    Pluto: calcOuterGeocentric(plutoHelio, 39.482),
  };
}

/** Проверява дали геоцентричната дължина намалява спрямо утрешния ден (Ретроградност) */
function checkRetrograde(todayDeg: number, tomorrowDeg: number): boolean {
  let diff = tomorrowDeg - todayDeg;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

/** Изтегля реални онлайн данни от външно астрономическо API за ретроградни планети */
async function fetchOnlineRetrogrades(): Promise<Record<string, boolean> | null> {
  try {
    const res = await fetch("https://mercuryretrogradeapi.com");
    const data = await res.json();
    if (data && typeof data.is_retrograde === "boolean") {
      return { Mercury: data.is_retrograde };
    }
  } catch (err) {
    // При липса на мрежа се използва математическия алгоритъм
  }
  return null;
}

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";
  let i = 0;

  while (i < len) {
    const b1 = bytes[i++];
    const b2 = i < len ? bytes[i++] : NaN;
    const b3 = i < len ? bytes[i++] : NaN;

    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (b2 >> 4);
    let c3 = ((b2 & 15) << 2) | (b3 >> 6);
    let c4 = b3 & 63;

    if (isNaN(b2)) {
      c3 = c4 = 64;
    } else if (isNaN(b3)) {
      c4 = 64;
    }

    base64 +=
      chars.charAt(c1) +
      chars.charAt(c2) +
      (c3 === 64 ? "=" : chars.charAt(c3)) +
      (c4 === 64 ? "=" : chars.charAt(c4));
  }

  return `data:image/png;base64,${base64}`;
};

const PLANET_METADATA: Record<
  string,
  {
    image: string;
    ruler: string;
    element: "Fire" | "Earth" | "Air" | "Water";
    topic: string;
    description: string;
  }
> = {
  Sun: {
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
    ruler: "Leo",
    element: "Fire",
    topic: "Identity & Core Essence",
    description:
      "Our cosmic heart and source of vitality. Defines our willpower, self-expression, and core identity.",
  },
  Moon: {
    image:
      "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop",
    ruler: "Cancer",
    element: "Water",
    topic: "Emotions & Intuition",
    description:
      "Guardian of the subconscious, emotional realm, inner comfort, and intuitive reactions.",
  },
  Mercury: {
    image:
      "https://images.unsplash.com/photo-1545156521-77bd85671d30?q=80&w=600&auto=format&fit=crop",
    ruler: "Gemini / Virgo",
    element: "Air",
    topic: "Mind & Communication",
    description:
      "Planet of thought, speech, logic, and mental agility. Governs how we process information.",
  },
  Venus: {
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Taurus / Libra",
    element: "Earth",
    topic: "Love, Beauty & Values",
    description:
      "Goddess of beauty, love, harmony, art, and what we truly value in relationships.",
  },
  Mars: {
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
    ruler: "Aries",
    element: "Fire",
    topic: "Drive, Action & Courage",
    description:
      "The zodiac warrior – defines how we assert ourselves, direct our passion, and overcome obstacles.",
  },
  Jupiter: {
    image:
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop",
    ruler: "Sagittarius",
    element: "Fire",
    topic: "Expansion & Wisdom",
    description:
      "The great benefactor – brings growth, abundance, philosophical depth, and new horizons.",
  },
  Saturn: {
    image:
      "https://images.unsplash.com/photo-1614732484003-ef9881555dc3?q=80&w=600&auto=format&fit=crop",
    ruler: "Capricorn",
    element: "Earth",
    topic: "Discipline & Time",
    description:
      "The great teacher – builds boundaries, structure, discipline, maturity, and karmic lessons.",
  },
  Uranus: {
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Aquarius",
    element: "Air",
    topic: "Awakening & Innovation",
    description:
      "Catalyst for change, genius, freedom, originality, and sudden revolutionary breakthroughs.",
  },
  Neptune: {
    image:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
    ruler: "Pisces",
    element: "Water",
    topic: "Dreams & Mysticism",
    description:
      "Planet of illusions, higher spirituality, creative inspiration, dreams, and cosmic oneness.",
  },
  Pluto: {
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    ruler: "Scorpio",
    element: "Water",
    topic: "Rebirth & Transformation",
    description:
      "Ruler of deep transformation, rebirth, hidden power, and releasing the old.",
  },
};

interface ZodiacSign {
  name: string;
  symbol: string;
  element: "Fire" | "Earth" | "Air" | "Water";
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: "Aries", symbol: "♈", element: "Fire" },
  { name: "Taurus", symbol: "♉", element: "Earth" },
  { name: "Gemini", symbol: "♊", element: "Air" },
  { name: "Cancer", symbol: "♋", element: "Water" },
  { name: "Leo", symbol: "♌", element: "Fire" },
  { name: "Virgo", symbol: "♍", element: "Earth" },
  { name: "Libra", symbol: "♎", element: "Air" },
  { name: "Scorpio", symbol: "♏", element: "Water" },
  { name: "Sagittarius", symbol: "♐", element: "Fire" },
  { name: "Capricorn", symbol: "♑", element: "Earth" },
  { name: "Aquarius", symbol: "♒", element: "Air" },
  { name: "Pisces", symbol: "♓", element: "Water" },
];

function getZodiacFromLongitude(deg: number): ZodiacSign {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

export interface DetailedPlanetPosition {
  planet: string;
  name: string;
  signName: string;
  degInSign: number;
  zodiacSymbol: string;
  progressPercent: number;
  isRetrograde: boolean;
  meta: (typeof PLANET_METADATA)[string];
}

function calculateCurrentPlanetaryPositions(
  date = new Date(),
  overrideRetrogrades?: Record<string, boolean>
): DetailedPlanetPosition[] {
  const todayLongs = getRawLongitudes(date);
  const tomorrowObj = new Date(date.getTime() + 86400000);
  const tomorrowLongs = getRawLongitudes(tomorrowObj);

  const rawPlanets = [
    { symbol: "☉", name: "Sun", longitude: todayLongs.Sun, isRetro: false },
    { symbol: "☾", name: "Moon", longitude: todayLongs.Moon, isRetro: false },
    {
      symbol: "☿",
      name: "Mercury",
      longitude: todayLongs.Mercury,
      isRetro:
        overrideRetrogrades?.Mercury ??
        checkRetrograde(todayLongs.Mercury, tomorrowLongs.Mercury),
    },
    {
      symbol: "♀",
      name: "Venus",
      longitude: todayLongs.Venus,
      isRetro:
        overrideRetrogrades?.Venus ??
        checkRetrograde(todayLongs.Venus, tomorrowLongs.Venus),
    },
    {
      symbol: "♂",
      name: "Mars",
      longitude: todayLongs.Mars,
      isRetro:
        overrideRetrogrades?.Mars ??
        checkRetrograde(todayLongs.Mars, tomorrowLongs.Mars),
    },
    {
      symbol: "♃",
      name: "Jupiter",
      longitude: todayLongs.Jupiter,
      isRetro:
        overrideRetrogrades?.Jupiter ??
        checkRetrograde(todayLongs.Jupiter, tomorrowLongs.Jupiter),
    },
    {
      symbol: "♄",
      name: "Saturn",
      longitude: todayLongs.Saturn,
      isRetro:
        overrideRetrogrades?.Saturn ??
        checkRetrograde(todayLongs.Saturn, tomorrowLongs.Saturn),
    },
    {
      symbol: "♅",
      name: "Uranus",
      longitude: todayLongs.Uranus,
      isRetro:
        overrideRetrogrades?.Uranus ??
        checkRetrograde(todayLongs.Uranus, tomorrowLongs.Uranus),
    },
    {
      symbol: "♆",
      name: "Neptune",
      longitude: todayLongs.Neptune,
      isRetro:
        overrideRetrogrades?.Neptune ??
        checkRetrograde(todayLongs.Neptune, tomorrowLongs.Neptune),
    },
    {
      symbol: "♇",
      name: "Pluto",
      longitude: todayLongs.Pluto,
      isRetro:
        overrideRetrogrades?.Pluto ??
        checkRetrograde(todayLongs.Pluto, tomorrowLongs.Pluto),
    },
  ];

  return rawPlanets.map((p) => {
    const signInfo = getZodiacFromLongitude(p.longitude);
    const degInSign = Math.floor(((p.longitude % 30) + 30) % 30);
    const progressPercent = Math.min(100, Math.max(5, (degInSign / 30) * 100));

    return {
      planet: p.symbol,
      name: p.name,
      signName: signInfo.name,
      degInSign,
      zodiacSymbol: signInfo.symbol,
      progressPercent,
      isRetrograde: p.isRetro,
      meta: PLANET_METADATA[p.name] || PLANET_METADATA.Sun,
    };
  });
}

// ---------------------------------------------------------------------------
// 🌕 АНИМИРАН 3D ВИЗУАЛИЗАТОР НА ЛУНАТА
// ---------------------------------------------------------------------------
function AnimatedMoonVisualizer({ moonPhase }: { moonPhase: ReturnType<typeof getMoonPhaseData> }) {
  const { colors } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const shadowTranslateX = (moonPhase.phasePercent / 100) * 80 - 40;

  return (
    <View style={styles.moonVisualizerContainer}>
      <Animated.View
        style={[
          styles.moonAuraGlow,
          {
            backgroundColor: moonPhase.isSpecial ? colors.gold : colors.purple,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <View style={styles.moonSphereBody}>
        <LinearGradient
          colors={["#FDFBF7", "#E2D9C8", "#9E9484"]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.moonBaseGradient}
        >
          <View style={[styles.crater, { top: 12, left: 16, width: 14, height: 14 }]} />
          <View style={[styles.crater, { top: 38, left: 24, width: 20, height: 20 }]} />
          <View style={[styles.crater, { bottom: 16, right: 18, width: 16, height: 16 }]} />
          <View style={[styles.crater, { top: 22, right: 28, width: 10, height: 10 }]} />

          <View
            style={[
              styles.moonShadowOverlay,
              {
                backgroundColor: "#0D0A14",
                opacity: 1 - moonPhase.illuminated / 100,
                transform: [{ translateX: shadowTranslateX }],
              },
            ]}
          />
        </LinearGradient>
      </View>

      <View style={[styles.illuminationBadge, { borderColor: colors.gold }]}>
        <T bold size={10} style={{ color: colors.gold }}>
          {moonPhase.illuminated}%
        </T>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 📅 7-ДНЕВНА ЛУННА ПРОГНОЗА
// ---------------------------------------------------------------------------
function Moon7DayForecast() {
  const { colors } = useApp();

  const forecast = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const phaseData = getMoonPhaseData(d);
      const dayName =
        i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      list.push({
        dayName,
        dateStr,
        ...phaseData,
      });
    }
    return list;
  }, []);

  return (
    <View style={{ marginTop: 18, marginBottom: 10 }}>
      <View style={styles.sectionHeaderRow}>
        <Section>Moon 7-Day Forecast</Section>
        <Calendar size={15} color={colors.gold} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 6 }}
      >
        {forecast.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.forecastCard,
              {
                backgroundColor: item.isSpecial ? colors.surfaceAlt : colors.surface,
                borderColor: item.isSpecial ? colors.gold : colors.line,
              },
            ]}
          >
            <T bold size={12} style={{ color: item.dayName === "Today" ? colors.gold : colors.text }}>
              {item.dayName}
            </T>
            <T muted size={9} style={{ marginBottom: 6 }}>
              {item.dateStr}
            </T>

            <T size={26} style={{ marginVertical: 4 }}>
              {item.symbol}
            </T>

            <T bold size={11} style={{ color: colors.text, textAlign: "center", height: 28 }}>
              {item.phaseName}
            </T>

            <View style={styles.forecastIllumPill}>
              <T bold size={9} style={{ color: colors.gold }}>
                {item.illuminated}% illum
              </T>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ℞ СЕКЦИЯ ЗА РЕТРОГРАДНИ ПЛАНЕТИ (С АВТОМАТИЧНО ТЕГЛЕНЕ И СМЕТАНЕ)
// ---------------------------------------------------------------------------
function RetrogradeSection({
  planetaryPositions,
}: {
  planetaryPositions: DetailedPlanetPosition[];
}) {
  const { colors } = useApp();

  const retrogradePlanets = useMemo(
    () => planetaryPositions.filter((p) => p.isRetrograde),
    [planetaryPositions]
  );

  return (
    <View style={{ marginTop: 18, marginBottom: 14 }}>
      <View style={styles.sectionHeaderRow}>
        <Section>Retrograde Motion (℞)</Section>
        <RotateCcw size={15} color={colors.purple} />
      </View>

      {retrogradePlanets.length === 0 ? (
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 }}>
          <Sparkles size={18} color={colors.gold} />
          <T size={12} style={{ color: colors.text, flex: 1 }}>
            All planets are currently in Direct motion. Cosmic energy is flowing forward!
          </T>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {retrogradePlanets.map((planet) => (
            <Card
              key={planet.name}
              style={[
                styles.retroCard,
                { borderColor: colors.purple, backgroundColor: colors.surface },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <T size={22} style={{ color: colors.gold }}>
                  {planet.planet}
                </T>
                <View style={styles.retroBadge}>
                  <T bold size={10} style={{ color: "#FFF" }}>
                    ℞ RETROGRADE
                  </T>
                </View>
              </View>

              <T bold size={14} style={{ color: colors.text, marginTop: 4 }}>
                {planet.name}
              </T>
              <T size={11} style={{ color: colors.purple }}>
                in {planet.zodiacSymbol} {planet.signName} ({planet.degInSign}°)
              </T>
              <T muted size={9} style={{ marginTop: 4 }}>
                Re-evaluate & reflect on {planet.meta.topic}
              </T>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 🥠 FORTUNE COOKIE
// ---------------------------------------------------------------------------
function UltraRealisticFortuneCookie({
  onOpenConfetti,
}: {
  onOpenConfetti: () => void;
}) {
  const { colors, addStory } = useApp();
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [hasPostedToStory, setHasPostedToStory] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState(0);

  const fortunes = [
    "A quiet step today will open an unexpected door tomorrow.",
    "Trust the small steps. They are taking you somewhere meaningful.",
    "You are allowed to grow beyond the version of yourself you once knew.",
    "The universe is preparing a delightful surprise for you this week.",
    "Your intuition is stronger than ever today — listen closely.",
    "A fresh surge of cosmic energy and inspiration is entering your life.",
    "The harmony you seek is already blooming within you.",
  ];

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const splitAnim = useRef(new Animated.Value(0)).current;
  const paperAnim = useRef(new Animated.Value(0)).current;
  const auraAnim = useRef(new Animated.Value(0)).current;

  const handleCrackCookie = async () => {
    if (isAnimating) return;

    if (isOpened) {
      setIsAnimating(true);
      setHasPostedToStory(false);
      Animated.parallel([
        Animated.timing(splitAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(paperAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(auraAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setIsOpened(false);
        setIsAnimating(false);
        setFortuneIndex((prev) => (prev + 1) % fortunes.length);
      });
      return;
    }

    setIsAnimating(true);
    setHasPostedToStory(false);

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1.5, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1.5, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 2, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -2, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),

      Animated.parallel([
        Animated.timing(auraAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(splitAnim, {
          toValue: 1,
          friction: 5.5,
          tension: 38,
          useNativeDriver: true,
        }),
        Animated.timing(paperAnim, {
          toValue: 1,
          duration: 550,
          delay: 120,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsAnimating(false);
      setIsOpened(true);
      onOpenConfetti();
    });
  };

  const handlePostToStory = async () => {
    if (isPostingStory || hasPostedToStory) return;
    setIsPostingStory(true);

    try {
      const currentFortuneText = fortunes[fortuneIndex];
      const formattedText = `✦ NATALA FORTUNE ✦\n\n\n"${currentFortuneText}"\n\n\n✦ COSMIC DISCOVERY ✦`;
      const fortuneCardUrl = `https://placehold.co/600x1066/120E1F/EAB308.png?text=${encodeURIComponent(formattedText)}`;

      const base64Image = await fetchImageAsBase64(fortuneCardUrl);

      await addStory(base64Image);
      setHasPostedToStory(true);
      Alert.alert("Success! ✨", "Your fortune card has been posted to your Story!");
    } catch (error) {
      console.error("Error posting to story:", error);
      Alert.alert("Error", "Could not post to Story. Please try again.");
    } finally {
      setIsPostingStory(false);
    }
  };

  const shakeRotate = shakeAnim.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: ["-18deg", "0deg", "18deg"],
  });

  const shakeTranslateY = shakeAnim.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: [-4, 0, 4],
  });

  const leftTranslateX = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -68],
  });
  const leftRotateZ = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-48deg"],
  });
  const leftRotateY = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-35deg"],
  });

  const rightTranslateX = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 68],
  });
  const rightRotateZ = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "48deg"],
  });
  const rightRotateY = splitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "35deg"],
  });

  const paperTranslateY = paperAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, -75],
  });
  const paperScale = paperAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 1],
  });
  const paperOpacity = paperAnim;

  const auraScale = auraAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.4],
  });
  const auraOpacity = auraAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.9, 0.35],
  });

  const currentFortune = fortunes[fortuneIndex];

  return (
    <Card
      style={{
        width: "100%",
        minHeight: 320,
        padding: 18,
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <View style={{ alignItems: "center", gap: 3 }}>
        <T bold size={17} style={{ textAlign: "center", color: colors.text }}>
          {isOpened ? "Your Daily Fortune" : "Cosmic Fortune Cookie"}
        </T>
        <T muted size={11} style={{ textAlign: "center" }}>
          {isOpened
            ? "Inspired by the stars for your journey today"
            : "Tap the cookie to reveal what awaits you today"}
        </T>
      </View>

      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleCrackCookie}
        disabled={isAnimating}
        style={styles.cookieStage}
      >
        <Animated.View
          style={[
            styles.cosmicAura,
            {
              backgroundColor: colors.gold,
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.cookie3DWrapper,
            {
              transform: [{ translateY: shakeTranslateY }, { rotate: shakeRotate }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.fortunePaper,
              {
                borderColor: colors.gold,
                opacity: paperOpacity,
                transform: [{ translateY: paperTranslateY }, { scale: paperScale }],
              },
            ]}
          >
            <LinearGradient
              colors={["#FFFDF5", "#FFF7E6", "#FFF0D4"]}
              style={styles.paperGradient}
            >
              <View style={styles.paperInnerBorder}>
                <Sparkles size={16} color={colors.gold} style={{ marginBottom: 4 }} />
                <T
                  bold
                  size={12}
                  style={{
                    color: "#2D2140",
                    textAlign: "center",
                    lineHeight: 17,
                  }}
                >
                  "{currentFortune}"
                </T>
                <T size={9} style={{ color: colors.purple, marginTop: 6, letterSpacing: 1.5 }}>
                  ✦ NATALA DISCOVERY ✦
                </T>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.cookie3DHalf,
              styles.cookieLeftHalf,
              {
                transform: [
                  { translateX: leftTranslateX },
                  { rotateZ: leftRotateZ },
                  { rotateY: leftRotateY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#FBBF24", "#D97706", "#B45309", "#78350F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cookieGradient}
            >
              <View style={styles.cookieHighlight} />
              <View style={styles.cookieCreaseLeft} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.cookie3DHalf,
              styles.cookieRightHalf,
              {
                transform: [
                  { translateX: rightTranslateX },
                  { rotateZ: rightRotateZ },
                  { rotateY: rightRotateY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706", "#92400E", "#451A03"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cookieGradient}
            >
              <View style={styles.cookieHighlightRight} />
              <View style={styles.cookieCreaseRight} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <View style={{ alignItems: "center", gap: 10, width: "100%", marginTop: 10 }}>
        <Pill selected={isOpened} onPress={handleCrackCookie} disabled={isAnimating}>
          {isOpened ? "✦ Crack Another Fortune Cookie" : "✦ Crack Your Fortune Cookie"}
        </Pill>

        {isOpened && (
          <TouchableOpacity
            onPress={handlePostToStory}
            disabled={isPostingStory || hasPostedToStory}
            style={[
              styles.actionButton,
              styles.storyActionButton,
              hasPostedToStory && { opacity: 0.75 },
            ]}
            activeOpacity={0.7}
          >
            {isPostingStory ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : hasPostedToStory ? (
              <>
                <CheckCircle size={15} color={colors.gold} />
                <T bold size={12} style={{ color: colors.gold }}>
                  Posted to Story ✓
                </T>
              </>
            ) : (
              <>
                <PlusCircle size={15} color={colors.gold} />
                <T bold size={12} style={{ color: colors.gold }}>
                  ✦ Add to Story
                </T>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 🏠 MAIN HOME SCREEN
// ---------------------------------------------------------------------------
export default function Home() {
  const { colors, setPage, fetchActiveStories } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<DetailedPlanetPosition | null>(null);
  const [onlineRetrogrades, setOnlineRetrogrades] = useState<Record<string, boolean> | undefined>(undefined);

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // Извличане на онлайн данни при зареждане
  useEffect(() => {
    (async () => {
      const liveData = await fetchOnlineRetrogrades();
      if (liveData) {
        setOnlineRetrogrades(liveData);
      }
    })();
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfettiKey((prev) => prev + 1);
    setShowConfetti(true);
  }, []);

  const planetaryPositions = useMemo(
    () => calculateCurrentPlanetaryPositions(new Date(), onlineRetrogrades),
    [onlineRetrogrades]
  );
  const currentMoonPhase = useMemo(() => getMoonPhaseData(), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const liveData = await fetchOnlineRetrogrades();
      if (liveData) {
        setOnlineRetrogrades(liveData);
      }
      if (typeof fetchActiveStories === "function") {
        await fetchActiveStories();
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveStories]);

  const getElementColor = (element: string) => {
    switch (element) {
      case "Fire":
        return "#EF4444";
      case "Earth":
        return "#10B981";
      case "Air":
        return "#3B82F6";
      case "Water":
        return "#8B5CF6";
      default:
        return colors.gold;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 10, flexGrow: 1 }}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
            colors={[colors.purple]}
            progressBackgroundColor={colors.surface}
            enabled={true}
          />
        }
      >
        {/* Top Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <Brand />
          <T size={11} style={{ color: colors.gold }}>
            ✦ YOUR DAILY SPACE
          </T>
        </View>

        {/* Stories */}
        <Section>Stories & Inspiration</Section>
        <StoryViewer demoStories={demoStories} />

        {/* Streak Card */}
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Card
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 13,
            }}
          >
            <T size={21}>🔥</T>
            <View
              style={{
                backgroundColor: colors.goldSoft,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <T bold size={13} style={{ color: colors.gold }}>
                7 day · 7 Nov
              </T>
            </View>
            <T bold size={13}>discovery streak</T>
          </Card>
        </View>

        {/* Daily Gift Section */}
        <Section>Open your daily gift</Section>
        <View style={{ width: "100%", marginBottom: 16 }}>
          <UltraRealisticFortuneCookie onOpenConfetti={triggerConfetti} />
        </View>

        {/* 🌕 THE SKY TODAY & ANIMATED MOON VISUALIZER */}
        <Section>The sky today</Section>
        <View style={{ gap: 10 }}>
          <Card>
            <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
              <AnimatedMoonVisualizer moonPhase={currentMoonPhase} />

              <View style={{ flex: 1 }}>
                <T bold size={18}>
                  {currentMoonPhase.phaseName}
                </T>
                <T muted size={12}>
                  Age: {currentMoonPhase.ageInDays} days · {currentMoonPhase.illuminated}% Illuminated
                </T>
                <T size={12} style={{ color: colors.gold, marginTop: 5 }}>
                  ☾ In{" "}
                  {planetaryPositions.find((p) => p.name === "Moon")?.signName || "Gemini"}
                </T>
              </View>
            </View>
          </Card>

          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <T size={40} style={{ color: colors.gold }}>
                {planetaryPositions.find((p) => p.name === "Sun")?.zodiacSymbol || "♏"}
              </T>
              <View style={{ flex: 1 }}>
                <T bold size={18}>
                  {planetaryPositions.find((p) => p.name === "Sun")?.signName || "Scorpio"} season
                </T>
                <T muted size={12}>
                  A deeper month. A quieter kind of power.
                </T>
              </View>
            </View>
          </Card>
        </View>

        {/* 📅 7-ДНЕВНА ЛУННА ПРОГНОЗА */}
        <Moon7DayForecast />

        {/* ℞ СЕКЦИЯ ЗА РЕТРОГРАДНИ ПЛАНЕТИ */}
        <RetrogradeSection planetaryPositions={planetaryPositions} />

        {/* Planetary Codex */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          <Section>Planetary Codex</Section>
          <T size={11} style={{ color: colors.gold }}>
            ✦ TAP FOR ENCYCLOPEDIA
          </T>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 10 }}
        >
          {planetaryPositions.map((item) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.88}
              onPress={() => setSelectedPlanet(item)}
              style={[
                styles.planetEncyclopediaCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: item.isRetrograde ? colors.purple : colors.line,
                },
              ]}
            >
              <View style={styles.planetImageFrame}>
                <Image
                  source={{ uri: item.meta.image }}
                  style={styles.planetSphereImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.planetSymbolBadge,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <T bold size={12} style={{ color: colors.gold }}>
                    {item.planet}
                  </T>
                </View>

                {item.isRetrograde && (
                  <View style={styles.cardRetroBadge}>
                    <T bold size={9} style={{ color: "#FFF" }}>
                      ℞
                    </T>
                  </View>
                )}
              </View>

              <View style={{ marginTop: 10, alignItems: "center", gap: 2 }}>
                <T bold size={15} style={{ color: colors.text }}>
                  {item.name}
                </T>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <T size={18} style={{ color: colors.purple }}>
                    {item.zodiacSymbol}
                  </T>
                  <T bold size={13} style={{ color: colors.gold }}>
                    {item.signName} {item.degInSign}°
                  </T>
                </View>
              </View>

              <View style={styles.degreeProgressTrack}>
                <View
                  style={[
                    styles.degreeProgressFill,
                    {
                      width: `${item.progressPercent}%`,
                      backgroundColor: getElementColor(item.meta.element),
                    },
                  ]}
                />
              </View>

              <View style={styles.cardBottomMeta}>
                <T muted size={10} style={{ textAlign: "center" }}>
                  {item.meta.topic}
                </T>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Modal / Codex Entry Sheet */}
        <Modal
          visible={selectedPlanet !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedPlanet(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedPlanet(null)}
          >
            {selectedPlanet && (
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={[
                  styles.encyclopediaModalSheet,
                  { backgroundColor: colors.surface, borderColor: colors.purple },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedPlanet(null)}
                  style={styles.modalCloseIcon}
                >
                  <X color={colors.text} size={22} />
                </TouchableOpacity>

                <View style={{ alignItems: "center", gap: 12 }}>
                  <View style={styles.modalPlanetImageContainer}>
                    <Image
                      source={{ uri: selectedPlanet.meta.image }}
                      style={styles.modalPlanetImage}
                    />
                  </View>

                  <View style={{ alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <T size={30} style={{ color: colors.gold }}>
                        {selectedPlanet.planet}
                      </T>
                      <T bold size={24} style={{ color: colors.text }}>
                        {selectedPlanet.name}
                      </T>
                      {selectedPlanet.isRetrograde && (
                        <View style={styles.retroBadge}>
                          <T bold size={10} style={{ color: "#FFF" }}>
                            ℞ RETROGRADE
                          </T>
                        </View>
                      )}
                    </View>
                    <T size={13} style={{ color: colors.purple }}>
                      Ruler of {selectedPlanet.meta.ruler}
                    </T>
                  </View>
                </View>

                <View
                  style={[
                    styles.modalStatusBanner,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
                  ]}
                >
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <T muted size={10}>
                      CURRENT SIGN
                    </T>
                    <T bold size={16} style={{ color: colors.gold, marginTop: 2 }}>
                      {selectedPlanet.zodiacSymbol} {selectedPlanet.signName}
                    </T>
                  </View>

                  <View
                    style={{
                      width: 1,
                      height: "80%",
                      backgroundColor: colors.line,
                    }}
                  />

                  <View style={{ alignItems: "center", flex: 1 }}>
                    <T muted size={10}>
                      EXACT DEGREE
                    </T>
                    <T bold size={16} style={{ color: colors.text, marginTop: 2 }}>
                      {selectedPlanet.degInSign}° / 30°
                    </T>
                  </View>
                </View>

                <View style={{ gap: 8, marginVertical: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Globe size={16} color={colors.gold} />
                    <T bold size={14} style={{ color: colors.gold }}>
                      Cosmic Essence & Meaning
                    </T>
                  </View>
                  <T size={13} style={{ color: colors.text, lineHeight: 20 }}>
                    {selectedPlanet.meta.description}
                  </T>
                </View>

                <Pill selected onPress={() => setSelectedPlanet(null)}>
                  ✦ Close Codex Entry
                </Pill>
              </Pressable>
            )}
          </Pressable>
        </Modal>

        <Pressable
          onPress={() => setPage("explore")}
          style={{ paddingVertical: 20, alignItems: "center" }}
        >
          <T bold size={13} style={{ color: colors.purple }}>
            Explore the full sky ↗
          </T>
        </Pressable>
      </ScrollView>

      {/* FULLSCREEN CONFETTI CANNON OVERLAY */}
      {showConfetti && (
        <View style={styles.fullScreenConfettiOverlay} pointerEvents="none">
          <ConfettiCannon
            key={confettiKey}
            count={100}
            origin={{ x: width / 2, y: height }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3200}
            explosionSpeed={450}
            colors={["#FBBF24", "#A855F7", "#EC4899", "#3B82F6", "#10B981", "#EAB308"]}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  fullScreenConfettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },

  /* Moon Visualizer Styles */
  moonVisualizerContainer: {
    width: 82,
    height: 82,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  moonAuraGlow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    opacity: 0.25,
  },
  moonSphereBody: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  moonBaseGradient: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  crater: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(100, 90, 80, 0.25)",
    borderWidth: 0.8,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  moonShadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  illuminationBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#161224",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },

  /* Section Header Row */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  /* 7-Day Forecast Styles */
  forecastCard: {
    width: 96,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  forecastIllumPill: {
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },

  /* Retrograde Section Styles */
  retroCard: {
    width: 165,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  retroBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardRetroBadge: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFF",
  },

  /* Cookie Styles */
  cookieStage: {
    height: 140,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
    position: "relative",
  },
  cosmicAura: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cookie3DWrapper: {
    width: 140,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cookie3DHalf: {
    position: "absolute",
    width: 62,
    height: 84,
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  cookieLeftHalf: {
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    left: 10,
  },
  cookieRightHalf: {
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    right: 10,
  },
  cookieGradient: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  cookieHighlight: {
    position: "absolute",
    top: 6,
    left: 8,
    width: 24,
    height: 38,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  cookieHighlightRight: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 24,
    height: 38,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  cookieCreaseLeft: {
    position: "absolute",
    right: 2,
    top: 15,
    width: 12,
    height: 54,
    borderRadius: 6,
    backgroundColor: "rgba(69, 26, 3, 0.45)",
  },
  cookieCreaseRight: {
    position: "absolute",
    left: 2,
    top: 15,
    width: 12,
    height: 54,
    borderRadius: 6,
    backgroundColor: "rgba(69, 26, 3, 0.45)",
  },
  fortunePaper: {
    position: "absolute",
    width: 175,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  paperGradient: {
    width: "100%",
    padding: 3,
  },
  paperInnerBorder: {
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
    borderStyle: "dashed",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(234, 179, 8, 0.14)",
  },
  storyActionButton: {
    backgroundColor: "rgba(234, 179, 8, 0.14)",
  },

  /* Codex Styles */
  planetEncyclopediaCard: {
    width: 160,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  planetImageFrame: {
    width: 84,
    height: 84,
    borderRadius: 42,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  planetSphereImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  planetSymbolBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  degreeProgressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    marginVertical: 10,
    overflow: "hidden",
  },
  degreeProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardBottomMeta: {
    width: "100%",
    paddingTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  encyclopediaModalSheet: {
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalCloseIcon: {
    alignSelf: "flex-end",
    padding: 4,
  },
  modalPlanetImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#EAB308",
  },
  modalPlanetImage: {
    width: "100%",
    height: "100%",
  },
  modalStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
  },
});