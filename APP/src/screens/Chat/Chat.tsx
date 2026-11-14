import React from 'react';
import { useApp } from '../../context/AppContext';
import { useChat } from './useChat';
import { ActiveChatView } from './ActiveChatView';
import { ConversationsListView } from './ConversationsListView';
import { NewChatModal } from './NewChatModal';

export default function Chat() {
  const {
    colors,
    setPage,
    user,
    setHideBottomNav,
    selectedChat,
    setSelectedChat,
  } = useApp();

  const currentUserEmail = user?.email || '';

  const chat = useChat({
    currentUserEmail,
    selectedChat,
    setSelectedChat,
    setHideBottomNav,
  });

  if (chat.activeConversation) {
    return (
      <ActiveChatView
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
      />
    );
  }

  return (
    <>
      <ConversationsListView
        colors={colors}
        conversations={chat.filteredConversations}
        hasAnyConversations={chat.filteredConversations.length > 0 || Boolean(chat.searchQuery)}
        isLoading={chat.isLoading}
        searchQuery={chat.searchQuery}
        onChangeSearchQuery={chat.setSearchQuery}
        pendingStory={chat.pendingStory}
        onDismissPendingStory={chat.clearPendingStory}
        onOpenNewChatModal={() => chat.setIsAddModalOpen(true)}
        onSelectConversation={chat.setActiveChatId}
        onBackToExplore={() => setPage('explore')}
      />

      <NewChatModal
        visible={chat.isAddModalOpen}
        colors={colors}
        email={chat.newEmail}
        onChangeEmail={chat.setNewEmail}
        isSubmitting={chat.isSearchingUser}
        onClose={() => chat.setIsAddModalOpen(false)}
        onSubmit={chat.handleStartNewChat}
      />
    </>
  );
}