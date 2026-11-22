import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 4,
  },

  /* Potential Match Card */
  matchCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    gap: 11,
  },
  matchTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resonanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  matchBio: {
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 310,
  },
  matchActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  roundActionBtn: {
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallRoundBtn: {
    padding: 11,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Friends & Requests */
  listStack: {
    gap: 10,
  },
  friendRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarOnlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  nameAndScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  miniScoreTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Discover Grid */
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  discoverCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 7,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 3, 14, 0.78)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    maxHeight: '88%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownRow: {
    gap: 5,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  highlightsBox: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  codeBox: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  inviteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
});