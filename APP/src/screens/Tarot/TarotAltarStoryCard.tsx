import React from 'react';
import { Image, Text, View } from 'react-native';
import { StoryCanvas } from '../../components/StoryCanvas';
import { cosmic } from '../../theme/cosmic';
import { TAROT_ARTWORK, TAROT_CARD_ASPECT_RATIO } from './tarot.assets';
import type { TarotCardData, TarotMode } from './tarot.types';

function StoryArtwork({ card, width }: { card: TarotCardData; width: number }) {
  const source = TAROT_ARTWORK[card.pngKey];
  const frame = { width, aspectRatio: TAROT_CARD_ASPECT_RATIO, borderRadius: 5 };
  return source ? <Image source={source} style={frame} resizeMode="contain" /> : (
    <View style={[frame, { alignItems: 'center', justifyContent: 'center', backgroundColor: cosmic.surfaceAlt }]}>
      <Text allowFontScaling={false} style={{ color: cosmic.text }}>{card.symbol}</Text>
    </View>
  );
}

export function TarotAltarStoryCard({ storyRef, mode, question, singleCardForStory, drawnCards, bottomCard, rCount, cCount }: {
  storyRef: React.RefObject<React.ComponentRef<typeof View> | null>;
  mode: TarotMode;
  question: string;
  singleCardForStory: TarotCardData | null;
  drawnCards: TarotCardData[];
  bottomCard: TarotCardData | null;
  rCount: number;
  cCount: number;
}) {
  const single = mode === 'daily' || drawnCards.length <= 1;
  const columns = Math.max(1, cCount);
  const cardWidth = Math.min(rCount >= 3 ? 42 : 62, Math.floor((316 - (columns - 1) * 6) / columns));

  return (
    <StoryCanvas storyRef={storyRef} title={mode === 'daily' ? 'Daily Tarot' : 'Tarot Spread'}>
      {mode === 'spread' && question.trim() !== '' && (
        <Text allowFontScaling={false} numberOfLines={2} style={{ color: cosmic.muted, fontSize: 13, textAlign: 'center' }}>{question}</Text>
      )}
      {single ? singleCardForStory && (
        <>
          <StoryArtwork card={singleCardForStory} width={114} />
          <Text allowFontScaling={false} style={{ color: cosmic.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>{singleCardForStory.name}</Text>
          <Text allowFontScaling={false} style={{ color: cosmic.purple, fontSize: 12 }}>{singleCardForStory.arcana} Arcana{singleCardForStory.suit ? ' · ' + singleCardForStory.suit : ''}</Text>
          <Text allowFontScaling={false} numberOfLines={4} style={{ color: cosmic.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' }}>{singleCardForStory.message}</Text>
        </>
      ) : Array.from({ length: rCount }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {drawnCards.slice(row * columns, (row + 1) * columns).map((card, column) => (
            <View key={column} style={{ alignItems: 'center', gap: 3, width: columns === 4 ? 72 : Math.max(cardWidth, 75) }}>
              <StoryArtwork card={card} width={cardWidth} />
              <Text allowFontScaling={false} numberOfLines={2} style={{ color: cosmic.text, fontSize: 10, textAlign: 'center' }}>{card.name}</Text>
            </View>
          ))}
        </View>
      ))}
      {mode === 'spread' && bottomCard && (
        <Text allowFontScaling={false} numberOfLines={1} style={{ color: cosmic.gold, fontSize: 12 }}>Foundation · {bottomCard.name}</Text>
      )}
    </StoryCanvas>
  );
}
