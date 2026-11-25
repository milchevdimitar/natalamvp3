import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { useReducedMotion } from './useReducedMotion';

export const maxParallaxLevel = 8;
const lockKey = 'natala.appearance.lock-tilt-layers';
const preferenceKey = 'natala.appearance.star-parallax';

type Parallax = {
  x: Animated.Value;
  y: Animated.Value;
  level: number;
  setLevel: (level: number) => void;
  reduced: boolean;
  locked: boolean;
  setLocked: (locked: boolean) => void;
};
const ParallaxContext = createContext<Parallax | null>(null);
export const useTiltParallax = () => useContext(ParallaxContext);

export function TiltParallaxProvider({ children }: React.PropsWithChildren) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const [level, updateLevel] = useState(2);
  const [locked, setLocked] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(() => AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const reduced = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    void Promise.all([AsyncStorage.getItem(preferenceKey), AsyncStorage.getItem(lockKey)]).then(([value, savedLock]) => {
      if (mounted && savedLock !== null) setLocked(savedLock === 'true');
      const saved = value === null ? NaN : Number(value);
      if (mounted && Number.isInteger(saved) && saved >= 0) updateLevel(Math.min(saved, maxParallaxLevel));
    }).catch(() => {}).finally(() => { if (mounted) setLoaded(true); });
    const listener = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => { mounted = false; listener.remove(); };
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.multiSet([[preferenceKey, String(level)], [lockKey, String(locked)]]).catch(() => {});
  }, [loaded, level, locked]);

  const enabled = loaded && level > 0 && active && !reduced && Platform.OS !== 'web';
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    let origin: { x: number; y: number } | undefined;
    let smoothX = 0;
    let smoothY = 0;
    void Accelerometer.isAvailableAsync().then((available) => {
      if (!mounted || !available) return;
      Accelerometer.setUpdateInterval(33);
      subscription = Accelerometer.addListener((sample) => {
        if (!Number.isFinite(sample.x) || !Number.isFinite(sample.y)) return;
        origin ??= sample;
        const targetX = Math.max(-1, Math.min(1, (sample.x - origin.x) * 2));
        const targetY = Math.max(-1, Math.min(1, (origin.y - sample.y) * 2));
        smoothX += (targetX - smoothX) * 0.16;
        smoothY += (targetY - smoothY) * 0.16;
        x.setValue(smoothX);
        y.setValue(smoothY);
      });
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription?.remove();
      x.setValue(0);
      y.setValue(0);
    };
  }, [enabled, x, y]);

  const value = useMemo(() => ({ x, y, level, setLevel: updateLevel, reduced, locked, setLocked }), [x, y, level, reduced, locked]);
  return <ParallaxContext.Provider value={value}>{children}</ParallaxContext.Provider>;
}
