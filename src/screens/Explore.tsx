import React, { useState } from "react";
import { View } from "react-native";
import { Hero, SearchBar, Card, T, Section, Pill } from "../components/UI";
import { systems } from "../data/demo";
import { useApp } from "../context/AppContext";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { colors, setPage } = useApp();

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
      <Section>Explore your systems</Section>
      <View style={{ gap: 11 }}>
        {systems
          .filter((s) =>
            (s.name + " " + s.description)
              .toLowerCase()
              .includes(search.toLowerCase())
          )
          .map((s) => (
            <Card
              key={s.name}
              onPress={() => setSelected(selected === s.name ? null : s.name)}
            >
              <View
                style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 53,
                    height: 53,
                    borderRadius: 17,
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
                <T size={9} bold style={{ color: colors.gold }}>
                  {s.status}
                </T>
              </View>
              {selected === s.name && (
                <View style={{ marginTop: 15, gap: 9 }}>
                  <T muted size={13}>
                    {s.status === "SOON"
                      ? "This lens is planned for a future release."
                      : "Explore your personal insights through this lens."}
                  </T>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {s.name.toLowerCase() === "astrology" && (
                      <Pill onPress={() => setPage("astrology" as any)}>
                        Open Astrology
                      </Pill>
                    )}
                    {s.name.toLowerCase() === "mbti" && (
                      <Pill onPress={() => setPage("mbti" as any)}>
                        Open MBTI Test
                      </Pill>
                    )}
                    <Pill onPress={() => setSelected(null)}>Close details</Pill>
                  </View>
                </View>
              )}
            </Card>
          ))}
      </View>
    </>
  );
}