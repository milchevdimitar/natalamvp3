import { StarField } from '../../components/StarField';
import React, { useState } from 'react';
import { ScrollView,
  View,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { X, Globe } from 'lucide-react-native';
import { T, Section, Pill } from '../../components/UI';
import { Planet3D } from '../../components/planets';
import { DetailedPlanetPosition } from './home.types';
import { getElementColor } from './home.calculations';
import { styles } from './home.styles';

interface PlanetaryCodexSectionProps {
  planetaryPositions: DetailedPlanetPosition[];
  loadingNASA: boolean;
  colors: any;
}

export function PlanetaryCodexSection({
  planetaryPositions,
  loadingNASA,
  colors,
}: PlanetaryCodexSectionProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<DetailedPlanetPosition | null>(null);

  return (
    <>
      <View style={styles.codexHeaderRow}>
        <Section>Planetary Codex (NASA JPL)</Section>
        {loadingNASA ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : (
          <T size={11} style={{ color: colors.gold }}>
            ✦ LIVE EPHEMERIS
          </T>
        )}
      </View>

      <ScrollView horizontal
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
                  <T bold size={9} style={{ color: '#FFF' }}>
                    ℞
                  </T>
                </View>
              )}
            </View>

            <View style={{ marginTop: 10, alignItems: 'center', gap: 2 }}>
              <T bold size={15} style={{ color: colors.text }}>
                {item.name}
              </T>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
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
                    backgroundColor: getElementColor(item.meta.element, colors.gold),
                  },
                ]}
              />
            </View>

            <View style={styles.cardBottomMeta}>
              <T muted size={10} style={{ textAlign: 'center' }}>
                {item.longitude.toFixed(1)}° JPL
              </T>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          <StarField subtle />
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

              <View style={{ alignItems: 'center', gap: 12 }}>
                <Planet3D name={selectedPlanet.name} size={110} />

                <View style={{ alignItems: 'center', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T size={30} style={{ color: colors.gold }}>
                      {selectedPlanet.planet}
                    </T>
                    <T bold size={24} style={{ color: colors.text }}>
                      {selectedPlanet.name}
                    </T>
                    {selectedPlanet.isRetrograde && (
                      <View style={styles.retroBadge}>
                        <T bold size={10} style={{ color: '#FFF' }}>
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
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <T muted size={10}>
                    CURRENT SIGN
                  </T>
                  <T bold size={16} style={{ color: colors.gold, marginTop: 2 }}>
                    {selectedPlanet.zodiacSymbol} {selectedPlanet.signName}
                  </T>
                </View>

                <View style={{ width: 1, height: '80%', backgroundColor: colors.line }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <T muted size={10}>
                    NASA JPL LONGITUDE
                  </T>
                  <T bold size={16} style={{ color: colors.text, marginTop: 2 }}>
                    {selectedPlanet.longitude.toFixed(2)}°
                  </T>
                </View>
              </View>

              <View style={{ gap: 8, marginVertical: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
    </>
  );
}