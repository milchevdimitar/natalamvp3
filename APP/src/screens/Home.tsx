import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Pressable,
  Share,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Sun, Stars, Mail, X, Globe } from "lucide-react-native";
import { Brand, Card, T, Section, Pill } from "../components/UI";
import { stories as demoStories } from "../data/demo";
import { useApp } from "../context/AppContext";
import { StoryViewer } from "../components/StoryViewer";

const { width } = Dimensions.get("window");

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
      "Космическото ни сърце и източник на жизнена сила. Определя нашата воля, себеизразяване и фундаментална идентичност.",
  },
  Moon: {
    image:
      "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=600&auto=format&fit=crop",
    ruler: "Cancer",
    element: "Water",
    topic: "Emotions & Intuition",
    description:
      "Пазителят на подсъзнанието, емоционалния ни свят, подсъзнателните реактивни модели и вътрешния комфорт.",
  },
  Mercury: {
    image:
      "https://images.unsplash.com/photo-1545156521-77bd85671d30?q=80&w=600&auto=format&fit=crop",
    ruler: "Gemini / Virgo",
    element: "Air",
    topic: "Mind & Communication",
    description:
      "Планетата на мисълта, словото, логиката и менталната гъвкавост. Управлява начина, по който обработваме информация.",
  },
  Venus: {
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Taurus / Libra",
    element: "Earth",
    topic: "Love, Beauty & Values",
    description:
      "Богинята на красотата, любовта, хармонията, изкуството и това, което ценим истински във взаимоотношенията.",
  },
  Mars: {
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
    ruler: "Aries",
    element: "Fire",
    topic: "Drive, Action & Courage",
    description:
      "Войнът на зодиака – определя как отстояваме себе си, как насочваме страстта си и преодоляваме препятствията.",
  },
  Jupiter: {
    image:
      "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop",
    ruler: "Sagittarius",
    element: "Fire",
    topic: "Expansion & Wisdom",
    description:
      "Големият благодетел – носи растеж, изобилие, философска дълбочина, благополучие и отваря нови хоризонти.",
  },
  Saturn: {
    image:
      "https://images.unsplash.com/photo-1614732484003-ef9881555dc3?q=80&w=600&auto=format&fit=crop",
    ruler: "Capricorn",
    element: "Earth",
    topic: "Discipline & Time",
    description:
      "Великият учител – изгражда граници, структура, дисциплина, зрялост и дългосрочни кармични уроци.",
  },
  Uranus: {
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=600&auto=format&fit=crop",
    ruler: "Aquarius",
    element: "Air",
    topic: "Awakening & Innovation",
    description:
      "Катализаторът на промяната, гениалността, свободата, оригиналността и внезапните революционни прозрения.",
  },
  Neptune: {
    image:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
    ruler: "Pisces",
    element: "Water",
    topic: "Dreams & Mysticism",
    description:
      "Планетата на илюзиите, висшата духовност, творческото вдхновение, сънищата и пълното сливане с Космоса.",
  },
  Pluto: {
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    ruler: "Scorpio",
    element: "Water",
    topic: "Rebirth & Transformation",
    description:
      "Властелинът на дълбоката трансформация, прераждането, скритата сила и пълното освобождаване от старото.",
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
  meta: (typeof PLANET_METADATA)[string];
}

function calculateCurrentPlanetaryPositions(date = new Date()): DetailedPlanetPosition[] {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  const d = julianDate - 2451545.0;

  const g = (357.529 + 0.98560028 * d) % 360;
  const gRad = (g * Math.PI) / 180;
  const sunLong = (280.459 + 0.98564736 * d + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) % 360;

  const Lm = (218.316 + 13.176396 * d) % 360;
  const Mm = (134.963 + 13.064993 * d) % 360;
  const Fm = (93.272 + 13.22935 * d) % 360;
  const MmRad = (Mm * Math.PI) / 180;
  const FmRad = (Fm * Math.PI) / 180;
  const moonLong = (Lm + 6.289 * Math.sin(MmRad) - 1.274 * Math.sin(MmRad - 2 * FmRad)) % 360;

  const mercMean = (252.251 + 4.0923344 * d) % 360;
  const mercLong = (sunLong + 23 * Math.sin(((mercMean - sunLong) * Math.PI) / 180)) % 360;

  const venusMean = (181.979 + 1.6021302 * d) % 360;
  const venusLong = (sunLong + 42 * Math.sin(((venusMean - sunLong) * Math.PI) / 180)) % 360;

  const marsMean = (355.433 + 0.524033 * d) % 360;
  const marsLong = (marsMean + 10.6 * Math.sin(((marsMean - sunLong) * Math.PI) / 180)) % 360;

  const jupMean = (34.351 + 0.0830853 * d) % 360;
  const satMean = (50.077 + 0.0334442 * d) % 360;
  const uranMean = (314.055 + 0.01172834 * d) % 360;
  const nepMean = (304.349 + 0.00598106 * d) % 360;
  const plutoMean = (238.96 + 0.0039757 * d) % 360;

  const rawPlanets = [
    { symbol: "☉", name: "Sun", longitude: sunLong },
    { symbol: "☾", name: "Moon", longitude: moonLong },
    { symbol: "☿", name: "Mercury", longitude: mercLong },
    { symbol: "♀", name: "Venus", longitude: venusLong },
    { symbol: "♂", name: "Mars", longitude: marsLong },
    { symbol: "♃", name: "Jupiter", longitude: jupMean },
    { symbol: "♄", name: "Saturn", longitude: satMean },
    { symbol: "♅", name: "Uranus", longitude: uranMean },
    { symbol: "♆", name: "Neptune", longitude: nepMean },
    { symbol: "♇", name: "Pluto", longitude: plutoMean },
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
      meta: PLANET_METADATA[p.name] || PLANET_METADATA.Sun,
    };
  });
}

export default function Home() {
  const { colors, setPage, fetchActiveStories } = useApp();
  const [fortune, setFortune] = useState(false);
  const [tarot, setTarot] = useState(false);
  const [day, setDay] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPlanet, setSelectedPlanet] = useState<DetailedPlanetPosition | null>(null);

  const planetaryPositions = useMemo(() => calculateCurrentPlanetaryPositions(), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (typeof fetchActiveStories === "function") {
        await fetchActiveStories();
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Грешка при синхронизиране на данните:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveStories]);

  const messages = [
    "A quiet choice today can open a surprising door tomorrow.",
    "Trust the small steps. They are taking you somewhere meaningful.",
    "You are allowed to grow beyond the version of yourself you once knew.",
  ];

  const cards = [
    ["The Star", "Renewed hope, clarity and trust in your path."],
    ["The Moon", "Make room for intuition and the unknown."],
    ["The Sun", "A moment of warmth and renewed confidence."],
  ];

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

      {/* 📸 Сторита */}
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

      {/* Daily Gifts */}
      <Section>Open your daily gifts</Section>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Card
          style={{
            flex: 1,
            minHeight: 275,
            padding: 13,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center", gap: 7 }}>
            <View
              style={{
                width: 86,
                height: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {fortune ? (
                <Stars size={57} color={colors.gold} />
              ) : (
                <Mail size={67} strokeWidth={1.5} color={colors.purple} />
              )}
            </View>
            <T bold size={16} style={{ textAlign: "center" }}>
              {fortune ? "Your fortune" : "A message for you"}
            </T>
            <T muted size={12} style={{ textAlign: "center" }}>
              {fortune
                ? messages[day % messages.length]
                : "A little inspiration is waiting inside."}
            </T>
          </View>
          <Pill
            onPress={() => {
              if (fortune) setDay((d) => d + 1);
              setFortune(true);
            }}
          >
            {fortune ? "Another message" : "✦ Open fortune"}
          </Pill>
          {fortune && (
            <Pressable
              onPress={() =>
                Share.share({ message: messages[day % messages.length] })
              }
            >
              <T size={11} style={{ color: colors.purple }}>
                ↗ Share fortune
              </T>
            </Pressable>
          )}
        </Card>

        <Card
          style={{
            flex: 1,
            minHeight: 275,
            padding: 13,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center", gap: 7 }}>
            <View
              style={{
                width: 86,
                height: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {tarot ? (
                <Sun size={61} color={colors.gold} />
              ) : (
                <View
                  style={{
                    width: 65,
                    height: 94,
                    borderWidth: 2,
                    borderColor: colors.gold,
                    borderRadius: 9,
                    backgroundColor: colors.purpleSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T size={36} style={{ color: colors.gold }}>
                    ☾
                  </T>
                </View>
              )}
            </View>
            <T bold size={16} style={{ textAlign: "center" }}>
              {tarot ? cards[day % cards.length][0] : "Your card awaits"}
            </T>
            <T muted size={12} style={{ textAlign: "center" }}>
              {tarot
                ? cards[day % cards.length][1]
                : "A symbolic card for your daily reflection."}
            </T>
          </View>
          <Pill
            onPress={() => {
              if (tarot) setDay((d) => d + 1);
              setTarot(true);
            }}
          >
            {tarot ? "Draw again" : "♠ Draw a card"}
          </Pill>
          {tarot && (
            <Pressable
              onPress={() =>
                Share.share({
                  message: `${cards[day % cards.length][0]} — ${
                    cards[day % cards.length][1]
                  }`,
                })
              }
            >
              <T size={11} style={{ color: colors.purple }}>
                ↗ Share tarot
              </T>
            </Pressable>
          )}
        </Card>
      </View>

      {/* The sky today */}
      <Section>The sky today</Section>
      <View style={{ gap: 10 }}>
        <Card>
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: 41,
                backgroundColor: "#E9E1CF",
                overflow: "hidden",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 63,
                  height: 82,
                  borderRadius: 41,
                  backgroundColor: colors.surface,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <T bold size={18}>
                Moon phase
              </T>
              <T muted size={12}>
                Waxing crescent · A season for intention
              </T>
              <T size={12} style={{ color: colors.gold, marginTop: 5 }}>
                ☾ In{" "}
                {planetaryPositions.find((p) => p.name === "Moon")?.signName ||
                  "Gemini"}
              </T>
            </View>
          </View>
        </Card>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <T size={40} style={{ color: colors.gold }}>
              {planetaryPositions.find((p) => p.name === "Sun")?.zodiacSymbol ||
                "♏"}
            </T>
            <View style={{ flex: 1 }}>
              <T bold size={18}>
                {planetaryPositions.find((p) => p.name === "Sun")?.signName ||
                  "Scorpio"}{" "}
                season
              </T>
              <T muted size={12}>
                A deeper month. A quieter kind of power.
              </T>
            </View>
          </View>
        </Card>
      </View>

      {/* 🪐 ИНОВАЦИОННА КОСМИЧЕСКА ЕНЦИКЛОПЕДИЯ ЗА ПЛАНЕТИТЕ */}
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
                borderColor: colors.line,
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

      {/* Modal / Енциклопедичен Лист */}
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
                  <T
                    bold
                    size={16}
                    style={{ color: colors.gold, marginTop: 2 }}
                  >
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
                  <T
                    bold
                    size={16}
                    style={{ color: colors.text, marginTop: 2 }}
                  >
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
  );
}

const styles = StyleSheet.create({
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