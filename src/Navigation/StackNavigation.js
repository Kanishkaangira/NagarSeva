import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import Home, { HomeQuickCard } from '../Screens/Home';
import Myreports, { MyreportsHeader } from '../Screens/Myreports';
import Notifications from '../Screens/Notificatio';
import Profile from '../Screens/Profile';
import Report, { ReportHeader } from '../Screens/Report';
import ScreenHeader from '../Components/ScreenHeader';
import ReportCityBackdrop from '../Components/ReportCityBackdrop';
import styles from './StackNavigation.styles';

export default function StackNavigation({
  screen,
  issues,
  filter,
  onFilterChange,
  verified,
  onVerify,
  onReopen,
  category,
  onCategoryChange,
  title,
  onTitleChange,
  details,
  onDetailsChange,
  photo,
  onPhotoChange,
  onOpenReport,
  onBackReport,
  onSubmitReport,
  isSubmitting,
  onNavigate,
  bottomPadding,
}) {
  const animation = useRef(new Animated.Value(0)).current;
  const [homeTopHeight, setHomeTopHeight] = React.useState(167);
  const [reportHeaderHeight, setReportHeaderHeight] = React.useState(221);
  const [myReportsHeaderHeight, setMyReportsHeaderHeight] = React.useState(225);

  useEffect(() => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animation, screen]);

  const titleCopy = {
    Home: {
      greeting: 'NAMASTE,',
      title: 'Ananya Sharma',
      subtitle: 'Small actions make a better city.',
    },
    'My reports': {
      greeting: 'CITIZEN SERVICES',
      title: 'My reports',
      subtitle: 'Track each issue from report to resolution.',
    },
    Profile: {
      greeting: 'CITIZEN SERVICES',
      title: 'Profile',
      subtitle: 'Manage your citizen details.',
    },
    Report: {
      greeting: 'LET’S MAKE A DIFFERENCE',
      title: 'Report an issue',
      subtitle: 'A few details help the right team respond.',
    },
    Notifications: {
      greeting: 'STAY IN THE LOOP',
      title: 'Notifications',
      subtitle: 'Updates from your city team.',
    },
  }[screen];

  let content;
  if (screen === 'Home') {
    content = (
      <Home
        issues={issues}
        verified={verified}
        onVerify={onVerify}
        onReopen={onReopen}
        onOpenReport={onOpenReport}
        onViewReports={() => onNavigate('My reports')}
      />
    );
  } else if (screen === 'Report') {
    content = (
      <Report
        category={category}
        onCategoryChange={onCategoryChange}
        title={title}
        onTitleChange={onTitleChange}
        details={details}
        onDetailsChange={onDetailsChange}
        photo={photo}
        onPhotoChange={onPhotoChange}
        onSubmit={onSubmitReport}
        isSubmitting={isSubmitting}
      />
    );
  } else if (screen === 'My reports') {
    content = (
      <Myreports
        issues={issues}
        filter={filter}
        onFilterChange={onFilterChange}
        verified={verified}
        onVerify={onVerify}
        onReopen={onReopen}
        onOpenReport={onOpenReport}
      />
    );
  } else if (screen === 'Profile') {
    content = <Profile issues={issues} />;
  } else {
    content = <Notifications issues={issues} />;
  }

  return (
    <View style={styles.container}>
      {screen === 'Report' ? <ReportCityBackdrop /> : null}
      {screen === 'My reports' ? (
        <View
          style={[styles.reportsPinned, { top: 130 }]}
          onLayout={({ nativeEvent }) => {
            const measuredHeight = nativeEvent.layout.height;
            setMyReportsHeaderHeight(current =>
              current === measuredHeight ? current : measuredHeight,
            );
          }}
        >
          <View style={styles.reportsPinnedContent}>
            <MyreportsHeader
              issues={issues}
              filter={filter}
              onFilterChange={onFilterChange}
            />
          </View>
        </View>
      ) : null}
      {screen === 'Report' ? (
        <View
          style={styles.reportHeader}
          onLayout={({ nativeEvent }) => {
            const measuredHeight = nativeEvent.layout.height;
            setReportHeaderHeight(current =>
              current === measuredHeight ? current : measuredHeight,
            );
          }}
        >
          <ReportHeader onHome={() => onNavigate('Home')} />
        </View>
      ) : null}
      {screen !== 'Report' ? (
        <ScreenHeader
          {...titleCopy}
          showCitizenTag={screen === 'Home'}
          onNotifications={() => onNavigate('Notifications')}
          onProfile={() => onNavigate('Profile')}
        />
      ) : null}
      {screen === 'Home' ? (
        <View
          style={[styles.homePinned, { top: 130 }]}
          onLayout={({ nativeEvent }) => {
            const measuredHeight = nativeEvent.layout.height;
            setHomeTopHeight(current =>
              current === measuredHeight ? current : measuredHeight,
            );
          }}
        >
          <View style={styles.homePinnedContent}>
            <HomeQuickCard onOpenReport={onOpenReport} />
          </View>
        </View>
      ) : null}
      <ScrollView
        style={[
          styles.scrollView,
          screen === 'My reports' ? styles.reportsScroll : null,
          screen === 'Home' ? { top: 130 + homeTopHeight } : null,
          screen === 'My reports' ? { top: 130 + myReportsHeaderHeight } : null,
          screen === 'Report' ? { top: reportHeaderHeight } : null,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.body,
          screen === 'Home' ? styles.homeBody : null,
          screen === 'My reports' ? styles.reportsBody : null,
          screen === 'Report' ? styles.reportBody : null,
          { paddingBottom: bottomPadding },
        ]}
      >
        <Animated.View
          style={{
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          {content}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
