import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Flame, UserRound } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SunPosition } from 'astronomy-engine';
import { useApp } from '../../context/AppContext';
import { StoryViewer } from '../../components/StoryViewer';
import { AnimatedMoonVisualizer } from './AnimatedMoonVisualizer';
import { CelestialCarousel, DetailScreen, zodiacSlides } from './CelestialDetails';
import { CosmicBackground, useReducedMotion } from './CosmicBackground';
import { FortuneCookieCard } from './FortuneCookieCard';
import { MoonForecastSection } from './MoonForecastSection';
import { RetrogradeSection } from './RetrogradeSection';
import { SkyArtwork } from './SkyArtwork';
import { cosmic, glassPanel } from '../../theme/cosmic';
import { getMoonPhaseData, getZodiacInfo } from './home.calculations';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './home.constants';
import { styles as existing } from './home.styles';
import { useDiscoveryStreak } from './useDiscoveryStreak';
import { usePlanetaryData } from './usePlanetaryData';

type Detail = 'sun' | 'moon' | 'codex' | 'retrogrades';

function SkyCard({ title, subtitle, hint, artwork, onPress, disabled }: {
  title: string; subtitle: string; hint?: string; artwork: React.ReactNode; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <LinearGradient pointerEvents="none" colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} />
      <View style={styles.artwork}>{artwork}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMeta}>{subtitle}</Text>
        {hint && <Text style={styles.cardHint}>{hint}</Text>}
      </View>
      <ChevronRight color={cosmic.muted} size={18} />
    </Pressable>
  );
}

export default function Home() {
  const { colors, user, setPage, fetchActiveStories, addStory } = useApp();
  const palette = { ...colors, ...cosmic, purpleSoft: '#30457a', goldSoft: '#362845' };
  const insets = useSafeAreaInsets();
  const streak = useDiscoveryStreak(user?.email);
  const reduced = useReducedMotion();
  const scroll = useRef(new Animated.Value(0)).current;
  const still = useRef(new Animated.Value(0)).current;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confetti, setConfetti] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { loadingNASA, planetaryPositions, moonData, reloadPlanetaryData } = usePlanetaryData();
  const moon = useMemo(() => getMoonPhaseData(now), [now]);
  const sun = useMemo(() => getZodiacInfo(SunPosition(now).elon), [now]);
  const retrogradeCount = planetaryPositions.filter(({ isRetrograde }) => isRetrograde).length;
  const profileName = String(user?.name ?? '').trim();
  const close = () => setDetail(null);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setNow(new Date());
    try {
      await Promise.all([reloadPlanetaryData(), fetchActiveStories()]);
    } catch (error) {
      console.error('Error refreshing Home:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reloadPlanetaryData, fetchActiveStories]);

  return (
    <View style={styles.root}>
      <CosmicBackground offset={scroll} reduced={reduced} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scroll } } }], { useNativeDriver: Platform.OS !== 'web' })}
        contentContainerStyle={[styles.content, {
          paddingTop: Platform.OS === 'web' ? 22 : insets.top + 12,
          paddingBottom: insets.bottom + 112,
        }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={cosmic.purple} colors={[cosmic.purple]} />}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Natala</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => setPage('profile')} style={styles.profile}>
            {profileName ? <Text style={styles.profileText}>{profileName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</Text> : <UserRound color={cosmic.text} size={18} />}
          </Pressable>
        </View>

        <View style={styles.stories}>
          <Text accessibilityRole="header" style={styles.section}>Stories & inspiration</Text>
          <StoryViewer circular />
        </View>

        <View style={styles.greeting}>
          <Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <View style={styles.greetingRow}>
            <Text accessibilityRole="header" style={styles.hero}>Your daily <Text style={styles.heroAccent}>cosmic moment.</Text></Text>
            {streak !== null && <View accessible accessibilityLabel={streak + (streak === 1 ? ' day' : ' days') + ' · Discovery streak'} style={styles.streak}>
              <Flame size={13} color="#ff963f" fill="#ff963f" />
              <Text style={styles.streakText}>{streak + (streak === 1 ? ' day' : ' days')}</Text>
            </View>}
          </View>
          <Text style={styles.greetingSub}>Your sky, your stories, a little magic.</Text>
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>The sky right now</Text>
          <SkyCard title={sun.sign + ' season'} subtitle={'Sun in ' + sun.sign + ' · ' + sun.degree + '°'} hint="Swipe through the zodiac seasons" artwork={<SkyArtwork kind="sun" />} onPress={() => setDetail('sun')} />
          <SkyCard title={moon.phaseName} subtitle={'Moon · ' + moon.illuminated + '% illuminated'} hint="Moon phases · swipe month by month" artwork={<AnimatedMoonVisualizer moonPhase={moon} size={69} reduced={reduced} />} onPress={() => setDetail('moon')} />
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>Planetary Codex</Text>
          <SkyCard title="Explore the planets" subtitle={planetaryPositions.length ? 'Sun · Moon · Mars · and more' : loadingNASA ? 'Calculating planetary positions…' : 'Planetary positions unavailable'} hint="Swipe the cards · Read more for meanings" artwork={<SkyArtwork kind="codex" />} onPress={() => setDetail('codex')} disabled={!planetaryPositions.length} />
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>Retrogrades</Text>
          <SkyCard title={planetaryPositions.length ? (retrogradeCount ? retrogradeCount + ' active' : 'No active retrogrades') : loadingNASA ? 'Checking planetary motion…' : 'Planetary motion unavailable'} subtitle="Planetary motion at a glance" artwork={<SkyArtwork kind="retro" />} onPress={() => setDetail('retrogrades')} disabled={!planetaryPositions.length} />
        </View>

        <FortuneCookieCard colors={palette} email={user?.email} addStory={addStory} onOpenConfetti={() => { if (!reduced) setConfetti(Date.now()); }} />
      </Animated.ScrollView>

      {detail === 'sun' && <CelestialCarousel kind="zodiac" title="Zodiac seasons" slides={zodiacSlides(sun.sign, now)} onClose={close} reduced={reduced} />}
      {detail === 'codex' && <CelestialCarousel
        title="Planetary Codex"
        kind="codex"
        slides={planetaryPositions.map((planet) => ({
          title: planet.name, symbol: planet.planet, tagline: planet.meta.topic, description: planet.meta.description,
          position: planet.signName + ' ' + planet.degInSign + '°', badge: planet.isRetrograde ? 'Retrograde' : 'Direct',
          retrograde: planet.isRetrograde, note: planet.isLiveNASA ? undefined : 'Position and motion calculated locally.',
        }))}
        onClose={close}
        onRetrogrades={() => setDetail('retrogrades')}
        reduced={reduced}
      />}
      {detail === 'moon' && <DetailScreen title="Moon calendar" onClose={close} offset={still} reduced={reduced}>
        <ScrollView contentContainerStyle={styles.detailBody}>
          <View style={[styles.card, styles.moonHero]}>
            <AnimatedMoonVisualizer moonPhase={moon} size={100} reduced={reduced} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardTitle}>{moon.phaseName}</Text>
              <Text style={styles.muted}>{moon.illuminated}% illuminated · {moon.ageInDays} days old</Text>
              {moonData && <Text style={styles.muted}>Moon in {moonData.signName}</Text>}
            </View>
          </View>
          <MoonForecastSection reduced={reduced} />
        </ScrollView>
      </DetailScreen>}
      {detail === 'retrogrades' && <DetailScreen title="Retrogrades" onClose={close} offset={still} reduced={reduced}>
        <ScrollView contentContainerStyle={styles.detailBody}>
          {planetaryPositions.some(({ isLiveNASA }) => !isLiveNASA) && <Text style={styles.muted}>Includes locally estimated positions</Text>}
          <RetrogradeSection planetaryPositions={planetaryPositions} />
        </ScrollView>
      </DetailScreen>}

      {confetti !== null && <View style={existing.fullScreenConfettiOverlay} pointerEvents="none">
        <ConfettiCannon key={confetti} count={100} origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT }} autoStart fadeOut fallSpeed={3200} explosionSpeed={450} colors={[cosmic.gold, cosmic.purple, '#709bff']} onAnimationEnd={() => setConfetti(null)} />
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: cosmic.bg },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 19, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: cosmic.text, fontFamily: 'DancingScript_700Bold', fontSize: 40, lineHeight: 49 },
  profile: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#263f77', borderColor: cosmic.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileText: { color: cosmic.text, fontSize: 11, fontWeight: '800' },
  stories: { gap: 16 },
  greeting: { gap: 8 },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  date: { color: '#a9bceb', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  hero: { flexShrink: 1, maxWidth: 260, fontSize: 29, lineHeight: 33, fontWeight: '800', letterSpacing: -1.25, color: cosmic.text },
  heroAccent: { color: '#b7b4ff' },
  greetingSub: { color: cosmic.muted, fontSize: 12, lineHeight: 19, marginTop: 2 },
  streak: { flexDirection: 'row', gap: 4, alignItems: 'center', flexShrink: 0, marginTop: 5, backgroundColor: 'rgba(24,53,121,0.44)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, borderColor: cosmic.line, borderWidth: 1 },
  streakText: { color: cosmic.gold, fontWeight: '800', fontSize: 12 },
  group: { gap: 11 },
  section: { color: cosmic.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', borderRadius: 28, borderWidth: 1, borderColor: glassPanel.border, padding: 15, minHeight: 110, backgroundColor: glassPanel.background },
  artwork: { width: 69, height: 69, flexShrink: 0, borderRadius: 35, boxShadow: '0 0 0 5px rgba(108,146,236,0.08), 0 0 24px rgba(116,156,244,0.18)' },
  cardTitle: { color: cosmic.text, fontSize: 16, lineHeight: 19, fontWeight: '800' },
  cardMeta: { color: '#d1e1ff', fontSize: 12, marginTop: 4 },
  cardHint: { color: '#a9bfea', fontSize: 10.5, lineHeight: 14, marginTop: 6 },
  muted: { color: cosmic.muted, fontSize: 13 },
  moonHero: { padding: 16 },
  detailBody: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, gap: 16 },
});
