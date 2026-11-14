import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  UserPlus,
  Search,
  MessageSquare,
  X,
} from 'lucide-react-native';
import { Card, T, Section, Pill, Hero } from '../../components/UI';
import { Conversation, PendingStory } from './chat.types';
import { styles } from './chat.styles';

interface ConversationsListViewProps {
  colors: any;
  conversations: Conversation[];
  hasAnyConversations: boolean;
  isLoading: boolean;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  pendingStory: PendingStory | null;
  onDismissPendingStory: () => void;
  onOpenNewChatModal: () => void;
  onSelectConversation: (id: string) => void;
  onBackToExplore: () => void;
}

export function ConversationsListView({
  colors,
  conversations,
  hasAnyConversations,
  isLoading,
  searchQuery,
  onChangeSearchQuery,
  pendingStory,
  onDismissPendingStory,
  onOpenNewChatModal,
  onSelectConversation,
  onBackToExplore,
}: ConversationsListViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listScrollContent}
    >
      <TouchableOpacity onPress={onBackToExplore} style={styles.listBackBtn}>
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="COSMIC MESSAGES"
        first="Your"
        accent="Conversations."
        description="Connect with friends and astrological soulmates by email."
      />

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

      <Card style={styles.newChatCard}>
        <TouchableOpacity onPress={onOpenNewChatModal} style={styles.newChatRow}>
          <View style={styles.newChatLeft}>
            <View
              style={[
                styles.newChatIconCircle,
                { backgroundColor: colors.purpleSoft },
              ]}
            >
              <UserPlus size={20} color={colors.purple} />
            </View>
            <View>
              <T bold size={14}>
                Start New Chat
              </T>
              <T muted size={11}>
                Add a user by their email address
              </T>
            </View>
          </View>
          <Pill selected onPress={onOpenNewChatModal}>
            + Email
          </Pill>
        </TouchableOpacity>
      </Card>

      {hasAnyConversations && (
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt }]}>
          <Search size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            placeholder="Search chat or email..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
          />
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
              Tap "+ Email" above to start a conversation by email.
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