import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/apiBase';
import { SegmentedControl } from '../components/SegmentedControl';
import { AtlasPath } from './AtlasPath';
import { hasFeature } from '../services/account';
import { ChevronRight, Film, LockKeyhole, Star } from 'lucide-react-native';
import { Hero, SearchBar, Card, T, Section } from '../components/UI';
import { ExploreArtwork } from '../components/ExploreArtwork';
import { systems } from '../data/demo';
import { type ExploreRoute } from '../data/exploreRoutes';
import { useApp } from '../context/AppContext';
import { getDashboardSystems, systemNames } from '../services/profileDashboard';
import { useSystemActivity } from '../services/systemActivity';

const libraryOrder = ['astrology', 'numerology', 'chinese-zodiac', 'cardology', 'mbti', 'ayurveda', 'tarot', 'bazi'] as const;
const activeSystems = libraryOrder.map((route) => {
  const system = systems.find(({ name }) => name === systemNames[route]);
  return {
    route,
    name: systemNames[route],
    description: system?.description ?? (route === 'chinese-zodiac'
      ? 'Discover your birth-year animal and element.'
      : 'Four Pillars of Destiny · Chinese solar-term & Five Elements chart.'),
  };
});

const upcoming = {
  'Blood Group': 'blood',
  Elements: 'elements',
  Enneagram: 'enneagram',
  'Human Design': 'design',
} as const;

const upcomingSystems = systems.filter((system) => Object.hasOwn(upcoming, system.name));

const atlasViews = [{ value: 'path', label: 'Path' }, { value: 'library', label: 'Library' }] as const;
type AtlasView = (typeof atlasViews)[number]['value'];

export default function Explore({ initialView, initialChapter }: { initialView?: AtlasView; initialChapter?: string }) {
  const [search, setSearch] = useState('');
  const { colors, setPage, user, account } = useApp();
  const [view, setView] = useState<AtlasView>(initialView ?? 'path');
  const [favorite, setFavorite] = useState<ExploreRoute>();
  const storage = 'natala:atlas-library:' + API_BASE_URL + ':' + (user?.email || '');
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storage).then((saved) => {
      if (!saved || !active) return;
      const settings = JSON.parse(saved);
      if (!initialView && settings.view === 'library') setView('library');
      if (libraryOrder.includes(settings.favorite)) setFavorite(settings.favorite);
    }).catch(() => {});
    return () => { active = false; };
  }, [storage, initialView]);
  const update = (next: AtlasView, star?: ExploreRoute) => {
    setView(next);
    setFavorite(star);
    void AsyncStorage.setItem(storage, JSON.stringify({ view: next, favorite: star })).catch(() => {});
  };
  const activity = useSystemActivity(user?.email);
  const status = getDashboardSystems(user, activity);
  const query = search.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(query);
  const available = activeSystems.filter((system) => matches(system.name + ' ' + system.description + ' ' + system.route));
  const comingSoon = account?.tier === 'owner' ? upcomingSystems.filter((system) => matches(system.name + ' ' + system.description)) : [];

  const groups = [
    { title: 'Favorite', entries: available.filter(({ route }) => !query && route === favorite) },
    { title: 'From your birth details', entries: available.filter(({ route }) => (query || route !== favorite) && ['astrology', 'numerology', 'chinese-zodiac', 'cardology', 'bazi'].includes(route)) },
    { title: 'Assessments', entries: available.filter(({ route }) => (query || route !== favorite) && ['mbti', 'ayurveda'].includes(route)) },
    { title: 'Daily practice', entries: available.filter(({ route }) => (query || route !== favorite) && route === 'tarot') },
  ];

  return (
    <>
      <Hero eyebrow="DISCOVER YOURSELF" first="Your" accent="Atlas" />
      <SegmentedControl label="Atlas view" options={atlasViews} value={view} onChange={(next) => update(next, favorite)} />
      {view === 'path' ? <AtlasPath initialChapter={initialChapter} /> : <>
      <SearchBar value={search} onChange={setSearch} placeholder="Search systems" />

      {!query && <Card onPress={() => setPage('feed')} style={styles.card}>
        <Film color={colors.purple} size={22} />
        <View style={{ flex: 1 }}><T bold>Watch</T><T muted size={12}>Videos about the systems in your atlas</T></View>
        <ChevronRight color={colors.muted} size={17} />
      </Card>}

      {groups.filter(({ entries }) => entries.length > 0).map(({ title, entries }) => <React.Fragment key={title}>
        <Section>{title}</Section>
        <View style={styles.list}>
          {entries.map((system) => {
            const locked = !hasFeature(account, system.route);
            const ready = Boolean(status.find(({ route }) => route === system.route)?.value);
            return (
            <View key={system.route} style={styles.libraryRow}><Card onPress={() => setPage(locked ? 'subscription' : system.route)} activeOpacity={0.7} style={[styles.card, styles.libraryCard]}>
              <View style={styles.row}>
                <ExploreArtwork kind={system.route} />
                <View style={styles.copy}>
                  <View style={styles.titleRow}>
                    <T bold size={16}>{system.name}</T>
                    <View style={styles.status} accessible accessibilityLabel={ready ? 'Ready' : 'Not started'}>
                      <View style={[styles.statusDot, { backgroundColor: ready ? '#70d7b3' : 'transparent', borderColor: ready ? '#70d7b3' : colors.muted }]} />
                      <T muted size={9}>{ready ? 'Ready' : 'To do'}</T>
                    </View>
                  </View>
                  <T muted size={12}>{locked ? 'Plan access' : system.description}</T>
                </View>
                {locked ? <LockKeyhole color={colors.muted} size={16} /> : <ChevronRight color={colors.muted} size={18} />}
              </View>
            </Card>
            <Pressable accessibilityRole="button" accessibilityLabel={(favorite === system.route ? 'Unfavorite ' : 'Favorite ') + system.name}
              onPress={() => update('library', favorite === system.route ? undefined : system.route)} style={styles.favorite}>
              <Star color={colors.gold} fill={favorite === system.route ? colors.gold : 'none'} size={19} />
            </Pressable>
            </View>
            );
          })}
        </View>
      </React.Fragment>)}

      {comingSoon.length > 0 && <>
        <Section style={available.length > 0 ? { marginTop: 24 } : undefined}>To develop</Section>
        <View style={styles.list}>
          {comingSoon.map((system) => (
            <Card key={system.name} style={[styles.card, styles.unavailable]} treatment="muted">
              <View style={styles.row}>
                <ExploreArtwork kind={upcoming[system.name as keyof typeof upcoming] ?? 'design'} muted />
                <View style={styles.copy}>
                  <T bold size={16}>{system.name}</T>
                  <T muted size={12}>{system.description}</T>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </>}

      {available.length === 0 && comingSoon.length === 0 && <Card>
        <T muted size={13}>No systems match your search.</T>
      </Card>}
      </>}
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: 11 },
  libraryRow: { flexDirection: 'row', alignItems: 'center' },
  libraryCard: { flex: 1 },
  favorite: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { minHeight: 110, justifyContent: 'center', padding: 15 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1 },
  unavailable: { opacity: 0.65 },
});
