import { PagePager, type PagePagerHandle } from '../../components/PagePager';
import { usePageProgress } from '../../components/pageProgress';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getMoonPhaseData } from './home.calculations';
import { cosmic } from '../../theme/cosmic';
import { localDay } from './useDiscoveryStreak';
import { calendarDetailStyles as calendar } from './calendarDetailStyles';

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const dateLabel = (date: Date) => date.toLocaleDateString(undefined, { dateStyle: 'long' });

function getMonthPage(current: Date, delta: number) {
  const month = new Date(current.getFullYear(), current.getMonth() + delta, 1);
  const leading = (month.getDay() + 6) % 7;
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, i) => {
    if (i < leading || i >= leading + length) return null;
    const date = new Date(month.getFullYear(), month.getMonth(), i - leading + 1, 12);
    return { date, phase: getMoonPhaseData(date) };
  });
  return { month, days };
}

export function MoonForecastSection({ reduced, selected, onSelect }: { reduced: boolean; selected: Date; onSelect: (date: Date) => void }) {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [width, setWidth] = useState(0);
  const pager = useRef<PagePagerHandle>(null);
  const { position, fraction } = usePageProgress(width, 1);
  const recentering = useRef(false);
  const pages = useMemo(() => [-1, 0, 1].map((delta) => getMonthPage(month, delta)), [month]);

  useLayoutEffect(() => {
    if (!recentering.current) return;
    pager.current?.setPage(1, false);
    recentering.current = false;
  }, [month]);

  const settleMonth = (page: number) => {
    if (page === 1 || recentering.current) return;
    recentering.current = true;
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + page - 1, 1));
  };

  return (
    <View style={styles.calendar}>
      <View style={calendar.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => pager.current?.setPage(0, !reduced)} style={calendar.arrow}>
          <ChevronLeft size={22} color={cosmic.text} />
        </Pressable>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={calendar.monthTitle}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => pager.current?.setPage(2, !reduced)} style={calendar.arrow}>
          <ChevronRight size={22} color={cosmic.text} />
        </Pressable>
      </View>
      <View style={calendar.weekdays}>
        {weekdays.map((label) => <Text key={label} style={calendar.weekday}>{label}</Text>)}
      </View>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.window}>
        {width > 0 && <PagePager pagerRef={pager} width={width} initialIndex={1} position={position} fraction={fraction}
          onSettled={settleMonth}>
          {pages.map((page, pageIndex) => {
            const active = pageIndex === 1;
            return (
              <View key={pageIndex} pointerEvents={active ? 'auto' : 'none'} aria-hidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'} style={[calendar.grid, { width }]}>
                {page.days.map((day, i) => {
                  if (!day) return <View key={i} style={calendar.column} />;
                  const isToday = day.date.toDateString() === today.toDateString();
                  const isSelected = active && localDay(day.date) === localDay(selected);
                  return (
                    <View key={i} style={calendar.column}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={dateLabel(day.date) + ', ' + day.phase.phaseName}
                        accessibilityState={{ selected: isSelected }}
                        disabled={!active}
                        onPress={() => onSelect(day.date)}
                        style={[calendar.cell, isToday && calendar.today, isSelected && styles.selected]}
                      >
                        <Text style={[calendar.day, isSelected && styles.selectedText]}>{day.date.getDate()}</Text>
                        <Text style={styles.phase}>{day.phase.symbol}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </PagePager>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: 9 },
  window: { overflow: 'hidden', height: 284 },
  selected: { backgroundColor: cosmic.purple },
  selectedText: { color: cosmic.bg },
  phase: { fontSize: 12 },
});
