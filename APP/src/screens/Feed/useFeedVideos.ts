import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { YOUTUBE_API_KEY, YOUTUBE_SEARCH_URL } from './feed.constants';
import { FeedVideoItem, YouTubeSearchResponse } from './feed.types';
import { buildSearchQueryFromProfile, decodeHtmlEntities } from './feed.utils';

export function useFeedVideos(user: any) {
  const isFetchingMoreRef = useRef<boolean>(false);

  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userZodiac = user?.zodiacSign || user?.natalChart?.sunSign || '';
  const userMbti = user?.personalityType || user?.mbti?.type || '';
  const userInterests = useMemo(
    () => (Array.isArray(user?.interests) ? user.interests : []),
    [user?.interests]
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

  const handleLoadMore = useCallback(() => {
    if (!isFetchingMoreRef.current && !loading && nextPageToken) {
      fetchYouTubeShorts({ pageToken: nextPageToken });
    }
  }, [loading, nextPageToken, fetchYouTubeShorts]);

  const handleRefresh = useCallback(() => {
    fetchYouTubeShorts({ isRefresh: true });
  }, [fetchYouTubeShorts]);

  return {
    videos,
    activeIndex,
    setActiveIndex,
    loading,
    refreshing,
    loadingMore,
    errorMsg,
    profileQueryInfo,
    retryFetch: () => fetchYouTubeShorts(),
    handleLoadMore,
    handleRefresh,
  };
}