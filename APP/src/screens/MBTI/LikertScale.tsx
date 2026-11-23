import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';

const choices = [
  'Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neutral',
  'Somewhat agree', 'Agree', 'Strongly agree',
] as const;
const sizes = [30, 26, 22, 18, 22, 26, 30];
const markerSize = 30;
type Drag = { origin?: number; pageX: number; position?: number };

export function LikertScale({ value, onChange, colors }: {
  value?: number;
  onChange: (value: number) => void;
  colors: { surfaceAlt: string; surface: string; line: string; purple: string };
}) {
  const track = useRef<React.ComponentRef<typeof View>>(null);
  const width = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [dragX, setDragX] = useState<number | null>(null);
  const gesture = useRef<Drag | null>(null);

  const responder = useMemo(() => {
    const move = (pageX: number) => {
      const drag = gesture.current;
      if (!drag || !width.current) return;
      drag.pageX = pageX;
      if (drag.origin === undefined) return;
      const inset = width.current / (2 * choices.length);
      drag.position = Math.min(width.current - inset, Math.max(inset, pageX - drag.origin));
      setDragX(drag.position);
    };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.35,
      onPanResponderGrant: (event) => {
        const drag: Drag = { pageX: event.nativeEvent.pageX };
        gesture.current = drag;
        track.current?.measure((_x, _y, _width, _height, pageX) => {
          if (gesture.current !== drag) return;
          drag.origin = pageX;
          move(drag.pageX);
        });
      },
      onPanResponderMove: (_, { moveX }) => move(moveX),
      onPanResponderRelease: () => {
        const position = gesture.current?.position;
        gesture.current = null;
        setDragX(null);
        if (position !== undefined && width.current) {
          const index = Math.min(choices.length - 1, Math.floor(position / width.current * choices.length));
          onChangeRef.current(index + 1);
        }
      },
      onPanResponderTerminate: () => {
        gesture.current = null;
        setDragX(null);
      },
    });
  }, []);

  return (
    <View
      ref={track}
      collapsable={false}
      onLayout={({ nativeEvent }) => { width.current = nativeEvent.layout.width; }}
      style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={[styles.rail, { backgroundColor: colors.line }]} />
      {choices.map((label, index) => {
        const selected = value === index + 1;
        const size = sizes[index];
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(index + 1)}
            style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
          >
            <View pointerEvents="none" style={{
              width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.line,
              backgroundColor: index === 3 ? colors.line : colors.surface,
            }} />
            {selected && dragX === null && <View pointerEvents="none" style={[styles.marker, { backgroundColor: colors.purple }]} />}
          </Pressable>
        );
      })}
      {dragX !== null && (
        <View pointerEvents="none" style={[styles.marker, { left: dragX - markerSize / 2, backgroundColor: colors.purple }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: 28, ...(Platform.OS === 'web' ? { touchAction: 'pan-y' } : {}) },
  rail: { position: 'absolute', left: '7%', right: '7%', height: 2 },
  slot: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
  marker: { position: 'absolute', width: markerSize, height: markerSize, borderRadius: markerSize / 2, borderWidth: 2, borderColor: '#ede5ff' },
});
