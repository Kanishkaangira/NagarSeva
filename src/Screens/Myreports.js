import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from '../Components/Icon';
import IssueCard from '../Components/IssueCard';
import ScaleButton from '../Components/ScaleButton';
import { colors, isIssueResolved } from '../Theme';
import styles from './Myreports.styles';
import { t } from '../lib/i18n';

const filters = ['All', 'Open', 'Resolved'];

export function MyreportsHeader({ issues, filter, onFilterChange, darkMode = false, language = 'English' }) {
  const openCount = issues.filter(issue => !isIssueResolved(issue.status)).length;
  const resolvedCount = issues.length - openCount;
  const visibleCount =
    filter === 'Open' ? openCount : filter === 'Resolved' ? resolvedCount : issues.length;

  return (
    <View>
      <View style={[styles.overviewCard, darkMode && styles.darkSurface]}>
        <View style={styles.overviewHeader}>
          <View style={styles.overviewIcon}>
            <Icon name="reports" color={colors.blue} size={17} />
          </View>
          <View style={styles.overviewCopy}>
            <Text style={[styles.overviewTitle, darkMode && styles.darkText]}>{t(language, 'Report overview')}</Text>
            <Text style={[styles.overviewSubtitle, darkMode && styles.darkMuted]}>{t(language, 'Your civic requests at a glance')}</Text>
          </View>
          <Text style={styles.totalBadge}>{issues.length} {t(language, 'total')}</Text>
        </View>
        <View style={styles.overviewMetrics}>
          <Metric number={openCount} label={t(language, 'Open')} color={colors.blue} />
          <View style={styles.metricDivider} />
          <Metric number={resolvedCount} label={t(language, 'Resolved')} color={colors.green} />
        </View>
      </View>

      <View style={styles.filterHeading}>
          <Text style={[styles.filterHeadingText, darkMode && styles.darkText]}>{t(language, 'Filter reports')}</Text>
        <Text style={styles.filterHint}>{t(language, 'By status')}</Text>
      </View>
      <View style={[styles.filterBar, darkMode && styles.darkFilterBar]}>
        {filters.map(item => {
          const count =
            item === 'All'
              ? issues.length
              : item === 'Open'
                ? openCount
                : resolvedCount;
          const active = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onFilterChange(item)}
              style={({ pressed }) => [
                styles.filterButton,
                darkMode && styles.darkFilterButton,
                active && styles.filterButtonActive,
                active && darkMode && styles.darkFilterButtonActive,
                pressed && { opacity: 0.78 },
              ]}
            >
              <Text style={[styles.filterText, darkMode && styles.darkMuted, active && styles.filterTextActive, active && darkMode && styles.darkText]}>
                {t(language, item)}
              </Text>
              <View style={[styles.filterCount, active && styles.filterCountActive]}>
                <Text
                  style={[
                    styles.filterCountText,
                    active && styles.filterCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.reportsHeading}>
        <Text style={[styles.filterHeadingText, darkMode && styles.darkText]}>{t(language, 'Your reports')}</Text>
        <Text style={styles.filterHint}>{visibleCount} {t(language, 'shown')}</Text>
      </View>
    </View>
  );
}

export default function Myreports({
  issues,
  filter,
  verified,
  onVerify,
  onReopen,
  onOpenReport,
  darkMode = false,
  language = 'English',
}) {
    const visible = issues.filter(issue => {
      if (filter === 'Open') return !isIssueResolved(issue.status);
      if (filter === 'Resolved') return isIssueResolved(issue.status);
    return true;
  });

  return (
    <>
      {visible.length ? (
        visible.map((issue, index) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            darkMode={darkMode}
            language={language}
            isVerified={verified.includes(issue.id)}
            onVerify={() => onVerify(issue.id)}
            onReopen={() => onReopen(issue.id)}
            delay={index * 55}
          />
        ))
      ) : (
        <View style={[styles.emptyState, darkMode && styles.darkSurface]}>
          <View style={styles.emptyIcon}>
            <Icon name="reports" size={22} />
          </View>
          <Text style={[styles.emptyTitle, darkMode && styles.darkText]}>{t(language, 'No reports in this list')}</Text>
          <Text style={[styles.emptyText, darkMode && styles.darkMuted]}>{t(language, 'Your future updates will show here.')}</Text>
        </View>
      )}
      <ScaleButton style={styles.outlineButton} onPress={() => onOpenReport()}>
        <Icon name="plus" color={colors.white} size={15} />
        <Text style={styles.outlineButtonText}> {t(language, 'Report a new issue')}</Text>
      </ScaleButton>
    </>
  );
}

function Metric({ number, label, color }) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricNumber, { color }]}>{number}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
