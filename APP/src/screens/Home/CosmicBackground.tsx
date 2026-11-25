import React, { useId } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useBackgroundTone } from '../../components/BackgroundTone';
import { StarField } from '../../components/StarField';
import { ShootingStar } from '../../components/ShootingStar';
export { useReducedMotion } from '../../components/useReducedMotion';

const locations = [0, 0.35, 0.65, 1] as const;
// Keep the SVG bounds outside the viewport at both extremes of the drift.
const glowOverscan = 64;
const glows = [
  { x: 12, y: 50, rx: 73, ry: 29, color: '#3068d7', light: 0.11, dark: 0.30 },
  { x: 78, y: 10, rx: 74, ry: 29, color: '#6d57c1', light: 0.10, dark: 0.26 },
  { x: 82, y: 78, rx: 70, ry: 26, color: '#724cbd', light: 0.09, dark: 0.23 },
];

export function CosmicBackground({ offset, horizontal, reduced, travel = 1800, light = false, darkBottom = false }: {
  offset: Animated.Value | ReturnType<typeof Animated.subtract> | ReturnType<typeof Animated.multiply>;
  horizontal?: boolean;
  reduced: boolean;
  travel?: number;
  light?: boolean;
  darkBottom?: boolean;
}) {
  const { backgroundStyle, colorSpeed, colorDifference, glowSize, glowX, glowY, driftSpeed, blend, drift } = useBackgroundTone();
  const aurora = backgroundStyle === 'aurora';
  const drifting = aurora && !reduced && driftSpeed > 0;
  const base = light ? ['#f3f5ff', '#e6edff', '#e1e8fd', '#eeeaff'] as const
    : ['#03091f', '#0a1b48', '#11265b', '#080f31'] as const;
  const alternate = light ? ['#f6f1ff', '#e9e3fb', '#d1ebf8', '#eadff9'] as const
    : ['#0c0922', '#251648', '#194059', '#24133e'] as const;
  const x = aurora ? (glowX - 5) * 4.4 : 0;
  const y = aurora ? (glowY - 5) * 4.4 : 0;
  const scale = aurora ? 0.55 + glowSize * 0.09 : 1;
  const id = 'cosmic-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <LinearGradient colors={base} locations={locations} style={StyleSheet.absoluteFill} />
      {aurora && colorDifference > 0 && <Animated.View style={[StyleSheet.absoluteFill, {
        opacity: !reduced && colorSpeed > 0 ? blend.interpolate({ inputRange: [0, 1], outputRange: [0, colorDifference / 10] })
          : colorDifference / 20,
      }]}>
        <LinearGradient colors={alternate} locations={locations} style={StyleSheet.absoluteFill} />
      </Animated.View>}
      <Animated.View style={[StyleSheet.absoluteFill, aurora && {
        top: -glowOverscan, left: -glowOverscan, right: -glowOverscan, bottom: -glowOverscan,
        transform: drifting ? [
          { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) },
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [13, -13] }) },
        ] : undefined,
      }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {glows.map((glow, index) => (
              <RadialGradient key={glow.color} id={id + index}
                cx={(glow.x + x) + '%'} cy={(glow.y + y) + '%'} rx={(glow.rx * scale) + '%'} ry={(glow.ry * scale) + '%'}>
                <Stop stopColor={glow.color} stopOpacity={light ? glow.light : glow.dark} />
                <Stop offset="1" stopColor={glow.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {glows.map((glow, index) => <Rect key={glow.color} width="100%" height="100%" fill={'url(#' + id + index + ')'} />)}
        </Svg>
      </Animated.View>
      {darkBottom && <LinearGradient
        colors={['rgba(1,4,14,0)', 'rgba(1,3,12,0.48)', '#010208']}
        locations={[0.24, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />}
      <StarField offset={offset} horizontal={horizontal} reduced={reduced} travel={travel} light={light} />
      <ShootingStar reduced={reduced} light={light} />
    </View>
  );
}
