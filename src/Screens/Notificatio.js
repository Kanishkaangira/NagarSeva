import React from 'react';
import { Text, View } from 'react-native';
import { statusColor } from '../Theme';
import Icon from '../Components/Icon';
import styles from './Notificatio.styles';

export default function Notifications({ issues }) {
  const updates = issues.slice(0, 3);

  return (
    <>
      {updates.map((issue, index) => (
        <View key={issue.id} style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${statusColor[issue.status]}18` },
            ]}
          >
            <Icon name="bell" color={statusColor[issue.status]} size={17} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>
                {issue.status === 'Resolved' || issue.status === 'Closed'
                ? 'Your issue was resolved'
                  : issue.status === 'In progress' || issue.status === 'In Progress'
                ? 'Work has started on your report'
                : 'Your report was assigned'}
            </Text>
            <Text style={styles.description}>{issue.title}</Text>
            <Text style={styles.time}>
              {index === 0 ? 'Today' : issue.date} · {issue.id}
            </Text>
          </View>
          {index === 0 ? <View style={styles.unreadDot} /> : null}
        </View>
      ))}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>You’re up to date</Text>
        <Text style={styles.noticeText}>
          We’ll let you know when the city team updates your reports.
        </Text>
      </View>
    </>
  );
}
