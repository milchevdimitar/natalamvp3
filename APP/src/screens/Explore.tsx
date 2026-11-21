import React, { useState } from "react";
import { View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Hero, SearchBar, Card, T, Section } from "../components/UI";
import { systems } from "../data/demo";
import { useApp } from "../context/AppContext";

// Карта на активните системи и съответните им страници
const ACTIVE_SYSTEM_ROUTES: Record<string, string> = {
  mbti: "mbti",
  cardology: "cardology",
  astrology: "astrology",
  ayurveda: "ayurveda",
  tarot: "tarot",
  numerology: "numerology",
  bazi: "bazi",
  "ba zi": "bazi",
};

export default function Explore() {
  const [search, setSearch] = useState("");
  const { colors, setPage } = useApp();

  // Гарантира, че BaZi присъства в списъка дори ако липсва в demo.ts
  const hasBaziInDemo = systems.some((s) =>
    ["bazi", "ba zi"].includes(s.name.toLowerCase())
  );

  const allSystems = hasBaziInDemo
    ? systems
    : [
        ...systems,
        {
          name: "BaZi",
          icon: "☯",
          description:
            "Four Pillars of Destiny · Chinese solar-term & Five Elements chart.",
        },
      ];

  const searchFiltered = allSystems.filter((s) =>
    (s.name + " " + s.description)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Разделяне на активни и предстоящи системи
  const activeSystems = searchFiltered.filter(
    (s) => ACTIVE_SYSTEM_ROUTES[s.name.toLowerCase()] !== undefined
  );

  const upcomingSystems = searchFiltered.filter(
    (s) => ACTIVE_SYSTEM_ROUTES[s.name.toLowerCase()] === undefined
  );

  return (
    <>
      <Hero
        eyebrow="YOUR ATLAS · EXPLORE & DISCOVER"
        first="Find a"
        accent="new lens."
        description="Explore the systems that shape your inner world and discover new perspectives."
      />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search systems..."
      />

      {/* Секция 1: Активни системи */}
      <Section>Explore your systems</Section>
      <View style={{ gap: 11 }}>
        {activeSystems.map((s) => {
          const route = ACTIVE_SYSTEM_ROUTES[s.name.toLowerCase()];
          return (
            <Card
              key={s.name}
              onPress={() => setPage(route)}
              activeOpacity={0.7}
              style={{ minHeight: 110, justifyContent: "center", padding: 15 }}
            >
              <View
                style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.purpleSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T size={29} style={{ color: colors.purple }}>
                    {s.icon}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={17}>
                    {s.name}
                  </T>
                  <T muted size={12}>
                    {s.description}
                  </T>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </View>
            </Card>
          );
        })}
      </View>

      {/* Секция 2: Предстоящи системи */}
      {upcomingSystems.length > 0 && (
        <>
          <Section style={{ marginTop: 24 }}>Expect soon in next release</Section>
          <View style={{ gap: 11, opacity: 0.75 }}>
            {upcomingSystems.map((s) => (
              <Card key={s.name}>
                <View
                  style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
                >
                  <View
                    style={{
                      width: 53,
                      height: 53,
                      borderRadius: 17,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <T size={29} style={{ color: colors.muted }}>
                      {s.icon}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T bold size={17}>
                      {s.name}
                    </T>
                    <T muted size={12}>
                      {s.description}
                    </T>
                  </View>
                  <T size={9} bold style={{ color: colors.gold }}>
                    SOON
                  </T>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </>
  );
}
