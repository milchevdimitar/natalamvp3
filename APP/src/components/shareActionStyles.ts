import { StyleSheet } from 'react-native';

export const shareActionStyles = StyleSheet.create({
  row: { width: '100%', maxWidth: 230, height: 44, marginTop: 8, flexDirection: 'row', gap: 8 },
  button: { flex: 1, borderRadius: 16, backgroundColor: '#f6c66d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { color: '#282034', fontWeight: '800' },
});
