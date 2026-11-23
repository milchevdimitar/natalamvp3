import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  readingOptions: { width: '100%', maxWidth: 336, alignSelf: 'center', gap: 6 },
  optionTrack: { flexDirection: 'row', gap: 4, padding: 3, borderWidth: 1, borderRadius: 14 },
  option: { flex: 1, minHeight: 36, paddingHorizontal: 5, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  spreadOptions: { marginBottom: 12, padding: 10 },

  /* TarotArtworkCard Styles */
  tarotCardFrame: {
    borderRadius: 8,
    backgroundColor: '#161026',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  tarotCardBack: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1A1423',
  },
  cardIndexBadge: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    backgroundColor: 'rgba(26, 20, 35, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  tarotCardFront: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotCardFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },

  /* Daily Section Styles */
  sectionStack: {
    gap: 18,
    marginBottom: 40,
  },

  /* Spread Section Styles */
  inputContainer: {
    minHeight: 46,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  questionTextInput: {
    fontSize: 14,
    fontWeight: '500',
  },
  matrixInputContainer: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  matrixTextInput: {
    fontSize: 15,
    fontWeight: '700',
  },
  spreadBoardContainer: {
    gap: 14,
    padding: 10,
    backgroundColor: '#120C1F',
    borderRadius: 16,
  },
  clarifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 6,
  },
  clarificationItemBox: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  foundationCard: {
    gap: 12,
    borderWidth: 1.5,
  },
  revealAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  spreadActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
    marginTop: 14,
  },
});
