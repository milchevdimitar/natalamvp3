import React from 'react';
import { Text, View } from 'react-native';
import { StoryCanvas } from '../../components/StoryCanvas';
import { cosmic } from '../../theme/cosmic';
import { CognitiveBalance } from './CognitiveBalance';
import type { MbtiResultData } from './mbti.types';

export function MbtiStoryCard({ storyRef, resultData }: {
  storyRef: React.RefObject<React.ComponentRef<typeof View> | null>;
  resultData: MbtiResultData;
}) {
  const { type, details, ratios } = resultData;
  return (
    <StoryCanvas storyRef={storyRef} title="16 Archetypes">
      <Text allowFontScaling={false} style={{ color: cosmic.purple, fontSize: 38, fontWeight: '800' }}>{type}</Text>
      <Text allowFontScaling={false} style={{ color: cosmic.text, fontSize: 20, fontWeight: '700' }}>{details.title}</Text>
      <Text allowFontScaling={false} numberOfLines={2} style={{ color: cosmic.muted, fontSize: 13, textAlign: 'center' }}>{details.subtitle}</Text>
      <View style={{ width: '100%', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: cosmic.line, backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <CognitiveBalance ratios={ratios} story />
      </View>
      <Text allowFontScaling={false} numberOfLines={2} style={{ color: cosmic.muted, textAlign: 'center', fontSize: 12 }}>{details.traits.join(' · ')}</Text>
    </StoryCanvas>
  );
}
