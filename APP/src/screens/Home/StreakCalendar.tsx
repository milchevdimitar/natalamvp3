import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from './StreakLottie';
import { cosmic } from '../../theme/cosmic';
import { DAY_MS } from './useDiscoveryStreak';
import { celestialOrbSize } from './CelestialDetails';
import { calendarDetailStyles as calendar } from './calendarDetailStyles';

const fireAnimation = require('./assets/fire-streak-orange.json');
const FIRE_PLAY_TIME = 2000;

function StreakFire({ size }: { size: number }) {
  const player = useRef<LottieView>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleLoaded = useCallback(() => setReady(true), []);
  const handleFailure = useCallback(() => setFailed(true), []);

  const replay = useCallback(() => {
    const animation = player.current;
    if (!ready || failed || !animation) return;
    clearTimeout(pauseTimer.current);
    animation.pause();
    animation.reset();
    animation.play();
    pauseTimer.current = setTimeout(() => animation.pause(), FIRE_PLAY_TIME);
  }, [ready, failed]);

  useEffect(() => {
    const animation = player.current;
    replay();
    return () => {
      clearTimeout(pauseTimer.current);
      animation?.pause();
    };
  }, [replay]);

  const dimensions = { width: size, height: size };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Replay streak flame" onPress={replay} disabled={!ready || failed} style={dimensions}>
      <LinearGradient colors={['rgba(246,198,109,0.25)', 'rgba(196,79,42,0.12)']} style={[styles.flameOrb, dimensions, { borderRadius: size / 2 }]}>
        {failed
          ? <Flame color="#ffe3a6" fill="#f8a947" size={size * 0.58} strokeWidth={1.15} />
          : <LottieView ref={player} source={fireAnimation} loop={false} style={dimensions} webStyle={dimensions}
              onAnimationLoaded={handleLoaded} onAnimationFailure={handleFailure} />}
      </LinearGradient>
    </Pressable>
  );
}

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const monthStart = (day: number) => {
  const date = new Date(day * DAY_MS);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
};

export function StreakCalendar({ today, days, count }: { today: number; days: number[]; count: number }) {
  const { width } = useWindowDimensions();
  const size = celestialOrbSize(width);
  const [displayMonth, setDisplayMonth] = useState(() => monthStart(today));
  const month = new Date(displayMonth);
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const leading = (month.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const visited = new Set(days);
  const earliest = monthStart(days[0] ?? today);
  const latest = monthStart(today);
  const format = (date: Date) => date.toLocaleDateString(undefined, { dateStyle: 'long', timeZone: 'UTC' });
  const move = (delta: number) => setDisplayMonth(Date.UTC(year, index + delta, 1));

  return (
    <ScrollView contentContainerStyle={calendar.body}>
      <View style={calendar.heading}>
        <Text accessibilityRole="header" style={[calendar.date, styles.eyebrow]}>Discovery streak</Text>
        <Text accessibilityRole="header" style={calendar.title}>{count} {count === 1 ? 'day' : 'days'} in a row</Text>
        <Text style={calendar.meta}>Highlighted days show when you opened Home.</Text>
      </View>
      <View style={[calendar.hero, { minHeight: Math.max(175, size + 22) }]}>
        <StreakFire size={size} />
      </View>
      <View style={calendar.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={displayMonth <= earliest} onPress={() => move(-1)} style={calendar.arrow}>
          <ChevronLeft color={displayMonth <= earliest ? '#63749e' : cosmic.text} />
        </Pressable>
        <Text accessibilityRole="header" style={calendar.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={displayMonth >= latest} onPress={() => move(1)} style={calendar.arrow}>
          <ChevronRight color={displayMonth >= latest ? '#63749e' : cosmic.text} />
        </Pressable>
      </View>
      <View style={calendar.weekdays}>
        {weekdays.map((label) => <Text key={label} style={calendar.weekday}>{label}</Text>)}
      </View>
      <View style={calendar.grid}>
        {Array.from({ length: leading + length }, (_, position) => {
          const number = position - leading + 1;
          const date = new Date(Date.UTC(year, index, number));
          const day = date.getTime() / DAY_MS;
          const recorded = visited.has(day);
          return (
            <View key={position} style={calendar.column}>
              {number > 0 && <View testID={recorded ? 'streak-visited-day' : undefined} accessible accessibilityLabel={format(date) + (recorded ? ', streak day' : '')} style={[calendar.cell, day === today && calendar.today, recorded && styles.visited]}>
                <Text style={[calendar.day, !recorded && { color: cosmic.muted }, recorded && styles.visitedText]}>{number}</Text>
                {recorded && <Text style={styles.dayFlame} accessible={false}>🔥</Text>}
              </View>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#ff9c3d' },
  flameOrb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(246,198,109,0.28)', boxShadow: '0 0 28px rgba(246,148,59,0.24)' },
  visited: { backgroundColor: 'rgba(246,198,109,0.21)' },
  visitedText: { color: cosmic.gold, fontWeight: '800' },
  dayFlame: { fontSize: 13, lineHeight: 16 },
});
