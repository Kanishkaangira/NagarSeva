import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { categories, colors, isIssueResolved } from '../Theme';
import Icon from '../Components/Icon';
import IssueCard from '../Components/IssueCard';
import ScaleButton from '../Components/ScaleButton';
import styles from './Home.styles';

export default function Home({
  issues,
  verified,
  onVerify,
  onReopen,
  onOpenReport,
  onViewReports,
}) {
  const openCount = issues.filter(issue => !isIssueResolved(issue.status)).length;
  const resolvedCount = issues.length - openCount;

  return (
    <>
      <View style={styles.sectionHeading}>
        <View style={styles.yellowDash} />
        <Text style={styles.sectionTitle}>Services</Text>
      </View>
      <View style={styles.serviceGrid}>
        {categories.map((item, index) => (
          <ScaleButton
            key={item.name}
            containerStyle={styles.servicePressable}
            style={[styles.serviceCard, serviceColors[index]]}
            accessibilityLabel={`Report ${item.name.toLowerCase()} issue`}
            onPress={() => onOpenReport(item.name)}
          >
            <View style={styles.serviceIconBox}>
              <Icon
                name={item.icon}
                color={colors.white}
                size={24}
                strokeWidth={2.3}
              />
            </View>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceHint}>Report an issue</Text>
          </ScaleButton>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Summary number={issues.length} label="Reported" />
        <View style={styles.summaryDivider} />
        <Summary number={openCount} label="In progress" />
        <View style={styles.summaryDivider} />
        <Summary number={resolvedCount} label="Resolved" />
      </View>

      <View style={styles.latestHeading}>
        <View style={styles.sectionHeading}>
          <View style={styles.yellowDash} />
          <Text style={styles.sectionTitle}>Latest update</Text>
        </View>
        <ScaleButton style={styles.viewAllButton} onPress={onViewReports}>
          <Text style={styles.linkText}>View all</Text>
          <Icon name="arrowRight" color={colors.blue} size={12} />
        </ScaleButton>
      </View>
      {issues.slice(0, 1).map((issue, index) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isVerified={verified.includes(issue.id)}
          onVerify={() => onVerify(issue.id)}
          onReopen={() => onReopen(issue.id)}
          delay={index * 65}
        />
      ))}

      <View style={styles.noticeCard}>
        <View style={styles.noticeIcon}>
          <Icon name="bell" color="#A56700" size={16} />
        </View>
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>Municipal notice</Text>
          <Text style={styles.noticeText}>
            Sector 15 water cut on 11 Nov, 10 AM to 2 PM.
          </Text>
        </View>
      </View>
    </>
  );
}

export function HomeQuickCard({ onOpenReport }) {
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
          <Text style={styles.quickTagText}>QUICK REPORT</Text>
        </View>
        <Text style={styles.quickTime}>Takes about 1 min</Text>
      </View>
      <View style={styles.quickMain}>
        <View style={styles.quickCopy}>
          <Text style={styles.quickTitle}>Spot a problem nearby?</Text>
          <Text style={styles.quickSubtitle}>
            We’ll connect your report with the right city team.
          </Text>
          <ScaleButton
            style={styles.quickButton}
            onPress={() => onOpenReport()}
          >
            <Text style={styles.quickButtonText}>Report an issue</Text>
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

function Summary({ number, label }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryNumber}>{number}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const serviceColors = [
  { backgroundColor: '#155BC5' },
  { backgroundColor: '#21A8E8' },
  { backgroundColor: '#F3A719' },
  { backgroundColor: '#1DB8B0' },
];
