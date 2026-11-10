import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.navy,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  checkCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  message: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 8, marginTop: 3 },
});
