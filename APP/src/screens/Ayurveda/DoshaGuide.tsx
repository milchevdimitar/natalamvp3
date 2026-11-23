import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { T } from '../../components/UI';
import { DetailScreen } from '../Home/CelestialDetails';
import { useReducedMotion } from '../Home/CosmicBackground';
import { DOSHA_ICONS } from './DoshaBalanceCard';
import { DOSHA_META } from './ayurveda.data';
import type { DoshaName } from './ayurveda.types';

const states = ['Aggravated', 'Balanced', 'Depleted'] as const;

const guide: Record<DoshaName, {
  theme: string; intro: string;
  readings: readonly (readonly [string, string, string])[];
}> = {
  Vata: {
    theme: 'Movement and rhythm',
    intro: 'Ayurveda associates Vata with air and space. It describes movement, change and the rhythm that connects one activity to the next.',
    readings: [
      ['When movement becomes restless', 'In classical Ayurveda, aggravated Vata describes an increase in qualities such as lightness, dryness and irregularity. In daily life, think of a day with constant changes of pace and few chances to settle.', 'Give yourself one steady point in the day, such as an unhurried meal or a quiet evening routine.'],
      ['Flexible with a steady rhythm', 'Balanced Vata describes movement that has a rhythm. You can respond to change, explore ideas and shift between activity and rest without feeling pulled in every direction.', 'Notice what helps you change gears smoothly. Keep one familiar routine even on your busiest days.'],
      ['When movement feels muted', 'Depleted Vata is the traditional term for a decrease in its movement qualities. As an everyday metaphor, it can describe a stretch when initiating change or finding momentum feels harder.', 'Try a small change that feels inviting, like a short walk outside or a few minutes of drawing.'],
    ],
  },
  Pitta: {
    theme: 'Heat and transformation',
    intro: 'Ayurveda associates Pitta with fire and transformation. It uses Pitta to describe processes such as digestion and warmth, and qualities such as focus and discernment.',
    readings: [
      ['When intensity builds', 'Aggravated Pitta describes an increase in hot or sharp qualities in the classical model. In daily life, it can be a way to reflect on the moments when urgency starts crowding out patience.', 'Put a real pause between demanding tasks. Leave one part of your schedule free of deadlines or competition.'],
      ['Focused without rushing', 'Balanced Pitta describes intensity that serves a purpose. It is the difference between giving something your full attention and feeling that everything needs an immediate answer.', 'Choose one task that matters, give it focused time and stop for a proper break when you finish.'],
      ['When drive feels quieter', 'Depleted Pitta is the traditional term for reduced heat or transformative qualities. As a reflection prompt, it can describe a time when it is harder to decide where to direct your effort.', 'Choose one small goal with a clear finish, then make the first step easy enough to start today.'],
    ],
  },
  Kapha: {
    theme: 'Structure and steadiness',
    intro: 'Ayurveda associates Kapha with earth and water. It describes the qualities that lend structure, stability and continuity to everyday life.',
    readings: [
      ['When steadiness turns into inertia', 'Aggravated Kapha describes an increase in heavy or slow qualities in the classical model. As an everyday metaphor, it can help you notice when a comfortable routine has become hard to leave.', 'Try adding energy without making a big commitment. Put on music and move for a few minutes, or take a walk somewhere different.'],
      ['Steady and able to adapt', 'Balanced Kapha describes stability that supports action. Familiar routines and relationships give you a place to return to while leaving room to try something new.', 'Keep one routine that grounds you and leave a little space in the week for variety.'],
      ['When steadiness feels thin', 'Depleted Kapha is the traditional term for a decrease in its supporting or stabilizing qualities. In daily life, you can use it as a prompt to notice when you miss a regular rhythm or sense of continuity.', 'Choose one repeatable point of support, such as an unhurried meal or a regular check-in with someone you trust.'],
    ],
  },
};

export function DoshaGuide({ dosha, onClose }: { dosha: DoshaName; onClose: () => void }) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const content = guide[dosha];
  const color = DOSHA_META[dosha].color;
  const Icon = DOSHA_ICONS[dosha];
  const move = (page: number) => {
    if (page >= 0 && page < states.length) pager.current?.scrollTo({ x: page * width, animated: !reduced });
  };

  return <DetailScreen title={dosha} onClose={onClose} offset={offset} reduced={reduced} darkBottom travel={width * 3}>
    <View style={styles.body} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && <Animated.ScrollView ref={pager} horizontal pagingEnabled bounces={false}
        directionalLockEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: offset } } }], {
          useNativeDriver: Platform.OS !== 'web',
          listener: (event: { nativeEvent: { contentOffset: { x: number } } }) =>
            setIndex(Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)))),
        })}>
        {content.readings.map(([title, reading, reflection], page) => (
          <View key={states[page]} style={{ width }}>
            <ScrollView style={styles.body} nestedScrollEnabled directionalLockEnabled contentContainerStyle={styles.chapter}>
              <LinearGradient colors={[color + '66', '#1a2049']} style={[styles.orb, { borderColor: color + 'aa' }]}>
                <Icon size={46} color={color} strokeWidth={1.8} />
              </LinearGradient>
              <T bold size={12} style={styles.eyebrow}>{dosha.toUpperCase()} · {content.theme.toUpperCase()}</T>
              <T bold size={31} style={styles.title}>{states[page]}</T>
              <View style={styles.card}>
                {page === 0 && <T size={15} style={styles.text}>{content.intro}</T>}
                <T bold size={17} style={styles.heading}>{title}</T>
                <T size={15} style={styles.text}>{reading}</T>
                <View style={styles.rule} />
                <T bold size={13} style={styles.eyebrow}>TRY THIS</T>
                <T size={15} style={styles.text}>{reflection}</T>
              </View>
              <T size={12} style={styles.note}>These are traditional descriptions. Your quiz score reflects your answers and does not identify an imbalance.</T>
            </ScrollView>
          </View>
        ))}
      </Animated.ScrollView>}
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous state" disabled={index === 0} onPress={() => move(index - 1)} style={[styles.button, index === 0 && styles.disabled]}><ChevronLeft color="#f1edff" size={22} /></Pressable>
        <T size={13} style={styles.note}>{index + 1} of 3</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Next state" disabled={index === 2} onPress={() => move(index + 1)} style={[styles.button, index === 2 && styles.disabled]}><ChevronRight color="#f1edff" size={22} /></Pressable>
      </View>
    </View>
  </DetailScreen>;
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  chapter: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 19, paddingBottom: 24, gap: 12 },
  orb: { width: 104, height: 104, borderRadius: 52, borderWidth: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginVertical: 10 },
  eyebrow: { color: '#e7ccaa', letterSpacing: 1.4, textAlign: 'center' },
  title: { color: '#fbf7ff', textAlign: 'center', lineHeight: 38 },
  heading: { color: '#fbf7ff' },
  card: { padding: 17, gap: 12, borderRadius: 23, borderWidth: 1, borderColor: '#848dc069', backgroundColor: '#2b32696e' },
  text: { color: '#ebe6fa', lineHeight: 22 },
  note: { color: '#c7c8e5', textAlign: 'center', lineHeight: 17 },
  rule: { height: 1, backgroundColor: '#848dc069' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 330, alignSelf: 'center', paddingHorizontal: 19, paddingVertical: 8 },
  button: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#848dc069', backgroundColor: '#2b3269' },
  disabled: { opacity: 0.32 },
});
