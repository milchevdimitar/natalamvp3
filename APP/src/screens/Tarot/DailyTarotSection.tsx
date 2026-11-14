import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { RotateCcw, Calendar, Share2, Check } from 'lucide-react-native';
import { Card, T, Pill } from '../../components/UI';
import { LocalPngTarotCard } from './LocalPngTarotCard';
import { TarotCardData } from './tarot.types';
import { styles } from './tarot.styles';

interface DailyTarotSectionProps {
  colors: any;
  useFullDeck: boolean;
  dailyDrawn: boolean;
  dailyCard: TarotCardData | null;
  isCapturing: boolean;
  shared: boolean;
  onDrawDaily: () => void;
  onShareToStory: () => void;
}

export function DailyTarotSection({
  colors,
  useFullDeck,
  dailyDrawn,
  dailyCard,
  isCapturing,
  shared,
  onDrawDaily,
  onShareToStory,
}: DailyTarotSectionProps) {
  return (
    <View style={styles.sectionStack}>
      {!dailyDrawn ? (
        <Card style={styles.dailyUndrawnCard}>
          <LocalPngTarotCard isRevealed={false} colors={colors} size="large" />

          <T bold size={18} style={{ textAlign: 'center' }}>
            Draw Your Daily Card ({useFullDeck ? '78 Cards' : '22 Cards'})
          </T>
          <Pill selected onPress={onDrawDaily}>
            ♠ Reveal Today's Arcana
          </Pill>
        </Card>
      ) : (
        dailyCard && (
          <Card style={styles.dailyRevealedCard}>
            <View style={[styles.dailyGuidanceBox, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.dailyHeaderRow}>
                <Calendar size={14} color={colors.gold} />
                <T muted size={11} style={{ letterSpacing: 1.5 }}>
                  NATALA TAROT GUIDANCE
                </T>
              </View>

              <LocalPngTarotCard
                card={dailyCard}
                isRevealed
                colors={colors}
                size="large"
              />

              <T bold size={22} style={{ color: colors.purple, marginTop: 12 }}>
                {dailyCard.name}
              </T>
              <Pill>
                {dailyCard.arcana} Arcana {dailyCard.suit ? `· ${dailyCard.suit}` : ''}
              </Pill>

              <T muted size={13} style={styles.dailyMessageText}>
                {dailyCard.message}
              </T>
            </View>

            <View style={styles.actionButtonsRow}>
              <Pill onPress={onDrawDaily}>
                <RotateCcw size={14} color={colors.purple} /> Draw Another Card
              </Pill>

              <Pill selected onPress={onShareToStory}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : shared ? (
                  <Check size={14} color="#FFF" />
                ) : (
                  <Share2 size={14} color="#FFF" />
                )}
                {shared ? 'Added!' : 'Add to Story'}
              </Pill>
            </View>
          </Card>
        )
      )}
    </View>
  );
}