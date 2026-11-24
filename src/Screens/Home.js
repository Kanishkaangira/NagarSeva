import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { categories, colors, isIssueResolved } from '../Theme';
import Icon from '../Components/Icon';
import IssueCard from '../Components/IssueCard';
import ScaleButton from '../Components/ScaleButton';
import styles from './Home.styles';
import { t } from '../lib/i18n';

export default function Home({
  issues,
  verified,
  onVerify,
  onReopen,
  onOpenReport,
  onViewReports,
  darkMode = false,
  language = 'English',
}) {
  return (
    <>
      <View style={styles.sectionHeading}>
        <View style={styles.yellowDash} />
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>{t(language, 'Services')}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.serviceGrid}
      >
        {categories.map((item, index) => (
          <ScaleButton
            key={item.name}
            containerStyle={styles.servicePressable}
            style={[styles.serviceCard, darkMode && styles.darkSurface]}
            accessibilityLabel={`${t(language, 'Report issue')}: ${t(language, item.name)}`}
            onPress={() => onOpenReport(item.name)}
          >
            <View style={styles.serviceCardHeader}>
              <View
                style={[
                  styles.serviceIconBox,
                  { backgroundColor: serviceIconTints[index] },
                ]}
              >
                <Icon
                  name={item.icon}
                  color={serviceAccentColors[index]}
                  size={21}
                  strokeWidth={2.2}
                />
              </View>
              <View style={styles.serviceArrowBox}>
                <Icon name="arrowRight" color="#91A1BB" size={12} />
              </View>
            </View>
            <Text style={[styles.serviceName, darkMode && styles.darkText]}>{t(language, item.name)}</Text>
            <View style={styles.serviceCardFooter}>
              <View
                style={[
                  styles.serviceDot,
                  { backgroundColor: serviceAccentColors[index] },
                ]}
              />
              <Text style={[styles.serviceHint, darkMode && styles.darkMuted]}>{t(language, 'Report issue')}</Text>
            </View>
          </ScaleButton>
        ))}
      </ScrollView>

      <View style={styles.latestHeading}>
        <View style={styles.sectionHeading}>
          <View style={styles.yellowDash} />
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>{t(language, 'Latest update')}</Text>
        </View>
        <ScaleButton style={styles.viewAllButton} onPress={onViewReports}>
          <Text style={styles.linkText}>{t(language, 'View all')}</Text>
          <Icon name="arrowRight" color={colors.blue} size={12} />
        </ScaleButton>
      </View>
      {issues.slice(0, 1).map((issue, index) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          darkMode={darkMode}
          language={language}
          isVerified={verified.includes(issue.id)}
          onVerify={() => onVerify(issue.id)}
          onReopen={() => onReopen(issue.id)}
          delay={index * 65}
        />
      ))}

      <View style={[styles.noticeCard, darkMode && styles.darkNotice]}>
        <View style={styles.noticeIcon}>
          <Icon name="bell" color="#A56700" size={16} />
        </View>
        <View style={styles.noticeCopy}>
          <Text style={[styles.noticeTitle, darkMode && styles.darkNoticeTitle]}>{t(language, 'Municipal notice')}</Text>
          <Text style={[styles.noticeText, darkMode && styles.darkNoticeText]}>
            {t(language, 'Sector 15 water cut on 11 Nov, 10 AM to 2 PM.')}
          </Text>
        </View>
      </View>
    </>
  );
}

export function HomeQuickCard({ onOpenReport, darkMode = false, language = 'English' }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const enterAnimation = Animated.spring(entrance, {
      toValue: 1,
      speed: 18,
      bounciness: 2,
      useNativeDriver: true,
    });
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    enterAnimation.start();
    pulseAnimation.start();
    return () => {
      enterAnimation.stop();
      pulseAnimation.stop();
    };
  }, [entrance, pulse]);

  return (
    <Animated.View
      style={[
        styles.quickCard,
        darkMode && styles.darkQuickCard,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.quickGlow} />
      <View style={styles.quickOrb} />
      <View style={styles.quickTop}>
        <View style={styles.quickTag}>
          <View style={styles.quickTagDot} />
          <Text style={styles.quickTagText}>{t(language, 'QUICK REPORT')}</Text>
        </View>
        <Text style={styles.quickTime}>{t(language, 'Takes about 1 min')}</Text>
      </View>
      <View style={styles.quickMain}>
        <View style={styles.quickCopy}>
          <Text style={[styles.quickTitle, darkMode && styles.darkQuickTitle]}>{t(language, 'Spot a problem nearby?')}</Text>
          <Text style={[styles.quickSubtitle, darkMode && styles.darkQuickSubtitle]}>
            {t(language, 'We will connect your report with the right city team.') }
          </Text>
          <ScaleButton
            style={styles.quickButton}
            onPress={() => onOpenReport()}
          >
            <Text style={styles.quickButtonText}>{t(language, 'Report an issue')}</Text>
            <Icon name="arrowRight" color={colors.white} size={15} />
          </ScaleButton>
        </View>
        <Animated.View
          style={[
            styles.quickCameraOuter,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1.04],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.quickCameraInner}>
            <Icon name="camera" color={colors.white} size={27} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function HomeSummary({ issues, darkMode = false, language = 'English' }) {
  const openCount = issues.filter(issue => !isIssueResolved(issue.status)).length;
  const resolvedCount = issues.length - openCount;

  return (
    <View style={[styles.summaryRow, darkMode && styles.darkSurface]}>
      <Summary number={issues.length} label={t(language, 'Reported')} darkMode={darkMode} />
      <View style={[styles.summaryDivider, darkMode && styles.darkDivider]} />
      <Summary number={openCount} label={t(language, 'In progress')} darkMode={darkMode} />
      <View style={[styles.summaryDivider, darkMode && styles.darkDivider]} />
      <Summary number={resolvedCount} label={t(language, 'Resolved')} darkMode={darkMode} />
    </View>
  );
}

function Summary({ number, label, darkMode }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryNumber, darkMode && styles.darkText]}>{number}</Text>
      <Text style={[styles.summaryLabel, darkMode && styles.darkMuted]}>{label}</Text>
    </View>
  );
}

const serviceAccentColors = [
  '#1766D1',
  '#6757C8',
  '#1686B7',
  '#3965A7',
  '#D99412',
  '#139B92',
  '#548A32',
  '#1385A1',
  '#6075A3',
  '#C77923',
];

const serviceIconTints = [
  '#EAF2FF',
  '#F0EDFF',
  '#E8F6FB',
  '#EDF2FA',
  '#FFF5E2',
  '#E6F7F4',
  '#EFF7E8',
  '#E8F6F9',
  '#EEF1F8',
  '#FFF1E4',
];
