import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Image, ScrollView, Text, View } from 'react-native';
import {
  issueCategories,
  colors,
  statusBackground,
  statusColor,
} from '../Theme';
import Icon from './Icon';
import ScaleButton from './ScaleButton';
import styles from './IssueCard.styles';
import { t } from '../lib/i18n';

const stages = ['Reported', 'Assigned', 'In progress', 'Resolved'];

export default function IssueCard({
  issue,
  isVerified,
  onVerify,
  onReopen,
  delay = 0,
  darkMode = false,
  language = 'English',
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const stageIndex =
    issue.status === 'Resolved' || issue.status === 'Closed'
      ? 3
      : issue.status === 'In progress' ||
          issue.status === 'In Progress' ||
          issue.status === 'Reopened'
        ? 2
        : issue.status === 'Assigned'
          ? 1
          : 0;
  const isResolved = issue.status === 'Resolved' || issue.status === 'Closed';
  const icon =
    issueCategories.find(item => item.name === issue.category)?.icon ?? 'roads';

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, entrance]);

  return (
    <Animated.View
      style={[
        styles.card,
        darkMode && styles.darkCard,
        {
          borderLeftColor: statusColor[issue.status],
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Icon name={icon} color={colors.navy} size={19} />
        </View>
        <View style={styles.heading}>
        <Text style={[styles.title, darkMode && styles.darkText]}>{t(language, issue.title)}</Text>
          <Text style={[styles.meta, darkMode && styles.darkMuted]}>
            {issue.id} · {t(language, issue.date)}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusBackground[issue.status] },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusColor[issue.status] }]}
          >
            {t(language, issue.status)}
          </Text>
        </View>
      </View>

      <View style={styles.location}>
        <Icon name="location" color={colors.muted} size={12} />
        <Text style={[styles.locationText, darkMode && styles.darkMuted]}>{issue.place}</Text>
      </View>

      {issue.resolutionImages?.length ? (
        <View style={styles.resolutionPhotos}>
              <Text style={[styles.resolutionPhotosTitle, darkMode && styles.darkText]}>{t(language, 'Resolution photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.resolutionPhotosRow}>
              {issue.resolutionImages.map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  style={styles.resolutionPhoto}
                  resizeMode="cover"
                  accessibilityLabel={`Resolution photo ${index + 1}`}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.timeline}>
        {stages.map((stage, index) => {
          const complete = index <= stageIndex;
          return (
            <View key={stage} style={styles.timelineStep}>
              <View style={styles.timelineLineArea}>
                {index < stages.length - 1 ? (
                  <View
                    style={[
                      styles.timelineLine,
                      index < stageIndex
                        ? styles.timelineLineActive
                      : styles.timelineLinePending,
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.timelineDot,
                    complete ? styles.timelineDotComplete : null,
                    index === stageIndex ? styles.timelineDotCurrent : null,
                  ]}
                >
                  {index < stageIndex || isResolved ? (
                    <Icon
                      name="check"
                      color={colors.white}
                      size={9}
                      strokeWidth={3}
                    />
                  ) : null}
                </View>
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  darkMode && styles.darkMuted,
                  complete ? styles.timelineLabelActive : null,
                ]}
              >
                {t(language, stage)}
              </Text>
            </View>
          );
        })}
      </View>

      {isResolved ? (
        isVerified ? (
          <View style={styles.confirmedBanner}>
            <View style={styles.confirmedContent}>
              <Icon name="check" color={colors.green} size={13} strokeWidth={3} />
              <Text style={styles.confirmedText}>
                {t(language, 'Thank you for confirming this is fixed.')}
              </Text>
            </View>
          </View>
        ) : issue.citizenFeedback === 'not_fixed' ? (
          <View style={styles.reviewRequestedBanner}>
            <Icon name="bell" color={colors.blue} size={14} />
            <Text style={styles.reviewRequestedText}>
              {t(language, 'Review requested. The city team will check again.')}
            </Text>
          </View>
        ) : (
          <View style={styles.feedback}>
            <Text style={[styles.feedbackTitle, darkMode && styles.darkText]}>{t(language, 'Has this issue been fixed?')}</Text>
            <View style={styles.feedbackActions}>
              <ScaleButton style={styles.feedbackYes} onPress={onVerify}>
                <Text style={styles.feedbackYesText}>{t(language, 'Yes, fixed')}</Text>
              </ScaleButton>
              <ScaleButton
                style={styles.feedbackNo}
                onPress={() => {
                  if (onReopen) {
                    onReopen();
                  } else {
                    Alert.alert(
                      t(language, "We'll take another look"),
                      t(language, 'Your feedback has been sent to the city team.'),
                    );
                  }
                }}
              >
                <Text style={styles.feedbackNoText}>{t(language, 'Not fixed')}</Text>
              </ScaleButton>
            </View>
          </View>
        )
      ) : null}
    </Animated.View>
  );
}
