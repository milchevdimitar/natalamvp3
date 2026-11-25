import { SegmentedControl } from '../components/SegmentedControl';
import { useBackgroundTone } from '../components/BackgroundTone';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
        React.createElement('input', {
          type: 'range', 'aria-label': label, min: 0, max, step: 1, value,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.currentTarget.value)),
          style: { width: '100%', height: 34, accentColor: colors.purple },
        })
      )}
    </View>
  );
}

export function AppearanceSettings() {
  const { backgroundStyle, setBackgroundStyle } = useBackgroundTone();
  const tilt = useTiltParallax();

  if (!tilt) return null;
  return (
    <>
    <Card style={styles.card}>
      <T bold size={16}>Background</T>
      <SegmentedControl label="Background style"
        options={[{ value: 'default', label: 'Default' }, { value: 'aurora', label: 'Aurora' }]}
        value={backgroundStyle} onChange={setBackgroundStyle} />
    </Card>
    <Card style={styles.card}>
      <T bold size={16}>Star parallax</T>
      <TuneSlider label="Tilt strength" value={tilt.level} max={maxParallaxLevel} onChange={tilt.setLevel} />
      {tilt.reduced && <T muted size={12}>Device Reduce Motion is enabled.</T>}
    </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10, marginBottom: 12 },
  row: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  slider: { width: '100%', height: 44 },
});
