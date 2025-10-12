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
          settings: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
          },
          routines: [
            {
              id: 1,
              name: "Morning Routine",
              timeOfDay: "morning",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              habits: [],
              order: 0
            },
            {
              id: 2,
              name: "Afternoon Routine",
              timeOfDay: "afternoon",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
              habits: [],
              order: 1
            },
            {
              id: 3,
              name: "Evening Routine",
              timeOfDay: "evening",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              habits: [],
              order: 2
            }
          ],
          habits: [],
          goals: [],
          todos: [],
          habitCompletions: {},
          habitCompletionTimes: {},
          routineCompletions: {},
          lastResetDate: null,
          dashboardOrder: [] // Array of {type: 'routine'|'habit', id: number, order: number}
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

  async getUserSettings() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.settings || { timezone: "UTC" };
  }

  async getDashboardOrder() {
    const userData = await this.getCurrentUserData();
    return userData?.data?.dashboardOrder || [];
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

  async updateUserSettings(settings) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.settings = settings;
    await this.updateUserData(userData.data);
  }

  async updateDashboardOrder(dashboardOrder) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    userData.data.dashboardOrder = dashboardOrder;
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
          habits: [],
          order: 0
        },
        {
          id: 2,
          name: "Afternoon Routine",
          timeOfDay: "afternoon",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          habits: [],
          order: 1
        },
        {
          id: 3,
          name: "Evening Routine",
          timeOfDay: "evening",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          habits: [],
          order: 2
        }
      ];

      let needsUpdate = false;

      // Check if we need to add any missing default routines
      const existingRoutineIds = userData.data.routines.map(r => r.id);
      const missingRoutines = defaultRoutines.filter(r => !existingRoutineIds.includes(r.id));
      
      if (missingRoutines.length > 0) {
        userData.data.routines = [...userData.data.routines, ...missingRoutines];
        needsUpdate = true;
      }

      // Ensure settings exist
      if (!userData.data.settings) {
        userData.data.settings = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        };
        needsUpdate = true;
      }

      // Ensure dashboardOrder exists
      if (!userData.data.dashboardOrder) {
        userData.data.dashboardOrder = [];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
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

  // Routine CRUD Operations
  async addRoutine(routineData) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    // Check routine limit (max 5)
    if (userData.data.routines.length >= 5) {
      throw new Error('Maximum of 5 routines allowed');
    }
    
    // Generate new ID
    const newId = Math.max(...userData.data.routines.map(r => r.id), 0) + 1;
    
    const newRoutine = {
      id: newId,
      name: routineData.name,
      timeOfDay: routineData.timeOfDay || null,
      days: routineData.days || [],
      habits: [],
      order: userData.data.routines.length
    };
    
    userData.data.routines.push(newRoutine);
    await this.updateUserData(userData.data);
    return newRoutine;
  }

  async updateRoutine(routineId, routineData) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    const routineIndex = userData.data.routines.findIndex(r => r.id === routineId);
    if (routineIndex === -1) throw new Error('Routine not found');
    
    userData.data.routines[routineIndex] = {
      ...userData.data.routines[routineIndex],
      ...routineData
    };
    
    await this.updateUserData(userData.data);
    return userData.data.routines[routineIndex];
  }

  async deleteRoutine(routineId, keepHabitsAsSingles = false) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    const routineIndex = userData.data.routines.findIndex(r => r.id === routineId);
    if (routineIndex === -1) throw new Error('Routine not found');
    
    const routine = userData.data.routines[routineIndex];
    
    // Handle habits in the routine
    if (keepHabitsAsSingles) {
      // Convert routine habits to single habits
      const routineHabits = userData.data.habits.filter(h => h.routineId === routineId);
      routineHabits.forEach(habit => {
        habit.routineId = null;
        habit.trackingType = habit.trackingType || 'simple'; // Default to simple if not set
      });
    } else {
      // Delete habits that belong to this routine
      userData.data.habits = userData.data.habits.filter(h => h.routineId !== routineId);
    }
    
    // Remove routine
    userData.data.routines.splice(routineIndex, 1);
    
    // Reorder remaining routines
    userData.data.routines.forEach((r, index) => {
      r.order = index;
    });
    
    await this.updateUserData(userData.data);
    return true;
  }

  async addSingleHabit(habitData) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    const newId = Math.max(...userData.data.habits.map(h => h.id), 0) + 1;
    
    const newHabit = {
      id: newId,
      name: habitData.name,
      description: habitData.description || '',
      routineId: null, // Single habit
      trackingType: habitData.trackingType || 'simple',
      duration: habitData.duration || null,
      expectedCompletionTime: habitData.expectedCompletionTime || null,
      createdAt: new Date().toISOString()
    };
    
    userData.data.habits.push(newHabit);
    await this.updateUserData(userData.data);
    return newHabit;
  }

  async updateHabit(habitId, habitData) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    const habitIndex = userData.data.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) throw new Error('Habit not found');
    
    userData.data.habits[habitIndex] = {
      ...userData.data.habits[habitIndex],
      ...habitData
    };
    
    await this.updateUserData(userData.data);
    return userData.data.habits[habitIndex];
  }

  async deleteHabit(habitId) {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');
    
    const habitIndex = userData.data.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) throw new Error('Habit not found');
    
    const habit = userData.data.habits[habitIndex];
    
    // If it's a routine habit, remove it from the routine
    if (habit.routineId) {
      const routine = userData.data.routines.find(r => r.id === habit.routineId);
      if (routine) {
        routine.habits = routine.habits.filter(hId => hId !== habitId);
      }
    }
    
    // Remove habit
    userData.data.habits.splice(habitIndex, 1);
    
    await this.updateUserData(userData.data);
    return true;
  }

  // Clear all data (for testing/reset) - Note: This only clears local state, not Firestore
  clearAllData() {
    console.warn('clearAllData() is not supported in Firestore mode. Data is stored in the cloud.');
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;