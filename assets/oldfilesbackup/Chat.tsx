import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  UserPlus,
  Search,
  MessageSquare,
  X,
  Mail,
  Sparkles,
  CornerUpLeft,
  Clock,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import {
  fetchUserConversations,
  createOrGetConversation,
  sendMessageApi,
  fetchChatMessages,
} from '../services/api';
import { showMessageNotification } from '../services/notifications';

export interface Message {
  id: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'story_reply' | 'story_share';
  storyData?: {
    storyId?: string;
    imageUrl?: string;
    authorName?: string;
    createdAt?: string;
  };
  replyTo?: {
    messageId?: string;
    senderEmail?: string;
    text?: string;
  };
}

export interface Conversation {
  id: string;
  partnerEmail: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export default function Chat() {
  const {
    colors,
    setPage,
    user,
    setHideBottomNav,
    selectedChat,
    setSelectedChat,
  } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Прикачено стори за споделяне
  const [pendingStory, setPendingStory] = useState<{
    id?: string;
    imageUrl?: string;
    authorName?: string;
    createdAt?: string;
    type?: 'story_reply' | 'story_share';
  } | null>(null);

  // Избрано съобщение за отговор (Reply to message)
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // Модал за добавяне по имейл
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const currentUserEmail = user?.email || '';

  const formatStoryAge = (isoString?: string) => {
    if (!isoString) return 'скоро';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
      if (hours < 1) return 'преди малко';
      return `преди ${hours}ч`;
    } catch {
      return isoString;
    }
  };

  useEffect(() => {
    if (selectedChat?.sharedStory) {
      setPendingStory({
        id: selectedChat.sharedStory.id,
        imageUrl: selectedChat.sharedStory.imageUrl,
        authorName: selectedChat.sharedStory.authorName,
        type: 'story_share',
      });

      if (selectedChat.targetUser) {
        const targetEmail = selectedChat.targetUser.toLowerCase();
        (async () => {
          try {
            const conversation = await createOrGetConversation(
              currentUserEmail,
              targetEmail
            );
            setConversations((prev) => {
              const exists = prev.some((c) => c.id === conversation.id);
              if (exists) {
                return prev.map((c) => (c.id === conversation.id ? conversation : c));
              }
              return [conversation, ...prev];
            });
            setActiveChatId(conversation.id);
          } catch (e) {
            console.error('Грешка при отваряне на чат:', e);
          }
        })();
      } else {
        setActiveChatId(null);
      }
    }
  }, [selectedChat, currentUserEmail]);

  useEffect(() => {
    if (activeChatId) {
      setHideBottomNav?.(true);
    } else {
      setHideBottomNav?.(false);
    }
    return () => setHideBottomNav?.(false);
  }, [activeChatId]);

  const loadConversations = async () => {
    if (!currentUserEmail) return;
    try {
      const data = await fetchUserConversations(currentUserEmail);
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) return;

    const interval = setInterval(async () => {
      if (activeChatId) {
        const updatedMessages = await fetchChatMessages(activeChatId);
        if (updatedMessages && Array.isArray(updatedMessages)) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeChatId) {
                const oldLength = c.messages.length;
                const newLength = updatedMessages.length;

                if (newLength > oldLength) {
                  const lastMsg = updatedMessages[newLength - 1];
                  if (lastMsg.senderEmail !== currentUserEmail) {
                    showMessageNotification(c.partnerName, lastMsg.text);
                  }
                }

                return {
                  ...c,
                  messages: updatedMessages,
                  lastMessage:
                    updatedMessages[newLength - 1]?.text || c.lastMessage,
                };
              }
              return c;
            })
          );
        }
      } else {
        const data = await fetchUserConversations(currentUserEmail);
        if (Array.isArray(data)) {
          setConversations(data);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUserEmail, activeChatId]);

  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeChatId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeChatId);

  const handleStartNewChat = async () => {
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert('Грешка', 'Моля, въведете имейл адрес.');
      return;
    }

    if (trimmedEmail === currentUserEmail.toLowerCase()) {
      Alert.alert('Грешка', 'Не можете да започнете чат със себе си.');
      return;
    }

    setIsSearchingUser(true);

    try {
      const conversation = await createOrGetConversation(
        currentUserEmail,
        trimmedEmail
      );

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) {
          return prev.map((c) => (c.id === conversation.id ? conversation : c));
        }
        return [conversation, ...prev];
      });

      setActiveChatId(conversation.id);
      setNewEmail('');
      setIsAddModalOpen(false);
    } catch (error: any) {
      Alert.alert(
        'Грешка',
        error.message || 'Не бе открит потребител с този имейл адрес.'
      );
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if ((!text && !pendingStory) || !activeChatId || isSending) return;

    setMessageInput('');
    setIsSending(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const msgType = pendingStory?.type || (pendingStory ? 'story_share' : 'text');
    const storyData = pendingStory
      ? {
          storyId: pendingStory.id,
          imageUrl: pendingStory.imageUrl,
          authorName: pendingStory.authorName,
          createdAt: pendingStory.createdAt,
        }
      : undefined;

    const replyToData = replyingToMessage
      ? {
          messageId: replyingToMessage.id,
          senderEmail: replyingToMessage.senderEmail,
          text: replyingToMessage.text,
        }
      : undefined;

    const tempMsg: Message = {
      id: Date.now().toString(),
      senderEmail: currentUserEmail,
      text: text || (msgType === 'story_reply' ? '💬 Story reply' : '📷 Shared story'),
      timestamp: timeStr,
      type: msgType,
      storyData,
      replyTo: replyToData,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: tempMsg.text,
              lastMessageTime: timeStr,
              messages: [...c.messages, tempMsg],
            }
          : c
      )
    );

    try {
      await sendMessageApi(
        activeChatId,
        currentUserEmail,
        tempMsg.text,
        msgType,
        storyData,
        replyToData
      );

      setPendingStory(null);
      setReplyingToMessage(null);
      if (setSelectedChat) setSelectedChat(null);
    } catch (error) {
      console.error('Грешка при изпращане:', error);
      Alert.alert(
        'Грешка',
        'Съобщението не бе изпратено. Проверете връзката си.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- ЕКРАН АКТИВЕН ЧАТ ---
  if (activeConversation) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveChatId(null)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          >
            <ArrowLeft size={20} color={colors.purple} />
            <T bold size={14} style={{ color: colors.purple }}>
              Back
            </T>
          </TouchableOpacity>

          <View style={{ alignItems: 'flex-end' }}>
            <T bold size={15}>
              {activeConversation.partnerName}
            </T>
            <T muted size={11}>
              {activeConversation.partnerEmail}
            </T>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ gap: 12, paddingVertical: 10, flexGrow: 1, justifyContent: 'flex-end' }}
        >
          {activeConversation.messages.length === 0 ? (
            <View style={{ alignItems: 'center', marginVertical: 'auto', gap: 8 }}>
              <Sparkles size={32} color={colors.gold} />
              <T muted size={13} style={{ textAlign: 'center' }}>
                Start your cosmic conversation with{' '}
                {activeConversation.partnerName}!
              </T>
            </View>
          ) : (
            activeConversation.messages.map((msg) => {
              const isMe = msg.senderEmail === currentUserEmail;
              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '84%',
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => setReplyingToMessage(msg)}
                    style={{
                      backgroundColor: isMe ? colors.purple : colors.surfaceAlt,
                      borderRadius: 18,
                      borderBottomRightRadius: isMe ? 3 : 18,
                      borderBottomLeftRadius: isMe ? 18 : 3,
                      padding: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    {/* ЦИТИРАНО СЪОБЩЕНИЕ (REPLY TO) */}
                    {msg.replyTo && (
                      <View
                        style={{
                          backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                          borderLeftWidth: 3,
                          borderLeftColor: isMe ? colors.gold : colors.purple,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 6,
                          marginBottom: 8,
                        }}
                      >
                        <T bold size={10} style={{ color: isMe ? colors.gold : colors.purple }}>
                          {msg.replyTo.senderEmail === currentUserEmail ? 'You' : msg.replyTo.senderEmail}
                        </T>
                        <T muted size={11} numberOfLines={1} style={{ color: isMe ? '#EAE6FF' : colors.text }}>
                          {msg.replyTo.text}
                        </T>
                      </View>
                    )}

                    {/* ПРЕМИУМ МАЗНО СТОРИ КАРТА */}
                    {msg.storyData?.imageUrl && (
                      <View
                        style={{
                          width: 210,
                          height: 280,
                          borderRadius: 14,
                          overflow: 'hidden',
                          marginBottom: 8,
                          backgroundColor: '#000000',
                          position: 'relative',
                        }}
                      >
                        <Image
                          source={{ uri: msg.storyData.imageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <View style={styles.storyCardGradientOverlay} />

                        {/* Хедър с автор и време на сторито */}
                        <View style={styles.storyCardHeaderBadge}>
                          <View style={styles.storyAvatarBorder}>
                            <T bold size={10} style={{ color: '#FFF' }}>
                              {(msg.storyData.authorName || 'S').charAt(0).toUpperCase()}
                            </T>
                          </View>
                          <View style={{ flex: 1 }}>
                            <T bold size={11} numberOfLines={1} style={{ color: '#FFFFFF' }}>
                              {msg.storyData.authorName || 'Stargazer'}
                            </T>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Clock size={9} color="rgba(255,255,255,0.7)" />
                              <T size={9} style={{ color: 'rgba(255,255,255,0.75)' }}>
                                {formatStoryAge(msg.storyData.createdAt)}
                              </T>
                            </View>
                          </View>
                        </View>

                        {/* Долна значка за тип стори */}
                        <View style={styles.storyTypeBadge}>
                          <Sparkles size={11} color={colors.gold} />
                          <T bold size={10} style={{ color: colors.gold }}>
                            {msg.type === 'story_reply' ? 'Story Reply' : 'Shared Story'}
                          </T>
                        </View>
                      </View>
                    )}

                    {/* ТЕКСТ НА СЪОБЩЕНИЕТО */}
                    {!!msg.text && (
                      <T size={14} style={{ color: isMe ? '#FFFFFF' : colors.text, lineHeight: 18 }}>
                        {msg.text}
                      </T>
                    )}
                  </TouchableOpacity>

                  {/* Време & Бутон за Бърз Отговор */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      gap: 6,
                      marginTop: 3,
                      marginHorizontal: 4,
                    }}
                  >
                    <T muted size={9}>
                      {msg.timestamp}
                    </T>
                    <TouchableOpacity onPress={() => setReplyingToMessage(msg)} style={{ padding: 2 }}>
                      <CornerUpLeft size={12} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ПРЕГЛЕД НА СТОРИ ПРЕДИ ИЗПРАЩАНЕ */}
        {pendingStory?.imageUrl && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceAlt,
              padding: 8,
              borderRadius: 14,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: colors.purple,
            }}
          >
            <Image
              source={{ uri: pendingStory.imageUrl }}
              style={{ width: 44, height: 56, borderRadius: 8, marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <T bold size={12} style={{ color: colors.gold }}>
                {pendingStory.type === 'story_reply' ? 'Reply to story' : 'Sharing story'}
              </T>
              <T muted size={11} numberOfLines={1}>
                {pendingStory.authorName ? `by @${pendingStory.authorName}` : 'Story preview'}
              </T>
            </View>
            <TouchableOpacity onPress={() => setPendingStory(null)}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* ПРЕГЛЕД НА ЦИТИРАНО СЪОБЩЕНИЕ ПРЕДИ ИЗПРАЩАНЕ (REPLY BAR) */}
        {replyingToMessage && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceAlt,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              marginBottom: 6,
              borderLeftWidth: 3,
              borderLeftColor: colors.purple,
            }}
          >
            <View style={{ flex: 1 }}>
              <T bold size={11} style={{ color: colors.purple }}>
                Replying to {replyingToMessage.senderEmail === currentUserEmail ? 'yourself' : replyingToMessage.senderEmail}
              </T>
              <T muted size={12} numberOfLines={1}>
                {replyingToMessage.text}
              </T>
            </View>
            <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* ИНПУТ ЛЕНТА */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.bg,
          }}
        >
          <TextInput
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
            }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSending}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.purple,
              alignItems: 'center',
              justifyContent: 'center',
            }}
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

  // --- ЕКРАН СПИСЪК С ЧАТОВЕ ---
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}
      >
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

      {pendingStory && !activeChatId && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.purpleSoft,
            padding: 12,
            borderRadius: 14,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: colors.purple,
          }}
        >
          <Image
            source={{ uri: pendingStory.imageUrl }}
            style={{ width: 44, height: 56, borderRadius: 8, marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <T bold size={13} style={{ color: colors.purple }}>
              Select a conversation to share story
            </T>
            <T muted size={11}>
              Story by @{pendingStory.authorName || 'Stargazer'}
            </T>
          </View>
          <TouchableOpacity
            onPress={() => {
              setPendingStory(null);
              if (setSelectedChat) setSelectedChat(null);
            }}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <Card style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.purpleSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
          <Pill selected onPress={() => setIsAddModalOpen(true)}>
            + Email
          </Pill>
        </TouchableOpacity>
      </Card>

      {conversations.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 16,
          }}
        >
          <Search size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chat or email..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 10,
              fontSize: 13,
              color: colors.text,
            }}
          />
        </View>
      )}

      <Section>Active Conversations</Section>
      <View style={{ gap: 10, marginBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.purple}
            style={{ marginVertical: 20 }}
          />
        ) : filteredConversations.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
            <MessageSquare size={32} color={colors.muted} />
            <T bold size={14}>
              No conversations found
            </T>
            <T muted size={12} style={{ textAlign: 'center' }}>
              Tap "+ Email" above to start a conversation by email.
            </T>
          </Card>
        ) : (
          filteredConversations.map((conv) => (
            <Card key={conv.id}>
              <TouchableOpacity
                onPress={() => setActiveChatId(conv.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.goldSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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

      {/* MODAL ADD EMAIL */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsAddModalOpen(false)}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.purple },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color={colors.purple} />
                <T bold size={16}>
                  Start Chat by Email
                </T>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <T muted size={12} style={{ marginBottom: 14 }}>
              Enter the email address of the user you wish to connect with.
            </T>

            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="user@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: colors.surfaceAlt,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.line,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Pill onPress={() => setIsAddModalOpen(false)}>Cancel</Pill>
              <Pill selected onPress={handleStartNewChat} disabled={isSearchingUser}>
                {isSearchingUser ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  'Start Chat ↗'
                )}
              </Pill>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
  },
  storyCardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  storyCardHeaderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  storyAvatarBorder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});