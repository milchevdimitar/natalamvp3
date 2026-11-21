import { CognitiveBalance } from './CognitiveBalance';
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Sparkles } from 'lucide-react-native';
import { T } from '../../components/UI';
import { MbtiResultData } from './mbti.types';
import { styles } from './mbti.styles';

interface MbtiStoryCardProps {
  storyRef: React.RefObject<View | null>;
  resultData: MbtiResultData;
}

export function MbtiStoryCard({ storyRef, resultData }: MbtiStoryCardProps) {
  const { type, details, ratios } = resultData;

  return (
    <View style={styles.offscreenStoryWrapper} pointerEvents="none">
      <View ref={storyRef} collapsable={false} style={styles.storyCanvas}>
        <LinearGradient
          colors={['#0D0714', '#170E28', '#261240', '#0D0714']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyGradient}
        >
          {/* Header Branding */}
          <View style={{ alignItems: 'center', gap: 4, marginTop: 10 }}>
            <View style={styles.storyHeaderPill}>
              <Sparkles size={12} color="#EAB308" />
              <T bold size={11} style={{ color: '#EAB308', letterSpacing: 2 }}>
                NATALA COSMIC ATLAS
              </T>
            </View>
            <T
              size={10}
              style={{
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 1.5,
                marginTop: 2,
              }}
            >
              16 ARCHETYPES · PERSONALITY PROFILE
            </T>
          </View>

          {/* Main Badge & Type Hero */}
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={styles.storyHeroBrainCircle}>
              <Brain size={48} color="#FFF" />
            </View>

            <T bold size={44} style={styles.storyTypeHeroText}>
              {type}
            </T>

            <T bold size={22} style={{ color: '#EAB308', marginTop: 2 }}>
              {details.title}
            </T>

            <T size={12} style={styles.storySubtitleText}>
              "{details.subtitle}"
            </T>
          </View>

          {/* Cognitive Balance Visual Bars */}
          <View style={styles.storyDynamicsBox}>
            <T
              bold
              size={11}
              style={{ color: '#EAB308', letterSpacing: 1, marginBottom: 2 }}
            >
              COGNITIVE DYNAMICS
            </T>

            <CognitiveBalance ratios={ratios} story />
          </View>

          {/* Core Traits Pills */}
          <View style={styles.storyTraitsWrap}>
            {details.traits.map((trait, i) => (
              <View key={i} style={styles.storyTraitPill}>
                <T bold size={11} style={{ color: '#FFF' }}>
                  ✦ {trait}
                </T>
              </View>
            ))}
          </View>

          {/* Footer Branding */}
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <T
              size={10}
              style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}
            >
              DISCOVER YOUR PERSONALITY · NATALA APP
            </T>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
