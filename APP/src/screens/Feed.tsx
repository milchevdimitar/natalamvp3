import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Share,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  SkipForward,
  ExternalLink,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { T } from '../components/UI';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const FALLBACK_TAGS = ['astrology', 'tarot', 'numerology', 'mindfulness'];

const ZODIAC_BG_MAP: Record<string, string> = {
  aries: 'Овен',
  taurus: 'Телец',
  gemini: 'Близнаци',
  cancer: 'Рак',
  leo: 'Лъв',
  virgo: 'Дева',
  libra: 'Везни',
  scorpio: 'Скорпион',
  sagittarius: 'Стрелец',
  capricorn: 'Козирог',
  aquarius: 'Водолей',
  pisces: 'Риби',
};

// ---------------------------------------------------------------------------
// ✦ TYPESCRIPT ИНТЕРФЕЙСИ ЗА YOUTUBE DATA API V3 & FEED
// ---------------------------------------------------------------------------
export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
  };
  channelTitle: string;
  liveBroadcastContent: string;
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: YouTubeSnippet;
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface FeedVideoItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  matchedBadge: string;
}

export interface UserProfileInput {
  zodiacSign?: string;
  personalityType?: string;
  interests?: string[];
  natalChart?: {
    sunSign?: string;
  };
  mbti?: {
    type?: string;
  };
}

export interface ProfileQueryResult {
  query: string;
  badges: string[];
}

// ---------------------------------------------------------------------------
// ✦ ПОМОЩНИ ФУНКЦИИ ЗА ПРОФИЛНИ ТАГОВЕ И ПОЧИСТВАНЕ НА ТЕКСТ
// ---------------------------------------------------------------------------
export function buildSearchQueryFromProfile(userProfile?: UserProfileInput | null): ProfileQueryResult {
  const keywords: string[] = [];
  const badges: string[] = [];

  const rawZodiac = userProfile?.zodiacSign || userProfile?.natalChart?.sunSign;
  const rawMbti = userProfile?.personalityType || userProfile?.mbti?.type;
  const interests = Array.isArray(userProfile?.interests) ? userProfile.interests : [];

  if (rawZodiac && rawZodiac.trim()) {
    const cleanZodiac = rawZodiac.trim();
    const bgZodiac = ZODIAC_BG_MAP[cleanZodiac.toLowerCase()] || cleanZodiac;
    keywords.push(`${cleanZodiac} zodiac`);
    badges.push(`✨ ${bgZodiac}`);
  }

  if (rawMbti && rawMbti.trim()) {
    const cleanMbti = rawMbti.trim().toUpperCase();
    keywords.push(`${cleanMbti} personality`);
    badges.push(`🧠 ${cleanMbti}`);
  }

  if (interests.length > 0) {
    const topInterests = interests.slice(0, 2).map((i) => i.trim()).filter(Boolean);
    keywords.push(...topInterests);
    topInterests.forEach((interest) => badges.push(`🔮 ${interest}`));
  }

  if (keywords.length === 0) {
    const randomFallback = FALLBACK_TAGS.slice(0, 2).join(' ');
    return {
      query: `${randomFallback} #shorts`,
      badges: ['🌌 Астрология', '🔮 Таро'],
    };
  }

  return {
    query: `${keywords.join(' ')} #shorts`,
    badges,
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// ---------------------------------------------------------------------------
// ✦ HD ОБЛОЖКА С АВТОМАТИЧЕН FALLBACK (1280x720 -> 640x480 -> 480x360)
// ---------------------------------------------------------------------------
function HighResPoster({ videoId }: { videoId: string }) {
  const [qualityStep, setQualityStep] = useState<number>(0);

  const urls = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  return (
    <Image
      source={{ uri: urls[qualityStep] || urls[2] }}
      style={styles.posterImage}
      resizeMode="cover"
      onError={() => {
        if (qualityStep < urls.length - 1) {
          setQualityStep((prev) => prev + 1);
        }
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// ✦ КОМПОНЕНТ ЗА ЕДИНИЧЕН YOUTUBE SHORTS ВИДЕО ЕЛЕМЕНТ С PRE-BUFFERING
// ---------------------------------------------------------------------------
interface ReelPlayerProps {
  item: FeedVideoItem;
  isActive: boolean;
  shouldPreload: boolean;
  isMuted: boolean;
  containerHeight: number;
  colors: any;
  onToggleMute: () => void;
  onSkipNext: () => void;
}

const ReelPlayerItem = React.memo(function ReelPlayerItem({
  item,
  isActive,
  shouldPreload,
  isMuted,
  containerHeight,
  colors,
  onToggleMute,
  onSkipNext,
}: ReelPlayerProps) {
  const webViewRef = useRef<WebView>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  const shouldMountWebView = (isActive || shouldPreload) && !embedBlocked;

  // Изчистване на състоянието при излизане извън прозореца за предварително зареждане
  useEffect(() => {
    if (!shouldMountWebView) {
      setIsPaused(false);
      setIsFrameReady(false);
    }
  }, [shouldMountWebView]);

  // При напускане на активния слайд нулираме локалната пауза
  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  // Резервен таймер за показване на плейъра, ако събитието за готов кадър закъснее
  useEffect(() => {
    if (!shouldMountWebView || isFrameReady) return;
    const fallbackTimer = setTimeout(() => {
      setIsFrameReady(true);
    }, 1600);
    return () => clearTimeout(fallbackTimer);
  }, [shouldMountWebView, isFrameReady]);

  // Синхронизация на Play / Pause / Mute / Active състоянието в реално време без презареждане
  useEffect(() => {
    if (!shouldMountWebView) return;
    webViewRef.current?.injectJavaScript(`
      if (typeof window.syncPlayerState === 'function') {
        window.syncPlayerState(${isActive}, ${isPaused}, ${isMuted});
      }
      true;
    `);
  }, [shouldMountWebView, isActive, isPaused, isMuted]);

  const handleTapScreen = () => {
    if (!embedBlocked) {
      setIsPaused((prev) => !prev);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title} — https://www.youtube.com/shorts/${item.videoId}`,
      });
    } catch {
      // Игнориране при отказ от споделяне
    }
  };

  const handleOpenExternal = () => {
    Linking.openURL(`https://www.youtube.com/shorts/${item.videoId}`);
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'frame_ready') {
        setIsFrameReady(true);
      } else if (data.type === 'error') {
        setEmbedBlocked(true);
      }
    } catch {
      // Игнориране на невалидни съобщения
    }
  };

  // HTML шаблонът не зависи от isActive/isMuted, за да не презарежда WebView при скрол
  const embedHtml = useMemo(
    () => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta name="referrer" content="strict-origin-when-cross-origin">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background-color: #000000;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
              background: transparent;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <iframe
            id="ytplayer"
            src="https://www.youtube.com/embed/${item.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${item.videoId}&playsinline=1&iv_load_policy=3&fs=0&enablejsapi=1&origin=https://natala.app"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
          <script>
            var iframe = document.getElementById('ytplayer');
            var state = {
              active: ${isActive ? 'true' : 'false'},
              paused: false,
              muted: ${isMuted ? 'true' : 'false'},
              firstFrameBuffered: false
            };

            function postCmd(func, args) {
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({
                  event: 'command',
                  func: func,
                  args: args || []
                }), '*');
              }
            }

            function sendHandshake() {
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({
                  event: 'listening',
                  id: 1,
                  channel: 'widget'
                }), '*');
              }
            }

            window.syncPlayerState = function(active, paused, muted) {
              var wasActive = state.active;
              state.active = active;
              state.paused = paused;
              state.muted = muted;

              if (!active) {
                postCmd('mute');
                postCmd('pauseVideo');
                if (wasActive && state.firstFrameBuffered) {
                  postCmd('seekTo', [0, true]);
                }
                return;
              }

              if (paused) {
                postCmd('pauseVideo');
              } else {
                postCmd(muted ? 'mute' : 'unMute');
                postCmd('playVideo');
              }
            };

            iframe.addEventListener('load', function() {
              sendHandshake();
              setTimeout(sendHandshake, 150);
              setTimeout(sendHandshake, 450);
            });

            window.addEventListener('message', function(event) {
              if (!event.data || typeof event.data !== 'string') return;
              try {
                var parsed = JSON.parse(event.data);
                var playerState = parsed.info && typeof parsed.info.playerState === 'number'
                  ? parsed.info.playerState
                  : (parsed.event === 'onStateChange' ? parsed.info : null);

                if (playerState === 1 && !state.firstFrameBuffered) {
                  state.firstFrameBuffered = true;

                  if (!state.active) {
                    // Задържаме видеото на кадър 0 в готовност за мигновен старт при скрол
                    postCmd('mute');
                    postCmd('pauseVideo');
                    postCmd('seekTo', [0, true]);
                  } else {
                    if (state.paused) {
                      postCmd('pauseVideo');
                    } else if (!state.muted) {
                      postCmd('unMute');
                    }
                  }

                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'frame_ready' }));
                  }
                }

                if (parsed.event === 'onError' && window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: parsed.info }));
                }
              } catch (e) {}
            });
          </script>
        </body>
      </html>
    `,
    [item.videoId]
  );

  return (
    <View style={[styles.reelContainer, { height: containerHeight }]}>
      {shouldMountWebView && (
        <WebView
          ref={webViewRef}
          style={styles.webView}
          originWhitelist={['*']}
          source={{
            html: embedHtml,
            baseUrl: 'https://natala.app',
          }}
          scrollEnabled={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          setSupportMultipleWindows={false}
          androidLayerType="hardware"
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          mixedContentMode="always"
          onLoadEnd={() => {
            webViewRef.current?.injectJavaScript(`
              if (typeof window.syncPlayerState === 'function') {
                window.syncPlayerState(${isActive}, ${isPaused}, ${isMuted});
              }
              true;
            `);
          }}
          onMessage={handleWebViewMessage}
        />
      )}

      {/* Обложката се показва само преди първият кадър на видеото да е буфериран */}
      {(!shouldMountWebView || !isFrameReady || embedBlocked) && (
        <View style={styles.posterOverlay} pointerEvents={embedBlocked ? 'auto' : 'none'}>
          <HighResPoster videoId={item.videoId} />
          {embedBlocked && (
            <View style={styles.posterDimmer}>
              <View style={styles.blockedCard}>
                <AlertCircle size={30} color={colors.gold} />
                <T bold size={14} style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 8 }}>
                  Вграждането е ограничено от автора
                </T>
                <T muted size={12} style={{ textAlign: 'center', marginTop: 4 }}>
                  Плъзни надолу за следващото видео или го отвори директно.
                </T>
                <View style={styles.blockedActionsRow}>
                  <TouchableOpacity
                    onPress={onSkipNext}
                    style={[styles.blockedBtn, { backgroundColor: colors.purple }]}
                  >
                    <SkipForward size={15} color="#FFFFFF" />
                    <T bold size={12} style={{ color: '#FFFFFF' }}>
                      Следващо
                    </T>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleOpenExternal}
                    style={[styles.blockedBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                  >
                    <ExternalLink size={15} color="#FFFFFF" />
                    <T bold size={12} style={{ color: '#FFFFFF' }}>
                      YouTube
                    </T>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Сензорен слой за Tap -> Play / Pause */}
      {!embedBlocked && (
        <Pressable onPress={handleTapScreen} style={styles.tapOverlay}>
          {isPaused && (
            <View style={styles.pauseIndicator}>
              <Play size={38} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </Pressable>
      )}

      {/* Долен полупрозрачен градиент */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.88)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Странични бутони (Like, Share, Mute/Unmute) */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          onPress={() => setIsLiked((prev) => !prev)}
          activeOpacity={0.8}
          style={styles.controlButton}
        >
          <View style={styles.iconCircle}>
            <Heart
              size={24}
              color={isLiked ? '#FF3B30' : '#FFFFFF'}
              fill={isLiked ? '#FF3B30' : 'transparent'}
            />
          </View>
          <T bold size={11} style={styles.controlLabel}>
            {isLiked ? 'Харесано' : 'Харесай'}
          </T>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={styles.controlButton}
        >
          <View style={styles.iconCircle}>
            <Share2 size={22} color="#FFFFFF" />
          </View>
          <T bold size={11} style={styles.controlLabel}>
            Сподели
          </T>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleMute}
          activeOpacity={0.8}
          style={styles.controlButton}
        >
          <View style={[styles.iconCircle, isMuted && styles.mutedCircle]}>
            {isMuted ? (
              <VolumeX size={22} color="#FF6B6B" />
            ) : (
              <Volume2 size={22} color="#FFFFFF" />
            )}
          </View>
          <T bold size={11} style={styles.controlLabel}>
            {isMuted ? 'Без звук' : 'Звук'}
          </T>
        </TouchableOpacity>
      </View>

      {/* Долна информационна секция (Таг от профила, канал, заглавие) */}
      <View style={styles.bottomInfoContainer} pointerEvents="box-none">
        <View style={[styles.profileTagBadge, { borderColor: colors.gold }]}>
          <Sparkles size={12} color={colors.gold} />
          <T bold size={11} style={{ color: colors.gold }}>
            {item.matchedBadge}
          </T>
        </View>

        <T bold size={14} style={styles.channelTitle}>
          @{item.channelTitle}
        </T>

        <T size={13} numberOfLines={2} style={styles.videoTitle}>
          {item.title}
        </T>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// ✦ ГЛАВЕН FEED КОМПОНЕНТ
// ---------------------------------------------------------------------------
export default function Feed() {
  const { colors, user } = useApp();

  const flatListRef = useRef<FlatList<FeedVideoItem>>(null);
  const isFetchingMoreRef = useRef<boolean>(false);

  const [containerHeight, setContainerHeight] = useState<number>(SCREEN_HEIGHT - 85);
  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userZodiac = (user as any)?.zodiacSign || user?.natalChart?.sunSign || '';
  const userMbti = (user as any)?.personalityType || user?.mbti?.type || '';
  const userInterests = useMemo(
    () => (Array.isArray((user as any)?.interests) ? (user as any).interests : []),
    [(user as any)?.interests]
  );

  const profileQueryInfo = useMemo(
    () =>
      buildSearchQueryFromProfile({
        zodiacSign: userZodiac,
        personalityType: userMbti,
        interests: userInterests,
      }),
    [userZodiac, userMbti, userInterests]
  );

  const fetchYouTubeShorts = useCallback(
    async (options?: { pageToken?: string; isRefresh?: boolean }) => {
      const { pageToken, isRefresh = false } = options || {};

      if (!YOUTUBE_API_KEY) {
        setErrorMsg('Липсва EXPO_PUBLIC_YOUTUBE_API_KEY в .env файла.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (pageToken) {
        if (isFetchingMoreRef.current) return;
        isFetchingMoreRef.current = true;
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const params = new URLSearchParams({
          part: 'snippet',
          type: 'video',
          videoDuration: 'short',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          maxResults: '10',
          q: profileQueryInfo.query,
          key: YOUTUBE_API_KEY,
        });

        if (pageToken) {
          params.append('pageToken', pageToken);
        }

        const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
        const data: YouTubeSearchResponse = await response.json();

        if (!response.ok) {
          const apiErr = (data as any)?.error?.message || 'Грешка при заявка към YouTube API.';
          throw new Error(apiErr);
        }

        const badgesList = profileQueryInfo.badges;

        const mappedItems: FeedVideoItem[] = (data.items || [])
          .filter((item) => Boolean(item.id?.videoId))
          .map((item, idx) => {
            const videoId = item.id.videoId!;
            const badge = badgesList[idx % badgesList.length] || '✨ За теб';

            return {
              id: `${videoId}_${idx}_${Date.now()}`,
              videoId,
              title: decodeHtmlEntities(item.snippet.title || 'YouTube Short'),
              channelTitle: item.snippet.channelTitle || 'YouTube Creator',
              matchedBadge: badge,
            };
          });

        setNextPageToken(data.nextPageToken);

        if (pageToken) {
          setVideos((prev) => {
            const existingVideoIds = new Set(prev.map((v) => v.videoId));
            const uniqueNew = mappedItems.filter((v) => !existingVideoIds.has(v.videoId));
            return [...prev, ...uniqueNew];
          });
        } else {
          setVideos(mappedItems);
          setActiveIndex(0);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Неуспешно зареждане на видеа от YouTube.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        isFetchingMoreRef.current = false;
      }
    },
    [profileQueryInfo]
  );

  useEffect(() => {
    fetchYouTubeShorts();
  }, [fetchYouTubeShorts]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 5) {
      setContainerHeight(height);
    }
  };

  // Мигновено превключване веднага щом слайдът премине 50% от екрана при плъзване
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (containerHeight <= 0) return;
      const candidateIndex = Math.round(offsetY / containerHeight);
      if (
        candidateIndex >= 0 &&
        candidateIndex < videos.length &&
        candidateIndex !== activeIndex
      ) {
        setActiveIndex(candidateIndex);
      }
    },
    [containerHeight, videos.length, activeIndex]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<FeedVideoItem> | null | undefined, index: number) => ({
      length: containerHeight,
      offset: containerHeight * index,
      index,
    }),
    [containerHeight]
  );

  const handleSkipNext = useCallback(() => {
    const nextIdx = activeIndex + 1;
    if (nextIdx < videos.length) {
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      setActiveIndex(nextIdx);
    }
  }, [activeIndex, videos.length]);

  const handleLoadMore = () => {
    if (!isFetchingMoreRef.current && !loading && nextPageToken) {
      fetchYouTubeShorts({ pageToken: nextPageToken });
    }
  };

  const handleRefresh = () => {
    fetchYouTubeShorts({ isRefresh: true });
  };

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  if (loading && videos.length === 0) {
    return (
      <View style={styles.centerStateContainer} onLayout={handleLayout}>
        <ActivityIndicator size="large" color={colors.purple} />
        <T bold size={14} style={{ color: '#FFFFFF', marginTop: 12 }}>
          Подбираме видеа за теб...
        </T>
        <T muted size={12} style={{ marginTop: 4 }}>
          {profileQueryInfo.badges.join('  ·  ')}
        </T>
      </View>
    );
  }

  if (errorMsg && videos.length === 0) {
    return (
      <View style={styles.centerStateContainer} onLayout={handleLayout}>
        <AlertCircle size={40} color="#FF6B6B" />
        <T bold size={15} style={{ color: '#FFFFFF', marginTop: 12, textAlign: 'center' }}>
          Възникна проблем при зареждането
        </T>
        <T muted size={12} style={{ textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
          {errorMsg}
        </T>
        <TouchableOpacity
          onPress={() => fetchYouTubeShorts()}
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

  if (!loading && videos.length === 0) {
    return (
      <View style={styles.centerStateContainer} onLayout={handleLayout}>
        <Sparkles size={38} color={colors.gold} />
        <T bold size={15} style={{ color: '#FFFFFF', marginTop: 12 }}>
          Няма намерени видеа
        </T>
        <T muted size={12} style={{ textAlign: 'center', marginTop: 6, maxWidth: 260 }}>
          Не открихме YouTube Shorts за текущите критерии от профила ти.
        </T>
        <TouchableOpacity
          onPress={handleRefresh}
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

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelPlayerItem
            item={item}
            isActive={index === activeIndex}
            shouldPreload={Math.abs(index - activeIndex) === 1}
            isMuted={isMuted}
            containerHeight={containerHeight}
            colors={colors}
            onToggleMute={toggleMute}
            onSkipNext={handleSkipNext}
          />
        )}
        getItemLayout={getItemLayout}
        pagingEnabled
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={containerHeight}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.purple}
            colors={[colors.purple]}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : null
        }
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerStateContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    backgroundColor: '#000000',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  blockedCard: {
    backgroundColor: 'rgba(18, 14, 34, 0.92)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blockedActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  blockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIndicator: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    zIndex: 15,
  },
  rightControls: {
    position: 'absolute',
    right: 14,
    bottom: 105,
    zIndex: 25,
    alignItems: 'center',
    gap: 18,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 18, 30, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  mutedCircle: {
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  controlLabel: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfoContainer: {
    position: 'absolute',
    left: 16,
    right: 78,
    bottom: 98,
    zIndex: 25,
    gap: 6,
  },
  profileTagBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18, 14, 34, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  channelTitle: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  videoTitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});