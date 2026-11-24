import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Clock } from 'lucide-react-native';
import { BirthWheelPicker, birthMonths, type BirthDate } from './BirthWheelPicker';

export function BirthPickerFields({ date, time, onDateChange, onTimeChange, disabled, colors }: {
  date: BirthDate | null;
  time: string;
  onDateChange: (value: BirthDate) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
  colors: { text: string; muted: string; line: string };
}) {
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const dateLabel = date ? date.day + ' ' + birthMonths[date.month - 1] + ' ' + date.year : 'Choose date';

  return <>
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Date of birth</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Date of birth, ' + dateLabel}
          disabled={disabled} onPress={() => setPicker('date')} style={[styles.button, { borderColor: colors.line }]}>
          <CalendarDays size={17} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.value, { color: colors.text }]}>{dateLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Hour of birth</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Hour of birth, ' + (time || 'optional')}
          disabled={disabled} onPress={() => setPicker('time')} style={[styles.button, { borderColor: colors.line }]}>
          <Clock size={17} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.value, { color: colors.text }]}>{time || 'Optional'}</Text>
        </Pressable>
      </View>
    </View>
    {picker === 'date' && <BirthWheelPicker mode="date" value={date}
      onClose={() => setPicker(null)} onSave={(value) => { onDateChange(value); setPicker(null); }} />}
    {picker === 'time' && <BirthWheelPicker mode="time" value={time}
      onClose={() => setPicker(null)} onSave={(value) => { onTimeChange(value); setPicker(null); }} />}
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, minWidth: 0, gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8,
    borderWidth: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  value: { flex: 1, fontSize: 13 },
});
