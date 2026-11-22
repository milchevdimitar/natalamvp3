import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { EclipticGeoMoon } from 'astronomy-engine';
import { useCalc } from '../../services/calcApi';
import { cosmic } from '../../theme/cosmic';
import { AnimatedMoonVisualizer } from './AnimatedMoonVisualizer';
import { celestialOrbSize } from './CelestialDetails';
import { MoonForecastSection } from './MoonForecastSection';
import { getMoonPhaseData, getZodiacInfo } from './home.calculations';
import { calendarDetailStyles as calendar } from './calendarDetailStyles';

export function MoonCalendarDetail({ reduced }: { reduced: boolean }) {
  const { width } = useWindowDimensions();
  const size = celestialOrbSize(width);
  const [selected, setSelected] = useState(() => new Date());
  const { data } = useCalc<{ phase: ReturnType<typeof getMoonPhaseData>; zodiac: ReturnType<typeof getZodiacInfo> }>('sky/moon-day', { date: selected.toISOString() });
  const phase = useMemo(() => data?.phase ?? getMoonPhaseData(selected), [data, selected]);
  const zodiac = useMemo(() => data?.zodiac ?? getZodiacInfo(EclipticGeoMoon(selected).lon), [data, selected]);

  return (
    <ScrollView contentContainerStyle={calendar.body}>
      <View style={calendar.heading} accessibilityLiveRegion="polite">
        <Text style={calendar.date}>{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        <Text accessibilityRole="header" style={calendar.title}>{phase.phaseName}</Text>
        <Text style={calendar.meta}>{phase.illuminated}% illuminated · {phase.ageInDays} days old</Text>
      </View>
      <View style={[calendar.hero, { minHeight: Math.max(175, size + 22) }]}>
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
  badge: { position: 'absolute', bottom: 0, right: 4, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(7,22,71,0.83)', paddingHorizontal: 10, paddingVertical: 7 },
  symbol: { color: cosmic.gold, fontSize: 17 },
  badgeText: { color: cosmic.text, fontSize: 12, fontWeight: '800' },
});
