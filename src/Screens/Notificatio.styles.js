import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 9,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 9, marginTop: 4 },
  time: { color: '#91A0B7', fontSize: 7, marginTop: 5 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  notice: {
    alignItems: 'center',
    backgroundColor: colors.bluePale,
    borderRadius: 13,
    padding: 14,
    marginTop: 3,
  },
  noticeTitle: { color: colors.navy, fontSize: 10, fontWeight: '800' },
  noticeText: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
