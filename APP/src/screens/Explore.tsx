import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { hasFeature } from '../services/account';
import { ChevronRight, LockKeyhole } from 'lucide-react-native';
import { Hero, SearchBar, Card, T, Section } from '../components/UI';
import { ExploreArtwork } from '../components/ExploreArtwork';
import { systems } from '../data/demo';
import { exploreRoutes, isExploreRoute } from '../data/exploreRoutes';
import { useApp } from '../context/AppContext';
import { getDashboardSystems, systemNames } from '../services/profileDashboard';
import { useSystemActivity } from '../services/systemActivity';

const activeSystems = exploreRoutes.map((route) => {
  const system = systems.find(({ name }) => name.toLowerCase().replace(/\s/g, '') === route);
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

const upcomingSystems = systems.filter((system) => !isExploreRoute(system.name.toLowerCase().replace(/\s/g, '')));

export default function Explore() {
  const [search, setSearch] = useState('');
  const { colors, setPage, user, account } = useApp();
  const activity = useSystemActivity(user?.email);
  const status = getDashboardSystems(user, activity);
  const query = search.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(query);
  const available = activeSystems.filter((system) => matches(system.name + ' ' + system.description + ' ' + system.route));
  const comingSoon = account?.tier === 'owner' ? upcomingSystems.filter((system) => matches(system.name + ' ' + system.description)) : [];

  return (
    <>
      <Hero
        eyebrow="YOUR ATLAS · EXPLORE & DISCOVER"
        first="Find a"
        accent="new lens"
        description="Explore the systems that shape your inner world and discover new perspectives."
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search systems" />

      {available.length > 0 && <>
        <Section>Explore your systems</Section>
        <View style={styles.list}>
          {available.map((system) => {
            const locked = !hasFeature(account, system.route);
            const ready = Boolean(status.find(({ route }) => route === system.route)?.value);
            return (
            <Card key={system.route} onPress={() => setPage(locked ? 'subscription' : system.route)} activeOpacity={0.7} style={styles.card}>
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
            );
          })}
        </View>
      </>}

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
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: 11 },
  card: { minHeight: 110, justifyContent: 'center', padding: 15 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1 },
  unavailable: { opacity: 0.65 },
});
