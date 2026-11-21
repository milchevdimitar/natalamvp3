import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Active Chat Header
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  backAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  partnerInfoAlign: {
    alignItems: 'flex-end',
  },

  // Messages List & Bubbles
  messagesScrollContent: {
    gap: 12,
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyChatState: {
    alignItems: 'center',
    marginVertical: 'auto',
    gap: 8,
  },
  messageWrapper: {
    maxWidth: '84%',
    flexShrink: 1,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  replyQuoteBox: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  messageText: {
    lineHeight: 18,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    marginHorizontal: 4,
  },

  // Story Card inside Message
  storyCardContainer: {
    width: 210,
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#000000',
    position: 'relative',
  },
  storyCardImage: {
    width: '100%',
    height: '100%',
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
  storyAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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

  // Preview Bars & Input Bar
  pendingStoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
  },
  pendingStoryThumb: {
    width: 44,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Conversations List View
  listScrollContent: {
    paddingBottom: 120,
  },
  listStoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  newChatCard: {
    marginBottom: 16,
  },
  newChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newChatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newChatIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationsList: {
    gap: 10,
    marginBottom: 40,
  },
  emptyListCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
