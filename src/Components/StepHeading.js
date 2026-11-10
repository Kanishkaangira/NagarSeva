import React from 'react';
import { Text, View } from 'react-native';
import styles from './StepHeading.styles';

export default function StepHeading({ number, title }) {
  return (
    <View style={styles.row}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{number}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
