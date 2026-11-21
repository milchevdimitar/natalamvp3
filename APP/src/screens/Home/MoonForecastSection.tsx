import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { EclipticGeoMoon } from 'astronomy-engine';
import { getMoonPhaseData, getZodiacInfo } from './home.calculations';
import { cosmic } from '../../theme/cosmic';

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const webSwipeStyle: ViewStyle & { touchAction: 'pan-y' } = { touchAction: 'pan-y' };
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

export function MoonForecastSection({ reduced }: { reduced: boolean }) {
  const [today] = useState(() => new Date());
  const [selected, setSelected] = useState<number | null>(null);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [width, setWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const moving = useRef(false);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const pages = useMemo(() => [-1, 0, 1].map((delta) => getMonthPage(month, delta)), [month]);

  useLayoutEffect(() => {
    offset.setValue(0);
    moving.current = false;
  }, [month, offset]);

  useEffect(() => () => animation.current?.stop(), []);

  const settle = useCallback((delta: number) => {
    if (moving.current) return;
    moving.current = true;
    const finish = () => {
      if (delta) {
        setSelected(null);
        setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
      } else {
        offset.setValue(0);
        moving.current = false;
      }
    };
    if (reduced || !width) {
      finish();
      return;
    }

    animation.current = Animated.timing(offset, {
      toValue: -delta * width,
      duration: delta ? 240 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.current.start(({ finished }) => {
      animation.current = null;
      if (finished) finish();
      else moving.current = false;
    });
  }, [offset, reduced, width]);

  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => !moving.current && Math.abs(dx) > 12 && Math.abs(dx) > 1.5 * Math.abs(dy),
    onPanResponderMove: (_, { dx }) => {
      if (!reduced && !moving.current) offset.setValue(Math.max(-width, Math.min(width, dx)));
    },
    onPanResponderRelease: (_, { dx, dy }) => settle(Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0),
    onPanResponderTerminate: () => settle(0),
  }), [offset, reduced, settle, width]);

  const selectedDay = pages[1].days.find((day) => !!day && day.date.getDate() === selected);
  const selectedSign = selectedDay && getZodiacInfo(EclipticGeoMoon(selectedDay.date).lon);

  return (
    <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => settle(-1)} style={styles.arrow}>
          <ChevronLeft size={22} color={cosmic.text} />
        </Pressable>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.month}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => settle(1)} style={styles.arrow}>
          <ChevronRight size={22} color={cosmic.text} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {weekdays.map((label) => <Text key={label} style={styles.weekday}>{label}</Text>)}
      </View>
      <View {...swipe.panHandlers} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.window, Platform.OS === 'web' && webSwipeStyle]}>
        {width > 0 && <Animated.View style={[styles.track, { width: width * 3, marginLeft: -width, transform: [{ translateX: offset }] }]}>
          {pages.map((page, pageIndex) => {
            const active = pageIndex === 1;
            return (
              <View key={page.month.toISOString()} pointerEvents={active ? 'auto' : 'none'} aria-hidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'} style={[styles.grid, { width }]}>
                {page.days.map((day, i) => {
                  if (!day) return <View key={i} style={styles.column} />;
                  const isToday = day.date.toDateString() === today.toDateString();
                  const isSelected = active && day.date.getDate() === selected;
                  return (
                    <View key={i} style={styles.column}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={dateLabel(day.date) + ', ' + day.phase.phaseName}
                        accessibilityState={{ selected: isSelected }}
                        disabled={!active}
                        onPress={() => setSelected(day.date.getDate())}
                        style={[styles.cell, isToday && styles.today, isSelected && styles.selected]}
                      >
                        <Text style={[styles.day, isSelected && styles.selectedText]}>{day.date.getDate()}</Text>
                        <Text style={styles.phase}>{day.phase.symbol}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </Animated.View>}
      </View>
      {selectedDay && <Text accessibilityLiveRegion="polite" style={styles.selection}>
        {dateLabel(selectedDay.date)} · {selectedDay.phase.phaseName} · {selectedDay.phase.illuminated}% illuminated · {selectedSign?.sign}
      </Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: 9 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: cosmic.text },
  weekdays: { flexDirection: 'row' },
  weekday: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: cosmic.muted },
  window: { overflow: 'hidden', minHeight: 284 },
  track: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  column: { width: '14.28%', minHeight: 44, paddingHorizontal: 2 },
  cell: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 11, borderWidth: 1, borderColor: 'transparent' },
  today: { borderColor: cosmic.purple },
  selected: { backgroundColor: cosmic.purple },
  day: { color: cosmic.text, fontSize: 12, fontWeight: '700' },
  selectedText: { color: cosmic.bg },
  phase: { fontSize: 12 },
  selection: { color: cosmic.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
