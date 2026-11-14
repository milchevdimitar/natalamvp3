import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Flame, Moon } from 'lucide-react-native';
import { T } from '../../components/UI';
import { LocalPngTarotCard } from './LocalPngTarotCard';
import { TarotCardData, TarotMode } from './tarot.types';
import { styles } from './tarot.styles';

interface TarotAltarStoryCardProps {
  storyRef: React.RefObject<View | null>;
  colors: any;
  mode: TarotMode;
  question: string;
  singleCardForStory: TarotCardData | null;
  drawnCards: TarotCardData[];
  bottomCard: TarotCardData | null;
  rCount: number;
  cCount: number;
}

export function TarotAltarStoryCard({
  storyRef,
  colors,
  mode,
  question,
  singleCardForStory,
  drawnCards,
  bottomCard,
  rCount,
  cCount,
}: TarotAltarStoryCardProps) {
  return (
    <View style={styles.offscreenStoryWrapper} pointerEvents="none">
      <View ref={storyRef} collapsable={false} style={styles.storyCanvas}>
        <LinearGradient
          colors={['#08040C', '#180B26', '#2A0E3B', '#10051B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyGradient}
        >
          <View style={styles.storyDashedBorder} pointerEvents="none" />

          {/* Header: Свещи и Заглавие */}
          <View style={styles.storyHeaderRow}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={styles.storyCandleCircle}>
                <Flame size={18} color="#F59E0B" />
              </View>
              <T size={8} style={{ color: '#F59E0B', marginTop: 2, letterSpacing: 1 }}>
                🕯️ ALTAR
              </T>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View style={styles.storyTitlePill}>
                <Sparkles size={12} color="#EAB308" />
                <T bold size={10} style={{ color: '#EAB308', letterSpacing: 2 }}>
                  SACRED TAROT SPREAD
                </T>
              </View>
              <T size={8} style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 4 }}>
                NATALA TAROT SANCTUARY
              </T>
            </View>

            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={styles.storyMoonCircle}>
                <Moon size={16} color="#EAB308" />
              </View>
              <T size={8} style={{ color: '#EAB308', marginTop: 2, letterSpacing: 1 }}>
                🔮 ORACLE
              </T>
            </View>
          </View>

          {/* Въпрос / Интенция */}
          {mode === 'spread' && question.trim().length > 0 && (
            <View style={styles.storyIntentionBox}>
              <T size={9} style={{ color: '#EAB308', letterSpacing: 1, marginBottom: 2 }}>
                ✦ SEEKER'S INTENTION ✦
              </T>
              <T
                bold
                size={12}
                style={{ color: '#FFF', textAlign: 'center', fontStyle: 'italic' }}
                numberOfLines={2}
              >
                "{question}"
              </T>
            </View>
          )}

          {/* Основно платно: Единична карта или Пълна подредба */}
          <View style={styles.storyBodyArea}>
            {mode === 'daily' || drawnCards.length <= 1 ? (
              singleCardForStory ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.storySingleCardFrame}>
                    <LocalPngTarotCard
                      card={singleCardForStory}
                      isRevealed
                      colors={colors}
                      size="large"
                    />
                  </View>

                  <T bold size={22} style={styles.storySingleCardTitle}>
                    {singleCardForStory.name}
                  </T>

                  <View style={styles.storyArcanaPill}>
                    <T bold size={11} style={{ color: '#EAB308' }}>
                      {singleCardForStory.arcana} Arcana{' '}
                      {singleCardForStory.suit ? `· ${singleCardForStory.suit}` : ''}
                    </T>
                  </View>

                  <View style={styles.storyMessageBox}>
                    <T
                      bold
                      size={11}
                      style={{
                        color: '#2D2140',
                        textAlign: 'center',
                        lineHeight: 16,
                        fontStyle: 'italic',
                      }}
                    >
                      "{singleCardForStory.message}"
                    </T>
                  </View>
                </View>
              ) : null
            ) : (
              <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                <View style={styles.storySpreadGridBox}>
                  {Array.from({ length: rCount }).map((_, rIdx) => (
                    <View
                      key={`story-row-${rIdx}`}
                      style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}
                    >
                      {Array.from({ length: cCount }).map((__, cIdx) => {
                        const cardIdx = rIdx * cCount + cIdx;
                        const card = drawnCards[cardIdx];
                        if (!card) return null;

                        const isLargeSpread = rCount * cCount > 4;
                        const cardSize = isLargeSpread ? 'micro' : 'small';

                        return (
                          <View
                            key={`story-card-${cardIdx}`}
                            style={{
                              alignItems: 'center',
                              flex: 1,
                              maxWidth: isLargeSpread ? 80 : 100,
                            }}
                          >
                            <LocalPngTarotCard
                              card={card}
                              isRevealed
                              cardIndex={cardIdx}
                              colors={colors}
                              size={cardSize}
                            />
                            <T
                              bold
                              size={9}
                              style={{ color: '#EAB308', textAlign: 'center', marginTop: 3 }}
                              numberOfLines={1}
                            >
                              {card.name}
                            </T>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {bottomCard && (
                  <View style={styles.storyFoundationBanner}>
                    <T size={13}>🔮</T>
                    <View style={{ flex: 1 }}>
                      <T bold size={10} style={{ color: '#EAB308' }}>
                        FOUNDATION: {bottomCard.name}
                      </T>
                      <T size={9} style={{ color: 'rgba(255,255,255,0.7)' }} numberOfLines={1}>
                        {bottomCard.message}
                      </T>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Долен Брандинг */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <T size={11}>🕯️</T>
              <T bold size={10} style={{ color: '#EAB308', letterSpacing: 1 }}>
                UNVEIL YOUR COSMIC DESTINY
              </T>
              <T size={11}>✨</T>
            </View>
            <T size={8} style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
              NATALA ASTROLOGY & TAROT SANCTUARY
            </T>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}