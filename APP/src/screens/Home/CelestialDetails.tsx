import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SearchSunLongitude } from 'astronomy-engine';
import { CosmicBackground } from './CosmicBackground';
import { cosmic, glassPanel } from '../../theme/cosmic';
import { ZODIAC_SIGNS_DATA } from './home.constants';
import { seasonReadings } from './celestialReadings';
import type { TransitAspectItem } from '../Astrology/astrology.types';
import type { getPlanetPlacementReading } from '../Astrology/planetHouseReadings';

export type CelestialSlide = {
  title: string;
  symbol: string;
  tagline: string;
  position: string;
  badge: string;
  description: string;
  summary?: string;
  current?: boolean;
  retrograde?: boolean;
  note?: string;
  natal?: ReturnType<typeof getPlanetPlacementReading>;
  today?: string;
  transits?: readonly TransitAspectItem[];
};

const seasonMeanings = [
  ['Beginnings & courage', 'A season for bold starts, confidence and initiative.'],
  ['Grounding & pleasure', 'A season of steadiness, values and physical grounding.'],
  ['Ideas & connection', 'A season of curiosity, conversation and learning.'],
  ['Care & belonging', 'A season of memory, home and emotional safety.'],
  ['Joy & expression', 'A season that celebrates creativity, warmth and visibility.'],
  ['Clarity & refinement', 'A season for routines, craft and thoughtful improvement.'],
  ['Harmony & relationships', 'A season for balance, cooperation and beauty.'],
  ['Depth & transformation', 'A season that invites honest reflection and change.'],
  ['Discovery & meaning', 'A season of exploration, perspective and possibility.'],
  ['Structure & mastery', 'A season for steady progress, ambition and responsibility.'],
  ['Innovation & community', 'A season of original ideas, collective purpose and change.'],
  ['Dreams & intuition', 'A season for imagination, empathy and quiet reflection.'],
];

export function zodiacSlides(currentSign: string, now: Date): CelestialSlide[] {
  const current = Math.max(0, ZODIAC_SIGNS_DATA.findIndex(({ name }) => name === currentSign));
  const start = new Date(now);
  start.setDate(start.getDate() - 40);
  let cursor = SearchSunLongitude(current * 30, start, 80)?.date ?? now;
  const format = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const slides: CelestialSlide[] = [];
  for (let offset = 0; offset < seasonMeanings.length; offset += 1) {
    const index = (current + offset) % seasonMeanings.length;
    const { name, symbol } = ZODIAC_SIGNS_DATA[index];
    const [tagline, summary] = seasonMeanings[index];
    const next = SearchSunLongitude(((index + 1) % 12) * 30, cursor, 40)?.date;
    slides[index] = {
      title: name,
      symbol,
      tagline,
      summary,
      current: offset === 0,
      position: offset === 0 ? 'Current season' : 'Season preview',
      badge: next ? format(cursor) + ' – ' + format(next) : 'Seasonal dates unavailable',
      description: seasonReadings[name] ?? summary,
    };
    if (next) cursor = next;
  }
  return slides;
}

export function DetailScreen({ title, onClose, children, offset, reduced, travel, header, darkBottom }: {
  title: string; onClose: () => void; children: React.ReactNode;
  offset: Animated.Value; reduced: boolean; travel?: number; header?: React.ReactNode; darkBottom?: boolean;
}) {
  return (
    <Modal visible animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
      <SafeAreaView style={styles.detail}>
        <CosmicBackground offset={offset} horizontal reduced={reduced} travel={travel} darkBottom={darkBottom} />
        {header ?? <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.icon}>
            <X color={cosmic.text} size={22} />
          </Pressable>
        </View>}
        {children}
      </SafeAreaView>
    </Modal>
  );
}

const orbColors: Record<string, readonly string[]> = {
  Sun: ['#fff2ac', '#ffc539', '#ee8a0d', '#b94b05'],
  Moon: ['#faf9ed', '#d4d3c8', '#8c9090'],
  Mars: ['#ffbb95', '#e17c53', '#ae3d26', '#76211e'],
  Mercury: ['#f1dfc6', '#a8947f', '#5d4b3d'],
  Venus: ['#efd4a4', '#d4a56d', '#b17e44'],
  Jupiter: ['#f5d9af', '#b57853', '#d9aa7d', '#e6c59e'],
  Saturn: ['#f6e3bb', '#d5b077', '#7c613e'],
  Uranus: ['#d6faff', '#73d3e4', '#1b7e9d'],
  Neptune: ['#9bbaff', '#3d70dd', '#152b75'],
  Pluto: ['#dbcfc8', '#a99b9d', '#5a4d63'],
  'North Node': ['#d1fff3', '#72d9c5', '#26667d', '#182b55'],
  'South Node': ['#ffe5c8', '#e6a57b', '#954f70', '#4b2d5f'],
  Lilith: ['#c5a4ec', '#715293', '#34234f', '#171229'],
  Scorpio: ['#80eee2', '#279f93', '#15394c'],
  Sagittarius: ['#ffdbb5', '#dc8b39', '#752b31'],
  Libra: ['#ffe0f1', '#cd79b6', '#682e73'],
  Capricorn: ['#f9e9c3', '#c5a063', '#50422c'],
};

function CelestialOrb({ slide, zodiac, size }: { slide: CelestialSlide; zodiac: boolean; size: number }) {
  const colors = orbColors[slide.title] ?? ['#b7c9ff', '#537ada', '#392b8b'];
  const id = 'celestial-' + slide.title.toLowerCase();
  const banded = slide.title === 'Venus' || slide.title === 'Jupiter';
  const saturn = slide.title === 'Saturn';
  const node = slide.title === 'North Node' || slide.title === 'South Node';
  const lilith = slide.title === 'Lilith';
  const orbitTint = slide.title === 'North Node' ? '#b7fff1' : '#ffdbbd';

  return (
    <View pointerEvents="none" style={[styles.orb, { width: size, height: size }]}>
      <Svg width={size * 1.3} height={size} viewBox="-28 0 256 200">
        <Defs>
          <RadialGradient id={id} cx="32%" cy="25%" rx="75%" ry="75%">
            {colors.map((color, i) => <Stop key={color} offset={i / (colors.length - 1)} stopColor={color} />)}
          </RadialGradient>
          <ClipPath id={id + '-clip'}><Circle cx={100} cy={100} r={98} /></ClipPath>
        </Defs>
        <Circle cx={100} cy={100} r={98} fill={`url(#${id})`} stroke="rgba(220,230,255,0.23)" />
        {banded && <G clipPath={`url(#${id}-clip)`}>
          <G rotation={slide.title === 'Venus' ? -24 : -5} origin="100,100">
            {Array.from({ length: 8 }, (_, i) => <Rect key={i} x={-10} y={i * 26} width={220} height={26} fill={colors[i % colors.length]} opacity={0.36} />)}
          </G>
        </G>}
        {saturn && <Ellipse cx={100} cy={112} rx={121} ry={28} rotation={-21} origin="100,112" stroke="#e9d6ad" strokeWidth={8} opacity={0.75} fill="none" />}
        {node && <>
          <Ellipse cx={100} cy={100} rx={111} ry={34} rotation={-22} origin="100,100" stroke={orbitTint} strokeWidth={2} opacity={0.73} fill="none" />
          <Ellipse cx={100} cy={100} rx={107} ry={29} rotation={22} origin="100,100" stroke={orbitTint} strokeWidth={1.5} strokeDasharray="3 7" opacity={0.55} fill="none" />
          <Circle cx={slide.title === 'North Node' ? 181 : 19} cy={slide.title === 'North Node' ? 53 : 147} r={5} fill={orbitTint} />
        </>}
        {lilith && <Path d="M157 21 A97 97 0 0 1 56 185 C94 185 132 158 150 124 C168 90 173 49 157 21 Z" fill="#ddbfff" opacity={0.28} />}
      </Svg>
      {(zodiac || node || lilith) && <Text style={[styles.symbol, { fontSize: size * 0.43 }]}>{slide.symbol}</Text>}
    </View>
  );
}

const planetSummaries: Record<string, string> = {
  Sun: 'The Sun symbolizes identity, vitality and the way you express your true self.',
  Moon: 'The Moon is linked with emotions, instinct, comfort and belonging.',
  Mercury: 'Mercury is associated with thinking, communication and curiosity.',
  Venus: 'Venus reflects affection, beauty and the values you bring to relationships.',
  Mars: 'Mars represents initiative, desire and the way you take action.',
  Jupiter: 'Jupiter is associated with growth, learning and possibility.',
  Saturn: 'Saturn brings attention to time, boundaries and responsibility.',
  Uranus: 'Uranus is associated with freedom, change and unexpected ideas.',
  Neptune: 'Neptune is associated with imagination, dreams and intuition.',
  Pluto: 'Pluto is associated with transformation, renewal and hidden patterns.',
};

const formatIndex = (index: number) => String(index + 1).padStart(2, '0');
export const celestialOrbSize = (width: number) => Math.min(width * 0.54, 208);

function CodexReading({ slide }: { slide: CelestialSlide }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.description, styles.codexDescription]}>
      <LinearGradient pointerEvents="none" colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.track} contentContainerStyle={styles.readingContent} nestedScrollEnabled directionalLockEnabled>
        <View style={styles.factHeader}>
          <Text style={styles.eyebrow}>MEANING IN ASTROLOGY</Text>
          <Text style={[styles.badge, slide.retrograde && styles.retroBadge]}>{slide.badge}</Text>
        </View>
        <Text style={styles.copy}>{slide.summary ?? planetSummaries[slide.title] ?? slide.tagline}</Text>
        {expanded && <Text style={[styles.more, styles.continued]}>{slide.description}</Text>}
        {!!slide.description && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.readToggle}>
          <Text style={styles.link}>{expanded ? 'Read less' : 'Read more'}</Text>
        </Pressable>}

        <View style={styles.divider} />
        <Text style={styles.eyebrow}>YOUR NATAL PLACEMENT</Text>
        {slide.natal && <Text style={styles.readingTitle}>{slide.natal.title}</Text>}
        <Text style={styles.more}>{slide.natal?.reading ?? (slide.natal
          ? 'Add your exact birth time to see the house interpretation.'
          : 'Add your birth details in Profile to see your natal placement.')}</Text>

        <View style={styles.divider} />
        <Text style={styles.eyebrow}>TODAY’S TRANSITS</Text>
        {!!slide.today && <Text style={[styles.more, styles.continued]}>{slide.today}</Text>}
        {slide.transits?.length ? slide.transits.map((transit) => (
          <View key={transit.id} style={styles.transit}>
            <Text style={styles.readingTitle}>{transit.title}</Text>
            <Text style={styles.more}>{transit.summary}</Text>
            <Text style={styles.more}>{transit.guidance}</Text>
          </View>
        )) : <Text style={[styles.more, styles.continued]}>{slide.natal?.reading
          ? 'No major personal aspects from this body are active today.'
          : 'Add your birth details, including your exact birth time, to see personal transit readings.'}</Text>}
        {slide.note && <Text style={[styles.note, styles.continued]}>{slide.note}</Text>}
      </ScrollView>
    </View>
  );
}

export function CelestialCarousel({ title, kind, slides, onClose, reduced, onRetrogrades }: {
  title: string; kind: 'zodiac' | 'codex'; slides: CelestialSlide[]; onClose: () => void; reduced: boolean;
  onRetrogrades?: () => void;
}) {
  const zodiac = kind === 'zodiac';
  const [index, setIndex] = useState(() => Math.max(0, slides.findIndex((slide) => slide.current)));
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const { width, height } = viewport;
  const offset = useRef(new Animated.Value(0)).current;
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const activeIndex = useRef(index);
  const float = useRef(new Animated.Value(0)).current;
  const travel = width * (slides.length - 1);

  useEffect(() => {
    float.setValue(0);
    if (reduced) return;
    const leg = (toValue: number, duration: number) => Animated.timing(float, {
      toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    });
    const animation = Animated.loop(Animated.sequence([leg(-5, 1500), leg(5, 3000), leg(0, 1500)]));
    animation.start();
    return () => animation.stop();
  }, [float, reduced]);

  useEffect(() => {
    if (!width) return;
    const frame = requestAnimationFrame(() => {
      scroller.current?.scrollTo({ x: activeIndex.current * width, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [width]);

  const move = (next: number) => {
    scroller.current?.scrollTo({ x: next * width, animated: !reduced });
  };

  const orbSize = zodiac ? celestialOrbSize(width) : Math.min(celestialOrbSize(width), height * 0.28);

  return (
    <DetailScreen title={title} onClose={onClose} offset={offset} reduced={reduced} travel={travel} darkBottom header={
      <View style={[styles.header, styles.carouselHeader]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={onClose} style={styles.icon}>
          <ChevronLeft color={cosmic.text} size={23} />
        </Pressable>
        <Text accessibilityLabel={title + ', card ' + (index + 1) + ' of ' + slides.length} style={styles.counter}>{formatIndex(index)} / {slides.length}</Text>
        <View style={styles.headerEnd}>
          {onRetrogrades && <Pressable accessibilityRole="button" onPress={onRetrogrades} style={styles.shortcut}><Text style={styles.link}>↺ Retrogrades</Text></Pressable>}
        </View>
      </View>
    }>
      <View style={styles.track} onLayout={({ nativeEvent: { layout } }) => {
        setViewport((previous) => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height });
      }}>
        {width > 0 && height > 0 && <Animated.ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          directionalLockEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: offset } } }], {
            useNativeDriver: Platform.OS !== 'web',
            listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
              const next = Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
              if (next !== activeIndex.current) {
                activeIndex.current = next;
                setIndex(next);
              }
            },
          })}
          style={styles.track}
        >
          {slides.map((slide, i) => {
            const heading = <>
              <View style={styles.slideHeading}>
                <Text style={styles.eyebrow}>{formatIndex(i)} · {zodiac ? 'SOLAR SEASON' : 'CELESTIAL STORY'}</Text>
                <Text accessibilityRole="header" style={styles.slideTitle}>{slide.title.toUpperCase()}</Text>
                <Text style={styles.subtitle}>{slide.tagline}</Text>
              </View>
              <View style={[styles.hero, { minHeight: zodiac ? Math.max(175, orbSize + 22) : orbSize + 16 }]}>
                <Animated.View pointerEvents="none" style={{ transform: [{ translateY: float }] }}>
                  <CelestialOrb slide={slide} zodiac={zodiac} size={orbSize} />
                </Animated.View>
                <View style={styles.position}>
                  <Text style={styles.positionSymbol}>{slide.symbol}</Text>
                  <Text style={styles.positionText}>{slide.position}</Text>
                </View>
              </View>
            </>;
            return zodiac ? (
            <ScrollView key={slide.title} style={{ width, height }} contentContainerStyle={styles.slide} nestedScrollEnabled directionalLockEnabled>
              {heading}
              <View style={styles.description}>
                <LinearGradient colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} />
                <View style={styles.factHeader}>
                  <Text style={styles.eyebrow}>{zodiac ? 'SEASONAL MEANING' : 'MEANING IN ASTROLOGY'}</Text>
                  <Text style={[styles.badge, slide.retrograde && styles.retroBadge]}>{slide.retrograde ? '↺ ' : ''}{slide.badge}</Text>
                </View>
                <Text style={styles.copy}>{slide.summary ?? planetSummaries[slide.title] ?? slide.tagline}</Text>
                <View style={styles.divider} />
                <Text style={styles.more}>{slide.description}</Text>
              </View>
              {slide.note && <Text style={styles.note}>{slide.note}</Text>}
            </ScrollView>
            ) : (
              <View key={slide.title} style={{ width, height }}>
                <View style={[styles.slide, styles.codexSlide]}>
                  {heading}
                  <CodexReading slide={slide} />
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>}
      </View>
      <View style={styles.controls}>
        <Pressable accessibilityLabel="Previous card" accessibilityRole="button" disabled={index === 0} onPress={() => move(index - 1)} style={[styles.icon, index === 0 && styles.disabled]}>
          <ChevronLeft color={cosmic.text} />
        </Pressable>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Pressable key={slide.title} accessibilityRole="button" accessibilityLabel={'Go to ' + slide.title} aria-selected={i === index} onPress={() => move(i)} style={styles.dotTarget}>
              <View style={[styles.dot, i === index && styles.activeDot]} />
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityLabel="Next card" accessibilityRole="button" disabled={index >= slides.length - 1} onPress={() => move(index + 1)} style={[styles.icon, index >= slides.length - 1 && styles.disabled]}>
          <ChevronRight color={cosmic.text} />
        </Pressable>
      </View>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  detail: { flex: 1, backgroundColor: cosmic.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  carouselHeader: { position: 'relative', maxWidth: 560, paddingVertical: 7 },
  heading: { color: cosmic.text, fontSize: 18, fontWeight: '700' },
  counter: { position: 'absolute', left: '25%', width: '50%', textAlign: 'center', color: cosmic.muted, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', pointerEvents: 'none' },
  headerEnd: { minWidth: 42, alignItems: 'flex-end' },
  shortcut: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 },
  icon: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(36,58,126,0.46)' },
  track: { flex: 1, minHeight: 0, width: '100%' },
  slide: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 5, paddingBottom: 20, gap: 10 },
  codexSlide: { flex: 1, minHeight: 0, paddingBottom: 4 },
  slideHeading: { alignItems: 'center', gap: 5 },
  eyebrow: { color: '#b9caff', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  hero: { alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  orb: { alignItems: 'center', justifyContent: 'center' },
  symbol: { position: 'absolute', color: '#f6f1ff', fontWeight: '700', textShadowColor: '#202852', textShadowRadius: 11, textShadowOffset: { width: 0, height: 2 } },
  slideTitle: { color: cosmic.text, fontSize: 38, lineHeight: 42, letterSpacing: 1.6, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#bdcff5', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  position: { position: 'absolute', right: 4, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(7,22,71,0.83)', borderColor: cosmic.line, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  positionSymbol: { color: cosmic.gold, fontSize: 17 },
  positionText: { color: cosmic.text, fontSize: 12, fontWeight: '800' },
  description: { width: '100%', backgroundColor: glassPanel.background, borderRadius: 28, overflow: 'hidden', padding: 17, borderWidth: 1, borderColor: glassPanel.border },
  codexDescription: { flex: 1, minHeight: 0, padding: 0 },
  readingContent: { padding: 17 },
  continued: { marginTop: 7 },
  readToggle: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 38, marginBottom: -6 },
  readingTitle: { color: cosmic.text, fontSize: 14, fontWeight: '800', marginTop: 7, marginBottom: 4 },
  transit: { marginTop: 6, gap: 3 },
  factHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  badge: { color: '#d9e6ff', fontSize: 10, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 7, backgroundColor: 'rgba(71,108,195,0.14)', borderColor: cosmic.line, borderWidth: 1, borderRadius: 20 },
  retroBadge: { color: '#ffb5c1', backgroundColor: 'rgba(221,73,107,0.14)', borderColor: 'rgba(255,145,169,0.36)' },
  copy: { color: '#e2eaff', fontSize: 13, lineHeight: 21, marginTop: 11 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: glassPanel.border, marginVertical: 13 },
  more: { color: '#c4d1ed', fontSize: 13, lineHeight: 21 },
  note: { color: cosmic.muted, textAlign: 'center', fontSize: 10, paddingVertical: 2 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 560, alignSelf: 'center', gap: 8, paddingHorizontal: 17, paddingBottom: 9, paddingTop: 3 },
  disabled: { opacity: 0.35 },
  dots: { flexDirection: 'row', flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  dotTarget: { height: 40, justifyContent: 'center', paddingHorizontal: 3 },
  dot: { width: 7, height: 7, borderRadius: 6, backgroundColor: '#576d9e' },
  activeDot: { width: 18, backgroundColor: '#baaaff' },
  link: { color: '#d7c6ff', fontSize: 12, fontWeight: '800' },
});
