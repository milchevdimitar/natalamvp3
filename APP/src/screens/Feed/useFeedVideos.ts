import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorizedFetch, hasFeature, type AccountState } from '../../services/account';
import { API_BASE_URL } from '../../services/apiBase';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getDashboardSystems } from '../../services/profileDashboard';
import { useSystemActivity } from '../../services/systemActivity';
import type { FeedVideoItem, YouTubeSearchResponse } from './feed.types';
import { buildFeedTopics, decodeHtmlEntities, normalizeFeedText, scoreFeedVideo, type FeedTopic } from './feed.utils';

type TopicPage = FeedTopic & { pageToken?: string };
type RequestMode = 'initial' | 'refresh' | 'more';
const titleKey = (title: string) => normalizeFeedText(title).replace(/\b(?:shorts|fyp|viral)\b/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchTopicPage(topic: TopicPage, signal: AbortSignal) {
  const params = new URLSearchParams({ q: topic.query });
  if (topic.pageToken) params.set('pageToken', topic.pageToken);

  const response = await authorizedFetch(`${API_BASE_URL}/feed/videos?${params.toString()}`, { signal });
  if (!response.ok) throw new Error('YouTube could not load videos. Try again.');
  const data: YouTubeSearchResponse = await response.json();
  const videos: (FeedVideoItem & { score: number })[] = (data.items ?? []).flatMap(({ id, snippet }) => {
    const videoId = id?.videoId;
    if (!videoId || !snippet) return [];
    const score = scoreFeedVideo(topic, snippet.title || '', snippet.description || '');
    if (!score) return [];
    return [{
      score,
      id: videoId,
      videoId,
      title: decodeHtmlEntities(snippet.title || 'YouTube Short'),
      channelTitle: snippet.channelTitle || 'YouTube Creator',
      matchedBadge: topic.badge,
    }];
  });
  return { videos: videos.sort((a, b) => b.score - a.score), next: data.nextPageToken && data.nextPageToken !== topic.pageToken
    ? { ...topic, pageToken: data.nextPageToken } : undefined };
}

export function useFeedVideos(user: (NonNullable<Parameters<typeof getDashboardSystems>[0]> & { email?: string }) | null, account: AccountState | null) {
  const activity = useSystemActivity(user?.email);
  const activityReady = !user?.email || activity !== undefined;
  const topics = useMemo(() => buildFeedTopics(getDashboardSystems(user, activity)
    .filter(({ route }) => hasFeature(account, route))), [user, activity, account]);
  const topicBadges = useMemo(() => topics.map(({ badge }) => badge), [topics]);
  const pending = useRef<TopicPage[]>([]);
  const seen = useRef(new Set<string>());
  const seenTitles = useRef(new Set<string>());
  const recent = useRef<{ id: string; title: string; at: number }[]>([]);
  const historyKey = user?.email ? `natala:feed-recent:${API_BASE_URL}:${user.email.toLowerCase()}` : '';
  const [loadedHistory, setLoadedHistory] = useState<string | null>(null);
  const round = useRef(0);
  const request = useRef<AbortController | null>(null);

  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    recent.current = [];
    round.current = 0;
    const since = Date.now() - 10 * 86400000;
    void (historyKey ? AsyncStorage.getItem(historyKey) : Promise.resolve(null)).then((value) => {
      if (!active || !value) return;
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) recent.current = parsed.filter((item) => item && item.at >= since && typeof item.id === 'string').slice(-250);
    }).catch(() => {}).finally(() => { if (active) setLoadedHistory(historyKey); });
    return () => { active = false; };
  }, [historyKey]);

  useEffect(() => {
    const video = videos[activeIndex];
    if (!historyKey || loadedHistory !== historyKey || !video || refreshing || loading) return;
    const timer = setTimeout(() => {
      const title = titleKey(video.title);
      recent.current = [...recent.current.filter(({ id }) => id !== video.id), { id: video.id, title, at: Date.now() }].slice(-250);
      void AsyncStorage.setItem(historyKey, JSON.stringify(recent.current)).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeIndex, historyKey, loadedHistory, loading, refreshing, videos]);

  const load = useCallback(async (mode: RequestMode) => {
    if (mode === 'more' && (request.current || !pending.current.length)) return;
    if (mode !== 'more') {
      request.current?.abort();
      const start = topics.length ? (Math.floor(Date.now() / 86400000) + round.current++) % topics.length : 0;
      pending.current = [...topics.slice(start), ...topics.slice(0, start)];
      seen.current = new Set(recent.current.map(({ id }) => id));
      seenTitles.current = new Set(recent.current.map(({ title }) => title).filter(Boolean));
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

    if (!topics.length) {
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
      const topicCount = Math.min(pending.current.length * 2, 8);

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
            const title = video && titleKey(video.title);
            if (video && title && !seen.current.has(video.videoId) && !seenTitles.current.has(title)) {
              seen.current.add(video.videoId);
              seenTitles.current.add(title);
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
        } else if (unique.length || mode === 'initial') {
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
    if (!activityReady || loadedHistory !== historyKey) return;
    void load('initial');
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [activityReady, historyKey, loadedHistory, load]);

  return {
    videos, activeIndex, setActiveIndex, loading: !activityReady || loadedHistory !== historyKey || loading, refreshing, loadingMore,
    errorMsg, topicBadges,
    retryFetch: () => { void load('initial'); },
    handleLoadMore: () => { void load('more'); },
    handleRefresh: () => { void load('refresh'); },
  };
}
