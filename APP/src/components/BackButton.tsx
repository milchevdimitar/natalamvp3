import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { cosmic } from '../theme/cosmic';

export const backHeaderSpacing = { paddingHorizontal: 18, paddingTop: 8 } as const;

export function BackButton({ onPress, label = 'Go back', disabled = false, onDark = false }: {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  onDark?: boolean;
}) {
  const { theme, colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed]}
    >
      <ChevronLeft color={onDark || theme === 'dark' ? cosmic.text : colors.text} size={23} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.55 },
});
