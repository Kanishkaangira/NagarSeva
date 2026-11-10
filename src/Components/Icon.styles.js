import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  glyph: { fontWeight: '700' },
  camera: {
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBump: {
    position: 'absolute',
    left: '18%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  cameraLens: { borderWidth: 1.7 },
  pin: {
    borderWidth: 1.8,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {},
});
