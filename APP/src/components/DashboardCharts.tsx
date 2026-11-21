import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Polygon, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../screens/Home/CosmicBackground';
import { useApp } from '../context/AppContext';

type SectionId = 'metrics' | 'elements' | 'ayurveda';

export function useDashboardVisibility() {
  const layouts = useRef<Partial<Record<SectionId, { y: number; height: number }>>>({});
  const scroll = useRef({ y: 0, height: 0 });
  const visited = useRef<Partial<Record<SectionId, boolean>>>({});
  const [visible, setVisible] = useState<Partial<Record<SectionId, boolean>>>({});

  const scan = useCallback(() => {
    const { y, height } = scroll.current;
    if (height <= 0) return;
    let changed = false;
    for (const [key, layout] of Object.entries(layouts.current)) {
      const id = key as SectionId;
      const overlap = layout ? Math.min(layout.y + layout.height, y + height) - Math.max(layout.y, y) : 0;
      if (!visited.current[id] && layout && overlap >= Math.min(80, layout.height * 0.45, height * 0.45)) {
        visited.current[id] = true;
        changed = true;
      }
    }
    if (changed) setVisible({ ...visited.current });
  }, []);

  const section = (id: SectionId) => (event: LayoutChangeEvent) => {
    layouts.current[id] = event.nativeEvent.layout;
    scan();
  };
  const onLayout = (event: LayoutChangeEvent) => {
    scroll.current.height = event.nativeEvent.layout.height;
    scan();
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scroll.current.y = event.nativeEvent.contentOffset.y;
    scroll.current.height = event.nativeEvent.layoutMeasurement.height;
    scan();
  };

  return { visible, section, onLayout, onScroll };
}

function useProgress(active: boolean) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduced) {
      progress.setValue(active ? 1 : 0);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [active, reduced, progress]);
  return progress;
}

export function CountUp({ value, active, color, size = 26, suffix = '' }: {
  value: number; active: boolean; color: string; size?: number; suffix?: string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active || reduced) {
      setDisplay(active ? value : 0);
      return;
    }
    const animationValue = new Animated.Value(0);
    const listener = animationValue.addListener(({ value: frame }) => setDisplay(Math.round(frame)));
    const motion = Animated.timing(animationValue, { toValue: value, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    motion.start();
    return () => { motion.stop(); animationValue.removeListener(listener); };
  }, [active, reduced, value]);

  return <Text accessibilityLabel={value + suffix} style={{ color, fontSize: size, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{display}{suffix}</Text>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const radius = 27;
const circumference = Math.PI * 2 * radius;

export function DashboardRing({ value, active, accent }: { value?: number; active: boolean; accent: string }) {
  const { colors } = useApp();
  const progress = useProgress(active);
  const dash = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, circumference * (1 - (value ?? 0) / 100)] });
  return (
    <View style={styles.ring}>
      <Svg width={72} height={72} viewBox="0 0 64 64" accessible={false}>
        <Circle cx={32} cy={32} r={radius} stroke={colors.line} strokeWidth={5} fill="none" />
        {!!value && <AnimatedCircle cx={32} cy={32} r={radius} stroke={accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={[circumference, circumference]} strokeDashoffset={dash} rotation={-90} origin="32,32" />}
      </Svg>
      <View style={styles.ringLabel}>
        {value === undefined
          ? <Text style={{ color: colors.muted, fontSize: 20 }}>—</Text>
          : <CountUp value={value} suffix="%" active={active} size={16} color={colors.text} />}
      </View>
    </View>
  );
}

type BalanceCategory = readonly [label: string, accent: string];

export function ElementColumns({ categories, values, active }: {
  categories: readonly BalanceCategory[];
  values?: number[];
  active: boolean;
}) {
  const { colors } = useApp();
  const progress = useProgress(active);
  return (
    <View style={styles.columns}>
      {categories.map(([label, accent], index) => {
        const value = values?.[index];
        const height = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', (value ?? 0) + '%'] });
        return (
          <View key={label} style={styles.column}>
            <View style={styles.columnValue}>
              {value === undefined ? <Text style={{ color: colors.muted }}>—</Text> : <CountUp value={value} active={active} color={colors.text} size={16} suffix="%" />}
            </View>
            <View style={[styles.columnTrack, { borderColor: colors.line, backgroundColor: colors.purpleSoft }]}>
              {value !== undefined && <Animated.View style={[styles.columnFill, { height }]}>
                <LinearGradient colors={[accent, accent + '80']} style={StyleSheet.absoluteFill} />
              </Animated.View>}
            </View>
            <Text style={[styles.columnLabel, { color: colors.muted }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const triangle = [[160, 25], [55, 25 + 105 * Math.sqrt(3)], [265, 25 + 105 * Math.sqrt(3)]] as const;
type Point = readonly [number, number];
const center = [160, triangle[0][1] / 3 + 2 * triangle[1][1] / 3] as const;
const mix = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function DoshaTriangle({ categories, values, active }: {
  categories: readonly BalanceCategory[];
  values?: number[];
  active: boolean;
}) {
  const { colors, theme } = useApp();
  const progress = useProgress(active);
  const position = (axis: 0 | 1) => values
    ? triangle.reduce((sum, vertex, index) => sum + vertex[axis] * values[index] / 100, 0)
    : center[axis];
  const cx = progress.interpolate({ inputRange: [0, 1], outputRange: [center[0], position(0)] });
  const cy = progress.interpolate({ inputRange: [0, 1], outputRange: [center[1], position(1)] });

  return (
    <>
      <Svg width="100%" height={224} viewBox="0 0 320 232" accessible={false}>
        <Defs>
          <SvgGradient id="dosha-fill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset={0} stopColor={theme === 'dark' ? '#493c82' : '#e1d9fb'} />
            <Stop offset={1} stopColor={theme === 'dark' ? '#17294e' : '#ccd8f7'} />
          </SvgGradient>
        </Defs>
        <Polygon points={triangle.map((point) => point.join(',')).join(' ')} fill="url(#dosha-fill)" stroke={colors.purple} strokeOpacity={0.65} />
        {[0.25, 0.5, 0.75].map((amount) => triangle.map((vertex, index) => {
          const from = mix(vertex, triangle[(index + 1) % 3], amount);
          const to = mix(vertex, triangle[(index + 2) % 3], amount);
          return <Line key={amount + ':' + index} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={colors.muted} strokeOpacity={0.34} strokeDasharray="3 5" />;
        }))}
        <Circle cx={center[0]} cy={center[1]} r={6} fill="none" stroke={colors.muted} strokeDasharray="2 2" />
        {values && active && <>
          <AnimatedCircle cx={cx} cy={cy} r={14} fill={colors.purple} opacity={0.24} />
          <AnimatedCircle cx={cx} cy={cy} r={6.5} fill={colors.text} stroke={colors.purple} strokeWidth={3} />
        </>}
        {categories.map(([label, accent], index) => <SvgText key={label} x={triangle[index][0]} y={index === 0 ? 15 : 226} textAnchor="middle" fontSize={12} fontWeight="700" fill={theme === 'dark' ? accent : colors.text}>{label}</SvgText>)}
      </Svg>
      <View style={styles.triangleLegend}>
        {categories.map(([label, accent], index) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: accent }]} />
            <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
            {values ? <CountUp value={values[index]} active={active} size={12} color={colors.text} suffix="%" /> : <Text style={{ color: colors.muted }}>—</Text>}
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  ring: { width: 72, height: 72 },
  ringLabel: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  columns: { flexDirection: 'row', justifyContent: 'center', gap: 9 },
  column: { flex: 1, maxWidth: 96, alignItems: 'center', gap: 7 },
  columnValue: { minHeight: 22, justifyContent: 'center' },
  columnTrack: { width: '100%', height: 118, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 12, borderWidth: 1 },
  columnFill: { width: '100%', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  columnLabel: { fontSize: 11, fontWeight: '600' },
  triangleLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
});
