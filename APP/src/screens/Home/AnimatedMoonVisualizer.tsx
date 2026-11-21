import React, { useEffect, useId, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import type { MoonPhaseData } from './home.types';

const center = 34.5;
const radius = 33.5;

function shadowPath(waxing: boolean, illuminated: number) {
  const outerSweep = waxing ? 0 : 1;
  const terminatorSweep = illuminated >= 50 ? 1 - outerSweep : outerSweep;
  const terminatorRadius = radius * Math.abs(1 - illuminated / 50);
  const terminator = terminatorRadius < 0.01
    ? 'L34.5 1'
    : `A${terminatorRadius} ${radius} 0 0 ${terminatorSweep} 34.5 1`;
  return `M34.5 1 A${radius} ${radius} 0 0 ${outerSweep} 34.5 68 ${terminator} Z`;
}

export function AnimatedMoonVisualizer({ moonPhase, size, reduced }: {
  moonPhase: MoonPhaseData; size: number; reduced: boolean;
}) {
  const id = 'natala-moon-' + useId().replace(/[^a-z0-9]/gi, '');
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (reduced) {
      glow.setValue(0.45);
      return;
    }

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 0.8, duration: 2600, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
      Animated.timing(glow, { toValue: 0.45, duration: 2600, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, reduced]);

  return (
    <Animated.View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.halo, { borderRadius: size / 2, opacity: glow }]} />
      <Svg width={size} height={size} viewBox="0 0 69 69" accessible={false}>
        <Defs>
          <RadialGradient id={id} cx="35%" cy="28%" rx="78%" ry="78%">
            <Stop offset="0" stopColor="#fcf8ea" />
            <Stop offset="0.46" stopColor="#d8d0bc" />
            <Stop offset="1" stopColor="#b0a38e" />
          </RadialGradient>
        </Defs>
        <Circle cx={center} cy={center} r={radius} fill={`url(#${id})`} />
        <Circle cx={22} cy={23} r={5.5} fill="#594d3c" opacity={0.19} />
        <Circle cx={42} cy={44} r={9.5} fill="#594d3c" opacity={0.16} />
        <Circle cx={30} cy={49} r={3} fill="#594d3c" opacity={0.10} />
        <Path d={shadowPath(moonPhase.phasePercent < 50, moonPhase.illuminated)} fill="#172343" opacity={0.62} />
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(218,227,255,0.32)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  halo: { backgroundColor: '#7ca5f7', boxShadow: '0 0 20px 4px rgba(107,149,249,0.48)', transform: [{ scale: 1.08 }] },
});
