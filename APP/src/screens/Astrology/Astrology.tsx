import { useBacktrackedSelection } from '../../components/NavigationBack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Card, Hero, T } from '../../components/UI';
import { ExploreSystemHeader } from '../ExploreSystemHeader';
import { LegacyAstrology } from './LegacyAstrology';

const modes = [
  { value: 'simple', label: 'Simple' },
  { value: 'pro', label: 'Pro' },
  { value: 'legacy', label: 'Legacy' },
] as const;

type AstrologyMode = (typeof modes)[number]['value'];

export default function Astrology() {
  const [mode, setMode] = useBacktrackedSelection<AstrologyMode>('legacy');

  return (
    <>
      <ExploreSystemHeader route="astrology" />
      <Hero
        eyebrow="NATALA ASTROLOGY STUDIO"
        first="Your"
        accent="Cosmic Blueprint."
        description="Start simple, tap any card to explore deeper layers."
      />
      <SegmentedControl label="Astrology mode" options={modes} value={mode} onChange={setMode} />
      {mode === 'legacy' ? <LegacyAstrology /> : (
        <Card style={styles.empty}>
          <T muted style={styles.center}>This view is in development. Your chart and readings are available in Legacy.</T>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 20 },
  center: { textAlign: 'center' },
});
