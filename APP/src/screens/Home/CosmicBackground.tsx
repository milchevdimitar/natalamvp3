import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; listener.remove(); };
  }, []);
  return reduced;
}

export function CosmicBackground({ offset, horizontal, reduced, travel = 1800, light = false, darkBottom = false }: {
  offset: Animated.Value;
  horizontal?: boolean;
  reduced: boolean;
  travel?: number;
  light?: boolean;
  darkBottom?: boolean;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2500, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 2200, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced, shimmer]);

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
      {[0, 1, 2].map((layer) => {
        const drift = reduced ? 0 : offset.interpolate({
          inputRange: [-1, 0, Math.max(1, travel)],
          outputRange: [0, 0, -(layer + 1) * 45],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View key={layer} style={[StyleSheet.absoluteFill, {
            bottom: -150, right: -150,
            transform: horizontal ? [{ translateX: drift }] : [{ translateY: drift }],
          }]}>
            {Array.from({ length: 22 }, (_, index) => {
              const size = index % 9 === 0 ? 3 : layer === 2 ? 2 : 1;
              return (
                <Animated.View key={index} style={{
                  position: 'absolute', width: size, height: size, borderRadius: size,
                  top: `${(index * 37.7 + layer * 12.1) % 100}%`,
                  left: `${(index * 71.3 + layer * 18.7) % 100}%`,
                  backgroundColor: '#e2ecff',
                  opacity: !reduced && index % 6 === 0
                    ? shimmer.interpolate({ inputRange: [0, 1], outputRange: layer === 1 ? [0.85, 0.25] : [0.25, 0.85] })
                    : 0.25 + layer * 0.13,
                }} />
              );
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}
