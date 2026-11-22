import React from 'react';
import { useApp } from '../../context/AppContext';
import { useChat } from './useChat';
import { ActiveChatView } from './ActiveChatView';
import { ConversationsListView } from './ConversationsListView';
import { profileId } from '../../services/profileLinks';

export default function Chat({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const {
    colors,
    user,
    setHideBottomNav,
    selectedChat,
    setSelectedChat,
    stories,
  } = useApp();

  const currentUserEmail = user?.email || '';

  const chat = useChat({
    currentUserEmail,
    selectedChat,
    setSelectedChat,
    setHideBottomNav,
  });

  if (chat.activeConversation) {
    const partnerId = profileId(chat.activeConversation.partnerId);
    const ownIds = [user?._id, user?.id, currentUserEmail].filter(Boolean).map((id) => String(id).toLowerCase());
    return (
      <ActiveChatView
        key={chat.activeConversation.id}
        conversation={chat.activeConversation}
        currentUserEmail={currentUserEmail}
        colors={colors}
        messageInput={chat.messageInput}
        onChangeMessageInput={chat.setMessageInput}
        isSending={chat.isSending}
        pendingStory={chat.pendingStory}
        onClearPendingStory={() => chat.setPendingStory(null)}
        replyingToMessage={chat.replyingToMessage}
        onSelectReplyMessage={chat.setReplyingToMessage}
        onSendMessage={chat.handleSendMessage}
        onBack={() => chat.setActiveChatId(null)}
        onOpenPartner={partnerId ? () => onOpenProfile(partnerId) : undefined}
        destinations={chat.conversations.filter(({ id }) => id !== chat.activeConversation?.id)}
        onForward={chat.forwardMessage}
        ownStories={stories.filter(({ userId }) => ownIds.includes(String(userId).toLowerCase()))}
        onAttachStory={chat.setPendingStory}
      />
    );
  }

  return (
    <>
      <ConversationsListView
        colors={colors}
        conversations={chat.filteredConversations}
        isLoading={chat.isLoading}
        searchQuery={chat.searchQuery}
        onChangeSearchQuery={chat.setSearchQuery}
        pendingStory={chat.pendingStory}
        onDismissPendingStory={chat.clearPendingStory}
        onSelectConversation={chat.setActiveChatId}
      />

    </>
  );
}
