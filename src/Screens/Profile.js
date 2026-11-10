import React from 'react';
import { Alert, Text, View } from 'react-native';
import { isIssueResolved, qrPattern } from '../Theme';
import SettingRow from '../Components/SettingRow';
import Icon from '../Components/Icon';
import styles from './Profile.styles';

export default function Profile({ issues }) {
  const resolvedCount = issues.filter(
    issue => isIssueResolved(issue.status),
  ).length;

  return (
    <>
      <View style={styles.citizenCard}>
        <View style={styles.cardTop}>
          <Text style={styles.digitalLabel}>DIGITAL CITIZEN CARD</Text>
          <View style={styles.verifiedBadge}>
            <Icon name="check" color="#168655" size={12} strokeWidth={3} />
            <Text style={styles.verifiedText}> Verified</Text>
          </View>
        </View>
        <View style={styles.cardMain}>
          <View style={styles.profileInitialCircle}>
            <Text style={styles.profileInitial}>A</Text>
          </View>
          <View style={styles.citizenInfo}>
            <Text style={styles.citizenName}>Ananya Sharma</Text>
            <Text style={styles.citizenDetail}>
              Verified citizen · Sector 15
            </Text>
          </View>
          <View style={styles.qrCard}>
            {qrPattern.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.qrRow}>
                {row.map((dark, colIndex) => (
                  <View
                    key={colIndex}
                    style={[styles.qrPixel, dark ? styles.qrPixelDark : null]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.citizenId}>ID NS-CIT-48213</Text>
        <View style={styles.cardOrb} />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{issues.length}</Text>
          <Text style={styles.statLabel}>Reports made</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Issues resolved</Text>
        </View>
      </View>

      <SectionTitle title="Personal details" />
      <View style={styles.settingsCard}>
        <SettingRow
          icon="phone"
          label="Mobile number"
          value="+91 98XX XXX 210"
        />
        <View style={styles.separator} />
        <SettingRow icon="location" label="Ward" value="Sector 15" />
      </View>

      <SectionTitle title="Settings" />
      <View style={styles.settingsCard}>
        <SettingRow
          icon="bell"
          label="Notifications"
          value="Status updates on"
          onPress={() =>
            Alert.alert(
              'Notifications',
              'You’re set to receive report updates.',
            )
          }
        />
        <View style={styles.separator} />
        <SettingRow
          icon="language"
          label="Language"
          value="English"
          onPress={() =>
            Alert.alert('Language', 'More languages will be available soon.')
          }
        />
        <View style={styles.separator} />
        <SettingRow
          icon="logout"
          label="Log out"
          value=""
          onPress={() =>
            Alert.alert('Log out', 'You are currently using a demo profile.')
          }
        />
      </View>
    </>
  );
}

function SectionTitle({ title }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.yellowDash} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}
