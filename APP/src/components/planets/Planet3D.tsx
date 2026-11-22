import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Earth'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

interface Planet3DProps {
  name: PlanetName | string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Planet3D({ name, size = 80, style }: Planet3DProps) {
  const radius = size / 2;

  // Описание на цветовете и детайлите за всяка планета според дизайна
  const renderPlanetBody = () => {
    switch (name) {
      case 'Sun':
        return (
          <LinearGradient
            colors={['#FFF176', '#FF9800', '#F57C00', '#D84315']}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            {/* Слънчеви лъчи / Корона */}
            <View style={[styles.sunRayContainer, { width: size, height: size }]}>
              <View style={[styles.sunRay, { backgroundColor: 'rgba(255, 235, 59, 0.4)' }]} />
              <View style={[styles.sunRay, { transform: [{ rotate: '45deg' }], backgroundColor: 'rgba(255, 152, 0, 0.4)' }]} />
            </View>
          </LinearGradient>
        );

      case 'Moon':
        return (
          <LinearGradient
            colors={['#FFFDF5', '#E2D9C8', '#9E9484', '#5D5447']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            {/* Кратери */}
            <View style={[styles.crater, { top: size * 0.15, left: size * 0.2, width: size * 0.22, height: size * 0.22 }]} />
            <View style={[styles.crater, { top: size * 0.45, left: size * 0.35, width: size * 0.28, height: size * 0.28 }]} />
            <View style={[styles.crater, { bottom: size * 0.15, right: size * 0.2, width: size * 0.2, height: size * 0.2 }]} />
            <View style={[styles.crater, { top: size * 0.2, right: size * 0.25, width: size * 0.14, height: size * 0.14 }]} />
          </LinearGradient>
        );

      case 'Mercury':
        return (
          <LinearGradient
            colors={['#B0BEC5', '#78909C', '#455A64', '#263238']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            {/* Текстура на метеоритни следи */}
            <View style={[styles.crater, { top: size * 0.2, left: size * 0.25, width: size * 0.3, height: size * 0.3 }]} />
            <View style={[styles.starCrater, { top: size * 0.15, right: size * 0.2, width: size * 0.25, height: size * 0.25 }]} />
          </LinearGradient>
        );

      case 'Venus':
        return (
          <LinearGradient
            colors={['#FFE082', '#FFB300', '#E65100', '#BF360C']}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 0.9 }}
            style={styles.full}
          >
            {/* Атмосферни вихри */}
            <View style={[styles.stripe, { top: size * 0.25, height: size * 0.12, backgroundColor: 'rgba(255, 235, 59, 0.35)', transform: [{ rotate: '-12deg' }] }]} />
            <View style={[styles.stripe, { top: size * 0.55, height: size * 0.18, backgroundColor: 'rgba(230, 81, 0, 0.4)', transform: [{ rotate: '-8deg' }] }]} />
          </LinearGradient>
        );

      case 'Earth':
        return (
          <LinearGradient
            colors={['#4FC3F7', '#0288D1', '#01579B']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            {/* Континенти (зелени петна) */}
            <View style={[styles.continent, { top: size * 0.18, left: size * 0.15, width: size * 0.4, height: size * 0.35, backgroundColor: '#66BB6A' }]} />
            <View style={[styles.continent, { bottom: size * 0.2, right: size * 0.12, width: size * 0.45, height: size * 0.3, backgroundColor: '#4CAF50' }]} />
            {/* Облаци */}
            <View style={[styles.cloud, { top: size * 0.22, right: size * 0.1, width: size * 0.35, height: size * 0.12 }]} />
            <View style={[styles.cloud, { bottom: size * 0.3, left: size * 0.1, width: size * 0.4, height: size * 0.1 }]} />
          </LinearGradient>
        );

      case 'Mars':
        return (
          <LinearGradient
            colors={['#FF7043', '#E64A19', '#BF360C', '#4E1002']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            {/* Червени каньони и релеф */}
            <View style={[styles.crater, { top: size * 0.3, left: size * 0.2, width: size * 0.4, height: size * 0.3, backgroundColor: 'rgba(78, 16, 2, 0.35)' }]} />
            <View style={[styles.crater, { bottom: size * 0.15, right: size * 0.25, width: size * 0.35, height: size * 0.25, backgroundColor: 'rgba(191, 54, 12, 0.4)' }]} />
          </LinearGradient>
        );

      case 'Jupiter':
        return (
          <LinearGradient
            colors={['#FFCC80', '#D7CCC8', '#A1887F', '#5D4037']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.full}
          >
            {/* Ивици на Юпитер */}
            <View style={[styles.stripe, { top: size * 0.18, height: size * 0.1, backgroundColor: '#8D6E63' }]} />
            <View style={[styles.stripe, { top: size * 0.35, height: size * 0.16, backgroundColor: '#D84315' }]} />
            <View style={[styles.stripe, { top: size * 0.62, height: size * 0.12, backgroundColor: '#8D6E63' }]} />
            {/* Голямото червено петно */}
            <View style={[styles.redSpot, { top: size * 0.42, right: size * 0.2, width: size * 0.24, height: size * 0.16 }]} />
          </LinearGradient>
        );

      case 'Saturn':
        return (
          <LinearGradient
            colors={['#F6E58D', '#E056FD', '#686DE0', '#30336B']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            <View style={[styles.stripe, { top: size * 0.3, height: size * 0.12, backgroundColor: 'rgba(255, 255, 255, 0.25)' }]} />
            <View style={[styles.stripe, { top: size * 0.55, height: size * 0.14, backgroundColor: 'rgba(104, 109, 224, 0.4)' }]} />
          </LinearGradient>
        );

      case 'Uranus':
        return (
          <LinearGradient
            colors={['#80DEEA', '#26C6DA', '#0097A7', '#006064']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            <View style={[styles.stripe, { top: size * 0.4, height: size * 0.15, backgroundColor: 'rgba(255, 255, 255, 0.2)', transform: [{ rotate: '25deg' }] }]} />
          </LinearGradient>
        );

      case 'Neptune':
        return (
          <LinearGradient
            colors={['#448AFF', '#2979FF', '#1565C0', '#0D47A1']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            <View style={[styles.stripe, { top: size * 0.25, height: size * 0.1, backgroundColor: 'rgba(130, 177, 255, 0.4)', transform: [{ rotate: '-15deg' }] }]} />
            <View style={[styles.stripe, { top: size * 0.6, height: size * 0.14, backgroundColor: 'rgba(41, 121, 255, 0.5)', transform: [{ rotate: '-10deg' }] }]} />
          </LinearGradient>
        );

      case 'Pluto':
      default:
        return (
          <LinearGradient
            colors={['#D1C4E9', '#9575CD', '#5E35B1', '#311B92']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.full}
          >
            <View style={[styles.volcano, { top: size * 0.1, alignSelf: 'center', width: size * 0.25, height: size * 0.25 }]} />
            <View style={[styles.crater, { bottom: size * 0.2, left: size * 0.2, width: size * 0.2, height: size * 0.2 }]} />
          </LinearGradient>
        );
    }
  };

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Задни пръстени (За Сатурн и Уран) */}
      {name === 'Saturn' && (
        <View style={[styles.ringSaturn, { width: size * 1.7, height: size * 0.5, borderRadius: size * 0.4 }]} />
      )}
      {name === 'Uranus' && (
        <View style={[styles.ringUranus, { width: size * 1.5, height: size * 0.35, borderRadius: size * 0.3 }]} />
      )}

      {/* Основно сферично тяло */}
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', position: 'relative' }}>
        {renderPlanetBody()}

        {/* 3D Сферична сянка (Долу вдясно) */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.65)']}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.95, y: 0.95 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* 3D Гланцов отблясък (Горе вляво) */}
        <View style={[styles.glossHighlight, { width: size * 0.45, height: size * 0.22, borderRadius: size * 0.25 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  glossHighlight: {
    position: 'absolute',
    top: '8%',
    left: '12%',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    transform: [{ rotate: '-30deg' }],
  },
  sunRayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunRay: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 16,
  },
  crater: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  starCrater: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stripe: {
    position: 'absolute',
    width: '120%',
    left: '-10%',
  },
  continent: {
    position: 'absolute',
    borderRadius: 18,
    opacity: 0.85,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 10,
  },
  redSpot: {
    position: 'absolute',
    backgroundColor: '#B71C1C',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  volcano: {
    position: 'absolute',
    backgroundColor: '#4A148C',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E1BEE7',
  },
  ringSaturn: {
    position: 'absolute',
    borderWidth: 7,
    borderColor: 'rgba(224, 86, 253, 0.75)',
    transform: [{ rotate: '-28deg' }],
    zIndex: 1,
  },
  ringUranus: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(128, 222, 234, 0.85)',
    transform: [{ rotate: '65deg' }],
    zIndex: 1,
  },
});