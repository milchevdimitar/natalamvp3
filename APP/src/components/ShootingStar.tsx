import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const cadence = 60000;
const startedAt = Date.now();

type Trail = { x: number; y: number; dx: number; dy: number; rotation: string };

export function ShootingStar({ reduced, light = false }: { reduced: boolean; light?: boolean }) {
  const { width, height } = useWindowDimensions();
  const [trail, setTrail] = useState<Trail | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTrail(null);
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    let flight: Animated.CompositeAnimation | undefined;
    let disposed = false;
    const nextMinute = () => startedAt + (Math.floor((Date.now() - startedAt) / cadence) + 1) * cadence;
    let deadline = nextMinute();

    const schedule = () => {
      timer = setTimeout(() => {
        deadline = Math.max(deadline + cadence, nextMinute());
        schedule();
        if (AppState.currentState !== 'active' && AppState.currentState !== null) return;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.max(34, Math.min(width, height, 360) * (0.28 + Math.random() * 0.12));
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        progress.setValue(0);
        setTrail({
          x: width * (0.24 + Math.random() * 0.52) - dx / 2,
          y: height * (0.23 + Math.random() * 0.46) - dy / 2,
          dx, dy, rotation: angle + 'rad',
        });
        flight = Animated.timing(progress, {
          toValue: 1, duration: 850, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false,
        });
        flight.start(({ finished }) => { if (finished && !disposed) setTrail(null); });
      }, Math.max(1, deadline - Date.now()));
    };
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
      flight?.stop();
    };
  }, [height, progress, reduced, width]);

  if (!trail) return null;
  return (
    <View style={styles.layer} pointerEvents="none" aria-hidden>
      <Animated.View testID="shooting-star" style={[
        styles.star,
        {
          left: trail.x,
          top: trail.y,
          opacity: progress.interpolate({ inputRange: [0, 0.2, 0.64, 1], outputRange: [0, 0.68, 0.53, 0] }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, trail.dx] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, trail.dy] }) },
            { rotate: trail.rotation },
          ],
        },
      ]}>
        <LinearGradient colors={light ? ['rgba(77,95,156,0)', '#6273ae'] : ['rgba(171,202,255,0)', '#c4dcff']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.tail} />
        <View style={[styles.head, light && { backgroundColor: '#5e6fae' }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  star: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  tail: { width: 25, height: 1, borderRadius: 1 },
  head: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#f4f8ff' },
});
