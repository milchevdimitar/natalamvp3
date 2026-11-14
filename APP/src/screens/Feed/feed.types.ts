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

export interface ReelPlayerProps {
  item: FeedVideoItem;
  isActive: boolean;
  shouldPreload: boolean;
  isMuted: boolean;
  containerHeight: number;
  colors: any;
  onToggleMute: () => void;
  onSkipNext: () => void;
}