import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Moon, Sparkles } from 'lucide-react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Card, T } from '../../components/UI';
import { shareActionStyles } from '../../components/shareActionStyles';
import { LocalPngTarotCard } from './LocalPngTarotCard';
import type { TarotCardData } from './tarot.types';

type Props = {
  colors: any;
  dailyCard: TarotCardData | null;
  isCapturing: boolean;
  shared: boolean;
  controls: React.ReactNode;
  onDrawDaily: () => void;
  onShareMessage: (message: string) => void;
  onShareToStory: () => void;
};

function DailyCardBack() {
  return (
    <View style={styles.cardBack}>
      <LinearGradient colors={['#111636', '#34275d', '#131534']} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 220 374" style={StyleSheet.absoluteFill} accessible={false}>
        <Rect x={10} y={10} width={200} height={354} rx={12} fill="none" stroke="#d9b77c" />
        <Rect x={17} y={17} width={186} height={340} rx={9} fill="none" stroke="#d9b77c" strokeOpacity={0.35} />
        <Path d="M110 62 182 187 110 312 38 187Z" fill="none" stroke="#e6c391" strokeOpacity={0.58} />
        <Circle cx={110} cy={187} r={45} fill="none" stroke="#e6c391" strokeOpacity={0.7} strokeDasharray="2 5" />
        <Circle cx={110} cy={187} r={32} fill="#191735" stroke="#e6c391" strokeOpacity={0.5} />
        <Path d="M110 38l2 7 7 2-7 2-2 7-2-7-7-2 7-2Zm0 280l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#e6c391" />
      </Svg>
      <Moon color="#f3d398" size={39} strokeWidth={1.3} />
      <View style={styles.cardSparkle}><Sparkles color="#f3d398" size={15} /></View>
    </View>
  );
}

export function DailyTarotSection({ colors, dailyCard, isCapturing, shared, controls, onDrawDaily, onShareMessage, onShareToStory }: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <Card style={styles.daily}>
      <T bold size={18} style={styles.center}>Draw a card</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dailyCard ? 'Draw a new tarot card' : 'Draw a tarot card'}
        disabled={isCapturing}
        onPress={() => { setShareOpen(false); onDrawDaily(); }}
        style={({ pressed }) => [styles.drawTarget, pressed && { opacity: 0.86 }]}
      >
        {dailyCard ? <LocalPngTarotCard card={dailyCard} isRevealed colors={colors} size="large" /> : <DailyCardBack />}
      </Pressable>
      {controls}

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
  cardBack: { width: '100%', aspectRatio: 145 / 246, overflow: 'hidden', borderRadius: 13, borderWidth: 1, borderColor: '#8f7bb1', alignItems: 'center', justifyContent: 'center' },
  cardSparkle: { position: 'absolute', top: '43%', right: '39%' },
  reading: { width: '100%', alignItems: 'center', gap: 5 },
  center: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 330, lineHeight: 20, marginTop: 4 },
});
