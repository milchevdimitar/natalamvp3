import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

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
  scaleLabelsRow: { flexDirection: 'row', justifyContent: 'center' },
  scaleLabel: { textAlign: 'center' },
  scaleEndLabel: { position: 'absolute', width: 64, marginLeft: -32 },
  scaleFirstLabel: { left: '7.142857%' },
  scaleLastLabel: { left: '92.857143%' },
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
});
