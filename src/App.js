import React from 'react';
import HabitGoalTracker from './components/HabitGoalTracker';
import AuthWrapper from './components/AuthWrapper';

function App() {
  return (
    <AuthWrapper>
      <HabitGoalTracker />
    </AuthWrapper>
  );
}

export default App;
