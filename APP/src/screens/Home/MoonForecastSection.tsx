import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getMoonPhaseData } from './home.calculations';
import { cosmic } from '../../theme/cosmic';
import { localDay } from './useDiscoveryStreak';
import { calendarDetailStyles as calendar } from './calendarDetailStyles';

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

export function MoonForecastSection({ reduced, selected, onSelect }: { reduced: boolean; selected: Date; onSelect: (date: Date) => void }) {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
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

  return (
    <View style={styles.calendar}>
      <View style={calendar.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => settle(-1)} style={calendar.arrow}>
          <ChevronLeft size={22} color={cosmic.text} />
        </Pressable>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={calendar.monthTitle}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => settle(1)} style={calendar.arrow}>
          <ChevronRight size={22} color={cosmic.text} />
        </Pressable>
      </View>
      <View style={calendar.weekdays}>
        {weekdays.map((label) => <Text key={label} style={calendar.weekday}>{label}</Text>)}
      </View>
      <View {...swipe.panHandlers} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.window, Platform.OS === 'web' && webSwipeStyle]}>
        {width > 0 && <Animated.View style={[styles.track, { width: width * 3, marginLeft: -width, transform: [{ translateX: offset }] }]}>
          {pages.map((page, pageIndex) => {
            const active = pageIndex === 1;
            return (
              <View key={page.month.toISOString()} pointerEvents={active ? 'auto' : 'none'} aria-hidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'} style={[calendar.grid, { width }]}>
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
        </Animated.View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: 9 },
  window: { overflow: 'hidden', minHeight: 284 },
  track: { flexDirection: 'row' },
  selected: { backgroundColor: cosmic.purple },
  selectedText: { color: cosmic.bg },
  phase: { fontSize: 12 },
});
