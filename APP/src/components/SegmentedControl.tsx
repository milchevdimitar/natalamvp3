import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { T } from './UI';

export function SegmentedControl<Value extends string>({ label, options, value, onChange, disabled }: {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
}) {
  const { colors } = useApp();
  return (
    <View accessibilityLabel={label} style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected, disabled }}
            disabled={disabled} onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: colors.purpleSoft }]}>
            <T size={14} bold={selected} muted={!selected} style={styles.label}>{option.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', maxWidth: 336, alignSelf: 'center', marginBottom: 16, flexDirection: 'row',
    gap: 4, padding: 3, borderWidth: 1, borderRadius: 14 },
  option: { flex: 1, minHeight: 44, padding: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  label: { textAlign: 'center' },
});
