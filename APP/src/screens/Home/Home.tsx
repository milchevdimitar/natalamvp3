import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Flame, UserRound } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SunPosition } from 'astronomy-engine';
import { useApp } from '../../context/AppContext';
import { StoryViewer } from '../../components/StoryViewer';
import { computeNatalChart, extractUserBirthDateTime } from '../Astrology/astrology.calculations';
import { calculateTransitsForDate, getSkyPositionsForDate } from '../Astrology/astrology.transits';
import { getPlanetPlacementReading } from '../Astrology/planetHouseReadings';
import { AnimatedMoonVisualizer } from './AnimatedMoonVisualizer';
import { CelestialCarousel, DetailScreen, zodiacSlides, type CelestialSlide } from './CelestialDetails';
import { CosmicBackground, useReducedMotion } from './CosmicBackground';
import { FortuneCookieCard } from './FortuneCookieCard';
import { MoonCalendarDetail } from './MoonCalendarDetail';
import { StreakCalendar } from './StreakCalendar';
import { planetDeepReadings } from './celestialReadings';
import { RetrogradeSection } from './RetrogradeSection';
import { SKY_ARTWORK_SIZE, SkyArtwork } from './SkyArtwork';
import { cosmic, glassPanel } from '../../theme/cosmic';
import { getMoonPhaseData, getZodiacInfo } from './home.calculations';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './home.constants';
import { styles as existing } from './home.styles';
import { useDiscoveryStreak } from './useDiscoveryStreak';
import { usePlanetaryData } from './usePlanetaryData';

type Detail = 'sun' | 'moon' | 'codex' | 'retrogrades' | 'streak';
const PLANET_ATLAS_TITLE = 'Your Planetary Atlas';

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
  const { colors, user, setPage, fetchActiveStories, addStory, setSelectedChat } = useApp();
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
  const { loadingNASA, planetaryPositions, reloadPlanetaryData } = usePlanetaryData();
  const moon = useMemo(() => getMoonPhaseData(now), [now]);
  const sun = useMemo(() => getZodiacInfo(SunPosition(now).elon), [now]);
  const codexOpen = detail === 'codex';
  const codexSlides = useMemo<CelestialSlide[]>(() => {
    if (!codexOpen) return [];
    const today = new Date();
    const birth = extractUserBirthDateTime(user);
    const natal = birth && computeNatalChart(birth.dStr, birth.tStr, birth.lat, birth.lon, birth.timezone, birth.hasExactBirthTime);
    const transits = natal?.hasExactBirthTime ? calculateTransitsForDate(natal, today) : [];
    const current = getSkyPositionsForDate(today);
    const withReadings = (key: string, slide: CelestialSlide): CelestialSlide => {
      const placement = natal?.planetsByKey[key];
      const sky = current.find((body) => body.key === key);
      return {
        ...slide,
        natal: placement && natal ? getPlanetPlacementReading(placement, natal.hasExactBirthTime) : undefined,
        today: sky ? `${sky.name} is in ${sky.sign} today.` : undefined,
        transits: transits.filter((transit) => transit.transitKey === key),
      };
    };
    const planets = planetaryPositions.map((planet) => withReadings(planet.name.toLowerCase(), {
      title: planet.name, symbol: planet.planet, tagline: planet.meta.topic,
      summary: planet.meta.description, description: planetDeepReadings[planet.name] ?? '',
      position: planet.signName + ' ' + planet.degInSign + '°', badge: planet.isRetrograde ? 'Retrograde' : 'Direct',
      retrograde: planet.isRetrograde, note: planet.isLiveNASA ? undefined : 'Position and motion calculated locally.',
    }));
    const nodes = current.filter(({ key }) => key === 'northNode' || key === 'southNode').map((node) => {
      const north = node.key === 'northNode';
      return withReadings(node.key, {
        title: node.name, symbol: node.symbol, tagline: north ? 'Growth & unfamiliar territory' : 'Instinct & familiar patterns',
        summary: north ? 'The North Node describes unfamiliar experiences that can help you grow.' : 'The South Node describes habits and strengths you already know well.',
        description: north
          ? 'The North Node marks where the Moon’s orbit crosses the path of the Sun in a northward direction. In astrology, its sign describes qualities worth practicing and its house points to the part of life where you can try them. It is read together with the opposite South Node.'
          : 'The South Node marks the opposite crossing of the Moon’s orbit. Its sign describes familiar ways of responding and its house points to where those responses tend to show up. Consider what these habits still offer you and when a different choice might serve you better.',
        position: node.sign + ' ' + node.degFormatted, badge: 'Lunar node',
      });
    });
    return [...planets, ...nodes];
  }, [codexOpen, planetaryPositions, user, now]);
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
          <StoryViewer circular circleSize={SKY_ARTWORK_SIZE} />
        </View>

        <View style={styles.greeting}>
          <Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <View style={styles.greetingRow}>
            <Text accessibilityRole="header" style={styles.hero}>Your daily <Text style={styles.heroAccent}>cosmic moment.</Text></Text>
            {streak !== null && <Pressable accessibilityRole="button" accessibilityLabel="Open discovery streak calendar" onPress={() => setDetail('streak')} style={styles.streak}>
              <Flame size={13} color="#ff963f" fill="#ff963f" />
              <Text style={styles.streakText}>{streak.count + (streak.count === 1 ? ' day' : ' days')}</Text>
            </Pressable>}
          </View>
          <Text style={styles.greetingSub}>Your sky, your stories, a little magic.</Text>
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>The sky right now</Text>
          <SkyCard title={PLANET_ATLAS_TITLE} subtitle={planetaryPositions.length ? 'Planet meanings, your birth chart & today’s transits' : loadingNASA ? 'Calculating planetary positions…' : 'Planetary positions unavailable'} hint="Swipe through 12 planets and lunar points" artwork={<SkyArtwork kind="codex" />} onPress={() => setDetail('codex')} disabled={!planetaryPositions.length} />
          <SkyCard title={sun.sign + ' season'} subtitle={'Sun in ' + sun.sign + ' · ' + sun.degree + '°'} hint="Swipe through the zodiac seasons" artwork={<SkyArtwork kind="sun" />} onPress={() => setDetail('sun')} />
          <SkyCard title={moon.phaseName} subtitle={'Moon · ' + moon.illuminated + '% illuminated'} hint="Moon phases · swipe month by month" artwork={<AnimatedMoonVisualizer moonPhase={moon} size={SKY_ARTWORK_SIZE} reduced={reduced} />} onPress={() => setDetail('moon')} />
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>Retrogrades</Text>
          <SkyCard title={planetaryPositions.length ? (retrogradeCount ? retrogradeCount + ' active' : 'No active retrogrades') : loadingNASA ? 'Checking planetary motion…' : 'Planetary motion unavailable'} subtitle="Planetary motion at a glance" artwork={<SkyArtwork kind="retro" />} onPress={() => setDetail('retrogrades')} disabled={!planetaryPositions.length} />
        </View>

        <FortuneCookieCard
          colors={palette}
          addStory={addStory}
          onShareMessage={(draftMessage) => {
            setSelectedChat({ draftMessage });
            setPage('chat');
          }}
          onOpenConfetti={() => { if (!reduced) setConfetti(Date.now()); }}
        />
      </Animated.ScrollView>

      {detail === 'sun' && <CelestialCarousel kind="zodiac" title="Zodiac seasons" slides={zodiacSlides(sun.sign, now)} onClose={close} reduced={reduced} />}
      {detail === 'codex' && <CelestialCarousel
        title={PLANET_ATLAS_TITLE}
        kind="codex"
        slides={codexSlides}
        onClose={close}
        onRetrogrades={() => setDetail('retrogrades')}
        reduced={reduced}
      />}
      {detail === 'moon' && <DetailScreen title="Moon calendar" onClose={close} offset={still} reduced={reduced} darkBottom>
        <MoonCalendarDetail reduced={reduced} />
      </DetailScreen>}
      {detail === 'streak' && streak && <DetailScreen title="Discovery streak" onClose={close} offset={still} reduced={reduced} darkBottom>
        <StreakCalendar today={streak.day} days={streak.days} count={streak.count} />
      </DetailScreen>}
      {detail === 'retrogrades' && <DetailScreen title="Retrogrades" onClose={close} offset={still} reduced={reduced} darkBottom>
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
  artwork: { width: SKY_ARTWORK_SIZE, height: SKY_ARTWORK_SIZE, flexShrink: 0, borderRadius: SKY_ARTWORK_SIZE / 2, boxShadow: '0 0 0 5px rgba(108,146,236,0.08), 0 0 24px rgba(116,156,244,0.18)' },
  cardTitle: { color: cosmic.text, fontSize: 16, lineHeight: 19, fontWeight: '800' },
  cardMeta: { color: '#d1e1ff', fontSize: 12, marginTop: 4 },
  cardHint: { color: '#a9bfea', fontSize: 10.5, lineHeight: 14, marginTop: 6 },
  muted: { color: cosmic.muted, fontSize: 13 },
  detailBody: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, gap: 16 },
});
