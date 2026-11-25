import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useBacktrackedSelection } from '../../components/NavigationBack';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Card, Hero, T } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { ExploreSystemHeader } from '../ExploreSystemHeader';
import { NatalChart3DDome } from './NatalChart3DDome';
import { ReadableNatalWheel } from './ReadableNatalWheel';
import { ZODIAC_SIGNS } from './astrology.constants';
import type { NatalChartResults } from './astrology.types';
import { getPlanetPlacementReading } from './planetHouseReadings';
import { useAstrologyChart } from './useAstrologyChart';

const modes = [
  { value: 'overview', label: 'Overview' },
  { value: 'lab', label: 'Chart Lab' },
] as const;
const labViews = [
  { value: 'chart', label: 'Chart' },
  { value: 'aspects', label: 'Aspects' },
  { value: 'dome', label: '3D Dome' },
] as const;
type LabView = (typeof labViews)[number]['value'];

const personal = [
  { key: 'sun', title: 'Sun', theme: 'Identity & purpose', description: 'The Sun describes what feels central to your identity and what you want to grow into.' },
  { key: 'moon', title: 'Moon', theme: 'Emotions & comfort', description: 'The Moon describes your emotional rhythms and what helps you feel at ease.' },
  { key: 'asc', title: 'Rising', theme: 'First impressions', description: 'Your rising sign describes how you meet unfamiliar situations and how others may first experience you.' },
  { key: 'mercury', title: 'Mercury', theme: 'Thinking & communication', description: 'Mercury describes how you make sense of ideas and put your thoughts into words.' },
  { key: 'venus', title: 'Venus', theme: 'Affection & values', description: 'Venus describes what makes connection feel natural and what you find beautiful or worthwhile.' },
  { key: 'mars', title: 'Mars', theme: 'Drive & action', description: 'Mars describes how you take initiative and go after what matters to you.' },
];
const elements = {
  Fire: 'initiative and enthusiasm', Earth: 'practical steps and consistency',
  Air: 'ideas and conversation', Water: 'feeling and intuition',
};
const stylesByModality = {
  Cardinal: 'starting something new', Fixed: 'staying with what matters', Mutable: 'adapting as things change',
};

function Overview({ chart, openChart }: { chart: NatalChartResults; openChart: (keys: string[]) => void }) {
  const { colors, setPage } = useApp();
  const [expanded, setExpanded] = useState<string>();
  const exact = chart.hasExactBirthTime;
  const closest = [...chart.aspects]
    .filter((a) => [0, 60, 90, 120, 180].includes(a.exactAngle)
      && [a.body1Key, a.body2Key].every((key) => personal.some((body) => body.key === key && body.key !== 'asc')))
    .sort((a, b) => a.orb - b.orb)[0];
  const dominant = chart.elements.dominantElement;
  const shares = Object.entries(chart.elements.shares).sort((a, b) => b[1] - a[1]);
  const clearElement = shares[0][1] > shares[1][1];
  const pattern = chart.patterns.find((p) => p.type === 'Stellium' && (exact || !p.house));

  function placement(body: typeof personal[number]) {
    const planet = chart.planetsByKey[body.key];
    const position = body.key === 'asc' ? (exact ? chart.angles.asc : undefined) : planet;
    const sign = ZODIAC_SIGNS.find((entry) => entry.name === position?.sign);
    const open = expanded === body.key;
    const reading = planet && getPlanetPlacementReading(planet, exact).reading;
    return (
      <Card key={body.key} style={styles.placement}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? undefined : body.key)} style={styles.placementHeader}>
          <View style={[styles.glyph, { backgroundColor: colors.purpleSoft }]}>
            <T bold size={21}>{body.key === 'asc' ? '↗' : planet?.symbol}</T>
          </View>
          <View style={styles.flex}>
            <T bold size={15}>{position ? `${body.title} in ${position.sign}` : body.title}</T>
            <T muted size={12}>{body.theme}{planet && exact ? ` · House ${planet.house}` : ''}</T>
          </View>
          <T muted size={16}>{open ? '−' : '+'}</T>
        </Pressable>
        {open && <View style={styles.details}>
          <T size={14}>{body.description}</T>
          {position ? <>
            {sign && <T muted size={13}>{sign.name} brings a focus on {elements[sign.element]} and a tendency toward {stylesByModality[sign.modality]}.</T>}
            {reading && <T muted size={13}>{reading}</T>}
            <Pressable accessibilityRole="button" onPress={() => openChart([body.key])}><T bold size={13} style={{ color: colors.purple }}>See in chart →</T></Pressable>
          </> : <Pressable accessibilityRole="button" onPress={() => setPage('profile')}>
            <T bold size={13} style={{ color: colors.purple }}>Add your birth time in Profile →</T>
          </Pressable>}
        </View>}
      </Card>
    );
  }

  return <>
    {!exact && <T muted size={12}>Birth time is unknown. Planet positions are approximate, especially the Moon.</T>}
    <T bold size={19}>Your Big Three</T>
    {personal.slice(0, 3).map(placement)}
    <T bold size={19}>Your Personal Planets</T>
    {personal.slice(3).map(placement)}
    {(clearElement || pattern || closest) && <>
      <T bold size={19}>What Stands Out</T>
      {clearElement && <Card style={styles.insight}>
        <T bold size={14}>{dominant} leads your chart</T>
        <T muted size={13}>This element has the largest share in your chart and is associated with {elements[dominant]}.</T>
      </Card>}
      {pattern && <Card style={styles.insight}>
        <T bold size={14}>{pattern.sign ? `A concentration in ${pattern.sign}` : 'A concentration in one house'}</T>
        <T muted size={13}>{pattern.bodies.join(', ')} form a stellium{pattern.house ? ` in House ${pattern.house}` : ''}.</T>
      </Card>}
      {closest && <Card style={styles.insight} onPress={() => openChart([closest.body1Key, closest.body2Key])}>
        <T bold size={14}>{closest.body1} · {closest.aspectType} · {closest.body2}</T>
        <T muted size={13}>A close connection between two of your personal placements. See it in your chart →</T>
      </Card>}
    </>}
  </>;
}

function AspectList({ chart, onChoose }: { chart: NatalChartResults; onChoose: (keys: string[]) => void }) {
  const { colors } = useApp();
  const [body, setBody] = useState('all');
  const [kind, setKind] = useState('all');
  const visible = chart.planetPositions.filter((p) => chart.hasExactBirthTime || p.key !== 'partOfFortune');
  const keys = new Set(visible.map((p) => p.key));
  const aspects = chart.aspects.filter((a) => keys.has(a.body1Key) && keys.has(a.body2Key));
  const filtered = aspects.filter((a) => (body === 'all' || a.body1Key === body || a.body2Key === body)
    && (kind === 'all' || a.aspectType === kind)).sort((a, b) => a.orb - b.orb);
  const filter = (label: string, value: string, set: (value: string) => void, entries: { key: string; name: string }[]) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} contentContainerStyle={styles.filters}>
      {[{ key: 'all', name: label }, ...entries].map((entry) => (
        <Pressable key={entry.key} onPress={() => set(entry.key)} accessibilityRole="button" accessibilityState={{ selected: entry.key === value }}
          style={[styles.chip, { borderColor: colors.line, backgroundColor: entry.key === value ? colors.purpleSoft : 'transparent' }]}>
          <T bold={entry.key === value} size={12}>{entry.name}</T>
        </Pressable>
      ))}
    </ScrollView>
  );
  return <Card style={styles.insight}>
    <T bold size={16}>Natal aspects</T>
    <T muted size={12}>Orb is the distance from the exact aspect. The closest matches are shown first.</T>
    {filter('All bodies', body, setBody, visible)}
    {filter('All aspects', kind, setKind, [...new Set(aspects.map((a) => a.aspectType))].map((name) => ({ key: name, name })))}
    {filtered.length === 0 && <T muted size={13}>No aspects match these filters.</T>}
    {filtered.map((a) => {
      const minutes = Math.round(a.orb * 60);
      return <Pressable key={a.id} accessibilityRole="button" onPress={() => onChoose([a.body1Key, a.body2Key])}
        style={[styles.aspect, { borderColor: colors.line }]}>
        <View style={styles.flex}>
          <T bold size={13}>{a.body1} · {a.aspectType} · {a.body2}</T>
          <T muted size={12}>{Math.floor(minutes / 60)}°{String(minutes % 60).padStart(2, '0')}′ · {a.isApplying ? 'Applying' : 'Separating'}</T>
        </View>
        <T muted size={15}>›</T>
      </Pressable>;
    })}
  </Card>;
}

export default function Astrology({ initialFocus }: { initialFocus?: 'venus' | 'mercury' }) {
  const { colors, user, setUser, setPage } = useApp();
  const { results, isInitializing } = useAstrologyChart(user, setUser);
  const [mode, setMode] = useBacktrackedSelection<(typeof modes)[number]['value']>(initialFocus ? 'lab' : 'overview');
  const [lab, setLab] = useBacktrackedSelection<LabView>('chart');
  const [focus, setFocus] = useState<string[]>(() => initialFocus ? [initialFocus] : []);
  const openChart = (keys: string[]) => {
    setFocus(keys);
    setLab('chart');
    setMode('lab');
  };

  return <>
    <ExploreSystemHeader route="astrology" />
    <Hero eyebrow="ASTROLOGY" first="Your" accent="Birth Chart." />
    <SegmentedControl label="Astrology mode" options={modes} value={mode} onChange={setMode} />
    {!results ? (
      <Card style={styles.insight}>
        <T size={14}>{isInitializing ? 'Preparing your birth chart…' : 'Add your birth date and birthplace to see your chart.'}</T>
        {!isInitializing && <Pressable accessibilityRole="button" onPress={() => setPage('profile')}><T bold style={{ color: colors.purple }}>Open Profile →</T></Pressable>}
      </Card>
    ) : mode === 'overview' ? (
      <View style={styles.stack}><Overview key={results.signature} chart={results} openChart={openChart} /></View>
    ) : (
      <View style={styles.stack}>
        <SegmentedControl label="Chart Lab view" options={labViews} value={lab} onChange={setLab} />
        {lab === 'chart' && <Card style={styles.chart}>
          <ReadableNatalWheel key={results.signature} results={results} focusKeys={focus} />
        </Card>}
        {lab === 'aspects' && <AspectList key={results.signature} chart={results} onChoose={openChart} />}
        {lab === 'dome' && <Card style={styles.chart}><NatalChart3DDome results={results} colors={colors} /></Card>}
      </View>
    )}
  </>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  placement: { padding: 0, overflow: 'hidden' },
  placementHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, padding: 12 },
  glyph: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  details: { paddingHorizontal: 15, paddingBottom: 15, gap: 7 },
  insight: { padding: 14, gap: 7 },
  chart: { padding: 8, alignItems: 'center' },
  filters: { gap: 6 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, minHeight: 38, justifyContent: 'center' },
  aspect: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth },
});
