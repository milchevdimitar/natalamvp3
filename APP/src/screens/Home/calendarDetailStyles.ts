import { StyleSheet } from 'react-native';
import { cosmic } from '../../theme/cosmic';

export const calendarDetailStyles = StyleSheet.create({
  body: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  heading: { alignItems: 'center', gap: 5 },
  date: { color: cosmic.purple, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: cosmic.text, fontSize: 33, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8 },
  meta: { color: cosmic.muted, fontSize: 12, textAlign: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  month: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: cosmic.text },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  weekdays: { flexDirection: 'row' },
  weekday: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: cosmic.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  column: { width: '14.28%', minHeight: 44, paddingHorizontal: 2 },
  cell: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 11, borderWidth: 1, borderColor: 'transparent' },
  today: { borderColor: cosmic.purple },
  day: { color: cosmic.text, fontSize: 12, fontWeight: '700' },
});
