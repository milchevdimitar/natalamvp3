import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';
import { useReducedMotion } from '../screens/Home/CosmicBackground';
import { useApp } from '../context/AppContext';
import { DOSHA_ICONS } from '../screens/Ayurveda/DoshaBalanceCard';

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
export function DashboardProgressBar({ value, active }: { value: number; active: boolean }) {
  const { colors } = useApp();
  const progress = useProgress(active);
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', value + '%'] });
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Discovery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} style={[styles.progressTrack, { backgroundColor: colors.line }]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: colors.purple }]} />
    </View>
  );
}

type BalanceCategory = readonly [label: string, accent: string];

export function ElementSymbols({ categories, values, active }: {
  categories: readonly BalanceCategory[];
  values?: number[];
  active: boolean;
}) {
  const { colors } = useApp();
  const ordered = categories.map(([label, accent], index) => ({ label, accent, value: values?.[index] }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return (
    <View style={styles.columns}>
      {ordered.map(({ label, accent, value }) => {
        const up = label === 'Fire' || label === 'Air';
        const crossed = label === 'Air' || label === 'Earth';
        return (
          <View key={label} style={styles.column}>
            <Svg width={54} height={54} viewBox="0 0 60 60" accessible={false}>
              <Polygon points={up ? '30,9 53,49 7,49' : '7,11 53,11 30,51'} fill="none" stroke={accent} strokeWidth={2.4} strokeLinejoin="round" />
              {crossed && <Line x1={16} x2={44} y1={30} y2={30} stroke={accent} strokeWidth={2.4} />}
            </Svg>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            {value === undefined ? <Text style={{ color: colors.muted }}>—</Text> : <CountUp value={value} active={active} color={colors.text} size={16} suffix="%" />}
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
  categories: readonly (readonly [keyof typeof DOSHA_ICONS, string])[];
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
  const legend = categories.map(([label, accent], index) => ({ label, accent, value: values?.[index] }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  return (
    <View style={styles.triangleLayout}>
      <View style={styles.triangleLegend}>
        {legend.map(({ label, accent, value }) => (
          <View key={label} style={styles.legendItem}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            {value === undefined ? <Text style={{ color: colors.muted }}>—</Text> : <CountUp value={value} active={active} size={16} color={colors.text} suffix="%" />}
          </View>
        ))}
      </View>
      <View style={styles.triangleGraphic}>
        <Svg width="100%" height={146} viewBox="33 -10 254 247" accessible={false}>
          <Defs>
            <SvgGradient id="dosha-fill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset={0} stopColor={theme === 'dark' ? '#493c82' : '#e1d9fb'} />
              <Stop offset={1} stopColor={theme === 'dark' ? '#17294e' : '#ccd8f7'} />
            </SvgGradient>
          </Defs>
          <Polygon points={triangle.map((point) => point.join(',')).join(' ')} fill="url(#dosha-fill)" stroke={colors.purple} strokeWidth={5} strokeLinejoin="round" />
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
          {categories.map(([label, accent], index) => {
            const Icon = DOSHA_ICONS[label];
            return <G key={label} x={triangle[index][0] - 11} y={index === 0 ? -7 : 214}><Icon size={22} color={accent} /></G>;
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  columns: { flexDirection: 'row', justifyContent: 'center', gap: 9 },
  column: { flex: 1, maxWidth: 96, alignItems: 'center', gap: 7 },
  triangleLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  triangleLegend: { width: 76, alignItems: 'center', gap: 6 },
  legendItem: { alignItems: 'center', gap: 2 },
  triangleGraphic: { flex: 1, maxWidth: 245, minWidth: 0 },
});
