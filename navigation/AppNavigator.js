import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import Login      from '../screens/Login';
import Onboarding from '../screens/Onboarding';
import TrackSelect from '../screens/TrackSelect';
import Main       from '../screens/Main';
import Story      from '../screens/Story';
import Dict       from '../screens/Dict';
import Rescue     from '../screens/Rescue';
import Leaderboard from '../screens/Leaderboard';
import Coop       from '../screens/Coop';
import Store      from '../screens/Store';

export default function AppNavigator() {
  const { user, setUser, track, lang, hydrated } = useApp();
  const [screen, setScreen] = useState(null); // null = لسه مستنيين التحميل من التخزين

  const go = (s) => setScreen(s);

  // أول ما بيانات المستخدم تتحمل من AsyncStorage، حدّد الشاشة الأولى:
  // مستخدم مسجل وله مسار مختار -> يدخل على طول للـ main (بدون تسجيل دخول تاني)
  useEffect(() => {
    if (!hydrated || screen !== null) return;
    if (user && track) setScreen('main');
    else if (user && !track) setScreen('trackselect');
    else setScreen('login');
  }, [hydrated, user, track, screen]);

  // لو المستخدم عمل تسجيل خروج وإحنا في نص التطبيق، ارجع لشاشة الدخول
  useEffect(() => {
    if (screen && screen !== 'login' && !user) setScreen('login');
  }, [user]);

  const handleLogin = (type) => {
    setScreen('onboarding');
  };

  const handleOnboardingDone = (userData) => {
    setUser(userData);
    setScreen('trackselect');
  };

  const handleTrackSelect = (selectedTrack) => {
    setScreen('main');
  };

  const handleNav = (dest) => {
    const screens = ['story','dict','rescue','leaderboard','coop','store'];
    if (screens.includes(dest)) setScreen(dest);
  };

  if (!hydrated || screen === null) {
    return (
      <View style={ns.loading}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  let content;
  if (screen === 'login')       content = <Login       onLogin={handleLogin} />;
  else if (screen === 'onboarding')  content = <Onboarding  onDone={handleOnboardingDone} />;
  else if (screen === 'trackselect') content = <TrackSelect  onSelect={handleTrackSelect} />;
  else if (screen === 'main')        content = <Main         onNav={handleNav} />;
  else if (screen === 'story')       content = <Story        onLeave={() => go('main')} />;
  else if (screen === 'dict')        content = <Dict         onBack={() => go('main')} />;
  else if (screen === 'rescue')      content = <Rescue       onBack={() => go('main')} />;
  else if (screen === 'leaderboard') content = <Leaderboard  onBack={() => go('main')} />;
  else if (screen === 'coop')        content = <Coop         onBack={() => go('main')} />;
  else if (screen === 'store')       content = <Store        onBack={() => go('main')} />;
  else content = <Login onLogin={handleLogin} />;

  // لو أي شاشة عطلت، رجّع المستخدم لمكان آمن (main لو مسجل دخول، وإلا login)
  // بدل ما التطبيق كله يقفل.
  const safeScreen = user && track ? 'main' : 'login';

  return (
    <ErrorBoundary lang={lang} resetKey={screen} onReset={() => go(safeScreen)}>
      {content}
    </ErrorBoundary>
  );
}

const ns = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#08080f', alignItems: 'center', justifyContent: 'center' },
});
