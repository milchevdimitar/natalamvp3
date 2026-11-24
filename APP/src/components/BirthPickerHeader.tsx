import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton, backHeaderSpacing } from './BackButton';
import { cosmic } from '../theme/cosmic';

export function BirthPickerHeader({ title, onBack, color = cosmic.text, onDark = true }: {
  title: string;
  onBack: () => void;
  color?: string;
  onDark?: boolean;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} onDark={onDark} />
      <Text accessibilityRole="header" style={[styles.title, { color }]}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: 500, alignSelf: 'center', ...backHeaderSpacing, flexDirection: 'row', alignItems: 'center' },
  spacer: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
});
