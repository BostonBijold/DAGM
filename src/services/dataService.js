// Firestore Data Service for Habit Tracker
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import authService from './authService';

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return db !== undefined;
};

class DataService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    
    // Listen to auth state changes
    authService.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  // Get current user ID
  getCurrentUserId() {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }
    return this.currentUser?.uid;
  }

  // Get user document reference
  getUserDocRef() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('No authenticated user');
    return doc(db, 'users', userId);
  }

  // Initialize user data with default structure
  async initializeUserData() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('No authenticated user');

    const userDocRef = this.getUserDocRef();
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create new user document with default data
      const defaultData = {
        userInfo: {
          name: this.currentUser.name,
          email: this.currentUser.email,
          photoURL: this.currentUser.photoURL,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        },
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
          habitCompletions: {},
          habitCompletionTimes: {},
          routineCompletions: {},
          lastResetDate: null
        }
      };

      await setDoc(userDocRef, defaultData);
      return defaultData;
    }

    return userDoc.data();
  }

  // Get current user data
  async getCurrentUserData() {
    try {
      const userDocRef = this.getUserDocRef();
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return await this.initializeUserData();
      }
      
      return userDoc.data();
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Update user data
  async updateUserData(data) {
    try {
      const userDocRef = this.getUserDocRef();
      await updateDoc(userDocRef, {
        'data': data,
        'userInfo.lastActive': serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Specific Data Getters
  async getRoutines() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.routines || [];
  }

  async getHabits() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.habits || [];
  }

  async getGoals() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.goals || [];
  }

  async getTodos() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.todos || [];
  }

  async getHabitCompletions() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.habitCompletions || {};
  }

  async getHabitCompletionTimes() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.habitCompletionTimes || {};
  }

  async getRoutineCompletions() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.routineCompletions || {};
  }

  async getLastResetDate() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.lastResetDate || null;
  }

  // Specific Data Setters
  async updateRoutines(routines) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.routines = routines;
    await this.updateUserData(userData.data);
  }

  async updateHabits(habits) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.habits = habits;
    await this.updateUserData(userData.data);
  }

  async updateGoals(goals) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.goals = goals;
    await this.updateUserData(userData.data);
  }

  async updateTodos(todos) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.todos = todos;
    await this.updateUserData(userData.data);
  }

  async updateHabitCompletions(habitCompletions) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.habitCompletions = habitCompletions;
    await this.updateUserData(userData.data);
  }

  async updateHabitCompletionTimes(habitCompletionTimes) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.habitCompletionTimes = habitCompletionTimes;
    await this.updateUserData(userData.data);
  }

  async updateRoutineCompletions(routineCompletions) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.routineCompletions = routineCompletions;
    await this.updateUserData(userData.data);
  }

  async updateLastResetDate(dateString) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.lastResetDate = dateString;
    await this.updateUserData(userData.data);
  }

  // Data Export/Import
  async exportUserData() {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return null;

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        userData: userData.data,
        userInfo: userData.userInfo
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  async importUserData(importData) {
    try {
      if (!importData.userData) throw new Error('Invalid import data');

      const userData = await this.getCurrentUserData();
      if (!userData) throw new Error('No user data found');

      userData.data = importData.userData;
      await this.updateUserData(userData.data);
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      throw error;
    }
  }

  // Ensure default routines exist for current user
  async ensureDefaultRoutines() {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      const defaultRoutines = [
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
      ];

      // Check if we need to add any missing default routines
      const existingRoutineIds = userData.data.routines.map(r => r.id);
      const missingRoutines = defaultRoutines.filter(r => !existingRoutineIds.includes(r.id));
      
      if (missingRoutines.length > 0) {
        userData.data.routines = [...userData.data.routines, ...missingRoutines];
        await this.updateUserData(userData.data);
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring default routines:', error);
      return false;
    }
  }

  // Utility Functions
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all data (for testing/reset) - Note: This only clears local state, not Firestore
  clearAllData() {
    console.warn('clearAllData() is not supported in Firestore mode. Data is stored in the cloud.');
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;