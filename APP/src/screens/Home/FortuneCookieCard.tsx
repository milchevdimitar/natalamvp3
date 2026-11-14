
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  PlusCircle,
  CheckCircle,
} from 'lucide-react-native';
import { Card, T, Pill } from '../../components/UI';
import { DAILY_FORTUNES } from './home.constants';
import { styles } from './home.styles';

interface FortuneCookieCardProps {
  colors: any;
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
  halo: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: '#9C5DE0',
    opacity: 0.12,
  },
  haloInner: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(233,189,112,0.24)',
  },
  cookieWrapper: {
    width: 230,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookieShadow: {
    position: 'absolute',
    bottom: 15,
    width: 148,
    height: 18,
    borderRadius: 100,
    backgroundColor: '#000',
    opacity: 0.22,
    transform: [{ scaleX: 1.15 }],
  },
  shell: {
    position: 'absolute',
    width: 105,
    height: 92,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F7C879',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  shellGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastedEdge: {
    position: 'absolute',
    width: 82,
    height: 70,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: 'rgba(118,54,17,0.45)',
    top: 12,
  },
  highlight: {
    position: 'absolute',
    width: 44,
    height: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(255,242,192,0.52)',
    top: 13,
    left: 20,
    transform: [{ rotate: '-18deg' }],
  },
  fold: {
    position: 'absolute',
    width: 78,
    height: 48,
    borderRadius: 35,
    backgroundColor: '#713A1B',
    borderWidth: 5,
    borderColor: '#D68A40',
    top: 47,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: 0.82 }],
  },
  foldInside: {
    width: 54,
    height: 27,
    borderRadius: 20,
    backgroundColor: '#351A13',
    borderTopWidth: 3,
    borderTopColor: '#8D4B25',
  },
  seam: {
    position: 'absolute',
    width: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#8E4B21',
    top: 50,
  },
  paper: {
    position: 'absolute',
    width: 202,
    minHeight: 112,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD,
    zIndex: 20,
    elevation: 12,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  paperInner: {
    margin: 5,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(173,115,48,0.42)',
    borderRadius: 8,
    alignItems: 'center',
  },
  paperQuote: {
    color: '#38233F',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  sparkle: {
    position: 'absolute',
    color: GOLD,
    fontSize: 16,
  },
});

function CookieShell({
  side,
}: {
  side: 'left' | 'right';
}) {
  const left = side === 'left';

  return (
    <View
      style={[
        cookieStyles.shell,
        {
          left: left ? 18 : undefined,
          right: left ? undefined : 18,
          transform: [
            { rotate: left ? '-25deg' : '25deg' },
            { scaleX: left ? 1 : -1 },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[
          '#FFE3A0',
          '#EFB96B',
          '#CE8136',
          '#9C5425',
          '#6D341A',
        ]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={cookieStyles.shellGradient}
      >
        <View style={cookieStyles.toastedEdge} />
        <View style={cookieStyles.highlight} />
        <View style={cookieStyles.fold}>
          <View style={cookieStyles.foldInside} />
        </View>
        <View
          style={[
            cookieStyles.seam,
            { right: left ? 4 : undefined },
          ]}
        />
      </LinearGradient>
    </View>
  );
}

export function FortuneCookieCard({
  colors,
  addStory,
  onOpenConfetti,
}: FortuneCookieCardProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [hasPostedToStory, setHasPostedToStory] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState(0);

  const storyRef = useRef<View>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const split = useRef(new Animated.Value(0)).current;
  const paper = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const currentFortune = DAILY_FORTUNES[fortuneIndex];

  const handleCrackCookie = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setHasPostedToStory(false);

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
        Animated.timing(glow, {
          toValue: 0,
          duration: 300,
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
      ]),
      Animated.parallel([
        Animated.spring(split, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(paper, {
          toValue: 1,
          duration: 600,
          delay: 120,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      setIsAnimating(false);
      if (!finished) return;
      setIsOpened(true);
      onOpenConfetti();
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

  const leftX = split.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const rightX = split.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const leftRotate = split.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-35deg'],
  });

  const rightRotate = split.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '35deg'],
  });

  const paperY = paper.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -68],
  });

  const paperScale = paper.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const haloScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.25],
  });

  return (
    <>
      <Card style={styles.cookieMainCard}>
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
              ? 'Your Daily Fortune'
              : 'Cosmic Fortune Cookie'}
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
          activeOpacity={0.9}
          disabled={isAnimating}
          onPress={handleCrackCookie}
          style={cookieStyles.stage}
        >
          <Animated.View
            style={[
              cookieStyles.halo,
              {
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <View style={cookieStyles.haloInner} />

          <Text
            style={[
              cookieStyles.sparkle,
              { top: 24, left: '18%' },
            ]}
          >
            ✦
          </Text>
          <Text
            style={[
              cookieStyles.sparkle,
              { top: 44, right: '17%', fontSize: 12 },
            ]}
          >
            ✧
          </Text>
          <Text
            style={[
              cookieStyles.sparkle,
              { bottom: 30, right: '25%', fontSize: 10 },
            ]}
          >
            ✦
          </Text>

          <Animated.View
            style={[
              cookieStyles.cookieWrapper,
              { transform: [{ rotate }] },
            ]}
          >
            <View style={cookieStyles.cookieShadow} />

            <Animated.View
              style={{
                position: 'absolute',
                width: 150,
                height: 110,
                zIndex: 1,
                transform: [
                  { translateX: leftX },
                  { rotate: leftRotate },
                ],
              }}
            >
              <CookieShell side="left" />
            </Animated.View>

            <Animated.View
              style={{
                position: 'absolute',
                width: 150,
                height: 110,
                zIndex: 2,
                transform: [
                  { translateX: rightX },
                  { rotate: rightRotate },
                ],
              }}
            >
              <CookieShell side="right" />
            </Animated.View>

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
                style={{ padding: 2 }}
              >
                <View style={cookieStyles.paperInner}>
                  <Sparkles
                    size={15}
                    color="#B88436"
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={cookieStyles.paperQuote}>
                    “{currentFortune}”
                  </Text>
                  <Text
                    style={{
                      color: '#99662E',
                      fontSize: 9,
                      marginTop: 8,
                      letterSpacing: 1.2,
                    }}
                  >
                    ✦ NATALA ✦
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>

        <View
          style={{
            width: '100%',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
          }}
        >
          <Pill
            selected={isOpened}
            disabled={isAnimating}
            onPress={handleCrackCookie}
          >
            {isOpened
              ? '✦ Crack Another Fortune Cookie'
              : '✦ Reveal My Fortune'}
          </Pill>

          {isOpened && (
            <TouchableOpacity
              onPress={handlePostToStory}
              disabled={
                isPostingStory || hasPostedToStory
              }
              style={[
                styles.storyActionButton,
                hasPostedToStory && { opacity: 0.75 },
              ]}
            >
              {isPostingStory ? (
                <ActivityIndicator
                  size="small"
                  color={colors.gold}
                />
              ) : hasPostedToStory ? (
                <>
                  <CheckCircle
                    size={15}
                    color={colors.gold}
                  />
                  <T
                    bold
                    size={12}
                    style={{ color: colors.gold }}
                  >
                    Posted to Story ✓
                  </T>
                </>
              ) : (
                <>
                  <PlusCircle
                    size={15}
                    color={colors.gold}
                  />
                  <T
                    bold
                    size={12}
                    style={{ color: colors.gold }}
                  >
                    ✦ Add to Story
                  </T>
                </>
              )}
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
