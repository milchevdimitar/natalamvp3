import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Pressable,
  Share,
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
  AlertCircle,
  SkipForward,
  ExternalLink,
} from 'lucide-react-native';
import { T } from '../../components/UI';
import { ReelPlayerProps } from './feed.types';
import { buildYouTubeEmbedHtml } from './feed.utils';
import { styles } from './feed.styles';

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

export const ReelPlayerItem = React.memo(function ReelPlayerItem({
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

  useEffect(() => {
    if (!shouldMountWebView) {
      setIsPaused(false);
      setIsFrameReady(false);
    }
  }, [shouldMountWebView]);

  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!shouldMountWebView || isFrameReady) return;
    const fallbackTimer = setTimeout(() => {
      setIsFrameReady(true);
    }, 1600);
    return () => clearTimeout(fallbackTimer);
  }, [shouldMountWebView, isFrameReady]);

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

  const embedHtml = useMemo(
    () => buildYouTubeEmbedHtml(item.videoId, isActive, isMuted),
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

      {!embedBlocked && (
        <Pressable onPress={handleTapScreen} style={styles.tapOverlay}>
          {isPaused && (
            <View style={styles.pauseIndicator}>
              <Play size={38} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </Pressable>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.88)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

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