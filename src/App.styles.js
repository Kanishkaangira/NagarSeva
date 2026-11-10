import { StyleSheet } from 'react-native';
import { colors } from './Theme';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  topStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    flexDirection: 'row',
    zIndex: 20,
    elevation: 20,
  },
  stripeSegment: { height: 24 },
  stripeOrange: { flex: 32, backgroundColor: '#FF9933' },
  stripeWhite: { flex: 31, backgroundColor: '#FFFFFF' },
  stripeGreen: { flex: 37, backgroundColor: '#138808' },
  flashContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
});
