import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Brain, Columns4, Diamond, Droplet, Fingerprint,
  Hash, Orbit, Shapes, Sparkles,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../context/AppContext';

type SymbolProps = { size: number; strokeWidth: number; color: string };

function PlayingCard({ size, color, strokeWidth }: SymbolProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
    <Path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M12 8l3 4-3 4-3-4 3-4Z" />
  </Svg>;
}

function ZodiacDragon({ size, color, strokeWidth }: SymbolProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m10 5-1-3 4 2 2-2 1 4 4 2 1 3-4 1-3-2c-5-1-8 2-7 5 1 3 5 3 8 1s6 0 5 3c-1 2-5 3-8 2l-3-1-4 1 2-3c-4-3-3-7 0-10l3-3Z M16 8h.1" />
  </Svg>;
}

function Lotus({ size, color, strokeWidth }: SymbolProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20C6 15 7 9 12 4c5 5 6 11 0 16Z M8 9a15 15 0 0 0-4-2c0 6 3 11 8 13 5-2 8-7 8-13a15 15 0 0 0-4 2 M5 13l-3-1c0 5 4 8 10 8 6 0 10-3 10-8l-3 1" />
  </Svg>;
}

const symbols = {
  astrology: Orbit,
  numerology: Hash,
  mbti: Brain,
  cardology: PlayingCard,
  tarot: Sparkles,
  ayurveda: Lotus,
  bazi: Columns4,
  'chinese-zodiac': ZodiacDragon,
  blood: Droplet,
  elements: Shapes,
  enneagram: Diamond,
  design: Fingerprint,
};

export type ExploreArtworkKind = keyof typeof symbols;

export function ExploreArtwork({ kind, muted = false, onDark = false }: { kind: ExploreArtworkKind; muted?: boolean; onDark?: boolean }) {
  const { colors, theme } = useApp();
  const Icon = symbols[kind];
  return (
    <View style={styles.slot} accessible={false}>
      <Icon size={34} strokeWidth={1.45} color={muted ? colors.muted : (onDark || theme === 'dark') ? '#d5c8ff' : colors.purple} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
