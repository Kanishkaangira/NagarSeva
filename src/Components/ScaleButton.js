import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export default function ScaleButton({
  children,
  onPress,
  style,
  containerStyle,
  accessibilityLabel,
  selected,
  disabled = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = toValue =>
    Animated.spring(scale, {
      toValue,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animate(0.975)}
      onPressOut={() => animate(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
