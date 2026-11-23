import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Card, T } from '../../components/UI';
import { shareActionStyles } from '../../components/shareActionStyles';
import { TarotArtworkCard } from './TarotArtworkCard';
import { useReducedMotion } from '../Home/CosmicBackground';
import type { TarotCardData } from './tarot.types';

type Props = {
  colors: any;
  dailyCard: TarotCardData | null;
  busy: boolean;
  error: string;
  isCapturing: boolean;
  shared: boolean;
  onDrawDaily: () => void;
  onShareMessage: (message: string) => void;
  onShareToStory: () => void;
};

export function DailyTarotSection({ colors, dailyCard, busy, error, isCapturing, shared, onDrawDaily, onShareMessage, onShareToStory }: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  const reduced = useReducedMotion();
  const reveal = useRef(new Animated.Value(1)).current;
  const cardId = dailyCard?.id;
  useEffect(() => {
    if (cardId === undefined || reduced) {
      reveal.setValue(1);
      return;
    }
    reveal.setValue(0);
    const animation = Animated.timing(reveal, { toValue: 1, duration: 240, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [cardId, reduced, reveal]);

  return (
    <Card style={styles.daily}>
      <T bold size={18} style={styles.center}>{dailyCard ? 'Your daily card' : 'Draw a card'}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dailyCard ? 'Your daily tarot card' : 'Draw a tarot card'}
        disabled={isCapturing || busy || Boolean(dailyCard)}
        onPress={() => { setShareOpen(false); onDrawDaily(); }}
        style={({ pressed }) => [styles.drawTarget, pressed && { opacity: 0.86 }]}
      >
        {busy ? <ActivityIndicator color={colors.purple} style={styles.loading} /> : <Animated.View style={{ opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}>
          <TarotArtworkCard card={dailyCard ?? undefined} isRevealed={Boolean(dailyCard)} colors={colors} size="large" />
        </Animated.View>}
      </Pressable>
      {!!error && <View accessibilityRole="alert"><T muted size={13} style={styles.center}>{error}</T></View>}

      {dailyCard && <>
        <View style={styles.reading}>
          <T bold size={22} style={[styles.center, { color: colors.purple }]}>{dailyCard.name}</T>
          <T muted bold size={11} style={styles.center}>{dailyCard.arcana} Arcana{dailyCard.suit ? ' · ' + dailyCard.suit : ''}</T>
          <T muted size={13} style={styles.message}>{dailyCard.message}</T>
        </View>
        <View style={shareActionStyles.row}>
          {shareOpen ? <>
            <Pressable accessibilityRole="button" onPress={() => onShareMessage(dailyCard.name + '\n\n' + dailyCard.message)} style={shareActionStyles.button}>
              <Text style={shareActionStyles.label}>Message</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={shared ? 'Posted to Story' : 'Story'} onPress={onShareToStory}
              disabled={isCapturing || shared} style={[shareActionStyles.button, shared && { opacity: 0.7 }]}>
              {isCapturing ? <ActivityIndicator size="small" color="#282034" /> : <>
                {shared && <Check size={14} color="#282034" />}
                <Text style={shareActionStyles.label}>Story</Text>
              </>}
            </Pressable>
          </> : <Pressable accessibilityRole="button" onPress={() => setShareOpen(true)} style={shareActionStyles.button}>
            <Text style={shareActionStyles.label}>Share</Text>
          </Pressable>}
        </View>
      </>}
    </Card>
  );
}

const styles = StyleSheet.create({
  daily: { alignItems: 'center', gap: 12, marginBottom: 40 },
  drawTarget: { width: '100%', maxWidth: 224 },
  loading: { aspectRatio: 3 / 5, justifyContent: 'center' },
  reading: { width: '100%', alignItems: 'center', gap: 5 },
  center: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 330, lineHeight: 20, marginTop: 4 },
});
