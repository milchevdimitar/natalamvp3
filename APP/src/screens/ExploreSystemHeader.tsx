import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton } from '../components/BackButton';
import { ExploreArtwork } from '../components/ExploreArtwork';
import { T } from '../components/UI';
import { useApp } from '../context/AppContext';
import type { ExploreRoute } from '../data/exploreRoutes';
import { systemGuides } from '../data/systemGuides';
import { cosmic, glassPanel } from '../theme/cosmic';
import { DetailScreen } from './Home/CelestialDetails';
import { useReducedMotion } from './Home/CosmicBackground';

export function ExploreSystemHeader({ route, children }: React.PropsWithChildren<{ route: ExploreRoute }>) {
  const { setPage, colors } = useApp();
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = systemGuides[route];

  return (
    <View style={styles.header}>
      <BackButton label="Back to Explore" onPress={() => setPage('explore')} />
      {children}
      <Pressable accessibilityRole="button" accessibilityLabel={'About ' + guide.title}
        onPress={() => setGuideOpen(true)} style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
        <Info size={23} color={colors.text} />
      </Pressable>
      {guideOpen && <SystemGuideScreen route={route} onClose={() => setGuideOpen(false)} />}
    </View>
  );
}

function SystemGuideScreen({ route, onClose }: { route: ExploreRoute; onClose: () => void }) {
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const guide = systemGuides[route];
  const sections = [
    { title: 'What it is', content: guide.intro },
    { title: 'How it works in Natala', content: guide.how },
    { title: 'Where to start', content: guide.firstStep },
  ];

  return (
    <DetailScreen title="" onClose={onClose} offset={offset} reduced={reduced} darkBottom>
      <Animated.ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: Platform.OS !== 'web' })}
        contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.symbol}><ExploreArtwork kind={route} onDark /></View>
          <Text accessibilityRole="header" style={styles.heroTitle}>{guide.title}</Text>
        </View>
        <View style={styles.guideCard}>
          <LinearGradient pointerEvents="none" colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} />
          {sections.map(({ title, content }, index) => (
            <View key={title} style={[styles.section, index > 0 && styles.divider]}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
              <T size={15} style={styles.body}>{content}</T>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  infoButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  pressed: { opacity: 0.55 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 28, gap: 16 },
  hero: { alignItems: 'center', gap: 10, paddingBottom: 4 },
  symbol: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 39,
    borderWidth: 1, borderColor: cosmic.line, backgroundColor: cosmic.surface },
  heroTitle: { color: cosmic.text, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  sectionTitle: { color: cosmic.text, fontSize: 17, fontWeight: '700' },
  guideCard: { borderWidth: 1, borderColor: glassPanel.border, borderRadius: 23, paddingHorizontal: 18, overflow: 'hidden' },
  section: { gap: 7, paddingVertical: 15 },
  divider: { borderTopWidth: 1, borderTopColor: glassPanel.border },
  body: { color: cosmic.muted, lineHeight: 23 },
});
