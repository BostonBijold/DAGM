import React from 'react';
import HabitGoalTracker from './components/HabitGoalTracker';
import AuthWrapper from './components/AuthWrapper';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthWrapper>
        <HabitGoalTracker />
      </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App;
