import { StyleSheet } from 'react-native';
import { colors } from '../Theme';

export default StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 62,
    borderRadius: 30,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    shadowColor: colors.navyDeep,
    shadowOpacity: 0.25,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 5 },
    elevation: 9,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activePill: {
    width: 74,
    height: 44,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 8,
  },
  activePillOn: { backgroundColor: colors.white },
  label: { color: '#AFC2E2', fontSize: 7, fontWeight: '600' },
  labelActive: { color: colors.navy, fontWeight: '900' },
});
