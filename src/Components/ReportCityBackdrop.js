import React from 'react';
import { View } from 'react-native';
import Icon from './Icon';
import styles from './ReportCityBackdrop.styles';

const buildings = [
  { width: 43, height: 76 },
  { width: 54, height: 111 },
  { width: 46, height: 91 },
  { width: 63, height: 135, civic: true },
  { width: 48, height: 84 },
  { width: 56, height: 119 },
  { width: 40, height: 68 },
];

export default function ReportCityBackdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <View style={styles.watermark}>
        <Icon name="landmark" color="#1264D5" size={300} strokeWidth={0.8} />
      </View>
      <View style={styles.skyline}>
        {buildings.map((building, index) => (
          <View
            key={index}
            style={[
              styles.building,
              building.civic && styles.civicBuilding,
              { width: building.width, height: building.height },
            ]}
          >
            {building.civic ? <View style={styles.civicRoof} /> : null}
            <View style={styles.windows}>
              {Array.from({ length: building.civic ? 8 : 6 }, (_, windowIndex) => (
                <View key={windowIndex} style={styles.window} />
              ))}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.groundLine} />
    </View>
  );
}
