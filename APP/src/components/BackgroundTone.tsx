import React, { createContext, useContext, useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BackgroundStyle = 'default' | 'aurora';
const auroraPreset = {
  colorSpeed: 10, colorDifference: 10, glowSize: 5, glowX: 0, glowY: 10, driftSpeed: 10,
};
const defaultStyle: BackgroundStyle = 'default';

const storageKey = 'natala.appearance.background-tone';
function useCycle(enabled: boolean, duration: number) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    value.setValue(0);
    if (!enabled) return;
    const leg = (toValue: number) => Animated.timing(value, {
      toValue, duration, easing: Easing.inOut(Easing.sin),
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    });
    const loop = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    loop.start();
    return () => loop.stop();
  }, [enabled, duration, value]);
  return value;
}

const idlePhase = new Animated.Value(0);
const ToneContext = createContext({
  ...auroraPreset,
  backgroundStyle: defaultStyle as BackgroundStyle,
  blend: idlePhase,
  drift: idlePhase,
  setBackgroundStyle: (_style: BackgroundStyle) => {},
});

export const useBackgroundTone = () => useContext(ToneContext);

export function BackgroundToneProvider({ children }: React.PropsWithChildren) {
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>(defaultStyle);
  const [loaded, setLoaded] = useState(false);
  const reduced = useReducedMotion();
  const animated = backgroundStyle === 'aurora' && !reduced;
  const blend = useCycle(animated, 22000 - auroraPreset.colorSpeed * 1800);
  const drift = useCycle(animated, 29000 - auroraPreset.driftSpeed * 2300);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(storageKey).then((saved) => {
      if (!mounted || !saved) return;
      const value = JSON.parse(saved);
      setBackgroundStyle(value?.backgroundStyle === 'aurora' ? 'aurora' : defaultStyle);
    }).catch(() => {}).finally(() => { if (mounted) setLoaded(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(storageKey, JSON.stringify({ backgroundStyle })).catch(() => {});
  }, [loaded, backgroundStyle]);

  return <ToneContext.Provider value={{ ...auroraPreset, backgroundStyle, blend, drift, setBackgroundStyle }}>
    {/* Keep the animated values attached while one screen unmounts and the next mounts. */}
    {animated && <Animated.View
      accessible={false}
      pointerEvents="none"
      style={{ position: 'absolute', width: 0, height: 0, transform: [{ translateX: blend }, { translateY: drift }] }}
    />}
    {children}
  </ToneContext.Provider>;
}
