import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from './Icon';
import styles from './SettingRow.styles';
import { colors } from '../Theme';

export default function SettingRow({ icon, label, value, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]}
    >
      <View style={styles.icon}>
        <Icon name={icon} color={colors.white} size={15} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      <Icon name="chevronRight" color="#9BAAC0" size={17} />
    </Pressable>
  );
}
