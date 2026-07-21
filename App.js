import React, { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import { initCrashReporting } from './utils/crashReporting';

// بيتفعّل أول ما الملف ده يتحمّل (قبل أي رندر) — عشان يلتقط أي خطأ من أول لحظة.
// لو الـ DSN مش متحطوط بـ utils/sentryConfig.js، الدالة دي بترجع فورًا من غير أي تأثير.
initCrashReporting();

export default function App() {
  const [bootKey, setBootKey] = useState(0);
  const handleReset = useCallback(() => setBootKey(k => k + 1), []);

  return (
    <ErrorBoundary lang="ar" onReset={handleReset}>
      <AppProvider key={bootKey}>
        <AppNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}
