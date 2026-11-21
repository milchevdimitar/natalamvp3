
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import { Card, T } from '../../components/UI';
import { DAILY_FORTUNES } from './home.constants';
import { styles } from './home.styles';
import { glassPanel } from '../../theme/cosmic';
import { useReducedMotion } from './CosmicBackground';

interface FortuneCookieCardProps {
  colors: any;
  onShareMessage: (message: string) => void;
  addStory: (base64Image: string) => Promise<void>;
  onOpenConfetti: () => void;
}

const GOLD = '#E9BD70';
const PURPLE = '#251238';

const cookieStyles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 225,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  rays: {
    position: 'absolute',
    width: '100%',
    maxWidth: 278,
  },
  cookieWrapper: {
    width: 230,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookieArt: {
    position: 'absolute',
    width: 162,
    height: 146,
    top: 2,
  },
  openedCookieArt: {
    width: 204,
    top: 19,
  },
  paper: {
    position: 'absolute',
    width: 210,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD,
    zIndex: 20,
    elevation: 12,
    shadowColor: GOLD,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  paperInner: {
    margin: 6,
    minHeight: 108,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(173,115,48,0.35)',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  paperQuote: {
    color: '#38233F',
    textAlign: 'center',
    fontSize: 15,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: { width: '100%', maxWidth: 230, height: 44, marginTop: 8, flexDirection: 'row', gap: 8 },
  action: { flex: 1, borderRadius: 16, backgroundColor: '#f6c66d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionLabel: { color: '#282034', fontWeight: '800' },
  paperSignature: { color: '#865424', fontSize: 8, fontWeight: '800', letterSpacing: 2.4 },
});

const COOKIE_RAYS = [
  [44, 48, 25, 32],
  [35, 76, 12, 69],
  [36, 106, 12, 113],
  [214, 44, 231, 27],
  [225, 69, 248, 61],
  [226, 96, 250, 99],
  [217, 120, 235, 134],
] as const;

const CLOSED_COOKIE = require('./assets/fortune-cookie-closed.png');
const OPEN_COOKIE = require('./assets/fortune-cookie-open.png');

export function FortuneCookieCard({
  colors,
  onShareMessage,
  addStory,
  onOpenConfetti,
}: FortuneCookieCardProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [hasPostedToStory, setHasPostedToStory] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);

  const storyRef = useRef<React.ComponentRef<typeof View>>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const split = useRef(new Animated.Value(0)).current;
  const paper = useRef(new Animated.Value(0)).current;
  const rayPulse = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    rayPulse.setValue(0);
    if (reducedMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(rayPulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(rayPulse, { toValue: 0, duration: 1550, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.delay(850),
    ]));
    animation.start();
    return () => animation.stop();
  }, [rayPulse, reducedMotion]);

  const currentFortune = DAILY_FORTUNES[fortuneIndex];
  const handleCrackCookie = () => {
    if (isAnimating || isPostingStory) return;

    setIsAnimating(true);
    setHasPostedToStory(false);
    setShareOptionsOpen(false);

    if (isOpened) {
      Animated.parallel([
        Animated.timing(split, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(paper, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        setIsAnimating(false);
        if (!finished) return;
        setIsOpened(false);
        setFortuneIndex(
          prev => (prev + 1) % DAILY_FORTUNES.length
        );
      });
      return;
    }

    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 65,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        setIsAnimating(false);
        return;
      }
      onOpenConfetti();
      Animated.parallel([
        Animated.spring(split, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(paper, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished: revealed }) => {
        setIsAnimating(false);
        if (revealed) setIsOpened(true);
      });
    });
  };

  const handlePostToStory = async () => {
    if (isPostingStory || hasPostedToStory) return;

    setIsPostingStory(true);

    try {
      const base64Image = await captureRef(storyRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });

      await addStory(base64Image);
      setHasPostedToStory(true);
      Alert.alert(
        'Success! ✨',
        'Your fortune has been posted to your Story!'
      );
    } catch (error) {
      console.error('Fortune Story error:', error);
      Alert.alert(
        'Error',
        'Could not post to Story. Please try again.'
      );
    } finally {
      setIsPostingStory(false);
    }
  };

  const rotate = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const closedOpacity = split.interpolate({
    inputRange: [0, 0.45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const openedOpacity = split.interpolate({
    inputRange: [0.12, 0.65],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const openedScale = split.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  const paperY = paper.interpolate({
    inputRange: [0, 1],
    outputRange: [22, -18],
  });

  const paperScale = paper.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const rayOpacity = rayPulse.interpolate({ inputRange: [0, 1], outputRange: [0.46, 0.88] });
  const rayScale = rayPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

  return (
    <>
      <Card style={{ ...styles.cookieMainCard, borderRadius: 28, borderWidth: 1, borderColor: glassPanel.border, backgroundColor: glassPanel.background }}>
        <LinearGradient colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={{ alignItems: 'center', gap: 5 }}>
          <T
            bold
            size={17}
            style={{
              color: colors.text,
              textAlign: 'center',
            }}
          >
            {isOpened
              ? 'Your fortune'
              : 'Your fortune awaits.'}
          </T>
          <T
            muted
            size={11}
            style={{ textAlign: 'center' }}
          >
            {isOpened
              ? 'A little wisdom from the universe'
              : 'A little mystery, made just for you'}
          </T>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isOpened ? 'Close fortune cookie' : 'Open fortune cookie'}
          activeOpacity={0.9}
          disabled={isAnimating || isPostingStory}
          onPress={handleCrackCookie}
          style={cookieStyles.stage}
        >
          <Animated.View
            pointerEvents="none"
            style={[cookieStyles.rays, { opacity: rayOpacity, transform: [{ scale: rayScale }] }]}
          >
            <Svg width="100%" height={166} viewBox="0 0 262 156" accessible={false}>
              {COOKIE_RAYS.map(([x1, y1, x2, y2]) => (
                <Line key={x1 + ':' + y1} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
              ))}
            </Svg>
          </Animated.View>
          <Animated.View
            style={[
              cookieStyles.cookieWrapper,
              { transform: [{ rotate }] },
            ]}
          >
            <Animated.Image
              source={CLOSED_COOKIE}
              resizeMode="contain"
              accessible={false}
              style={[cookieStyles.cookieArt, { opacity: closedOpacity }]}
            />
            <Animated.Image
              source={OPEN_COOKIE}
              resizeMode="contain"
              accessible={false}
              style={[cookieStyles.cookieArt, cookieStyles.openedCookieArt, { opacity: openedOpacity, transform: [{ scale: openedScale }] }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                cookieStyles.paper,
                {
                  opacity: paper,
                  transform: [
                    { translateY: paperY },
                    { scale: paperScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  '#FFFDF4',
                  '#FFF3D9',
                  '#F7E4BD',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={cookieStyles.paperInner}>
                  <Sparkles size={14} color="#A96C30" />
                  <Text style={cookieStyles.paperQuote}>
                    “{currentFortune}”
                  </Text>
                  <Text style={cookieStyles.paperSignature}>NATALA</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>

        <View style={cookieStyles.actions}>
          {isOpened && shareOptionsOpen ? (
            <>
              <TouchableOpacity accessibilityRole="button" onPress={() => onShareMessage(currentFortune)} style={cookieStyles.action}>
                <Text style={cookieStyles.actionLabel}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={hasPostedToStory ? 'Posted to Story' : 'Story'}
                onPress={handlePostToStory}
                disabled={isPostingStory || hasPostedToStory}
                style={[cookieStyles.action, hasPostedToStory && { opacity: 0.7 }]}
              >
                {isPostingStory ? <ActivityIndicator size="small" color="#282034" /> : <>
                  {hasPostedToStory && <CheckCircle size={14} color="#282034" />}
                  <Text style={cookieStyles.actionLabel}>Story</Text>
                </>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={isOpened ? () => setShareOptionsOpen(true) : handleCrackCookie}
              disabled={isAnimating}
              style={cookieStyles.action}
            >
              <Text style={cookieStyles.actionLabel}>{isOpened ? 'Share' : '✦ Reveal my fortune'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Existing offscreen 9:16 Story export */}
      <View
        style={styles.offscreenStoryWrapper}
        pointerEvents="none"
      >
        <View
          ref={storyRef}
          collapsable={false}
          style={styles.storyCardCanvas}
        >
          <LinearGradient
            colors={[
              '#0D0714',
              '#1A0B2E',
              '#2D124D',
              '#0D0714',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyCardGradient}
          >
            <View
              style={{
                alignItems: 'center',
                gap: 5,
                marginTop: 12,
              }}
            >
              <View style={styles.storyOraclePill}>
                <Sparkles size={14} color="#EAB308" />
                <T
                  bold
                  size={11}
                  style={{
                    color: '#EAB308',
                    letterSpacing: 2,
                  }}
                >
                  DAILY COSMIC ORACLE
                </T>
              </View>
              <T
                size={10}
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: 1.5,
                }}
              >
                NATALA FORTUNE COOKIE
              </T>
            </View>

            <View style={styles.storyQuotePaper}>
              <View style={styles.storyQuoteInnerBorder}>
                <T
                  size={34}
                  style={{ marginBottom: 12 }}
                >
                  🥠
                </T>
                <T
                  bold
                  size={19}
                  style={{
                    color: '#2D2140',
                    textAlign: 'center',
                    lineHeight: 27,
                    fontStyle: 'italic',
                  }}
                >
                  "{currentFortune}"
                </T>
                <View
                  style={{
                    height: 1.5,
                    width: 60,
                    backgroundColor: '#D97706',
                    marginVertical: 16,
                    opacity: 0.5,
                  }}
                />
                <T
                  bold
                  size={10}
                  style={{
                    color: '#9333EA',
                    letterSpacing: 2,
                  }}
                >
                  ✦ NATALA COSMIC WISDOM ✦
                </T>
              </View>
            </View>

            <View
              style={{
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <T
                bold
                size={12}
                style={{
                  color: '#EAB308',
                  letterSpacing: 1,
                }}
              >
                UNLOCK YOUR DAILY DESTINY
              </T>
              <T
                size={9}
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 1,
                }}
              >
                NATALA ASTROLOGY & COSMIC ATLAS
              </T>
            </View>
          </LinearGradient>
        </View>
      </View>
    </>
  );
}
