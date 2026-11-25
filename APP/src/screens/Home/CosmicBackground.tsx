import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { StarField } from '../../components/StarField';
export { useReducedMotion } from '../../components/useReducedMotion';
import { ShootingStar } from '../../components/ShootingStar';

export function CosmicBackground({ offset, horizontal, reduced, travel = 1800, light = false, darkBottom = false }: {
  offset: Animated.Value | ReturnType<typeof Animated.subtract> | ReturnType<typeof Animated.multiply>;
  horizontal?: boolean;
  reduced: boolean;
  travel?: number;
  light?: boolean;
  darkBottom?: boolean;
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <LinearGradient colors={light ? ['#f3f5ff', '#e6edff', '#e1e8fd', '#eeeaff'] : ['#03091f', '#0a1b48', '#11265b', '#080f31']} locations={[0, 0.35, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="blue" cx="12%" cy="50%" rx="73%" ry="29%">
            <Stop stopColor="#3068d7" stopOpacity={light ? 0.11 : 0.30} />
            <Stop offset="1" stopColor="#3068d7" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="violet" cx="78%" cy="10%" rx="74%" ry="29%">
            <Stop stopColor="#6d57c1" stopOpacity={light ? 0.10 : 0.26} />
            <Stop offset="1" stopColor="#6d57c1" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lower-glow" cx="82%" cy="78%" rx="70%" ry="26%">
            <Stop stopColor="#724cbd" stopOpacity={light ? 0.09 : 0.23} />
            <Stop offset="1" stopColor="#724cbd" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#blue)" />
        <Rect width="100%" height="100%" fill="url(#violet)" />
        <Rect width="100%" height="100%" fill="url(#lower-glow)" />
      </Svg>
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
