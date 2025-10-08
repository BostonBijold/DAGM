// Data Service for Habit Tracker
// This service handles data storage and can be easily migrated to Firebase

class DataService {
  constructor() {
    this.storageKey = 'habitTrackerData';
    this.currentUserKey = 'habitTrackerCurrentUser';
  }

  // User Management
  createUser(userName, userEmail = null) {
    const userId = this.generateUserId();
    const userData = {
      id: userId,
      name: userName,
      email: userEmail,
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
          },
          {
            id: 2,
            name: "Afternoon Routine",
            timeOfDay: "afternoon",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            habits: []
          },
          {
            id: 3,
            name: "Evening Routine",
            timeOfDay: "evening",
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

    this.saveUser(userData);
    this.setCurrentUser(userId);
    return userData;
  }

  getCurrentUser() {
    const userId = localStorage.getItem(this.currentUserKey);
    if (!userId) return null;
    
    const allUsers = this.getAllUsers();
    return allUsers.find(user => user.id === userId) || null;
  }

  setCurrentUser(userId) {
    localStorage.setItem(this.currentUserKey, userId);
  }

  getAllUsers() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveUser(userData) {
    const allUsers = this.getAllUsers();
    const existingUserIndex = allUsers.findIndex(user => user.id === userData.id);
    
    if (existingUserIndex >= 0) {
      allUsers[existingUserIndex] = userData;
    } else {
      allUsers.push(userData);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(allUsers));
  }

  deleteUser(userId) {
    const allUsers = this.getAllUsers();
    const filteredUsers = allUsers.filter(user => user.id !== userId);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredUsers));
    
    // If deleted user was current user, clear current user
    const currentUserId = localStorage.getItem(this.currentUserKey);
    if (currentUserId === userId) {
      localStorage.removeItem(this.currentUserKey);
    }
  }

  // Data Management for Current User
  getCurrentUserData() {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.data : null;
  }

  updateCurrentUserData(data) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    currentUser.data = data;
    currentUser.lastActive = new Date().toISOString();
    this.saveUser(currentUser);
    return true;
  }

  // Specific Data Getters
  getRoutines() {
    const userData = this.getCurrentUserData();
    return userData ? userData.routines : [];
  }

  getHabits() {
    const userData = this.getCurrentUserData();
    return userData ? userData.habits : [];
  }

  getGoals() {
    const userData = this.getCurrentUserData();
    return userData ? userData.goals : [];
  }

  getTodos() {
    const userData = this.getCurrentUserData();
    return userData ? userData.todos : [];
  }

  getHabitCompletions() {
    const userData = this.getCurrentUserData();
    return userData ? userData.habitCompletions : {};
  }

  // Specific Data Setters
  updateRoutines(routines) {
    const userData = this.getCurrentUserData();
    if (!userData) return false;
    
    userData.routines = routines;
    return this.updateCurrentUserData(userData);
  }

  updateHabits(habits) {
    const userData = this.getCurrentUserData();
    if (!userData) return false;
    
    userData.habits = habits;
    return this.updateCurrentUserData(userData);
  }

  updateGoals(goals) {
    const userData = this.getCurrentUserData();
    if (!userData) return false;
    
    userData.goals = goals;
    return this.updateCurrentUserData(userData);
  }

  updateTodos(todos) {
    const userData = this.getCurrentUserData();
    if (!userData) return false;
    
    userData.todos = todos;
    return this.updateCurrentUserData(userData);
  }

  updateHabitCompletions(habitCompletions) {
    const userData = this.getCurrentUserData();
    if (!userData) return false;
    
    userData.habitCompletions = habitCompletions;
    return this.updateCurrentUserData(userData);
  }

  // Data Export/Import
  exportUserData(userId = null) {
    const targetUserId = userId || this.getCurrentUser()?.id;
    if (!targetUserId) return null;

    const allUsers = this.getAllUsers();
    const user = allUsers.find(u => u.id === targetUserId);
    
    if (!user) return null;

    return {
      version: "1.0",
      exportDate: new Date().toISOString(),
      userData: user.data,
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    };
  }

  importUserData(importData, userId = null) {
    const targetUserId = userId || this.getCurrentUser()?.id;
    if (!targetUserId || !importData.userData) return false;

    const allUsers = this.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === targetUserId);
    
    if (userIndex < 0) return false;

    allUsers[userIndex].data = importData.userData;
    allUsers[userIndex].lastActive = new Date().toISOString();
    
    localStorage.setItem(this.storageKey, JSON.stringify(allUsers));
    return true;
  }

  // Utility Functions
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Firebase Migration Helpers (for future use)
  prepareForFirebase() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    return {
      userId: currentUser.id,
      userInfo: {
        name: currentUser.name,
        email: currentUser.email,
        createdAt: currentUser.createdAt,
        lastActive: currentUser.lastActive
      },
      userData: currentUser.data
    };
  }

  // Clear all data (for testing/reset)
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.currentUserKey);
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;
