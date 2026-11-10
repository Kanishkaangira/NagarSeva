import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import styles from './Flash.styles';
import Icon from '../Components/Icon';
import { colors } from '../Theme';

export default function Flash({ message, detail }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.checkCircle}>
        <Icon name="check" color={colors.white} size={13} strokeWidth={3} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </Animated.View>
  );
}
