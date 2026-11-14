import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react-native';
import { T } from '../../components/UI';
import { styles } from './feed.styles';

export function FeedLoadingState({
  badges,
  colors,
  onLayout,
}: {
  badges: string[];
  colors: any;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.centerStateContainer} onLayout={onLayout}>
      <ActivityIndicator size="large" color={colors.purple} />
      <T bold size={14} style={{ color: '#FFFFFF', marginTop: 12 }}>
        Подбираме видеа за теб...
      </T>
      <T muted size={12} style={{ marginTop: 4 }}>
        {badges.join('  ·  ')}
      </T>
    </View>
  );
}

export function FeedErrorState({
  errorMsg,
  colors,
  onRetry,
  onLayout,
}: {
  errorMsg: string;
  colors: any;
  onRetry: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.centerStateContainer} onLayout={onLayout}>
      <AlertCircle size={40} color="#FF6B6B" />
      <T bold size={15} style={{ color: '#FFFFFF', marginTop: 12, textAlign: 'center' }}>
        Възникна проблем при зареждането
      </T>
      <T muted size={12} style={{ textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
        {errorMsg}
      </T>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.purple }]}
      >
        <RefreshCw size={16} color="#FFFFFF" />
        <T bold size={13} style={{ color: '#FFFFFF' }}>
          Опитай отново
        </T>
      </TouchableOpacity>
    </View>
  );
}

export function FeedEmptyState({
  colors,
  onRefresh,
  onLayout,
}: {
  colors: any;
  onRefresh: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.centerStateContainer} onLayout={onLayout}>
      <Sparkles size={38} color={colors.gold} />
      <T bold size={15} style={{ color: '#FFFFFF', marginTop: 12 }}>
        Няма намерени видеа
      </T>
      <T muted size={12} style={{ textAlign: 'center', marginTop: 6, maxWidth: 260 }}>
        Не открихме YouTube Shorts за текущите критерии от профила ти.
      </T>
      <TouchableOpacity
        onPress={onRefresh}
        style={[styles.retryButton, { backgroundColor: colors.purple }]}
      >
        <RefreshCw size={16} color="#FFFFFF" />
        <T bold size={13} style={{ color: '#FFFFFF' }}>
          Презареди
        </T>
      </TouchableOpacity>
    </View>
  );
}