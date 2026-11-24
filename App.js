import React, { useEffect, useRef, useState } from 'react';
import { Alert, StatusBar, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { t } from './src/lib/i18n';
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
  const detail = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `Error code: ${error.code}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  return {
    message: 'Could not connect to city services',
    detail: detail || 'Check your connection and try again.',
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
  const [districtId, setDistrictId] = useState(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const submitLock = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('nagar-seva-dark-mode')
      .then(value => setDarkMode(value === 'true'))
      .catch(() => {});
    AsyncStorage.getItem('nagar-seva-language')
      .then(value => {
        if (value === 'English' || value === 'Hindi') setLanguage(value);
      })
      .catch(() => {});
  }, []);

  const updateDarkMode = enabled => {
    setDarkMode(enabled);
    AsyncStorage.setItem('nagar-seva-dark-mode', String(enabled)).catch(() => {});
  };
  const updateLanguage = selectedLanguage => {
    setLanguage(selectedLanguage);
    AsyncStorage.setItem('nagar-seva-language', selectedLanguage).catch(() => {});
  };
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
    const timer = setTimeout(() => setFlash(null), 4200);
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
    return <StartupSplash language={language} />;
  }

  const openReport = (selectedCategory = '') => {
    setPreviousScreen(screen);
    setTitle('');
    setDetails('');
    setPlace('');
    setDistrictId(null);
    setCoordinates(null);
    setPhoto(null);
    setCategory(selectedCategory);
    setScreen('Report');
  };

  const submitReport = async () => {
    if (submitLock.current) return;

    if (
      !photo?.uri ||
      !Number.isFinite(photo?.gps?.latitude) ||
      !Number.isFinite(photo?.gps?.longitude)
    ) {
      Alert.alert(
        t(language, 'Add a GPS photo'),
        t(language, 'Choose a photo with verifiable GPS location before submitting your report.'),
      );
      return;
    }

    if (!category) {
      Alert.alert(
        t(language, 'Select an issue type'),
        t(language, 'Choose the category that best matches the problem.'),
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        t(language, 'Add a short title'),
        t(language, 'Tell us what needs attention before submitting.'),
      );
      return;
    }

    if (
      !coordinates ||
      !Number.isFinite(coordinates.latitude) ||
      !Number.isFinite(coordinates.longitude)
    ) {
      Alert.alert(
        t(language, 'Add your current location'),
        t(language, 'Use the location button in step 4 before submitting your report.'),
      );
      return;
    }

    if (!districtId) {
      Alert.alert(
        t(language, 'Select your district'),
        t(language, 'Choose the district where the problem is located.'),
      );
      return;
    }

    if (!place.trim()) {
      Alert.alert(
        t(language, 'Add the issue location'),
        t(language, 'Enter a street, sector, village, or nearby landmark.'),
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
        place: place.trim(),
        districtId,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        photo,
      });
      setIssues(current => [report, ...current]);
      setFilter('All');
      setScreen('Home');
      setFlash({
        message: t(language, 'Report submitted successfully'),
        detail: `${t(language, 'Your report ID is')} ${report.id}. ${t(language, 'Track it in My reports.')}.`,
      });
    } catch (error) {
      const serviceError = getServiceError(error);
      Alert.alert(
        serviceError.message === 'Could not connect to city services'
          ? t(language, 'Report could not be submitted')
          : t(language, serviceError.message),
        t(language, serviceError.detail),
      );
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
        message: t(language, 'Feedback could not be saved'),
        detail: t(language, error.message || 'Check your connection and try again.'),
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
        message: t(language, 'Review requested'),
        detail: t(language, 'The city team has been asked to check this issue again.'),
      });
    } catch (error) {
      setFlash({
        message: t(language, 'Feedback could not be saved'),
        detail: t(language, error.message || 'Check your connection and try again.'),
      });
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, darkMode && styles.safeDark]}
    >
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
        darkMode={darkMode}
        onDarkModeChange={updateDarkMode}
        language={language}
        onLanguageChange={updateLanguage}
        onBackReport={() => setScreen(previousScreen)}
        issues={issues}
        filter={filter}
        onFilterChange={setFilter}
        verified={verified}
        onVerify={confirmFixed}
        onReopen={requestReview}
        category={category}
        onCategoryChange={setCategory}
        districtId={districtId}
        onDistrictChange={setDistrictId}
        place={place}
        onPlaceChange={setPlace}
        coordinates={coordinates}
        onCoordinatesChange={setCoordinates}
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
          darkMode={darkMode}
          language={language}
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
