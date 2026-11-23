import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },

  /* Questionnaire Styles */
  progressCard: {
    marginBottom: 18,
    gap: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionsList: {
    gap: 14,
  },
  questionCard: {
    gap: 14,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  questionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    flex: 1,
    lineHeight: 20,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },

  /* Result View Styles */
  resultStack: {
    gap: 18,
    marginBottom: 40,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  resultHeroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  resultBrainCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTypeCode: {
    letterSpacing: -1,
  },
  resultSubtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  essenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceCard: {
    gap: 14,
  },
  balanceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resultAction: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    paddingHorizontal: 8,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  /* Offscreen 9:16 Story Card Styles */
  offscreenStoryWrapper: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
  storyCanvas: {
    width: 380,
    height: 675,
    borderRadius: 32,
    overflow: 'hidden',
  },
  storyGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  storyHeroBrainCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 2,
    borderColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    marginBottom: 12,
  },
  storyTypeHeroText: {
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: '#A855F7',
    textShadowRadius: 10,
  },
  storySubtitleText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  storyDynamicsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  storyBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  storyTraitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  storyTraitPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
});
