import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  fetchUserConversations,
  createOrGetConversation,
  sendMessageApi,
  fetchChatMessages,
} from '../../services/api';
import { showMessageNotification } from '../../services/notifications';
import type { SelectedChatData } from '../../context/AppContext';
import { Conversation, Message, PendingStory } from './chat.types';
import { getCurrentTimeFormatted } from './chat.utils';

interface UseChatParams {
  currentUserEmail: string;
  selectedChat: SelectedChatData | null;
  setSelectedChat?: (val: SelectedChatData | null) => void;
  initialChatId?: string;
  setHideBottomNav?: (hide: boolean) => void;
}

export function useChat({
  currentUserEmail,
  selectedChat,
  setSelectedChat,
  setHideBottomNav,
  initialChatId,
}: UseChatParams) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [pendingStory, setPendingStory] = useState<PendingStory | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Обработка на споделено стори или директно избран потребител от друг екран
  useEffect(() => {
    if (!selectedChat || !currentUserEmail || isLoading) return;

    if (selectedChat.chatId) {
      setActiveChatId(selectedChat.chatId);
      setSelectedChat?.(null);
      return;
    }

    if (selectedChat.draftMessage) {
      setMessageInput(selectedChat.draftMessage);
      setActiveChatId(null);
      setSelectedChat?.(null);
      return;
    }

    if (selectedChat.sharedStory) {
      setPendingStory({
        id: selectedChat.sharedStory.id,
        imageUrl: selectedChat.sharedStory.imageUrl,
        authorName: selectedChat.sharedStory.authorName,
        type: 'story_share',
      });
    }

    let active = true;
    if (selectedChat.targetUser) {
      const targetEmail = selectedChat.targetUser.toLowerCase();
      (async () => {
        try {
          const conversation = await createOrGetConversation(
            currentUserEmail,
            targetEmail
          );
          if (!active) return;
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conversation.id);
            return exists
              ? prev.map((c) => (c.id === conversation.id ? conversation : c))
              : [conversation, ...prev];
          });
          setActiveChatId(conversation.id);
        } catch (e) {
          if (!active) return;
          console.error('Грешка при отваряне на чат:', e);
          if (!selectedChat.sharedStory) Alert.alert('Chat unavailable', 'Could not open the conversation.');
        } finally {
          if (active && !selectedChat.sharedStory) setSelectedChat?.(null);
        }
      })();
    } else {
      setActiveChatId(null);
    }
    return () => { active = false; };
  }, [selectedChat, currentUserEmail, isLoading, setSelectedChat]);

  // Скриване на долната навигация при отворен чат
  useEffect(() => {
    setHideBottomNav?.(Boolean(activeChatId));
    return () => setHideBottomNav?.(false);
  }, [activeChatId]);

  // Първоначално зареждане на разговорите
  useEffect(() => {
    if (!currentUserEmail) return;

    (async () => {
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
    })();
  }, [currentUserEmail]);

  // Периодично обновяване (polling на 3 секунди)
  useEffect(() => {
    if (!currentUserEmail) return;

    const interval = setInterval(async () => {
      if (activeChatId) {
        const updatedMessages = await fetchChatMessages(activeChatId);
        if (updatedMessages && Array.isArray(updatedMessages)) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeChatId) return c;

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
                lastMessage: updatedMessages[newLength - 1]?.text || c.lastMessage,
              };
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
        return exists
          ? prev.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...prev];
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

    const timeStr = getCurrentTimeFormatted();
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
      setSelectedChat?.(null);
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

  const forwardMessage = async (message: Message, destination: Conversation) => {
    if (destination.id === activeChatId || !currentUserEmail) return;
    const type = message.storyData?.imageUrl ? 'story_share' : 'text';
    const result = await sendMessageApi(destination.id, currentUserEmail, message.text, type, message.storyData ?? undefined);
    if (!result?.success || !result.message) throw new Error('Could not forward message.');
    const sent = result.message as Message;
    setConversations((previous) => previous.map((entry) => entry.id === destination.id ? {
      ...entry, lastMessage: sent.text, lastMessageTime: sent.timestamp,
      messages: entry.messages.some((item) => item.id === sent.id) ? entry.messages : [...entry.messages, sent],
    } : entry));
  };

  const clearPendingStory = () => {
    setPendingStory(null);
    setSelectedChat?.(null);
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId),
    [conversations, activeChatId]
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  return {
    activeConversation,
    conversations,
    forwardMessage,
    filteredConversations,
    setActiveChatId,
    removeConversation: (id: string) => {
      setActiveChatId(null);
      setConversations((previous) => previous.filter((item) => item.id !== id));
    },
    searchQuery,
    setSearchQuery,
    messageInput,
    setMessageInput,
    isLoading,
    isSending,
    pendingStory,
    setPendingStory,
    clearPendingStory,
    replyingToMessage,
    setReplyingToMessage,
    isAddModalOpen,
    setIsAddModalOpen,
    newEmail,
    setNewEmail,
    isSearchingUser,
    handleStartNewChat,
    handleSendMessage,
  };
}
