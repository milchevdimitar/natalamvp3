import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { cosmic } from '../../theme/cosmic';
import { DetailedPlanetPosition } from './home.types';

export function RetrogradeSection({ planetaryPositions }: { planetaryPositions: DetailedPlanetPosition[] }) {
  const retrogradePlanets = planetaryPositions.filter((planet) => planet.isRetrograde);

  return (
    <View style={styles.list}>
      {retrogradePlanets.length === 0 && (
        <Text style={styles.body}>No planets are currently in retrograde.</Text>
      )}
      {retrogradePlanets.map((planet) => (
        <View key={planet.name} style={styles.card}>
          <View style={styles.heading}>
            <RotateCcw size={16} color={cosmic.purple} />
            <Text accessibilityRole="header" style={styles.title}>{planet.name}</Text>
          </View>
          <Text style={styles.meta}>{planet.signName} · {planet.degInSign}° · Retrograde</Text>
          <Text style={styles.body}>{planet.meta.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 11 },
  card: { width: '100%', padding: 16, gap: 7, borderRadius: 22, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(27,46,98,0.52)' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: cosmic.text, fontSize: 16, fontWeight: '800' },
  meta: { color: cosmic.muted, fontSize: 12 },
  body: { color: cosmic.muted, fontSize: 13, lineHeight: 20 },
});
