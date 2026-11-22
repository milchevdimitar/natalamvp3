import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getDashboardSystems } from '../../services/profileDashboard';
import { useSystemActivity } from '../../services/systemActivity';
import { YOUTUBE_API_KEY, YOUTUBE_SEARCH_URL } from './feed.constants';
import type { FeedVideoItem, YouTubeSearchResponse } from './feed.types';
import { buildFeedTopics, decodeHtmlEntities, type FeedTopic } from './feed.utils';

type TopicPage = FeedTopic & { pageToken?: string };
type RequestMode = 'initial' | 'refresh' | 'more';

async function fetchTopicPage(topic: TopicPage, signal: AbortSignal) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoDuration: 'short',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    maxResults: '5',
    q: topic.query,
    key: YOUTUBE_API_KEY,
  });
  if (topic.pageToken) params.set('pageToken', topic.pageToken);

  const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error('YouTube could not load videos. Try again.');
  const data: YouTubeSearchResponse = await response.json();
  const videos: FeedVideoItem[] = (data.items ?? []).flatMap(({ id, snippet }) => {
    const videoId = id?.videoId;
    if (!videoId || !snippet) return [];
    return [{
      id: videoId,
      videoId,
      title: decodeHtmlEntities(snippet.title || 'YouTube Short'),
      channelTitle: snippet.channelTitle || 'YouTube Creator',
      matchedBadge: topic.badge,
    }];
  });
  return { videos, next: data.nextPageToken && data.nextPageToken !== topic.pageToken
    ? { ...topic, pageToken: data.nextPageToken } : undefined };
}

export function useFeedVideos(user: (NonNullable<Parameters<typeof getDashboardSystems>[0]> & { email?: string }) | null) {
  const activity = useSystemActivity(user?.email);
  const activityReady = !user?.email || activity !== undefined;
  const topics = useMemo(() => buildFeedTopics(getDashboardSystems(user, activity)), [user, activity]);
  const topicBadges = useMemo(() => topics.map(({ badge }) => badge), [topics]);
  const pending = useRef<TopicPage[]>([]);
  const seen = useRef(new Set<string>());
  const request = useRef<AbortController | null>(null);

  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async (mode: RequestMode) => {
    if (mode === 'more' && (request.current || !pending.current.length)) return;
    if (mode !== 'more') {
      request.current?.abort();
      pending.current = [...topics];
      seen.current = new Set();
      setErrorMsg(null);
      setLoadingMore(false);
      setRefreshing(mode === 'refresh');
      setLoading(mode === 'initial');
      if (mode === 'initial') {
        setVideos([]);
        setActiveIndex(0);
      }
    } else {
      setLoadingMore(true);
    }

    if (!topics.length || !YOUTUBE_API_KEY) {
      if (topics.length) setErrorMsg('The YouTube API key is missing.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    try {
      const unique: FeedVideoItem[] = [];
      let failures = 0;
      let attempted = 0;
      const topicCount = pending.current.length;

      // Mix two topics at a time and move their next pages behind unsearched topics.
      while (!unique.length && attempted < topicCount && pending.current.length) {
        const batch = pending.current.splice(0, Math.min(2, topicCount - attempted));
        attempted += batch.length;
        const results = await Promise.allSettled(batch.map((topic) => fetchTopicPage(topic, controller.signal)));
        if (controller.signal.aborted) return;
        const rows = results.map((result, index) => {
          if (result.status === 'rejected') {
            failures += 1;
            pending.current.push(batch[index]);
            return [];
          }
          if (result.value.next) pending.current.push(result.value.next);
          return result.value.videos;
        });
        for (let index = 0; index < Math.max(...rows.map((row) => row.length)); index += 1) {
          for (const row of rows) {
            const video = row[index];
            if (video && !seen.current.has(video.videoId)) {
              seen.current.add(video.videoId);
              unique.push(video);
            }
          }
        }
      }

      if (mode === 'more') {
        if (unique.length) setVideos((previous) => [...previous, ...unique]);
      } else {
        if (attempted && failures === attempted) {
          setErrorMsg('YouTube could not load videos. Try again.');
        } else {
          setVideos(unique);
          setActiveIndex(0);
        }
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [topics]);

  useEffect(() => {
    if (!activityReady) return;
    void load('initial');
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [activityReady, load]);

  return {
    videos, activeIndex, setActiveIndex, loading: !activityReady || loading, refreshing, loadingMore,
    errorMsg, topicBadges,
    retryFetch: () => { void load('initial'); },
    handleLoadMore: () => { void load('more'); },
    handleRefresh: () => { void load('refresh'); },
  };
}
