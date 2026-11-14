import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { SCREEN_HEIGHT } from './feed.constants';
import { FeedVideoItem } from './feed.types';
import { useFeedVideos } from './useFeedVideos';
import { ReelPlayerItem } from './ReelPlayerItem';
import { FeedLoadingState, FeedErrorState, FeedEmptyState } from './FeedStateViews';
import { styles } from './feed.styles';

export default function Feed() {
  const { colors, user } = useApp();
  const flatListRef = useRef<FlatList<FeedVideoItem>>(null);

  const [containerHeight, setContainerHeight] = useState<number>(SCREEN_HEIGHT - 85);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const {
    videos,
    activeIndex,
    setActiveIndex,
    loading,
    refreshing,
    loadingMore,
    errorMsg,
    profileQueryInfo,
    retryFetch,
    handleLoadMore,
    handleRefresh,
  } = useFeedVideos(user);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 5) {
      setContainerHeight(height);
    }
  };

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
    [containerHeight, videos.length, activeIndex, setActiveIndex]
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
  }, [activeIndex, videos.length, setActiveIndex]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  if (loading && videos.length === 0) {
    return (
      <FeedLoadingState
        badges={profileQueryInfo.badges}
        colors={colors}
        onLayout={handleLayout}
      />
    );
  }

  if (errorMsg && videos.length === 0) {
    return (
      <FeedErrorState
        errorMsg={errorMsg}
        colors={colors}
        onRetry={retryFetch}
        onLayout={handleLayout}
      />
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <FeedEmptyState
        colors={colors}
        onRefresh={handleRefresh}
        onLayout={handleLayout}
      />
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