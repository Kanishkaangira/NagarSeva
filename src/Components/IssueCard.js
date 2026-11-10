import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Text, View } from 'react-native';
import {
  issueCategories,
  colors,
  statusBackground,
  statusColor,
} from '../Theme';
import Icon from './Icon';
import ScaleButton from './ScaleButton';
import styles from './IssueCard.styles';

const stages = ['Reported', 'Assigned', 'In progress', 'Resolved'];

export default function IssueCard({
  issue,
  isVerified,
  onVerify,
  onReopen,
  delay = 0,
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
          <Text style={styles.title}>{issue.title}</Text>
          <Text style={styles.meta}>
            {issue.id} · {issue.date}
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
            {issue.status}
          </Text>
        </View>
      </View>

      <View style={styles.location}>
        <Icon name="location" color={colors.muted} size={12} />
        <Text style={styles.locationText}>{issue.place}</Text>
      </View>

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
                  complete ? styles.timelineLabelActive : null,
                ]}
              >
                {stage}
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
                Thank you for confirming this is fixed.
              </Text>
            </View>
          </View>
        ) : issue.citizenFeedback === 'not_fixed' ? (
          <View style={styles.reviewRequestedBanner}>
            <Icon name="bell" color={colors.blue} size={14} />
            <Text style={styles.reviewRequestedText}>
              Review requested. The city team will check again.
            </Text>
          </View>
        ) : (
          <View style={styles.feedback}>
            <Text style={styles.feedbackTitle}>Has this issue been fixed?</Text>
            <View style={styles.feedbackActions}>
              <ScaleButton style={styles.feedbackYes} onPress={onVerify}>
                <Text style={styles.feedbackYesText}>Yes, fixed</Text>
              </ScaleButton>
              <ScaleButton
                style={styles.feedbackNo}
                onPress={() => {
                  if (onReopen) {
                    onReopen();
                  } else {
                    Alert.alert(
                      "We'll take another look",
                      'Your feedback has been sent to the city team.',
                    );
                  }
                }}
              >
                <Text style={styles.feedbackNoText}>Not fixed</Text>
              </ScaleButton>
            </View>
          </View>
        )
      ) : null}
    </Animated.View>
  );
}
