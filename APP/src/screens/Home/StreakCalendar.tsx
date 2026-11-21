import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import { cosmic } from '../../theme/cosmic';
import { DAY_MS } from './useDiscoveryStreak';

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const monthStart = (day: number) => {
  const date = new Date(day * DAY_MS);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
};

export function StreakCalendar({ today, days, count }: { today: number; days: number[]; count: number }) {
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
    <View style={styles.card}>
      <View style={styles.summary}>
        <Flame color={cosmic.gold} size={24} />
        <Text style={styles.title}>{count} {count === 1 ? 'day' : 'days'} in a row</Text>
      </View>
      <Text style={styles.meta}>Highlighted days show when you opened Home.</Text>
      <View style={styles.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={displayMonth <= earliest} onPress={() => move(-1)} style={styles.arrow}>
          <ChevronLeft color={displayMonth <= earliest ? '#63749e' : cosmic.text} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={displayMonth >= latest} onPress={() => move(1)} style={styles.arrow}>
          <ChevronRight color={displayMonth >= latest ? '#63749e' : cosmic.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {weekdays.map((label) => <Text key={label} style={styles.weekday}>{label}</Text>)}
        {Array.from({ length: leading + length }, (_, position) => {
          const number = position - leading + 1;
          const date = new Date(Date.UTC(year, index, number));
          const day = date.getTime() / DAY_MS;
          const recorded = visited.has(day);
          return (
            <View key={position} style={styles.column}>
              {number > 0 && <View testID={recorded ? 'streak-visited-day' : undefined} accessible accessibilityLabel={format(date) + (recorded ? ', streak day' : '')} style={[styles.cell, day === today && styles.today, recorded && styles.visited]}>
                <Text style={[styles.day, recorded && styles.visitedText]}>{number}</Text>
              </View>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 15, borderRadius: 27, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(27,47,99,0.52)' },
  summary: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: cosmic.text, fontSize: 16, fontWeight: '800' },
  meta: { color: cosmic.muted, fontSize: 12 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 },
  weekday: { width: '14.28%', textAlign: 'center', color: cosmic.muted, fontSize: 11, fontWeight: '700' },
  column: { width: '14.28%', minHeight: 39, paddingHorizontal: 2 },
  cell: { minHeight: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  today: { borderColor: cosmic.purple },
  visited: { backgroundColor: 'rgba(246,198,109,0.21)' },
  day: { color: cosmic.muted, fontSize: 12 },
  visitedText: { color: cosmic.gold, fontWeight: '800' },
});
