import React from 'react';
import { Text, View } from 'react-native';
import Icon from './Icon';
import ScaleButton from './ScaleButton';
import styles from './ScreenHeader.styles';

export default function ScreenHeader({
  greeting,
  title,
  subtitle,
  showCitizenTag,
  onNotifications,
  onProfile,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.decor}>
        {Array.from({ length: 42 }, (_, index) => (
          <View key={index} style={styles.star} />
        ))}
      </View>
      <View style={styles.orb} />
      <View style={styles.lowerBlue} />
      <View style={styles.city}>
        {[22, 38, 29, 49, 26, 42, 32, 54, 25, 39, 30].map((height, index) => (
          <View key={index} style={[styles.tower, { height }]} />
        ))}
      </View>

      <View style={styles.brandLine}>
        <View style={styles.seal}>
          <Icon name="shield" color="#FFB21A" size={21} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>NagarSeva</Text>
          <Text style={styles.brandSubtitle}>Municipal Corporation</Text>
        </View>
        <ScaleButton
          style={styles.notificationButton}
          accessibilityLabel="Notifications"
          onPress={onNotifications}
        >
          <Icon name="bell" color="#FFFFFF" size={17} />
          <View style={styles.notificationDot} />
        </ScaleButton>
        <ScaleButton
          style={styles.avatar}
          accessibilityLabel="Open profile"
          onPress={onProfile}
        >
          <Text style={styles.avatarText}>A</Text>
        </ScaleButton>
      </View>

      <View style={styles.intro}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {showCitizenTag ? (
        <View style={styles.citizenTag}>
          <Icon name="shield" color="#FFFFFF" size={11} />
          <Text style={styles.citizenText}>Verified citizen · Sector 15</Text>
        </View>
      ) : null}
    </View>
  );
}
