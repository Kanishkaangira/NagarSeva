import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  container: { flex: 1 },
  homePinned: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  homePinnedContent: {
    paddingHorizontal: 18,
    paddingTop: 23,
  },
  reportsPinned: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  reportsPinnedContent: { paddingHorizontal: 18, paddingTop: 23 },
  reportsScroll: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#DCE7F5',
    overflow: 'hidden',
  },
  reportsBody: { paddingTop: 12 },
  homeBody: { paddingTop: 0 },
  reportHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 21,
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  reportBody: { paddingTop: 8 },
  scrollView: { position: 'absolute', top: 130, bottom: 0, left: 0, right: 0 },
  body: { paddingHorizontal: 18, paddingTop: 23 },
  pageTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 9,
    marginBottom: 10,
  },
});
