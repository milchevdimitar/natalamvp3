import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Path,
  RadialGradient,
} from 'react-native-svg';
import { RotateCcw } from 'lucide-react-native';
import { T } from '../../components/UI';
import { NatalChartResults } from './astrology.types';
import { NatalChartWheel } from './NatalChartWheel';
import { styles } from './astrology.styles';

interface NatalChart3DDomeProps {
  results: NatalChartResults;
  colors: any;
}

export function NatalChart3DDome({ results, colors }: NatalChart3DDomeProps) {
  const stageWidth = Math.min(Dimensions.get('window').width - 48, 340);
  const stageHeight = 360;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.stageContainer, { width: stageWidth, height: stageHeight }]}>
      <View style={styles.planetBaseWrapper}>
        <Svg width={stageWidth} height={140} viewBox={`0 0 ${stageWidth} 140`}>
          <Defs>
            <LinearGradient id="planetBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.85" />
              <Stop offset="40%" stopColor="#1C1438" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#0A0614" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="planetRingEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.9" />
              <Stop offset="50%" stopColor={colors.purple} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.9" />
            </LinearGradient>
            <RadialGradient id="coreGlow" cx="50%" cy="0%" r="60%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.4" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path
            d={`M 15 10 A ${stageWidth / 2 - 15} 90 0 0 0 ${stageWidth - 15} 10 Z`}
            fill="url(#planetBodyGrad)"
            stroke="url(#planetRingEdge)"
            strokeWidth="2"
          />
          <Ellipse cx={stageWidth / 2} cy={10} rx={stageWidth / 2 - 25} ry={45} fill="url(#coreGlow)" />
        </Svg>
      </View>

      <View style={styles.disk3DContainer}>
        <Animated.View
          style={[
            styles.diskAnimatedWrapper,
            {
              transform: [{ perspective: 900 }, { rotateX: '68deg' }, { rotateZ: spinRotation }],
            },
          ]}
        >
          <NatalChartWheel results={results} colors={colors} size={280} variant="3D" />
        </Animated.View>
      </View>

      <View style={styles.domeOverlay}>
        <Svg width={stageWidth} height={210} viewBox={`0 0 ${stageWidth} 210`}>
          <Defs>
            <LinearGradient id="domeGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.25" />
              <Stop offset="35%" stopColor={colors.purple} stopOpacity="0.12" />
              <Stop offset="85%" stopColor={colors.purple} stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="domeBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.8" />
              <Stop offset="50%" stopColor="rgba(255,255,255,0.9)" stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple} stopOpacity="0.8" />
            </LinearGradient>
            <RadialGradient id="topZenithLight" cx="50%" cy="0%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path
            d={`M 15 200 A ${stageWidth / 2 - 15} 185 0 0 1 ${stageWidth - 15} 200 Z`}
            fill="url(#domeGlassGrad)"
            stroke="url(#domeBorderGrad)"
            strokeWidth="1.8"
          />
          <Path
            d={`M 50 200 A ${stageWidth / 2 - 50} 150 0 0 1 ${stageWidth - 50} 200`}
            fill="none"
            stroke={colors.gold}
            strokeWidth="0.8"
            strokeDasharray="4,4"
            opacity={0.45}
          />
          <Path
            d={`M 90 200 A ${stageWidth / 2 - 90} 100 0 0 1 ${stageWidth - 90} 200`}
            fill="none"
            stroke={colors.purple}
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity={0.5}
          />
          <Line
            x1={stageWidth / 2}
            y1={15}
            x2={stageWidth / 2}
            y2={200}
            stroke={colors.gold}
            strokeWidth="1"
            strokeDasharray="5,4"
            opacity={0.4}
          />

          {results.planetPositions.map((p, idx) => {
            const relDeg = (p.deg - results.asc + 360) % 360;
            const toDomeRad = (relDeg * Math.PI) / 360;
            const domeRx = stageWidth / 2 - 32;
            const domeRy = 162;
            const px = stageWidth / 2 - domeRx * Math.cos(toDomeRad);
            const py = 195 - domeRy * Math.sin(toDomeRad);

            return (
              <G key={`dome-planet-${idx}`}>
                <Line
                  x1={stageWidth / 2}
                  y1={195}
                  x2={px}
                  y2={py}
                  stroke={colors.gold}
                  strokeWidth="0.6"
                  strokeDasharray="2,2"
                  opacity={0.35}
                />
                <Circle cx={px} cy={py} r="10" fill="#120E24" stroke={colors.gold} strokeWidth="1.2" />
                <SvgText
                  x={px}
                  y={py + 1}
                  fill={colors.gold}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {p.symbol}
                </SvgText>
              </G>
            );
          })}

          <Circle cx={stageWidth / 2} cy={16} r="18" fill="url(#topZenithLight)" />
          <Circle cx={stageWidth / 2} cy={16} r="3" fill="#FFFFFF" />
          <Circle cx={stageWidth / 2} cy={16} r="6" stroke={colors.gold} strokeWidth="1" fill="none" />
        </Svg>
      </View>

      <View style={styles.rotationHintBadge}>
        <RotateCcw size={11} color={colors.gold} />
        <T bold size={9} style={{ color: colors.gold, letterSpacing: 0.8 }}>
          3D DOME ORBIT ACTIVE
        </T>
      </View>
    </View>
  );
}