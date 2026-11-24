import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cosmic } from '../theme/cosmic';
import { CosmicBackground, useReducedMotion } from '../screens/Home/CosmicBackground';
import { BirthPickerHeader } from './BirthPickerHeader';

export type BirthDate = { year: number; month: number; day: number };
export const birthMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (value: number) => String(value).padStart(2, '0');
const rowHeight = 46;
const sideRows = 3;
const wheelHeight = rowHeight * (sideRows * 2 + 1);

function Wheel({ label, start = 0, count, value, onChange, format = String }: {
  label: string; start?: number; count: number; value: number; onChange: (value: number) => void; format?: (value: number) => string;
}) {
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const index = useRef(count + value - start);
  const [visibleIndex, setVisibleIndex] = useState(index.current);
  const dragging = useRef(false);
  const initialOffset = useRef({ x: 0, y: index.current * rowHeight }).current;
  const offset = useRef(new Animated.Value(initialOffset.y)).current;
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduced = useReducedMotion();

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    const next = Math.max(0, Math.min(count * 3 - 1, Math.round(y / rowHeight)));
    if (index.current !== next) {
      index.current = next;
      setVisibleIndex(next);
      onChange(start + next % count);
    }
    clearTimeout(settleTimer.current);
    if (dragging.current) return;
    settleTimer.current = setTimeout(() => {
      const center = count + next % count;
      if (next !== center || (Platform.OS === 'web' && Math.abs(y - next * rowHeight) > 1)) {
        index.current = center;
        setVisibleIndex(center);
        offset.setValue(center * rowHeight);
        scroller.current?.scrollTo({ y: center * rowHeight, animated: false });
      }
    }, 180);
  }

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  function goTo(next: number) {
    next = count + next % count;
    clearTimeout(settleTimer.current);
    index.current = next;
    setVisibleIndex(next);
    onChange(start + next % count);
    offset.setValue(next * rowHeight);
    scroller.current?.scrollTo({ y: next * rowHeight, animated: false });
  }

  return (
    <View style={styles.wheel}>
      <Text style={styles.columnLabel}>{label}</Text>
      <Animated.ScrollView ref={scroller} style={styles.wheelScroll} showsVerticalScrollIndicator={false}
        nestedScrollEnabled contentOffset={initialOffset} snapToInterval={rowHeight} decelerationRate="fast" bounces={false} overScrollMode="never"
        onLayout={() => scroller.current?.scrollTo({ y: index.current * rowHeight, animated: false })}
        onScrollBeginDrag={() => { dragging.current = true; clearTimeout(settleTimer.current); }}
        onScrollEndDrag={(event) => { dragging.current = false; handleScroll(event); }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
          useNativeDriver: Platform.OS !== 'web', listener: handleScroll,
        })}
        contentContainerStyle={styles.wheelPadding}>
        {Array.from({ length: count * 3 }, (_, i) => {
          const option = start + i % count;
          const inputRange = [-3, -2, -1, 0, 1, 2, 3].map((delta) => (i + delta) * rowHeight);
          const opacity = offset.interpolate({ inputRange, outputRange: [0.19, 0.32, 0.57, 1, 0.57, 0.32, 0.19], extrapolate: 'clamp' });
          const scale = offset.interpolate({ inputRange, outputRange: [0.60, 0.71, 0.85, 1, 0.85, 0.71, 0.60], extrapolate: 'clamp' });
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={label + ' ' + format(option)}
              accessible={Math.abs(i - visibleIndex) <= sideRows} accessibilityState={{ selected: value === option && visibleIndex === i }} onPress={() => goTo(i)} style={styles.row}>
              <Animated.Text style={[styles.value, { opacity }, !reduced && { transform: [{ scale }] },
                reduced && visibleIndex !== i && styles.reducedValue]}>{format(option)}</Animated.Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

type Props = { onClose: () => void } & (
  { mode: 'date'; value: BirthDate | null; onSave: (value: BirthDate) => void } |
  { mode: 'time'; value: string; onSave: (value: string) => void }
);

export function BirthWheelPicker(props: Props) {
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [today] = useState(() => new Date());
  const [date, setDate] = useState(() => props.mode === 'date' && props.value
    ? props.value : { year: 1995, month: 1, day: 1 });
  const [[hour, minute], setTime] = useState(() => props.mode === 'time' && props.value
    ? props.value.split(':').map(Number) : [12, 0]);

  const monthsInYear = (year: number) => year === today.getFullYear() ? today.getMonth() + 1 : 12;
  const daysInMonth = (year: number, month: number) => year === today.getFullYear() && month === today.getMonth() + 1
    ? today.getDate() : new Date(year, month, 0).getDate();
  function changeDate(change: Partial<BirthDate>) {
    setDate((current) => {
      const next = { ...current, ...change };
      const month = Math.min(next.month, monthsInYear(next.year));
      return { ...next, month, day: Math.min(next.day, daysInMonth(next.year, month)) };
    });
  }

  return (
    <Modal visible animationType={reduced ? 'none' : 'slide'} onRequestClose={props.onClose}>
      <View style={styles.screen}>
        <CosmicBackground offset={offset} reduced={reduced} darkBottom />
        <SafeAreaView style={styles.safe}>
          <BirthPickerHeader title={props.mode === 'date' ? 'Set birthday' : 'Set birth time'} onBack={props.onClose} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.wheels}>
              <View pointerEvents="none" style={styles.selectionBand} />
              {props.mode === 'date' ? <>
                <Wheel key={'day-' + daysInMonth(date.year, date.month)} label="Day" start={1} count={daysInMonth(date.year, date.month)}
                  value={date.day} onChange={(day) => changeDate({ day })} />
                <Wheel key={'month-' + monthsInYear(date.year)} label="Month" start={1} count={monthsInYear(date.year)} value={date.month}
                  format={(month) => birthMonths[month - 1]} onChange={(month) => changeDate({ month })} />
                <Wheel label="Year" start={1900} count={today.getFullYear() - 1899} value={date.year} onChange={(year) => changeDate({ year })} />
              </> : <>
                <Wheel label="Hour" count={24} value={hour} format={pad} onChange={(next) => setTime((current) => [next, current[1]])} />
                <Wheel label="Minute" count={60} value={minute} format={pad} onChange={(next) => setTime((current) => [current[0], next])} />
              </>}
            </View>
            <Pressable accessibilityRole="button" onPress={() => {
              if (props.mode === 'date') props.onSave(date);
              else props.onSave(pad(hour) + ':' + pad(minute));
            }} style={styles.confirm}>
              <Text style={styles.confirmText}>{props.mode === 'date' ? 'Set date' : 'Set time'}</Text>
            </Pressable>
            {props.mode === 'time' && <Pressable accessibilityRole="button" onPress={() => props.onSave('')} style={styles.unknown}>
              <Text style={styles.unknownText}>I don’t know my birth time</Text>
            </Pressable>}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cosmic.bg },
  safe: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', justifyContent: 'center', padding: 18, gap: 16 },
  wheels: { flexDirection: 'row', position: 'relative' },
  wheel: { flex: 1, minWidth: 0 },
  columnLabel: { height: 28, color: cosmic.muted, textAlign: 'center', fontSize: 12 },
  wheelScroll: { height: wheelHeight, flexGrow: 0 },
  wheelPadding: { paddingVertical: rowHeight * sideRows },
  selectionBand: { position: 'absolute', left: 0, right: 0, top: 28 + sideRows * rowHeight, height: rowHeight,
    backgroundColor: 'rgba(180,156,255,0.16)', borderWidth: 1, borderColor: cosmic.line, borderRadius: 13 },
  row: { height: rowHeight, alignItems: 'center', justifyContent: 'center' },
  value: { color: cosmic.text, fontSize: 25, fontWeight: '600', fontVariant: ['tabular-nums'] },
  reducedValue: { fontSize: 19 },
  confirm: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 14, backgroundColor: '#d5c8ff' },
  confirmText: { color: cosmic.bg, fontSize: 16, fontWeight: '800' },
  unknown: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  unknownText: { color: '#d5c8ff', fontSize: 14, fontWeight: '600' },
});
