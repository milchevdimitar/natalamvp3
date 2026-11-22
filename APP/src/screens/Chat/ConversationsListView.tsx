import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  MessageSquare,
  X,
} from 'lucide-react-native';
import { Card, T, Section, Hero, SearchBar } from '../../components/UI';
import { Conversation, PendingStory } from './chat.types';
import { styles } from './chat.styles';

interface ConversationsListViewProps {
  colors: any;
  conversations: Conversation[];
  isLoading: boolean;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  pendingStory: PendingStory | null;
  onDismissPendingStory: () => void;
  onSelectConversation: (id: string) => void;
}

export function ConversationsListView({
  colors,
  conversations,
  isLoading,
  searchQuery,
  onChangeSearchQuery,
  pendingStory,
  onDismissPendingStory,
  onSelectConversation,
}: ConversationsListViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listScrollContent}
    >
      <Hero
        eyebrow="COSMIC MESSAGES"
        first="Your"
        accent="Conversations."
        description="Connect with friends and astrological soulmates by email."
      />

      <SearchBar value={searchQuery} onChange={onChangeSearchQuery} placeholder="Search chat" />

      {pendingStory && (
        <View
          style={[
            styles.listStoryBanner,
            { backgroundColor: colors.purpleSoft, borderColor: colors.purple },
          ]}
        >
          <Image
            source={{ uri: pendingStory.imageUrl }}
            style={styles.pendingStoryThumb}
          />
          <View style={{ flex: 1 }}>
            <T bold size={13} style={{ color: colors.purple }}>
              Select a conversation to share story
            </T>
            <T muted size={11}>
              Story by @{pendingStory.authorName || 'Stargazer'}
            </T>
          </View>
          <TouchableOpacity onPress={onDismissPendingStory}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <Section>Active Conversations</Section>
      <View style={styles.conversationsList}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.purple}
            style={{ marginVertical: 20 }}
          />
        ) : conversations.length === 0 ? (
          <Card style={styles.emptyListCard}>
            <MessageSquare size={32} color={colors.muted} />
            <T bold size={14}>
              No conversations found
            </T>
            <T muted size={12} style={{ textAlign: 'center' }}>
              Start a conversation from a connection in People.
            </T>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Card key={conv.id}>
              <TouchableOpacity
                onPress={() => onSelectConversation(conv.id)}
                style={styles.conversationRow}
              >
                <View style={styles.conversationLeft}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: colors.goldSoft },
                    ]}
                  >
                    <T bold size={16} style={{ color: colors.gold }}>
                      {conv.partnerName.charAt(0)}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T bold size={14}>
                      {conv.partnerName}
                    </T>
                    <T muted size={12} numberOfLines={1}>
                      {conv.lastMessage}
                    </T>
                  </View>
                </View>
                <T muted size={10}>
                  {conv.lastMessageTime}
                </T>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
