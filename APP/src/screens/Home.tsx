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
import { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  X,
  Globe,
  Sparkles,
  PlusCircle,
  CheckCircle,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { Brand, Card, T, Section, Pill } from "../components/UI";
import { stories as demoStories } from "../data/demo";
import { useApp } from "../context/AppContext";
import { StoryViewer } from "../components/StoryViewer";
import { Planet3D } from "../components/planets";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = "http://10.159.206.3:5000";

const ZODIAC_SIGNS_DATA = [
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

export function getZodiacInfo(longitude: number) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const degree = Math.floor(normalized % 30);
  const signData = ZODIAC_SIGNS_DATA[index] || ZODIAC_SIGNS_DATA[0];
  return {
    sign: signData.name,
    symbol: signData.symbol,
    element: signData.element as "Fire" | "Earth" | "Air" | "Water",
    degree,
  };
}

/** Извлича еклиптична дължина за планета през собствения Express бекенд */
export async function fetchJPLPlanetPosition(
  planetName: string,
  dateObj = new Date()
): Promise<{ longitude: number; sign: string; degree: number; symbol: string } | null> {
  try {
    const dateStr = dateObj.toISOString().split("T")[0];
    const response = await fetch(
      `${API_BASE_URL}/api/horizons?planet=${planetName}&date=${dateStr}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data && typeof data.longitude === "number") {
      return {
        longitude: data.longitude,
        sign: data.sign,
        degree: data.degree,
        symbol: data.symbol,
      };
    }
    return null;
  } catch (error) {
    console.warn(`[JPL Horizons Proxy Error] ${planetName}:`, error);
    return null;
  }
}

/** Изчислява прецизно фазата, осветеността и възрастта на Луната */
export function getMoonPhaseData(date = new Date()) {
  const synodicMonth = 29.53058770576;
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

/** Алгоритмичен резервен изчислетел (Fallback при офлайн режим) */
function getFallbackRawLongitudes(dObj: Date) {
  const julianDate = dObj.getTime() / 86400000 + 2440587.5;
  const d = julianDate - 2451545.0;

  const g = (((357.529 + 0.98560028 * d) % 360) * Math.PI) / 180;
  const sunLong =
    (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360;

  const Lm = (218.316 + 13.176396 * d) % 360;
  const Mm = (((134.963 + 13.064993 * d) % 360) * Math.PI) / 180;
  const Fm = (((93.272 + 13.22935 * d) % 360) * Math.PI) / 180;
  const moonLong =
    (Lm + 6.289 * Math.sin(Mm) - 1.274 * Math.sin(Mm - 2 * Fm)) % 360;

  const earthLong = (sunLong + 180) % 360;

  const mercMean = (252.251 + 4.0923344 * d) % 360;
  const mercLong =
    (sunLong + 23 * Math.sin((((mercMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  const venusMean = (181.979 + 1.6021302 * d) % 360;
  const venusLong =
    (sunLong + 42 * Math.sin((((venusMean - sunLong) % 360) * Math.PI) / 180)) % 360;

  const calcOuterGeocentric = (helioMeanLong: number, semiMajorAxis: number) => {
    const alpha = (((earthLong - helioMeanLong) % 360) * Math.PI) / 180;
    const theta = Math.atan2(Math.sin(alpha), semiMajorAxis - Math.cos(alpha));
    return (((helioMeanLong + (theta * 180) / Math.PI) % 360) + 360) % 360;
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

function checkRetrograde(todayDeg: number, tomorrowDeg: number): boolean {
  let diff = tomorrowDeg - todayDeg;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

const PLANET_METADATA: Record<
  string,
  {
    image: string;
    ruler: string;
    element: "Fire" | "Earth" | "Air" | "Water";
    topic: string;
    description: string;
    symbol: string;
  }
> = {
  Sun: {
    symbol: "☉",
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
    ruler: "Leo",
    element: "Fire",
    topic: "Identity & Core Essence",
    description:
      "Our cosmic heart and source of vitality. Defines our willpower, self-expression, and core identity.",
  },
  Moon: {
    symbol: "☾",
    image:
      "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop",
    ruler: "Cancer",
    element: "Water",
    topic: "Emotions & Intuition",
    description:
      "Guardian of the subconscious, emotional realm, inner comfort, and intuitive reactions.",
  },
  Mercury: {
    symbol: "☿",
    image:
      "https://images.unsplash.com/photo-1545156521-77bd85671d30?q=80&w=600&auto=format&fit=crop",
    ruler: "Gemini / Virgo",
    element: "Air",
    topic: "Mind & Communication",
    description:
      "Planet of thought, speech, logic, and mental agility. Governs how we process information.",
  },
  Venus: {
    symbol: "♀",
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Taurus / Libra",
    element: "Earth",
    topic: "Love, Beauty & Values",
    description:
      "Goddess of beauty, love, harmony, art, and what we truly value in relationships.",
  },
  Mars: {
    symbol: "♂",
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
    ruler: "Aries",
    element: "Fire",
    topic: "Drive, Action & Courage",
    description:
      "The zodiac warrior – defines how we assert ourselves, direct our passion, and overcome obstacles.",
  },
  Jupiter: {
    symbol: "♃",
    image:
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop",
    ruler: "Sagittarius",
    element: "Fire",
    topic: "Expansion & Wisdom",
    description:
      "The great benefactor – brings growth, abundance, philosophical depth, and new horizons.",
  },
  Saturn: {
    symbol: "♄",
    image:
      "https://images.unsplash.com/photo-1614732484003-ef9881555dc3?q=80&w=600&auto=format&fit=crop",
    ruler: "Capricorn",
    element: "Earth",
    topic: "Discipline & Time",
    description:
      "The great teacher – builds boundaries, structure, discipline, maturity, and karmic lessons.",
  },
  Uranus: {
    symbol: "♅",
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Aquarius",
    element: "Air",
    topic: "Awakening & Innovation",
    description:
      "Catalyst for change, genius, freedom, originality, and sudden revolutionary breakthroughs.",
  },
  Neptune: {
    symbol: "♆",
    image:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
    ruler: "Pisces",
    element: "Water",
    topic: "Dreams & Mysticism",
    description:
      "Planet of illusions, higher spirituality, creative inspiration, dreams, and cosmic oneness.",
  },
  Pluto: {
    symbol: "♇",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    ruler: "Scorpio",
    element: "Water",
    topic: "Rebirth & Transformation",
    description:
      "Ruler of deep transformation, rebirth, hidden power, and releasing the old.",
  },
};

export interface DetailedPlanetPosition {
  planet: string;
  name: string;
  signName: string;
  degInSign: number;
  zodiacSymbol: string;
  progressPercent: number;
  isRetrograde: boolean;
  longitude: number;
  isLiveNASA?: boolean;
  meta: (typeof PLANET_METADATA)[string];
}

// ---------------------------------------------------------------------------
// 🌕 ANIMATED MOON VISUALIZER
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
// 📅 MOON 7-DAY FORECAST & INTERACTIVE CALENDAR MODAL
// ---------------------------------------------------------------------------
function Moon7DayForecast() {
  const { colors } = useApp();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

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

  // Изчисляване на Луната и зодиака за избраната дата в календара
  const selectedMoonPhase = useMemo(
    () => getMoonPhaseData(selectedCalendarDate),
    [selectedCalendarDate]
  );

  const selectedMoonZodiac = useMemo(() => {
    const raw = getFallbackRawLongitudes(selectedCalendarDate);
    return getZodiacInfo(raw.Moon);
  }, [selectedCalendarDate]);

  // Генератор на дните за текущо избрания месец
  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Смятане с Понеделник = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      daysArray.push(new Date(year, month, day));
    }
    return { year, month, daysArray };
  }, [currentMonthDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + offset,
      1
    );
    setCurrentMonthDate(newDate);
  };

  return (
    <View style={{ marginTop: 18, marginBottom: 10 }}>
      <View style={styles.sectionHeaderRow}>
        <Section>Moon 7-Day Forecast</Section>
        {/* Кликването върху жълтия календар отваря модала */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowCalendarModal(true)}
          style={{ padding: 4 }}
        >
          <Calendar size={18} color={colors.gold} />
        </TouchableOpacity>
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

      {/* 🌕 COSMIC MOON CALENDAR MODAL */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCalendarModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.encyclopediaModalSheet,
              { backgroundColor: colors.surface, borderColor: colors.gold },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Calendar size={20} color={colors.gold} />
                <T bold size={18} style={{ color: colors.text }}>
                  Cosmic Moon Calendar
                </T>
              </View>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>

            {/* Избор на Месец */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <ChevronLeft size={22} color={colors.gold} />
              </TouchableOpacity>
              <T bold size={16} style={{ color: colors.gold }}>
                {currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </T>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <ChevronRight size={22} color={colors.gold} />
              </TouchableOpacity>
            </View>

            {/* Дни от седмицата */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 4 }}>
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, i) => (
                <T key={i} bold size={12} style={{ color: colors.purple, width: 38, textAlign: "center" }}>
                  {day}
                </T>
              ))}
            </View>

            {/* Решетка на Календара */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
              {calendarGrid.daysArray.map((dateObj, idx) => {
                if (!dateObj) {
                  return <View key={`empty-${idx}`} style={{ width: "14.28%", height: 42 }} />;
                }

                const isSelected =
                  dateObj.toDateString() === selectedCalendarDate.toDateString();
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const dayMoon = getMoonPhaseData(dateObj);

                return (
                  <TouchableOpacity
                    key={dateObj.toISOString()}
                    onPress={() => setSelectedCalendarDate(dateObj)}
                    style={{
                      width: "14.28%",
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? colors.gold
                        : isToday
                        ? colors.purpleSoft
                        : "transparent",
                      borderWidth: isSelected ? 0 : isToday ? 1 : 0,
                      borderColor: colors.purple,
                      marginVertical: 2,
                    }}
                  >
                    <T
                      bold={isSelected || isToday}
                      size={12}
                      style={{ color: isSelected ? "#000" : colors.text }}
                    >
                      {dateObj.getDate()}
                    </T>
                    <T size={10}>{dayMoon.symbol}</T>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Карта с Астро Детайли за Избрания Ден */}
            <Card style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.gold, padding: 14 }}>
              <T bold size={13} style={{ color: colors.gold, marginBottom: 6 }}>
                ✦ {selectedCalendarDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </T>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <T size={32}>{selectedMoonPhase.symbol}</T>
                  <View>
                    <T bold size={15} style={{ color: colors.text }}>
                      {selectedMoonPhase.phaseName}
                    </T>
                    <T muted size={11}>
                      {selectedMoonPhase.illuminated}% Illuminated · Age: {selectedMoonPhase.ageInDays}d
                    </T>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <T bold size={18} style={{ color: colors.gold }}>
                    {selectedMoonZodiac.symbol} {selectedMoonZodiac.sign}
                  </T>
                  <T muted size={11}>
                    {selectedMoonZodiac.degree}° in Sign
                  </T>
                </View>
              </View>
            </Card>

            <Pill selected onPress={() => setShowCalendarModal(false)}>
              ✦ Close Moon Calendar
            </Pill>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ℞ RETROGRADE SECTION
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
// 🥠 FORTUNE COOKIE WITH CUSTOM 9:16 STORY CARD
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

  // Ref за скритата 9:16 Story карта
  const fortuneStoryCardRef = useRef<View>(null);

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

  // Споделяне на изработената 9:16 Story карта в Стори
  const handlePostToStory = async () => {
    if (isPostingStory || hasPostedToStory) return;
    setIsPostingStory(true);

    try {
      const base64Image = await captureRef(fortuneStoryCardRef, {
        format: "png",
        quality: 1.0,
        result: "base64",
      });

      await addStory(base64Image);
      setHasPostedToStory(true);
      Alert.alert("Success! ✨", "Your custom fortune card has been posted to your Story!");
    } catch (error) {
      console.error("Error capturing or posting fortune story:", error);
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
    <>
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

      {/* DESIGNED FORTUNE COOKIE STORY CARD (9:16 ASPECT RATIO) */}
      <View
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
        }}
        pointerEvents="none"
      >
        <View
          ref={fortuneStoryCardRef}
          collapsable={false}
          style={{
            width: 380,
            height: 675,
            borderRadius: 32,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#0D0714", "#1A0B2E", "#2D124D", "#0D0714"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              padding: 28,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ alignItems: "center", gap: 4, marginTop: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(234, 179, 8, 0.15)",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(234, 179, 8, 0.4)",
                }}
              >
                <Sparkles size={14} color="#EAB308" />
                <T bold size={11} style={{ color: "#EAB308", letterSpacing: 2 }}>
                  DAILY COSMIC ORACLE
                </T>
              </View>
              <T size={10} style={{ color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, marginTop: 4 }}>
                NATALA FORTUNE COOKIE
              </T>
            </View>

            <View
              style={{
                width: "100%",
                backgroundColor: "#FFFDF5",
                borderRadius: 24,
                padding: 24,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#EAB308",
                shadowColor: "#EAB308",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.55,
                shadowRadius: 20,
              }}
            >
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: "rgba(217, 119, 6, 0.35)",
                  borderStyle: "dashed",
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 22,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <T size={34} style={{ marginBottom: 12 }}>
                  🥠
                </T>
                <T
                  bold
                  size={19}
                  style={{
                    color: "#2D2140",
                    textAlign: "center",
                    lineHeight: 27,
                    fontStyle: "italic",
                  }}
                >
                  "{currentFortune}"
                </T>
                <View
                  style={{
                    height: 1.5,
                    width: 60,
                    backgroundColor: "#D97706",
                    marginVertical: 16,
                    opacity: 0.5,
                  }}
                />
                <T bold size={10} style={{ color: "#9333EA", letterSpacing: 2 }}>
                  ✦ NATALA COSMIC WISDOM ✦
                </T>
              </View>
            </View>

            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <T bold size={12} style={{ color: "#EAB308", letterSpacing: 1 }}>
                UNLOCK YOUR DAILY DESTINY
              </T>
              <T size={9} style={{ color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginTop: 2 }}>
                NATALA ASTROLOGY & COSMIC ATLAS
              </T>
            </View>
          </LinearGradient>
        </View>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// 🏠 MAIN HOME SCREEN WITH LIVE NASA JPL HORIZONS PROXY
// ---------------------------------------------------------------------------
export default function Home() {
  const { colors, setPage, fetchActiveStories } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingNASA, setLoadingNASA] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<DetailedPlanetPosition | null>(null);

  const [planetaryPositions, setPlanetaryPositions] = useState<DetailedPlanetPosition[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const currentMoonPhase = useMemo(() => getMoonPhaseData(), []);

  // Извличане на всички планетни позиции през Express Proxy
  const loadNASAPlanetaryData = useCallback(async () => {
    setLoadingNASA(true);
    const planetNames = Object.keys(PLANET_METADATA);
    const todayObj = new Date();
    const tomorrowObj = new Date(todayObj.getTime() + 86400000);

    const fallbackLongsToday = getFallbackRawLongitudes(todayObj);
    const fallbackLongsTomorrow = getFallbackRawLongitudes(tomorrowObj);

    try {
      const jplPromises = planetNames.map((name) => fetchJPLPlanetPosition(name, todayObj));
      const jplTomorrowPromises = planetNames.map((name) => fetchJPLPlanetPosition(name, tomorrowObj));

      const resultsToday = await Promise.all(jplPromises);
      const resultsTomorrow = await Promise.all(jplTomorrowPromises);

      const computedPositions: DetailedPlanetPosition[] = planetNames.map((name, idx) => {
        const meta = PLANET_METADATA[name];
        const jplToday = resultsToday[idx];
        const jplTomorrow = resultsTomorrow[idx];

        let longitude = jplToday ? jplToday.longitude : fallbackLongsToday[name as keyof typeof fallbackLongsToday];
        let tomorrowLong = jplTomorrow ? jplTomorrow.longitude : fallbackLongsTomorrow[name as keyof typeof fallbackLongsTomorrow];

        const isRetrograde = name === "Sun" || name === "Moon" ? false : checkRetrograde(longitude, tomorrowLong);
        const zodiacInfo = getZodiacInfo(longitude);
        const degInSign = zodiacInfo.degree;
        const progressPercent = Math.min(100, Math.max(5, (degInSign / 30) * 100));

        return {
          planet: meta.symbol,
          name,
          signName: zodiacInfo.sign,
          degInSign,
          zodiacSymbol: zodiacInfo.symbol,
          progressPercent,
          isRetrograde,
          longitude,
          isLiveNASA: !!jplToday,
          meta,
        };
      });

      setPlanetaryPositions(computedPositions);
    } catch (err) {
      console.error("Грешка при зареждане от NASA JPL Horizons Proxy:", err);
    } finally {
      setLoadingNASA(false);
    }
  }, []);

  useEffect(() => {
    loadNASAPlanetaryData();
  }, [loadNASAPlanetaryData]);

  const triggerConfetti = useCallback(() => {
    setConfettiKey((prev) => prev + 1);
    setShowConfetti(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNASAPlanetaryData();
      if (typeof fetchActiveStories === "function") {
        await fetchActiveStories();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadNASAPlanetaryData, fetchActiveStories]);

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

  const sunData = planetaryPositions.find((p) => p.name === "Sun");
  const moonData = planetaryPositions.find((p) => p.name === "Moon");

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Globe size={13} color={colors.gold} />
            <T size={11} bold style={{ color: colors.gold }}>
              NASA JPL LIVE
            </T>
          </View>
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
        <Section>The sky today (NASA JPL Data)</Section>
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
                  ☾ In {moonData ? `${moonData.zodiacSymbol} ${moonData.signName}` : "Calculating..."}
                </T>
              </View>
            </View>
          </Card>

          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <T size={40} style={{ color: colors.gold }}>
                {sunData?.zodiacSymbol || "♏"}
              </T>
              <View style={{ flex: 1 }}>
                <T bold size={18}>
                  {sunData ? `${sunData.signName} Season` : "Loading Season..."}
                </T>
                <T muted size={12}>
                  Sun at {sunData ? `${sunData.degInSign}° (${sunData.longitude.toFixed(2)}° JPL)` : "..."}
                </T>
              </View>
            </View>
          </Card>
        </View>

        {/* 📅 7-DAY MOON FORECAST & CALENDAR */}
        <Moon7DayForecast />

        {/* ℞ RETROGRADE SECTION */}
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
          <Section>Planetary Codex (NASA JPL)</Section>
          {loadingNASA ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <T size={11} style={{ color: colors.gold }}>
              ✦ LIVE EPHEMERIS
            </T>
          )}
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
                <Planet3D name={item.name} size={76} />
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
                  {item.longitude.toFixed(1)}° JPL
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
                  <Planet3D name={selectedPlanet.name} size={110} />

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
                      NASA JPL LONGITUDE
                    </T>
                    <T bold size={16} style={{ color: colors.text, marginTop: 2 }}>
                      {selectedPlanet.longitude.toFixed(2)}°
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
    zIndex: 10,
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