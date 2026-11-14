import React, { useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView, RefreshControl } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Globe } from 'lucide-react-native';
import { Brand, Card, T, Section } from '../../components/UI';
import { stories as demoStories } from '../../data/demo';
import { useApp } from '../../context/AppContext';
import { StoryViewer } from '../../components/StoryViewer';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './home.constants';
import { getMoonPhaseData } from './home.calculations';
import { usePlanetaryData } from './usePlanetaryData';
import { AnimatedMoonVisualizer } from './AnimatedMoonVisualizer';
import { MoonForecastSection } from './MoonForecastSection';
import { RetrogradeSection } from './RetrogradeSection';
import { FortuneCookieCard } from './FortuneCookieCard';
import { PlanetaryCodexSection } from './PlanetaryCodexSection';
import { styles } from './home.styles';

export default function Home() {
  const { colors, setPage, fetchActiveStories, addStory } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const currentMoonPhase = useMemo(() => getMoonPhaseData(), []);

  const {
    loadingNASA,
    planetaryPositions,
    sunData,
    moonData,
    reloadPlanetaryData,
  } = usePlanetaryData();

  const triggerConfetti = useCallback(() => {
    setConfettiKey((prev) => prev + 1);
    setShowConfetti(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadPlanetaryData();
      if (typeof fetchActiveStories === 'function') {
        await fetchActiveStories();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reloadPlanetaryData, fetchActiveStories]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
            colors={[colors.purple]}
            progressBackgroundColor={colors.surface}
            enabled
          />
        }
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Brand />
          <View style={styles.nasaLiveBadge}>
            <Globe size={13} color={colors.gold} />
            <T size={11} bold style={{ color: colors.gold }}>
              NASA JPL LIVE
            </T>
          </View>
        </View>

        {/* Stories */}
        <Section>Stories & Inspiration</Section>
        <StoryViewer demoStories={demoStories} />

        {/* Streak Card */}
        <View style={styles.streakWrapper}>
          <Card style={styles.streakCard}>
            <T size={21}>🔥</T>
            <View style={[styles.streakPill, { backgroundColor: colors.goldSoft }]}>
              <T bold size={13} style={{ color: colors.gold }}>
                7 day · 7 Nov
              </T>
            </View>
            <T bold size={13}>
              discovery streak
            </T>
          </Card>
        </View>

        {/* Daily Gift Section */}
        <Section>Open your daily gift</Section>
        <View style={styles.cookieSectionWrapper}>
          <FortuneCookieCard
            colors={colors}
            addStory={addStory}
            onOpenConfetti={triggerConfetti}
          />
        </View>

        {/* The Sky Today */}
        <Section>The sky today (NASA JPL Data)</Section>
        <View style={styles.skySectionList}>
          <Card>
            <View style={styles.skyRow}>
              <AnimatedMoonVisualizer moonPhase={currentMoonPhase} colors={colors} />

              <View style={{ flex: 1 }}>
                <T bold size={18}>
                  {currentMoonPhase.phaseName}
                </T>
                <T muted size={12}>
                  Age: {currentMoonPhase.ageInDays} days · {currentMoonPhase.illuminated}% Illuminated
                </T>
                <T size={12} style={{ color: colors.gold, marginTop: 5 }}>
                  ☾ In {moonData ? `${moonData.zodiacSymbol} ${moonData.signName}` : 'Calculating...'}
                </T>
              </View>
            </View>
          </Card>

          <Card>
            <View style={styles.sunRow}>
              <T size={40} style={{ color: colors.gold }}>
                {sunData?.zodiacSymbol || '♏'}
              </T>
              <View style={{ flex: 1 }}>
                <T bold size={18}>
                  {sunData ? `${sunData.signName} Season` : 'Loading Season...'}
                </T>
                <T muted size={12}>
                  Sun at {sunData ? `${sunData.degInSign}° (${sunData.longitude.toFixed(2)}° JPL)` : '...'}
                </T>
              </View>
            </View>
          </Card>
        </View>

        {/* 7-Day Moon Forecast & Interactive Calendar */}
        <MoonForecastSection colors={colors} />

        {/* Retrograde Motion Section */}
        <RetrogradeSection planetaryPositions={planetaryPositions} colors={colors} />

        {/* Planetary Codex */}
        <PlanetaryCodexSection
          planetaryPositions={planetaryPositions}
          loadingNASA={loadingNASA}
          colors={colors}
        />

        <Pressable onPress={() => setPage('explore')} style={styles.exploreMoreBtn}>
          <T bold size={13} style={{ color: colors.purple }}>
            Explore the full sky ↗
          </T>
        </Pressable>
      </ScrollView>

      {/* Fullscreen Confetti Overlay */}
      {showConfetti && (
        <View style={styles.fullScreenConfettiOverlay} pointerEvents="none">
          <ConfettiCannon
            key={confettiKey}
            count={100}
            origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT }}
            autoStart
            fadeOut
            fallSpeed={3200}
            explosionSpeed={450}
            colors={['#FBBF24', '#A855F7', '#EC4899', '#3B82F6', '#10B981', '#EAB308']}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </View>
  );
}