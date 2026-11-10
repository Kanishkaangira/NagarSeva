import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  row: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { color: colors.ink, fontSize: 9, fontWeight: '800' },
  value: { color: colors.muted, fontSize: 7, marginTop: 2 },
  chevron: { color: '#98A9C0', fontSize: 20, paddingHorizontal: 4 },
});
