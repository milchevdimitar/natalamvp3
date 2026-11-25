export interface StoryData {
  storyId?: string;
  imageUrl?: string;
  authorName?: string;
  createdAt?: string;
}

export interface ReplyToData {
  messageId?: string;
  senderEmail?: string;
  text?: string;
}

export interface Message {
  id: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'story_reply' | 'story_share';
  storyData?: StoryData;
  replyTo?: ReplyToData;
}

export interface Conversation {
  id: string;
  partnerEmail: string;
  partnerName: string;
  partnerId?: string;
  datingMatch?: boolean;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface PendingStory {
  id?: string;
  imageUrl?: string;
  authorName?: string;
  createdAt?: string;
  type?: 'story_reply' | 'story_share';
}
