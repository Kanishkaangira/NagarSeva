import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  number: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F0FF',
    marginRight: 9,
  },
  numberText: { color: colors.blue, fontSize: 10, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  titleDark: { color: '#EAF2FF' },
  required: { color: '#D94747', fontWeight: '900' },
});
