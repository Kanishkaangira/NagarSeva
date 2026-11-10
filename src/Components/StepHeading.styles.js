import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  number: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F0FF',
    marginRight: 9,
  },
  numberText: { color: colors.blue, fontSize: 11, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 13, fontWeight: '800' },
});
