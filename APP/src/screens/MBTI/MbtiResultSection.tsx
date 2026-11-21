import React from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import {
  Brain,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  CloudUpload,
  Share2,
  Check,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { MbtiResultData } from './mbti.types';
import { styles } from './mbti.styles';
import { CognitiveBalance } from './CognitiveBalance';

interface MbtiResultSectionProps {
  colors: any;
  resultData: MbtiResultData;
  isSyncing: boolean;
  syncStatus: string | null;
  isCapturing: boolean;
  shared: boolean;
  onRetake: () => void;
  onShareToStory: () => void;
}

export function MbtiResultSection({
  colors,
  resultData,
  isSyncing,
  syncStatus,
  isCapturing,
  shared,
  onRetake,
  onShareToStory,
}: MbtiResultSectionProps) {
  const { type, details, ratios } = resultData;

  return (
    <View style={styles.resultStack}>
      {syncStatus && (
        <View style={[styles.syncBanner, { backgroundColor: colors.purpleSoft }]}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <CloudUpload size={16} color={colors.purple} />
          )}
          <T size={12} style={{ color: colors.purple }}>
            {syncStatus}
          </T>
        </View>
      )}

      {/* Главен Card с резултата */}
      <Card style={styles.resultHeroCard}>
        <View
          style={[
            styles.resultBrainCircle,
            { backgroundColor: colors.purpleSoft },
          ]}
        >
          <Brain size={38} color={colors.purple} />
        </View>
        <T muted size={11} style={{ letterSpacing: 2 }}>
          YOUR PERSONALITY TYPE
        </T>
        <T bold size={36} style={[styles.resultTypeCode, { color: colors.purple }]}>
          {type}
        </T>
        <T bold size={20}>
          {details.title}
        </T>
        <T muted size={13} style={styles.resultSubtitle}>
          {details.subtitle}
        </T>
      </Card>

      {/* Type Essence */}
      <Card style={{ gap: 10 }}>
        <View style={styles.essenceHeader}>
          <Sparkles size={16} color={colors.gold} />
          <T bold size={15}>
            Type Essence
          </T>
        </View>
        <T muted size={13} style={{ lineHeight: 20 }}>
          {details.desc}
        </T>
      </Card>

      {/* Cognitive Balance */}
      <Section>Cognitive Balance</Section>
      <Card style={styles.balanceCard}>
        <CognitiveBalance ratios={ratios} />
      </Card>

      {/* Core Traits */}
      <Section>Core Traits</Section>
      <View style={styles.traitsGrid}>
        {details.traits.map((trait, i) => (
          <Card key={i} style={styles.traitCard}>
            <CheckCircle2 size={20} color={colors.purple} />
            <T bold size={13}>
              {trait}
            </T>
          </Card>
        ))}
      </View>

      {/* Бутони за управление */}
      <View style={styles.resultActionsRow}>
        <Pressable accessibilityRole="button" disabled={isCapturing} onPress={onRetake} style={({ pressed }) => [styles.resultAction, { borderColor: colors.line, backgroundColor: colors.purpleSoft }, pressed && { opacity: 0.75 }]}>
          <RotateCcw size={18} color={colors.purple} />
          <T bold size={14} style={{ textAlign: 'center' }}>Retake Test</T>
        </Pressable>

        <Pressable accessibilityRole="button" disabled={isCapturing || shared} onPress={onShareToStory} style={({ pressed }) => [styles.resultAction, { backgroundColor: colors.action }, pressed && { opacity: 0.78 }]}>
          {isCapturing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : shared ? (
            <Check size={18} color="#FFF" />
          ) : (
            <Share2 size={18} color="#FFF" />
          )}
          <T bold size={14} style={{ color: '#fff', textAlign: 'center' }}>{shared ? 'Added!' : 'Add to Story'}</T>
        </Pressable>
      </View>
    </View>
  );
}
