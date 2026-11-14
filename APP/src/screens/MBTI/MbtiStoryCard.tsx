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
              MBTI PERSONALITY PROFILE
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

            {/* Extraversion vs Introversion */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={10} style={{ color: '#FFF' }}>
                  Extraversion {ratios.EI.first}%
                </T>
                <T bold size={10} style={{ color: '#FFF' }}>
                  {ratios.EI.second}% Introversion
                </T>
              </View>
              <View style={styles.storyBarTrack}>
                <View
                  style={{
                    width: `${ratios.EI.first}%`,
                    height: '100%',
                    backgroundColor: '#A855F7',
                  }}
                />
              </View>
            </View>

            {/* Sensing vs Intuition */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={10} style={{ color: '#FFF' }}>
                  Sensing {ratios.SN.first}%
                </T>
                <T bold size={10} style={{ color: '#FFF' }}>
                  {ratios.SN.second}% Intuition
                </T>
              </View>
              <View style={styles.storyBarTrack}>
                <View
                  style={{
                    width: `${ratios.SN.first}%`,
                    height: '100%',
                    backgroundColor: '#EAB308',
                  }}
                />
              </View>
            </View>

            {/* Thinking vs Feeling */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={10} style={{ color: '#FFF' }}>
                  Thinking {ratios.TF.first}%
                </T>
                <T bold size={10} style={{ color: '#FFF' }}>
                  {ratios.TF.second}% Feeling
                </T>
              </View>
              <View style={styles.storyBarTrack}>
                <View
                  style={{
                    width: `${ratios.TF.first}%`,
                    height: '100%',
                    backgroundColor: '#3B82F6',
                  }}
                />
              </View>
            </View>

            {/* Judging vs Prospecting */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={10} style={{ color: '#FFF' }}>
                  Judging {ratios.JP.first}%
                </T>
                <T bold size={10} style={{ color: '#FFF' }}>
                  {ratios.JP.second}% Prospecting
                </T>
              </View>
              <View style={styles.storyBarTrack}>
                <View
                  style={{
                    width: `${ratios.JP.first}%`,
                    height: '100%',
                    backgroundColor: '#EC4899',
                  }}
                />
              </View>
            </View>
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