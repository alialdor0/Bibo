import React, { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';

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
