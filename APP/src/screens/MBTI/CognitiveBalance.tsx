import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import type { CognitiveRatios } from './mbti.types';

const axes = [
  { key: 'EI', left: 'Extraverted', right: 'Introverted', reverse: false, dark: '#7eddf7', light: '#166478' },
  { key: 'SN', left: 'Intuitive', right: 'Observant', reverse: true, dark: '#f6c66d', light: '#84570c' },
  { key: 'TF', left: 'Thinking', right: 'Feeling', reverse: false, dark: '#78e2bc', light: '#176c56' },
  { key: 'JP', left: 'Judging', right: 'Prospecting', reverse: false, dark: '#ceb6ff', light: '#6449aa' },
] as const;

export function CognitiveBalance({ ratios, story = false }: { ratios: CognitiveRatios; story?: boolean }) {
  const { theme, colors } = useApp();
  const dark = story || theme === 'dark';

  return (
    <View style={{ gap: story ? 9 : 18 }}>
      {axes.map(({ key, left, right, reverse, dark: darkColor, light }) => {
        const ratio = ratios[key];
        const position = reverse ? ratio.first : ratio.second;
        const tied = position === 50;
        const label = tied ? 'Balanced' : position > 50 ? right : left;
        const percent = Math.max(position, 100 - position);
        const accent = dark ? darkColor : light;
        return (
          <View key={key} accessible accessibilityLabel={left + ' to ' + right + '. ' + label + ', ' + percent + ' percent'} style={{ gap: story ? 4 : 6 }}>
            <Text allowFontScaling={!story} style={[styles.label, { color: dark ? '#f8faff' : colors.text, fontSize: story ? 11 : 15 }]}>
              {label}{': '}<Text style={{ color: accent, fontWeight: '800' }}>{percent}%</Text>
            </Text>
            <View style={styles.rail}>
              <View style={[styles.track, { backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.42)' }]} />
              <View style={[styles.midpoint, { backgroundColor: dark ? '#8fa1d1' : '#546693' }]} />
              <View style={[styles.marker, { left: `${position}%`, backgroundColor: accent, borderColor: dark ? '#223055' : '#f6f8ff' }]} />
            </View>
            {!story && <View style={styles.ends}>
              <Text style={[styles.endpoint, { color: colors.muted }]}>{left}</Text>
              <Text style={[styles.endpoint, { color: colors.muted }]}>{right}</Text>
            </View>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontWeight: '600' },
  rail: { marginHorizontal: 8, height: 18, justifyContent: 'center' },
  track: { height: 9, borderRadius: 9 },
  midpoint: { position: 'absolute', left: '50%', width: 1, height: 8, opacity: 0.6 },
  marker: { position: 'absolute', top: 0, marginLeft: -9, width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endpoint: { fontSize: 10 },
});
