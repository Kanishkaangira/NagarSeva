import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from '../Components/Icon';
import { colors } from '../Theme';
import styles from './HomeBottomNav.styles';

const items = [
  { label: 'Home', screen: 'Home', icon: 'home' },
  { label: 'My reports', screen: 'My reports', icon: 'reports' },
  { label: 'Profile', screen: 'Profile', icon: 'profile' },
];

export default function HomeBottomNav({
  activeScreen,
  onNavigate,
  bottomOffset,
}) {
  const activeTab = activeScreen === 'Report' ? 'Home' : activeScreen;

  return (
    <View style={[styles.nav, { bottom: bottomOffset }]}>
      {items.map(item => {
        const active = activeTab === item.screen;
        return (
          <Pressable
            key={item.screen}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(item.screen)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.activePill, active && styles.activePillOn]}>
              <Icon
                name={item.icon}
                color={active ? colors.navy : '#9DB2D3'}
                size={17}
              />
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
