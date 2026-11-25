import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform } from 'react-native';
import { useApp } from '../context/AppContext';

export function useLocalBack(enabled: boolean, onBack: () => void) {
  const { registerBack } = useApp();
  const latest = useRef(onBack);
  latest.current = onBack;
  useEffect(() => {
    if (!enabled) return;
    return registerBack(() => { latest.current(); return true; });
  }, [enabled, registerBack]);
}

export function useEdgeBack(onBack: () => void, enabled = true) {
  const latest = useRef(onBack);
  latest.current = onBack;
  const gesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { x0, dx, dy, moveX }) =>
      (x0 || moveX - dx) <= 22 && dx > 14 && dx > Math.abs(dy) * 1.5,
    onPanResponderRelease: (_, { dx, dy, vx }) => {
      if (dx > Math.abs(dy) && (dx > 65 || (dx > 30 && vx > 0.55))) latest.current();
    },
  }), []);
  return Platform.OS === 'ios' && enabled ? gesture.panHandlers : {};
}

export function useBacktrackedSelection<Value>(initial: Value) {
  const [history, setHistory] = useState([initial]);
  const value = history[history.length - 1];
  useLocalBack(history.length > 1, () => setHistory((current) => current.slice(0, -1)));
  const select = (next: Value) => setHistory((current) =>
    current[current.length - 1] === next ? current : [...current.slice(-19), next]);
  return [value, select] as const;
}
