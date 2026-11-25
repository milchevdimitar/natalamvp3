import { ProfileAvatar } from '../../components/ProfileAvatar';
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
import { Card, T, Section } from '../../components/UI';
import { Conversation, PendingStory } from './chat.types';
import { styles } from './chat.styles';

interface ConversationsListViewProps {
  colors: any;
  conversations: Conversation[];
  isLoading: boolean;
  header: React.ReactNode;
  pendingStory: PendingStory | null;
  onDismissPendingStory: () => void;
  onSelectConversation: (id: string) => void;
}

export function ConversationsListView({
  colors,
  conversations,
  isLoading,
  header,
  pendingStory,
  onDismissPendingStory,
  onSelectConversation,
}: ConversationsListViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listScrollContent}
    >
      {header}

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
                  <ProfileAvatar name={conv.partnerName} source={conv.partnerAvatar} size={40} />
                  <View style={{ flex: 1 }}>
                    <T bold size={14}>
                      {conv.partnerName}{conv.datingMatch ? ' · Match' : ''}
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
