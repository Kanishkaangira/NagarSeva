import React, { useEffect, useRef, useState } from 'react';
import { Alert, StatusBar, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import HomeBottomNav from './src/Navigation/HomeBottomNav';
import StackNavigation from './src/Navigation/StackNavigation';
import Flash from './src/Screens/Flash';
import StartupSplash from './src/Screens/StartupSplash';
import { colors } from './src/Theme';
import {
  createComplaint,
  ensureCitizenSession,
  loadMyComplaints,
  removeComplaintSubscription,
  saveCitizenFeedback,
  subscribeToMyComplaints,
} from './src/lib/complaints';
import styles from './src/App.styles';

function getServiceError(error) {
  if (error?.code === 'anonymous_provider_disabled') {
    return {
      message: 'Citizen sign-in is not enabled yet',
      detail:
        'This project needs anonymous citizen sessions enabled before it can save a report.',
    };
  }
  return {
    message: 'Could not connect to city services',
    detail: error?.message || 'Check your connection and try again.',
  };
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState('Home');
  const [previousScreen, setPreviousScreen] = useState('Home');
  const [issues, setIssues] = useState([]);
  const [verified, setVerified] = useState([]);
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [flash, setFlash] = useState(null);
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowStartupSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!flash) {
      return undefined;
    }
    const timer = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    let active = true;
    let complaintChannel;
    const loadComplaints = async () => {
      try {
        const user = await ensureCitizenSession();
        const reports = await loadMyComplaints();
        if (!active) return;
        setIssues(reports);
        setVerified(
          reports
            .filter(report => report.citizenFeedback === 'fixed')
            .map(report => report.id),
        );
        complaintChannel = subscribeToMyComplaints(user.id, event => {
          if (event.type === 'DELETE') {
            setIssues(current =>
              current.filter(issue => issue.id !== event.complaintNumber),
            );
            return;
          }
          setIssues(current => {
            const exists = current.some(issue => issue.id === event.issue.id);
            const updated = exists
              ? current.map(issue =>
                  issue.id === event.issue.id ? event.issue : issue,
                )
              : [event.issue, ...current];
            return updated.sort(
              (left, right) =>
                new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0),
            );
          });
          if (event.issue.citizenFeedback === 'fixed') {
            setVerified(current =>
              current.includes(event.issue.id)
                ? current
                : [...current, event.issue.id],
            );
          }
        });
      } catch (error) {
        if (active) {
          setFlash(getServiceError(error));
        }
      }
    };

    loadComplaints();
    return () => {
      active = false;
      removeComplaintSubscription(complaintChannel);
    };
  }, []);

  if (showStartupSplash) {
    return <StartupSplash />;
  }

  const openReport = (selectedCategory = '') => {
    setPreviousScreen(screen);
    setTitle('');
    setDetails('');
    setPhoto(null);
    setCategory(selectedCategory);
    setScreen('Report');
  };

  const submitReport = async () => {
    if (submitLock.current) return;

    if (!category) {
      Alert.alert(
        'Select an issue type',
        'Choose the category that best matches the problem.',
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        'Add a short title',
        'Tell us what needs attention before submitting.',
      );
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const report = await createComplaint({
        category,
        title,
        details,
        place: 'Sector 15, New Delhi',
          photo,
      });
      setIssues(current => [report, ...current]);
      setFilter('All');
      setScreen('My reports');
      setFlash({
        message: 'Report submitted',
        detail: `Your report ID is ${report.id}. Track it in My reports.`,
      });
    } catch (error) {
      const serviceError = getServiceError(error);
      setFlash({
        message:
          serviceError.message === 'Could not connect to city services'
            ? 'Report could not be submitted'
            : serviceError.message,
        detail: serviceError.detail,
      });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const confirmFixed = async issueId => {
    try {
      await saveCitizenFeedback(issueId, 'fixed');
      setVerified(current =>
        current.includes(issueId) ? current : [...current, issueId],
      );
      setIssues(current =>
        current.map(issue =>
          issue.id === issueId
            ? { ...issue, citizenFeedback: 'fixed' }
            : issue,
        ),
      );
    } catch (error) {
      setFlash({
        message: 'Feedback could not be saved',
        detail: error.message || 'Check your connection and try again.',
      });
    }
  };

  const requestReview = async issueId => {
    try {
      await saveCitizenFeedback(issueId, 'not_fixed');
      setVerified(current => current.filter(id => id !== issueId));
      setIssues(current =>
        current.map(issue =>
          issue.id === issueId
            ? { ...issue, citizenFeedback: 'not_fixed' }
            : issue,
        ),
      );
      setFlash({
        message: 'Review requested',
        detail: 'The city team has been asked to check this issue again.',
      });
    } catch (error) {
      setFlash({
        message: 'Feedback could not be saved',
        detail: error.message || 'Check your connection and try again.',
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar
        backgroundColor={colors.navy}
        barStyle="light-content"
      />
      <View
        pointerEvents="none"
        style={[
          styles.topStripe,
          {
            top: 0,
            left: -insets.left,
            right: -insets.right,
          },
        ]}
      >
        <View style={[styles.stripeSegment, styles.stripeOrange]} />
        <View style={[styles.stripeSegment, styles.stripeWhite]} />
        <View style={[styles.stripeSegment, styles.stripeGreen]} />
      </View>
      <StackNavigation
        screen={screen}
        onBackReport={() => setScreen(previousScreen)}
        issues={issues}
        filter={filter}
        onFilterChange={setFilter}
        verified={verified}
        onVerify={confirmFixed}
        onReopen={requestReview}
        category={category}
        onCategoryChange={setCategory}
        title={title}
        onTitleChange={setTitle}
        details={details}
        onDetailsChange={setDetails}
        photo={photo}
        onPhotoChange={setPhoto}
        onOpenReport={openReport}
        onSubmitReport={submitReport}
        isSubmitting={isSubmitting}
        onNavigate={nextScreen => {
          setFlash(null);
          setScreen(nextScreen);
        }}
        bottomPadding={
          screen === 'Report'
            ? insets.bottom + 24
            : Math.max(108, insets.bottom + 104)
        }
      />
      {screen !== 'Report' ? (
        <HomeBottomNav
          activeScreen={screen}
          bottomOffset={Math.max(insets.bottom, 12) + 14}
          onNavigate={nextScreen => {
            setFlash(null);
            setScreen(nextScreen);
          }}
        />
      ) : null}
      {flash ? (
        <View pointerEvents="box-none" style={styles.flashContainer}>
          <Flash message={flash.message} detail={flash.detail} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
