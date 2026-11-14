import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { Sparkles, RotateCcw } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { DetailedPlanetPosition } from './home.types';
import { styles } from './home.styles';

interface RetrogradeSectionProps {
  planetaryPositions: DetailedPlanetPosition[];
  colors: any;
}

export function RetrogradeSection({
  planetaryPositions,
  colors,
}: RetrogradeSectionProps) {
  const retrogradePlanets = useMemo(
    () => planetaryPositions.filter((p) => p.isRetrograde),
    [planetaryPositions]
  );

  return (
    <View style={styles.retroSectionWrapper}>
      <View style={styles.sectionHeaderRow}>
        <Section>Retrograde Motion (℞)</Section>
        <RotateCcw size={15} color={colors.purple} />
      </View>

      {retrogradePlanets.length === 0 ? (
        <Card style={styles.retroEmptyCard}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T size={22} style={{ color: colors.gold }}>
                  {planet.planet}
                </T>
                <View style={styles.retroBadge}>
                  <T bold size={10} style={{ color: '#FFF' }}>
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