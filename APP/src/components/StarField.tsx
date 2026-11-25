import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useTiltParallax } from './TiltParallax';

const depths = [5, 13, 26];

export function StarField({ offset, horizontal, travel = 1800, reduced, light, subtle }: {
  offset?: Animated.Value | ReturnType<typeof Animated.subtract> | ReturnType<typeof Animated.multiply>;

  horizontal?: boolean;
  travel?: number;
  reduced?: boolean;
  light?: boolean;
  subtle?: boolean;
}) {
  const motion = useTiltParallax();
  const still = reduced || motion?.reduced;
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still || subtle || !offset) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2500, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 2200, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still, subtle, offset, shimmer]);

  return <View pointerEvents="none" style={styles.clip}>
    {depths.map((depth, layer) => (
      <StarLayer key={depth} layer={layer} depth={depth} offset={offset} horizontal={horizontal}
        travel={travel} still={still} light={light} subtle={subtle} shimmer={shimmer} />
    ))}
  </View>;
}

function StarLayer({ layer, depth, offset, horizontal, travel, still, light, subtle, shimmer }: {
  layer: number; depth: number; offset?: Animated.Value | ReturnType<typeof Animated.subtract> | ReturnType<typeof Animated.multiply>; horizontal?: boolean; travel: number;
  still?: boolean; light?: boolean; subtle?: boolean; shimmer: Animated.Value;
}) {
  const motion = useTiltParallax();
  const strength = still ? 0 : (motion?.level ?? 0) * 0.25;
  const tiltDepth = 13;
  const motionX = motion?.x;
  const motionY = motion?.y;
  const transform = useMemo(() => {
    const x = motionX && strength ? Animated.multiply(motionX, tiltDepth * strength) : 0;
    const y = motionY && strength ? Animated.multiply(motionY, tiltDepth * strength) : 0;
    const scroll = !still && offset ? Animated.add(offset, 0).interpolate({
      inputRange: [0, Math.max(1, travel)], outputRange: [0, -(layer + 1) * 45], extrapolate: 'clamp',
    }) : null;
    const translateY = scroll && !horizontal ? Animated.add(y, scroll) : y;
    return [
      { translateX: scroll && horizontal ? Animated.add(x, scroll) : x },
      { translateY: translateY },
    ];
  }, [motionX, motionY, tiltDepth, strength, still, offset, travel, layer, horizontal]);
  const pulse = useMemo(() => shimmer.interpolate({
    inputRange: [0, 1], outputRange: layer === 1 ? [0.85, 0.25] : [0.25, 0.85],
  }), [layer, shimmer]);

  return <Animated.View style={[styles.layer, offset && styles.scrollOverscan, { transform }]}>
    {Array.from({ length: subtle ? 10 : 22 }, (_, index) => {
      const size = index % 9 === 0 ? 3 : layer === 2 ? 2 : 1;
      return <Animated.View key={index} style={{
        position: 'absolute', width: size, height: size, borderRadius: size,
        top: ((index * 37.7 + layer * 12.1) % 100) + '%',
        left: ((index * 71.3 + layer * 18.7) % 100) + '%',
        backgroundColor: light ? '#617bb3' : '#e2ecff',
        opacity: subtle ? 0.13 + layer * 0.04 : !still && offset && !light && index % 6 === 0 ? pulse : 0.25 + layer * 0.13,
      }} />;
    })}
  </Animated.View>;
}

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  layer: { position: 'absolute', top: -60, left: -60, right: -60, bottom: -60 },
  scrollOverscan: { right: -198, bottom: -198 },
});
