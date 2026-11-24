import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from './Icon';
import styles from './SettingRow.styles';
import { colors } from '../Theme';

export default function SettingRow({ icon, label, value, onPress, rightAccessory, darkMode = false }) {
  return (
    <Pressable
      accessible={!rightAccessory}
      accessibilityRole={rightAccessory ? undefined : 'button'}
      accessibilityLabel={rightAccessory ? undefined : value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, darkMode && styles.rowDark, pressed && { opacity: 0.72 }]}
    >
      <View style={[styles.icon, darkMode && styles.iconDark]}>
        <Icon name={icon} color={colors.white} size={15} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>{label}</Text>
        {value ? <Text style={[styles.value, darkMode && styles.valueDark]}>{value}</Text> : null}
      </View>
      {rightAccessory ?? <Icon name="chevronRight" color="#9BAAC0" size={17} />}
    </Pressable>
  );
}
