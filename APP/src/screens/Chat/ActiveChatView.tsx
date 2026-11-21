import React, { useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ArrowLeft, Send, X, Sparkles } from 'lucide-react-native';
import { T } from '../../components/UI';
import { Conversation, Message, PendingStory } from './chat.types';
import { MessageBubble } from './MessageBubble';
import { styles } from './chat.styles';

interface ActiveChatViewProps {
  conversation: Conversation;
  currentUserEmail: string;
  colors: any;
  messageInput: string;
  onChangeMessageInput: (text: string) => void;
  isSending: boolean;
  pendingStory: PendingStory | null;
  onClearPendingStory: () => void;
  replyingToMessage: Message | null;
  onSelectReplyMessage: (msg: Message | null) => void;
  onSendMessage: () => void;
  onBack: () => void;
}

export function ActiveChatView({
  conversation,
  currentUserEmail,
  colors,
  messageInput,
  onChangeMessageInput,
  isSending,
  pendingStory,
  onClearPendingStory,
  replyingToMessage,
  onSelectReplyMessage,
  onSendMessage,
  onBack,
}: ActiveChatViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [conversation.id, conversation.messages.length]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      {/* Хедър */}
      <View style={[styles.activeHeader, { borderBottomColor: colors.line }]}>
        <TouchableOpacity onPress={onBack} style={styles.backAction}>
          <ArrowLeft size={20} color={colors.purple} />
          <T bold size={14} style={{ color: colors.purple }}>
            Back
          </T>
        </TouchableOpacity>

        <View style={styles.partnerInfoAlign}>
          <T bold size={15}>
            {conversation.partnerName}
          </T>
          <T muted size={11}>
            {conversation.partnerEmail}
          </T>
        </View>
      </View>

      {/* Списък със съобщения */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.messagesScrollContent}
      >
        {conversation.messages.length === 0 ? (
          <View style={styles.emptyChatState}>
            <Sparkles size={32} color={colors.gold} />
            <T muted size={13} style={{ textAlign: 'center' }}>
              Start your cosmic conversation with {conversation.partnerName}!
            </T>
          </View>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserEmail={currentUserEmail}
              colors={colors}
              onReply={onSelectReplyMessage}
            />
          ))
        )}
      </ScrollView>

      {/* Преглед на прикачено стори */}
      {pendingStory?.imageUrl && (
        <View
          style={[
            styles.pendingStoryBar,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.purple },
          ]}
        >
          <Image
            source={{ uri: pendingStory.imageUrl }}
            style={styles.pendingStoryThumb}
          />
          <View style={{ flex: 1 }}>
            <T bold size={12} style={{ color: colors.gold }}>
              {pendingStory.type === 'story_reply' ? 'Reply to story' : 'Sharing story'}
            </T>
            <T muted size={11} numberOfLines={1}>
              {pendingStory.authorName ? `by @${pendingStory.authorName}` : 'Story preview'}
            </T>
          </View>
          <TouchableOpacity onPress={onClearPendingStory}>
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Преглед на цитирано съобщение */}
      {replyingToMessage && (
        <View
          style={[
            styles.replyingBar,
            { backgroundColor: colors.surfaceAlt, borderLeftColor: colors.purple },
          ]}
        >
          <View style={{ flex: 1 }}>
            <T bold size={11} style={{ color: colors.purple }}>
              Replying to{' '}
              {replyingToMessage.senderEmail === currentUserEmail
                ? 'yourself'
                : replyingToMessage.senderEmail}
            </T>
            <T muted size={12} numberOfLines={1}>
              {replyingToMessage.text}
            </T>
          </View>
          <TouchableOpacity onPress={() => onSelectReplyMessage(null)}>
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Поле за въвеждане */}
      <View
        style={[
          styles.inputBarContainer,
          { borderTopColor: colors.line, backgroundColor: colors.bg },
        ]}
      >
        <TextInput
          value={messageInput}
          onChangeText={onChangeMessageInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.muted}
          style={[
            styles.textInput,
            { backgroundColor: colors.surfaceAlt, color: colors.text },
          ]}
        />
        <TouchableOpacity
          onPress={onSendMessage}
          disabled={isSending}
          style={[styles.sendButton, { backgroundColor: colors.action }]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
