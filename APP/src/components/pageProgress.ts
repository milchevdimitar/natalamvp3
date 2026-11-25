import { useMemo, useRef } from 'react';
import { Animated } from 'react-native';

export function usePageProgress(width: number, initialIndex = 0) {
  const position = useRef(new Animated.Value(initialIndex)).current;
  const fraction = useRef(new Animated.Value(0)).current;
  const offset = useMemo(() => Animated.multiply(Animated.add(position, fraction), width), [position, fraction, width]);
  return { position, fraction, offset };
}
