import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandMark from '../Components/BrandMark';
import styles from './StartupSplash.styles';

export default function StartupSplash() {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      speed: 10,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar backgroundColor="#061F4E" barStyle="light-content" />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: entrance,
            transform: [
              {
                scale: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logoHalo}>
          <BrandMark size={156} />
        </View>
        <Text style={styles.name}>NagarSeva</Text>
        <Text style={styles.subtitle}>MUNICIPAL CORPORATION</Text>
        <View style={styles.flagLine}>
          <View style={styles.saffron} />
          <View style={styles.white} />
          <View style={styles.green} />
        </View>
        <Text style={styles.tagline}>Your city. Your voice. Better together.</Text>
      </Animated.View>
      <Text style={styles.footer}>CITIZEN SERVICES</Text>
    </SafeAreaView>
  );
}
