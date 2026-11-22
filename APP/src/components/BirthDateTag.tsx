import React from 'react';
import { View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { T } from './UI';

export function BirthDateTag({ date }: { date: string }) {
  const { colors } = useApp();
  return (
    <View accessible accessibilityLabel={'Birth date ' + date} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.purpleSoft }}>
      <Calendar size={12} color={colors.purple} />
      <T bold size={11} style={{ color: colors.text }}>{date}</T>
    </View>
  );
}
