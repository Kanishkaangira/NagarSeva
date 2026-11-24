import React from 'react';
import { Text, View } from 'react-native';
import { statusColor } from '../Theme';
import Icon from '../Components/Icon';
import styles from './Notificatio.styles';
import { t } from '../lib/i18n';

export default function Notifications({ issues, darkMode = false, language = 'English' }) {
  const updates = issues.slice(0, 3);

  return (
    <>
      {updates.map((issue, index) => (
        <View key={issue.id} style={[styles.card, darkMode && styles.darkCard]}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${statusColor[issue.status]}18` },
            ]}
          >
            <Icon name="bell" color={statusColor[issue.status]} size={17} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, darkMode && styles.darkText]}>
                {issue.status === 'Resolved' || issue.status === 'Closed'
                ? t(language, 'Your issue was resolved')
                  : issue.status === 'In progress' || issue.status === 'In Progress'
                ? t(language, 'Work has started on your report')
                : t(language, 'Your report was assigned')}
            </Text>
            <Text style={[styles.description, darkMode && styles.darkMuted]}>{t(language, issue.title)}</Text>
            <Text style={[styles.time, darkMode && styles.darkMuted]}>
              {t(language, index === 0 ? 'Today' : issue.date)} · {issue.id}
            </Text>
          </View>
        </View>
      ))}
      <View style={[styles.notice, darkMode && styles.darkNotice]}>
        <Text style={styles.noticeTitle}>{t(language, "You are up to date")}</Text>
        <Text style={styles.noticeText}>
          {t(language, "We will let you know when the city team updates your reports.")}
        </Text>
      </View>
    </>
  );
}
