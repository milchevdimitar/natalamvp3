import { StarField } from '../../components/StarField';
import { useLocalBack } from '../../components/NavigationBack';
import { BackButton } from '../../components/BackButton';
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
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Forward, Info, Plus, Send, Smile, X, Sparkles } from 'lucide-react-native';
import { Card, Pill, T } from '../../components/UI';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import type { AppStory } from '../../context/AppContext';
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
  onOpenPartner?: () => void;
  destinations: Conversation[];
  onForward: (message: Message, destination: Conversation) => Promise<void>;
  ownStories: AppStory[];
  onAttachStory: (story: PendingStory) => void;
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
  onOpenPartner,
  destinations,
  onForward,
  ownStories,
  onAttachStory,
}: ActiveChatViewProps) {
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [panel, setPanel] = React.useState<'info' | 'attach' | 'emoji' | null>(null);
  const [forwarding, setForwarding] = React.useState<Message | null>(null);
  const [sendingForward, setSendingForward] = React.useState(false);
  const [forwardNotice, setForwardNotice] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const back = () => {
    if (sendingForward) return;
    if (panel || forwarding) {
      setPanel(null);
      setForwarding(null);
    } else onBack();
  };
  useLocalBack(true, back);

  const forwardTo = async (destination: Conversation) => {
    if (!forwarding || sendingForward) return;
    setSendingForward(true);
    setForwardNotice('');
    try {
      await onForward(forwarding, destination);
      setForwarding(null);
      setFeedback('Forwarded to ' + destination.partnerName);
    } catch {
      setForwardNotice('Could not forward this message. Try again.');
    } finally {
      setSendingForward(false);
    }
  };

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
      <View style={[thread.header, { borderBottomColor: colors.line }]}>
        <BackButton onPress={back} label="Back to chats" />

        <ProfileAvatar name={conversation.partnerName} source={conversation.partnerAvatar} size={40} />
        <T bold size={16} numberOfLines={1} style={thread.partner}>{conversation.partnerName}</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Conversation information" onPress={() => setPanel('info')} style={[thread.circle, { backgroundColor: colors.purpleSoft }]}>
          <Info size={20} color={colors.purple} />
        </Pressable>
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
          conversation.messages.map((msg) => {
            const isMine = msg.senderEmail === currentUserEmail;
            return (
            <View key={msg.id} style={[thread.messageRow, isMine && thread.ownMessageRow]}>
              <MessageBubble message={msg} currentUserEmail={currentUserEmail} colors={colors} onReply={onSelectReplyMessage} />
              <Pressable accessibilityRole="button" accessibilityLabel="Forward message" onPress={() => { setForwardNotice(''); setForwarding(msg); }} style={[thread.forward, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
                <Forward size={16} color={colors.muted} />
              </Pressable>
            </View>
            );
          })
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
      {!!feedback && <T muted size={11} style={{ textAlign: 'center' }}>{feedback}</T>}
      {panel === 'emoji' && <View style={[thread.emojiPanel, { backgroundColor: colors.surfaceAlt }]}>
        {['😀', '😂', '❤️', '✨', '👍', '🔥', '🌙', '🥰'].map((emoji) => (
          <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={emoji} onPress={() => { onChangeMessageInput(messageInput + emoji); setPanel(null); }} style={thread.circle}><T size={21}>{emoji}</T></Pressable>
        ))}
      </View>}
      {panel === 'attach' && <Card style={thread.picker}>
        <T bold size={14}>Attach a story</T>
        {ownStories.length ? <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
          {ownStories.map((entry, index) => <Pressable key={entry._id} accessibilityRole="button" accessibilityLabel={'Attach story ' + (index + 1)} onPress={() => {
            onAttachStory({ id: entry._id, imageUrl: entry.imageUrl, authorName: entry.authorName, createdAt: entry.createdAt, type: 'story_share' });
            setPanel(null);
          }}><Image style={thread.storyThumb} source={{ uri: entry.imageUrl }} /></Pressable>)}
        </ScrollView> : <T muted size={12}>You have no active stories to attach.</T>}
      </Card>}
      <View
        style={[
          styles.inputBarContainer,
          { borderTopColor: colors.line, backgroundColor: colors.bg },
        ]}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Attach a story" onPress={() => setPanel(panel === 'attach' ? null : 'attach')} style={[thread.circle, { backgroundColor: colors.purpleSoft }]}>
          <Plus size={22} color={colors.purple} />
        </Pressable>
        <View style={[thread.inputShell, { backgroundColor: colors.surfaceAlt }]}>
        <TextInput
          value={messageInput}
          onChangeText={onChangeMessageInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.muted}
          style={[
            styles.textInput,
            { color: colors.text },
          ]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Choose emoji" onPress={() => setPanel(panel === 'emoji' ? null : 'emoji')} style={thread.circle}>
          <Smile size={20} color={colors.purple} />
        </Pressable>
        </View>
        <TouchableOpacity
          onPress={onSendMessage}
          accessibilityRole="button"
          accessibilityLabel="Send message"
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
      {(panel === 'info' || forwarding) && <Modal visible transparent animationType="fade" onRequestClose={() => {
        if (!sendingForward) { setPanel(null); setForwarding(null); }
      }}>
        <View style={thread.backdrop}>
          <StarField subtle />
          <Card style={[thread.dialog, { backgroundColor: colors.surface }]}>
            <View style={thread.dialogHeading}>
              <T bold size={18}>{forwarding ? 'Forward message' : 'Conversation information'}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" disabled={sendingForward} onPress={() => { setPanel(null); setForwarding(null); }} style={thread.circle}><X size={20} color={colors.text} /></Pressable>
            </View>
            {forwarding ? <>
              <T muted size={12} numberOfLines={2}>{forwarding.text || 'Shared story'}</T>
              <ScrollView style={{ maxHeight: 250 }}>
                {destinations.length ? destinations.map((person) => (
                  <Pressable key={person.id} accessibilityRole="button" disabled={sendingForward} onPress={() => forwardTo(person)} style={thread.destination}>
                    <ProfileAvatar name={person.partnerName} source={person.partnerAvatar} size={34} />
                    <T bold size={14} style={thread.partner}>{person.partnerName}</T>
                    <Forward size={17} color={colors.purple} />
                  </Pressable>
                )) : <T muted size={13}>There are no other conversations yet.</T>}
              </ScrollView>
              {!!forwardNotice && <T muted size={12}>{forwardNotice}</T>}
            </> : <View style={thread.info}>
              <ProfileAvatar name={conversation.partnerName} source={conversation.partnerAvatar} size={76} />
              <T bold size={21}>{conversation.partnerName}</T>
              {onOpenPartner && <Pill selected onPress={onOpenPartner}>View profile</Pill>}
            </View>}
          </Card>
        </View>
      </Modal>}
    </KeyboardAvoidingView>
  );
}

const thread = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingBottom: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  partner: { flex: 1, minWidth: 0 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '90%', gap: 8 },
  ownMessageRow: { flexDirection: 'row-reverse', alignSelf: 'flex-end' },
  forward: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, flexShrink: 0, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  inputShell: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', borderRadius: 23 },
  emojiPanel: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 15, padding: 5 },
  picker: { gap: 9, marginBottom: 6 },
  storyThumb: { width: 55, height: 72, borderRadius: 8 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(3,7,20,0.8)' },
  dialog: { width: '100%', maxWidth: 420, gap: 8 },
  dialogHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 49 },
  info: { alignItems: 'center', gap: 10 },
});
