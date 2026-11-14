import React from 'react';
import { View, Image } from 'react-native';
import { T } from '../../components/UI';
import { CARD_BACK_PNG, TAROT_PNG_MAP } from './tarot.assets';
import { LocalPngTarotCardProps } from './tarot.types';
import { styles } from './tarot.styles';

const CARD_DIMENSIONS = {
  micro: { width: 64, height: 108 },
  small: { width: 84, height: 142 },
  medium: { width: 110, height: 188 },
  large: { width: 145, height: 246 },
};

export function LocalPngTarotCard({
  card,
  isRevealed,
  cardIndex,
  colors,
  size = 'medium',
}: LocalPngTarotCardProps) {
  const dims = CARD_DIMENSIONS[size];
  const imageSource = card ? TAROT_PNG_MAP[card.pngKey] : null;

  return (
    <View
      style={[
        styles.tarotCardFrame,
        {
          width: size === 'medium' ? '100%' : dims.width,
          height: dims.height,
          borderColor: colors.purple,
        },
      ]}
    >
      {!isRevealed ? (
        <View style={styles.tarotCardBack}>
          <Image
            source={CARD_BACK_PNG}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
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
              resizeMode="contain"
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