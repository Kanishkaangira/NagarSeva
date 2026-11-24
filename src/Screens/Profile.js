import React, { useState } from 'react';
import { Alert, Modal, Pressable, Switch, Text, View } from 'react-native';
import { colors, isIssueResolved, qrPattern } from '../Theme';
import SettingRow from '../Components/SettingRow';
import Icon from '../Components/Icon';
import styles from './Profile.styles';
import { t } from '../lib/i18n';

export default function Profile({
  issues,
  darkMode = false,
  onDarkModeChange,
  language = 'English',
  onLanguageChange,
}) {
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const resolvedCount = issues.filter(
    issue => isIssueResolved(issue.status),
  ).length;

  return (
    <>
      <View style={styles.citizenCard}>
        <View style={styles.cardTop}>
            <Text style={styles.digitalLabel}>{t(language, 'DIGITAL CITIZEN CARD')}</Text>
          <View style={styles.verifiedBadge}>
            <Icon name="check" color="#168655" size={12} strokeWidth={3} />
            <Text style={styles.verifiedText}> {t(language, 'Verified')}</Text>
          </View>
        </View>
        <View style={styles.cardMain}>
          <View style={styles.profileInitialCircle}>
            <Text style={styles.profileInitial}>A</Text>
          </View>
          <View style={styles.citizenInfo}>
            <Text style={styles.citizenName}>{t(language, 'Ananya Sharma')}</Text>
            <Text style={styles.citizenDetail}>
              {t(language, 'Verified citizen · Sector 15')}
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
        <View style={[styles.stat, darkMode && styles.darkSurface]}>
          <Text style={[styles.statNumber, darkMode && styles.darkText]}>{issues.length}</Text>
          <Text style={[styles.statLabel, darkMode && styles.darkMuted]}>{t(language, 'Reports made')}</Text>
        </View>
        <View style={[styles.stat, darkMode && styles.darkSurface]}>
          <Text style={[styles.statNumber, darkMode && styles.darkText]}>{resolvedCount}</Text>
          <Text style={[styles.statLabel, darkMode && styles.darkMuted]}>{t(language, 'Issues resolved')}</Text>
        </View>
      </View>

      <SectionTitle title={t(language, 'Personal details')} darkMode={darkMode} />
      <View style={[styles.settingsCard, darkMode && styles.darkSurface]}>
        <SettingRow
          icon="phone"
          label={t(language, 'Mobile number')}
          value="+91 98XX XXX 210"
          darkMode={darkMode}
        />
        <View style={[styles.separator, darkMode && styles.darkSeparator]} />
        <SettingRow icon="location" label={t(language, 'Ward')} value={t(language, 'Sector 15')} darkMode={darkMode} />
      </View>

      <SectionTitle title={t(language, 'Settings')} darkMode={darkMode} />
      <View style={[styles.settingsCard, darkMode && styles.darkSurface]}>
        <SettingRow
          icon="moon"
          label={t(language, 'Dark theme')}
          value={t(language, darkMode ? 'On' : 'Off')}
          darkMode={darkMode}
          rightAccessory={(
            <Switch
              value={darkMode}
              onValueChange={onDarkModeChange}
              accessibilityLabel="Toggle dark theme"
              trackColor={{ false: '#C6D1E0', true: '#2874D0' }}
              thumbColor="#FFFFFF"
            />
          )}
        />
        <View style={[styles.separator, darkMode && styles.darkSeparator]} />
        <SettingRow
          icon="bell"
          label={t(language, 'Notifications')}
          value={t(language, 'Status updates on')}
          darkMode={darkMode}
          onPress={() =>
            Alert.alert(
                  t(language, 'Notifications'),
                  t(language, 'You are set to receive report updates.'),
            )
          }
        />
        <View style={[styles.separator, darkMode && styles.darkSeparator]} />
        <SettingRow
          icon="language"
          label={t(language, 'Language')}
          value={language === 'Hindi' ? '\u0939\u093f\u0928\u094d\u0926\u0940' : 'English'}
          darkMode={darkMode}
          onPress={() => setLanguagePickerVisible(true)}
        />
        <View style={[styles.separator, darkMode && styles.darkSeparator]} />
        <SettingRow
          icon="logout"
          label={t(language, 'Log out')}
          value=""
          darkMode={darkMode}
          onPress={() =>
            Alert.alert(t(language, 'Log out'), t(language, 'You are currently using a demo profile.'))
          }
        />
      </View>
      <Modal
        visible={languagePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguagePickerVisible(false)}
      >
        <View style={styles.languageOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close language selection"
            style={styles.languageScrim}
            onPress={() => setLanguagePickerVisible(false)}
          />
          <View style={[styles.languageSheet, darkMode && styles.darkSurface]}>
            <View style={styles.languageHandle} />
            <View style={styles.languageHeadingRow}>
              <View style={styles.languageIcon}>
                <Icon name="language" color={colors.blue} size={19} />
              </View>
              <View style={styles.languageHeadingCopy}>
                <Text style={[styles.languageTitle, darkMode && styles.darkText]}>
                  {t(language, 'App language')}
                </Text>
                <Text style={[styles.languageSubtitle, darkMode && styles.darkMuted]}>
                  {t(language, 'Choose your preferred language')}
                </Text>
              </View>
            </View>
            {[
              { id: 'English', native: 'English', subtitle: t(language, 'English') },
              { id: 'Hindi', native: '\u0939\u093f\u0928\u094d\u0926\u0940', subtitle: t(language, 'Hindi') },
            ].map(option => {
              const selected = language === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onLanguageChange?.(option.id);
                    setLanguagePickerVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.languageOption,
                    darkMode && styles.languageOptionDark,
                    selected && styles.languageOptionSelected,
                    selected && darkMode && styles.languageOptionSelectedDark,
                    pressed && { opacity: 0.78 },
                  ]}
                >
                  <View style={styles.languageOptionCopy}>
                    <Text style={[styles.languageNative, darkMode && styles.darkText]}>
                      {option.native}
                    </Text>
                    <Text style={[styles.languageEnglish, darkMode && styles.darkMuted]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <View style={[styles.languageRadio, selected && styles.languageRadioSelected]}>
                    {selected ? <View style={styles.languageRadioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={() => setLanguagePickerVisible(false)}
              style={({ pressed }) => [styles.languageCancel, pressed && { opacity: 0.75 }]}
            >
              <Text style={[styles.languageCancelText, darkMode && styles.darkMuted]}>
                {t(language, 'Cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SectionTitle({ title, darkMode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.yellowDash} />
      <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>{title}</Text>
    </View>
  );
}
