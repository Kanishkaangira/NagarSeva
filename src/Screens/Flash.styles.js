import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 62,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 17,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CDEBDD',
    borderLeftWidth: 5,
    borderLeftColor: colors.green,
    shadowColor: colors.navy,
    shadowOpacity: 0.23,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  message: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  detail: { color: '#536987', fontSize: 12, lineHeight: 17, marginTop: 5 },
});
