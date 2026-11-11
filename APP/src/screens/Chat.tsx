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
  const { colors, setPage, user, setHideBottomNav } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Модал за добавяне по имейл
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const currentUserEmail = user?.email || '';

  // Скриване/Показване на BottomNav при влизане и излизане от разговор
  useEffect(() => {
    if (activeChatId) {
      setHideBottomNav?.(true);
    } else {
      setHideBottomNav?.(false);
    }
    return () => setHideBottomNav?.(false);
  }, [activeChatId]);

  // 1. Зареждане на разговорите на потребителя от MongoDB при отваряне
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

  // 2. Real-time Polling: Периодично обновяване и изпращане на нотификации при ново съобщение
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

  // Автоматично скролване до най-новото съобщение
  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeChatId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeChatId);

  // 3. Добавяне на нов чат по имейл през базата данни
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

  // 4. Изпращане на съобщение с онлайн запис в базата
  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !activeChatId || isSending) return;

    setMessageInput('');
    setIsSending(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const tempMsg: Message = {
      id: Date.now().toString(),
      senderEmail: currentUserEmail,
      text,
      timestamp: timeStr,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: timeStr,
              messages: [...c.messages, tempMsg],
            }
          : c
      )
    );

    try {
      await sendMessageApi(activeChatId, currentUserEmail, text);
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
        {/* Хедър на активния чат */}
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

        {/* Списък със съобщения */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ gap: 10, paddingVertical: 10, flexGrow: 1, justifyContent: 'flex-end' }}
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
                    maxWidth: '80%',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isMe
                        ? colors.purple
                        : colors.surfaceAlt,
                      borderRadius: 16,
                      borderBottomRightRadius: isMe ? 2 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 2,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <T
                      size={14}
                      style={{ color: isMe ? '#FFFFFF' : colors.text }}
                    >
                      {msg.text}
                    </T>
                  </View>
                  <T
                    muted
                    size={9}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      marginTop: 3,
                      marginHorizontal: 4,
                    }}
                  >
                    {msg.timestamp}
                  </T>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Поле за въвеждане на съобщение над клавиатурата */}
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

      <Card style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
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

      {/* MODAL FOR ADDING USER BY EMAIL */}
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
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
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

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <Pill onPress={() => setIsAddModalOpen(false)}>Cancel</Pill>
              <Pill
                selected
                onPress={handleStartNewChat}
                disabled={isSearchingUser}
              >
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
});