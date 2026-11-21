import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { EclipticGeoMoon } from 'astronomy-engine';
import { cosmic } from '../../theme/cosmic';
import { AnimatedMoonVisualizer } from './AnimatedMoonVisualizer';
import { celestialOrbSize } from './CelestialDetails';
import { MoonForecastSection } from './MoonForecastSection';
import { getMoonPhaseData, getZodiacInfo } from './home.calculations';

export function MoonCalendarDetail({ reduced }: { reduced: boolean }) {
  const { width } = useWindowDimensions();
  const size = celestialOrbSize(width);
  const [selected, setSelected] = useState(() => new Date());
  const phase = useMemo(() => getMoonPhaseData(selected), [selected]);
  const zodiac = useMemo(() => getZodiacInfo(EclipticGeoMoon(selected).lon), [selected]);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.heading} accessibilityLiveRegion="polite">
        <Text style={styles.date}>{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        <Text accessibilityRole="header" style={styles.title}>{phase.phaseName}</Text>
        <Text style={styles.meta}>{phase.illuminated}% illuminated · {phase.ageInDays} days old</Text>
      </View>
      <View style={[styles.hero, { minHeight: Math.max(175, size + 22) }]}>
        <AnimatedMoonVisualizer moonPhase={phase} size={size} reduced={reduced} animateShadow />
        <View style={styles.badge}>
          <Text style={styles.symbol}>{zodiac.symbol}</Text>
          <Text style={styles.badgeText}>Moon in {zodiac.sign} · {zodiac.degree}°</Text>
        </View>
      </View>
      <MoonForecastSection reduced={reduced} selected={selected} onSelect={setSelected} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  heading: { alignItems: 'center', gap: 5 },
  date: { color: cosmic.purple, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: cosmic.text, fontSize: 33, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8 },
  meta: { color: cosmic.muted, fontSize: 12, textAlign: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  badge: { position: 'absolute', bottom: 0, right: 4, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(7,22,71,0.83)', paddingHorizontal: 10, paddingVertical: 7 },
  symbol: { color: cosmic.gold, fontSize: 17 },
  badgeText: { color: cosmic.text, fontSize: 12, fontWeight: '800' },
});
