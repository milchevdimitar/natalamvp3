import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTiltParallax, maxParallaxLevel } from '../components/TiltParallax';
import { Card, T } from '../components/UI';
import { useApp } from '../context/AppContext';


function TuneSlider({ label, value, max = 10, onChange }: {
  label: string; value: number; max?: number; onChange: (value: number) => void;
}) {
  const { colors } = useApp();
  return (
    <View>
      <View style={styles.row}><T bold size={13}>{label}</T><T muted size={13}>{value}</T></View>
      {Platform.OS !== 'web' ? <Slider style={styles.slider} accessibilityLabel={label}
        accessibilityValue={{ min: 0, max, now: value }} minimumValue={0} maximumValue={max} step={1}
        value={value} onValueChange={onChange} minimumTrackTintColor={colors.purple}
        maximumTrackTintColor={colors.line} thumbTintColor={colors.purple} /> : (
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Decrease ' + label} disabled={value === 0}
            onPress={() => onChange(value - 1)} style={styles.step}><T size={20}>−</T></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Increase ' + label} disabled={value === max}
            onPress={() => onChange(value + 1)} style={styles.step}><T size={20}>+</T></Pressable>
        </View>
      )}
    </View>
  );
}

export function AppearanceSettings() {
  const tilt = useTiltParallax();
  const { colors } = useApp();

  if (!tilt) return null;
  return (
    <Card style={styles.card}>
      <T bold size={16}>Star parallax</T>
      <TuneSlider label="Tilt strength" value={tilt.level} max={maxParallaxLevel} onChange={tilt.setLevel} />
      <View style={styles.row}>
        <T size={13}>Lock layers for tilt parallax</T>
        <Switch accessibilityLabel="Lock layers for tilt parallax" value={tilt.locked} onValueChange={tilt.setLocked}
          trackColor={{ true: colors.purple, false: colors.line }} />
      </View>
      {tilt.reduced && <T muted size={12}>Device Reduce Motion is enabled.</T>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10, marginBottom: 12 },
  row: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  slider: { width: '100%', height: 44 },
  step: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
});
