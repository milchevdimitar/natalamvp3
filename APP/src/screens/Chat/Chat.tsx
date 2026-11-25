import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { ProfileQrScreen } from '../../components/ProfileQrScreen';
import { PeopleHeader } from '../People/PeopleHeader';
import { DatingSafety } from '../People/Dating';
import { useApp } from '../../context/AppContext';
import { useChat } from './useChat';
import { ActiveChatView } from './ActiveChatView';
import { ConversationsListView } from './ConversationsListView';
import { profileId } from '../../services/profileLinks';

export default function Chat({ onOpenProfile, initialChatId, onScanProfile }: { onScanProfile: (id: string) => void; onOpenProfile: (id: string, chatId: string) => void; initialChatId?: string }) {
  const {
    colors,
    user,
    setHideBottomNav,
    selectedChat,
    setSelectedChat,
    stories,
  } = useApp();

  const [scanOpen, setScanOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const currentUserEmail = user?.email || '';

  const chat = useChat({
    initialChatId,
    currentUserEmail,
    selectedChat,
    setSelectedChat,
    setHideBottomNav,
  });

  if (chat.activeConversation) {
    const { id: chatId, partnerId: rawPartnerId } = chat.activeConversation;
    const partnerId = profileId(rawPartnerId);
    const ownIds = [user?._id, user?.id, currentUserEmail].filter(Boolean).map((id) => String(id).toLowerCase());
    return (
      <>
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
        onOpenPartner={partnerId ? () => chat.activeConversation?.datingMatch ? setManage(true) : onOpenProfile(partnerId, chatId) : undefined}
        destinations={chat.conversations.filter(({ id }) => id !== chat.activeConversation?.id)}
        onForward={chat.forwardMessage}
        ownStories={stories.filter(({ userId }) => ownIds.includes(String(userId).toLowerCase()))}
        onAttachStory={chat.setPendingStory}
      />
      {manage && partnerId && <Modal transparent visible animationType="fade" onRequestClose={() => setManage(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.64)' }}>
          <DatingSafety id={partnerId} onCancel={() => setManage(false)} onDone={() => { setManage(false); chat.removeConversation(chatId); }} />
        </View>
      </Modal>}
      </>
    );
  }

  return (
    <>
      <ConversationsListView
        colors={colors}
        conversations={chat.filteredConversations}
        isLoading={chat.isLoading}
        header={<PeopleHeader view="chat" search={chat.searchQuery} onSearch={chat.setSearchQuery} onScan={() => setScanOpen(true)} />}
        pendingStory={chat.pendingStory}
        onDismissPendingStory={chat.clearPendingStory}
        onSelectConversation={chat.setActiveChatId}
      />
      {scanOpen && <ProfileQrScreen initialMode="scan" onClose={() => setScanOpen(false)} onOpenProfile={onScanProfile} />}

    </>
  );
}
