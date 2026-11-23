import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { T } from '../../components/UI';
import { TAROT_CARD_BACK, TAROT_ARTWORK, TAROT_CARD_ASPECT_RATIO } from './tarot.assets';
import { TarotArtworkCardProps } from './tarot.types';
import { styles } from './tarot.styles';

const CARD_WIDTH = { micro: 64, small: 84, medium: '100%', large: '100%' } as const;

export function TarotArtworkCard({
  card,
  isRevealed,
  cardIndex,
  colors,
  size = 'medium',
}: TarotArtworkCardProps) {
  const imageSource = card ? TAROT_ARTWORK[card.pngKey] : null;

  return (
    <View
      style={[
        styles.tarotCardFrame,
        {
          width: CARD_WIDTH[size],
          aspectRatio: TAROT_CARD_ASPECT_RATIO,
          borderColor: colors.purple,
        },
      ]}
    >
      {!isRevealed ? (
        <View style={styles.tarotCardBack}>
          <Image
            source={TAROT_CARD_BACK}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
          {cardIndex !== undefined && (
            <View style={[styles.cardIndexBadge, { borderColor: colors.purple }]}>
              <T bold size={8} style={{ color: colors.purple }}>
                #{cardIndex + 1}
              </T>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.tarotCardFront}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          ) : (
            <View style={styles.tarotCardFallback}>
              <T size={24}>{card?.symbol || '🃏'}</T>
              <T bold size={9} style={{ textAlign: 'center', marginTop: 2, color: '#111' }}>
                {card?.name}
              </T>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
