import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  Brain,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  CloudUpload,
  Share2,
  Check,
} from 'lucide-react-native';
import { Card, T, Section, Pill, Progress } from '../../components/UI';
import { MbtiResultData } from './mbti.types';
import { styles } from './mbti.styles';

interface MbtiResultSectionProps {
  colors: any;
  resultData: MbtiResultData;
  isSyncing: boolean;
  syncStatus: string | null;
  isCapturing: boolean;
  shared: boolean;
  onRetake: () => void;
  onShareToStory: () => void;
  onNavigateExplore: () => void;
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
  onNavigateExplore,
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
        <View style={{ gap: 6 }}>
          <View style={styles.balanceRowHeader}>
            <T bold size={12}>
              Extraversion (E) {ratios.EI.first}%
            </T>
            <T bold size={12}>
              {ratios.EI.second}% Introversion (I)
            </T>
          </View>
          <Progress value={ratios.EI.first} color={colors.purple} />
        </View>

        <View style={{ gap: 6 }}>
          <View style={styles.balanceRowHeader}>
            <T bold size={12}>
              Sensing (S) {ratios.SN.first}%
            </T>
            <T bold size={12}>
              {ratios.SN.second}% Intuition (N)
            </T>
          </View>
          <Progress value={ratios.SN.first} color={colors.gold} />
        </View>

        <View style={{ gap: 6 }}>
          <View style={styles.balanceRowHeader}>
            <T bold size={12}>
              Thinking (T) {ratios.TF.first}%
            </T>
            <T bold size={12}>
              {ratios.TF.second}% Feeling (F)
            </T>
          </View>
          <Progress value={ratios.TF.first} color={colors.purple} />
        </View>

        <View style={{ gap: 6 }}>
          <View style={styles.balanceRowHeader}>
            <T bold size={12}>
              Judging (J) {ratios.JP.first}%
            </T>
            <T bold size={12}>
              {ratios.JP.second}% Prospecting (P)
            </T>
          </View>
          <Progress value={ratios.JP.first} color={colors.gold} />
        </View>
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
        <Pill onPress={onRetake}>
          <RotateCcw size={14} color={colors.purple} /> Retake Test
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

        <Pill onPress={onNavigateExplore}>To Explore ↗</Pill>
      </View>
    </View>
  );
}