import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../components/UI';
import { API_BASE_URL } from '../services/apiBase';
import { authorizedFetch } from '../services/account';
import { DetailScreen } from './Home/CelestialDetails';
import { useReducedMotion } from './Home/CosmicBackground';

type ReadingPage = { id: string; number: number; title: string; subtitle: string; paragraphs: string[] };

export function ProfileReading({ userId, tarot, onClose }: {
  userId: string; tarot?: { value: string; detail: string }; onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [pages, setPages] = useState<ReadingPage[]>([]);
  const [error, setError] = useState('');
  const tarotValue = tarot?.value;
  const tarotDetail = tarot?.detail;

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void (async () => {
      try {
        const response = await authorizedFetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/report/reading`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
          body: JSON.stringify({ tarot: tarotValue ? { value: tarotValue, detail: tarotDetail } : undefined }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.pages?.length !== 13) throw new Error(data?.error || 'Could not load your reading.');
        if (!controller.signal.aborted) setPages(data.pages);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load your reading.');
      }
    })();
    return () => controller.abort();
  }, [attempt, userId, tarotValue, tarotDetail]);

  const move = (next: number) => {
    if (next < 0 || next >= pages.length || !width) return;
    setIndex(next);
    pager.current?.scrollTo({ x: width * next, animated: !reduced });
  };
  const current = pages[index]?.number ?? 0;

  return <DetailScreen title="Your Cosmic Report" onClose={onClose} offset={offset} reduced={reduced} darkBottom travel={width * 13}>
    <View style={styles.body} onLayout={(event) => {
      const next = event.nativeEvent.layout.width;
      if (next > 0 && next !== width) setWidth(next);
    }}>
      {error ? <View style={styles.status}>
        <T bold size={21} style={styles.text}>Reading unavailable</T>
        <T size={14} style={styles.muted}>{error}</T>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.button}><T bold style={styles.text}>Try again</T></Pressable>
      </View> : !pages.length ? <View style={styles.status}>
        <ActivityIndicator size="large" color="#e0c5ff" />
        <T bold size={20} style={styles.text}>Preparing your cosmic report</T>
        <T size={14} style={styles.muted}>Natala is connecting the results from your profile.</T>
      </View> : width > 0 && <>
        <Animated.ScrollView
          ref={pager}
          horizontal pagingEnabled bounces={false} showsHorizontalScrollIndicator={false}
          directionalLockEnabled nestedScrollEnabled scrollEventThrottle={16}

          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: offset } } }], {
            useNativeDriver: Platform.OS !== 'web',
            listener: (event: { nativeEvent: { contentOffset: { x: number } } }) =>
              setIndex(Math.min(12, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / width)))),
          })}
        >
          {pages.map((page) => <View key={page.id} style={{ width }}>
            <ScrollView style={styles.body} nestedScrollEnabled directionalLockEnabled contentContainerStyle={styles.chapter}>
              <LinearGradient colors={['#654571', '#282c65', '#171d4a']} style={styles.orb}>
                <Sparkles color="#ffe4b5" size={page.number ? 27 : 38} />
              </LinearGradient>
              <T bold size={11} style={styles.eyebrow}>{page.number ? `CHAPTER ${String(page.number).padStart(2, '0')} / 12` : 'PROLOGUE'}</T>
              <T bold size={30} style={styles.title}>{page.title}</T>
              <T size={15} style={styles.subtitle}>{page.subtitle}</T>
              <View style={styles.card}>
                {page.paragraphs.map((paragraph, position) => <T key={position} size={15} style={styles.paragraph}>{paragraph}</T>)}
              </View>
            </ScrollView>
          </View>)}
        </Animated.ScrollView>
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous page" disabled={index === 0} onPress={() => move(index - 1)} style={[styles.button, index === 0 && styles.disabled]}><ChevronLeft color="#efe9ff" size={22} /></Pressable>
          <T size={13} style={styles.muted}>{current ? `${current} of 12` : 'Introduction'}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Next page" disabled={index === 12} onPress={() => move(index + 1)} style={[styles.button, index === 12 && styles.disabled]}><ChevronRight color="#efe9ff" size={22} /></Pressable>
        </View>
      </>}
    </View>
  </DetailScreen>;
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  text: { color: '#f8f4ff' },
  muted: { color: '#c7c8e5', textAlign: 'center' },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25, gap: 15 },
  chapter: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 21, paddingBottom: 25, gap: 11 },
  orb: { alignSelf: 'center', width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: '#b9a3d280', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  eyebrow: { color: '#ecd2a9', textAlign: 'center', letterSpacing: 2 },
  title: { color: '#f8f4ff', textAlign: 'center', lineHeight: 36 },
  subtitle: { color: '#d7caef', textAlign: 'center', lineHeight: 21 },
  card: { padding: 17, gap: 13, marginTop: 8, borderRadius: 22, borderWidth: 1, borderColor: '#878bc05e', backgroundColor: '#30356266' },
  paragraph: { color: '#f2efff', lineHeight: 23 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: '100%', maxWidth: 360, paddingHorizontal: 24, paddingVertical: 8 },
  button: { minWidth: 44, minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#878bc05e', backgroundColor: '#303562' },
  disabled: { opacity: 0.3 },
});
