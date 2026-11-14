import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../../components/UI';
import { MoonPhaseData } from './home.types';
import { styles } from './home.styles';

interface AnimatedMoonVisualizerProps {
  moonPhase: MoonPhaseData;
  colors: any;
}

export function AnimatedMoonVisualizer({
  moonPhase,
  colors,
}: AnimatedMoonVisualizerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const shadowTranslateX = (moonPhase.phasePercent / 100) * 80 - 40;

  return (
    <View style={styles.moonVisualizerContainer}>
      <Animated.View
        style={[
          styles.moonAuraGlow,
          {
            backgroundColor: moonPhase.isSpecial ? colors.gold : colors.purple,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <View style={styles.moonSphereBody}>
        <LinearGradient
          colors={['#FDFBF7', '#E2D9C8', '#9E9484']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.moonBaseGradient}
        >
          <View style={[styles.crater, { top: 12, left: 16, width: 14, height: 14 }]} />
          <View style={[styles.crater, { top: 38, left: 24, width: 20, height: 20 }]} />
          <View style={[styles.crater, { bottom: 16, right: 18, width: 16, height: 16 }]} />
          <View style={[styles.crater, { top: 22, right: 28, width: 10, height: 10 }]} />

          <View
            style={[
              styles.moonShadowOverlay,
              {
                backgroundColor: '#0D0A14',
                opacity: 1 - moonPhase.illuminated / 100,
                transform: [{ translateX: shadowTranslateX }],
              },
            ]}
          />
        </LinearGradient>
      </View>

      <View style={[styles.illuminationBadge, { borderColor: colors.gold }]}>
        <T bold size={10} style={{ color: colors.gold }}>
          {moonPhase.illuminated}%
        </T>
      </View>
    </View>
  );
}