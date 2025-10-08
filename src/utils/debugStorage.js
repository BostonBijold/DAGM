// Debug utility to check localStorage
export const debugStorage = () => {
  console.log('=== localStorage Debug ===');
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.log('habitTrackerData:', localStorage.getItem('habitTrackerData'));
  console.log('habitTrackerCurrentUser:', localStorage.getItem('habitTrackerCurrentUser'));
  console.log('========================');
};

// Test function to add sample data
export const addTestData = () => {
  const testData = {
    id: 'test_user_123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    data: {
      routines: [
        {
          id: 1,
          name: "Morning Routine",
          timeOfDay: "morning",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          habits: []
        }
      ],
      habits: [],
      goals: [],
      todos: [],
      habitCompletions: {}
    }
  };
  
  localStorage.setItem('habitTrackerData', JSON.stringify([testData]));
  localStorage.setItem('habitTrackerCurrentUser', testData.id);
  console.log('Test data added to localStorage');
};
