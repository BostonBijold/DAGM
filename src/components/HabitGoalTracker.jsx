import React, { useState, useEffect } from 'react';
import { Check, Circle, Plus, X, ChevronRight, Home, Target, Calendar, CheckSquare, Edit2, Trash2, Download, Upload, TrendingUp, ChevronLeft, User, Play, SkipBack, SkipForward, CheckCircle, GripVertical, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import dataService from '../services/dataService';
import authService from '../services/authService';
import ActiveRoutineScreen from './ActiveRoutineScreen';
import VirtueCheckInModal from './VirtueCheckInModal';

const HabitGoalTracker = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Utility function to format minutes as hours:minutes
  const formatMinutesToHours = (minutes) => {
    if (!minutes || minutes < 0) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Utility function to check if active routine is from previous day
  const isRoutineFromPreviousDay = (routineStartTime) => {
    const routineDate = new Date(routineStartTime).toDateString();
    const today = new Date().toDateString();
    return routineDate !== today;
  };
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedGoalForTask, setSelectedGoalForTask] = useState(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [showRoutineEditModal, setShowRoutineEditModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showHabitEditModal, setShowHabitEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [activeTimers, setActiveTimers] = useState({});
  const [timerDurations, setTimerDurations] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [timerUpdateTrigger, setTimerUpdateTrigger] = useState(0);
  const [showUserManager, setShowUserManager] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [quotes, setQuotes] = useState([]);
  
  // New state for routine and single habit management
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [showAddSingleHabitModal, setShowAddSingleHabitModal] = useState(false);
  const [dashboardOrder, setDashboardOrder] = useState([]);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [showOrderRoutinesModal, setShowOrderRoutinesModal] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  
  
  // Fallback quotes if no quotes are loaded from Firestore
  const fallbackQuotes = [
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts repeated day in and day out.",
    "You don't have to be great to start, but you have to start to be great.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there."
  ];
  
  // "What Is A Good Man?" virtues for weekly focus
  const weeklyFocuses = [
    { 
      virtue: "Present", 
      focus: "A Good Man Is Present. Be fully where you are this week.",
      description: "Being present means giving your full attention to the current moment, whether in conversation, work, or daily activities. It's about being mentally and emotionally engaged rather than distracted by past regrets or future worries. Practice this by putting away your phone during conversations, focusing on one task at a time, and truly listening when others speak."
    },
    { 
      virtue: "Determined", 
      focus: "A Good Man Is Determined. Know your why and stand firm this week.",
      description: "Determination is the unwavering commitment to your goals and values, even when faced with obstacles or setbacks. It means having a clear sense of purpose and the persistence to see things through. Practice this by setting clear daily intentions, staying committed to your routines, and not giving up when things get difficult."
    },
    { 
      virtue: "Confident", 
      focus: "A Good Man Is Confident. Keep your promises to yourself this week.",
      description: "True confidence comes from keeping the promises you make to yourself, not from external validation. It's about trusting in your abilities and decisions while remaining humble. Practice this by following through on your commitments, speaking up for what you believe in, and making decisions based on your values rather than others' opinions."
    },
    { 
      virtue: "Patient", 
      focus: "A Good Man Is Patient. Do not complain this week.",
      description: "Patience is the ability to remain calm and composed in the face of delays, difficulties, or frustration. It means accepting what you cannot control and focusing on what you can. Practice this by taking deep breaths when frustrated, reframing setbacks as learning opportunities, and avoiding complaints about things beyond your control."
    },
    { 
      virtue: "Genuine", 
      focus: "A Good Man Is Genuine. Be your authentic self this week.",
      description: "Being genuine means staying true to your values, beliefs, and personality without pretense or artificial behavior. It's about being honest with yourself and others about who you are. Practice this by expressing your true opinions respectfully, admitting when you're wrong, and not pretending to be someone you're not to fit in."
    },
    { 
      virtue: "Responsible", 
      focus: "A Good Man Is Responsible. Take ownership this week.",
      description: "Responsibility means accepting accountability for your actions, decisions, and their consequences. It's about being reliable and dependable in all areas of your life. Practice this by admitting mistakes without making excuses, following through on commitments, and taking initiative to solve problems rather than waiting for others to act."
    },
    { 
      virtue: "Strong", 
      focus: "A Good Man Is Strong. Build your strength in all forms this week.",
      description: "Strength encompasses physical, mental, emotional, and spiritual resilience. It's about developing the capacity to handle challenges and support others. Practice this by maintaining physical fitness, developing emotional intelligence, standing up for what's right, and being a source of support for those around you."
    },
    { 
      virtue: "Disciplined", 
      focus: "A Good Man Is Disciplined. Master yourself this week.",
      description: "Discipline is the ability to control your impulses, maintain consistent habits, and work toward long-term goals despite short-term temptations. It's about self-mastery and delayed gratification. Practice this by maintaining consistent routines, resisting unhealthy temptations, and staying focused on your priorities even when it's difficult."
    },
    { 
      virtue: "Humble", 
      focus: "A Good Man Is Humble. Serve others before yourself this week.",
      description: "Humility is the recognition that you are not the center of the universe and that others' needs matter as much as your own. It's about putting others first and recognizing your own limitations. Practice this by listening more than you speak, helping others without expecting recognition, and acknowledging when others have better ideas or solutions."
    }
  ];
  
  // State for data - initialized from data service
  const [routines, setRoutines] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [todos, setTodos] = useState([]);
  const [habitCompletions, setHabitCompletions] = useState({}); // Now contains full completion objects
  const [activeRoutine, setActiveRoutine] = useState(null); // Currently running routine
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0); // Current habit index
  const [routineStartTime, setRoutineStartTime] = useState(null);
  const [routineCompletions, setRoutineCompletions] = useState({}); // Now contains full completion objects
  const [expandedRoutines, setExpandedRoutines] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [virtueCheckIns, setVirtueCheckIns] = useState({});
  const [expandedVirtues, setExpandedVirtues] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [dailyChallenges, setDailyChallenges] = useState({});
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengesLoading, setChallengesLoading] = useState(false);
  
  // Initialize data from data service
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        setDataLoaded(false);
        
        const user = authService.getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);
        
        // 1. Ensure default routines exist
        await dataService.ensureDefaultRoutines();
        
        // 2. Load all base data
        const userData = await loadUserData();
        
        // 2.5. Load quotes from Firestore
        try {
          const quotesData = await dataService.getQuotes();
          setQuotes(quotesData);
        } catch (error) {
          console.warn('Could not load quotes from Firestore:', error);
          // Continue without quotes - will use fallback
        }
        
        // 3. Validate data exists and has correct structure
        if (!userData || !userData.data) {
          throw new Error('Failed to load user data');
        }
        
        if (!Array.isArray(userData.data.routines)) {
          throw new Error('Invalid routines data');
        }
        
        if (!Array.isArray(userData.data.habits)) {
          throw new Error('Invalid habits data');
        }
        
        // 4. Initialize today's data with validated data
        await initializeTodayData(userData.data.habits, userData.data.routines);
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load daily challenge when selected date changes
  useEffect(() => {
    const loadDailyChallenge = async () => {
      if (!dataLoaded) return;
      
      setChallengesLoading(true);
      try {
        const dateString = getSelectedDateString(selectedDate);
        const dailyChallenge = await dataService.getDailyChallenge(dateString);
        
        if (dailyChallenge) {
          setDailyChallenges(prev => ({
            ...prev,
            [dateString]: dailyChallenge
          }));
        }
      } catch (error) {
        console.error('Error loading daily challenge:', error);
        // Set error state for UI feedback
        setError(`Failed to load daily challenge: ${error.message}`);
      } finally {
        setChallengesLoading(false);
      }
    };

    loadDailyChallenge();
  }, [selectedDate, dataLoaded]);

  // Timer update effect - updates every second when there are active timers
  useEffect(() => {
    const hasActiveTimers = Object.keys(activeTimers).length > 0;
    
    if (hasActiveTimers) {
      const interval = setInterval(() => {
        setTimerUpdateTrigger(prev => prev + 1);
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [activeTimers]);

  // Load user data from data service
  const loadUserData = async () => {
    try {
      const todayString = getTodayString();
      const [routinesData, habitsData, goalsData, todosData, habitCompletionsData, routineCompletionsData, settingsData, dashboardOrderData, virtueCheckInsData, challengesData] = await Promise.all([
        dataService.getRoutines(),
        dataService.getHabits(),
        dataService.getGoals(),
        dataService.getTodos(),
        dataService.getAllHabitCompletions(),
        dataService.getAllRoutineCompletions(),
        dataService.getUserSettings(),
        dataService.getDashboardOrder(),
        dataService.getTodayVirtues(todayString),
        dataService.getChallenges()
      ]);
      
      // Validate data arrays
      const validatedRoutines = Array.isArray(routinesData) ? routinesData : [];
      const validatedHabits = Array.isArray(habitsData) ? habitsData : [];
      const validatedGoals = Array.isArray(goalsData) ? goalsData : [];
      const validatedTodos = Array.isArray(todosData) ? todosData : [];
      const validatedDashboardOrder = Array.isArray(dashboardOrderData) ? dashboardOrderData : [];
      
      setRoutines(validatedRoutines);
      setHabits(validatedHabits);
      setGoals(validatedGoals);
      setTodos(validatedTodos);
      
      // Process habit completions (now unified structure)
      const processedHabitCompletions = {};
      if (habitCompletionsData) {
        Object.keys(habitCompletionsData).forEach(date => {
          if (habitCompletionsData[date]?.habitCompletions) {
            processedHabitCompletions[date] = habitCompletionsData[date].habitCompletions;
          }
        });
      }
      setHabitCompletions(processedHabitCompletions);
      
      // Process routine completions (now unified structure)
      const processedRoutineCompletions = {};
      if (routineCompletionsData) {
        Object.keys(routineCompletionsData).forEach(date => {
          if (routineCompletionsData[date]?.routineCompletions) {
            processedRoutineCompletions[date] = routineCompletionsData[date].routineCompletions;
          }
        });
      }
      setRoutineCompletions(processedRoutineCompletions);
      setUserSettings(settingsData || {});
      setDashboardOrder(validatedDashboardOrder);
      setVirtueCheckIns({ [todayString]: virtueCheckInsData || {} });
      setChallenges(challengesData || []);
      setChallengesLoading(false); // Ensure loading state is cleared after initial load
      
      // Return the loaded data for validation
      return {
        data: {
          routines: validatedRoutines,
          habits: validatedHabits,
          goals: validatedGoals,
          todos: validatedTodos,
          settings: settingsData || {},
          dashboardOrder: validatedDashboardOrder
        }
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  };

  // Auto-expand the next incomplete routine when data changes
  useEffect(() => {
    if (routines.length > 0) {
      const nextRoutine = getNextIncompleteRoutine();
      if (nextRoutine) {
        setExpandedRoutines(new Set([nextRoutine.id]));
      }
    }
  }, [routines, habitCompletions]);

  // Restore active timers and routine state from database
  const restoreActiveTimers = async (todayString, routinesData = null) => {
    try {
      const activeHabitTimers = await dataService.getActiveHabitTimers(todayString);
      const activeRoutineState = await dataService.getActiveRoutine(todayString);
      
      // Restore habit timers
      if (activeHabitTimers) {
        const restoredTimers = {};
        const restoredDurations = {};
        
        Object.entries(activeHabitTimers).forEach(([habitId, timerData]) => {
          const startTime = new Date(timerData.startTime).getTime();
          
          // Restore active timer
          restoredTimers[habitId] = startTime;
          if (timerData.duration) {
            restoredDurations[habitId] = timerData.duration;
          }
        });
        
        setActiveTimers(restoredTimers);
        setTimerDurations(restoredDurations);
      }
      
      // Restore active routine
      if (activeRoutineState && activeRoutineState.routineId) {
        const routinesToSearch = routinesData || routines;
        const routine = routinesToSearch.find(r => r.id === activeRoutineState.routineId);
        if (routine) {
          // Check if routine is from previous day
          if (isRoutineFromPreviousDay(activeRoutineState.startTime)) {
            // Mark current active habit as skipped and finish routine
            const currentHabitId = routine.habits[activeRoutineState.currentHabitIndex];
            if (currentHabitId) {
              const skipCompletion = {
                completed: false,
                completedAt: null,
                duration: null,
                startTime: null,
                endTime: new Date().toISOString(),
                notes: "Skipped - Previous day"
              };
              
              // Update habit completion
              setHabitCompletions(prev => ({
                ...prev,
                [todayString]: {
                  ...prev[todayString],
                  [currentHabitId]: skipCompletion
                }
              }));
              
              await dataService.updateTodayHabits({ [currentHabitId]: skipCompletion }, todayString);
            }
            
            // Mark routine as finished
            const routineCompletion = {
              completed: true,
              completedAt: new Date().toISOString(),
              totalDuration: 0,
              startTime: activeRoutineState.startTime,
              endTime: new Date().toISOString(),
              habitTimes: {}
            };
            
            setRoutineCompletions(prev => ({
              ...prev,
              [todayString]: {
                ...prev[todayString],
                [activeRoutineState.routineId]: routineCompletion
              }
            }));
            
            await dataService.updateTodayRoutines({ [activeRoutineState.routineId]: routineCompletion }, todayString);
            
            // Clear active routine from database
            await dataService.updateActiveRoutine(null, todayString);
          } else {
            // Routine is from today, restore it
            setActiveRoutine(routine);
            setActiveRoutineIndex(activeRoutineState.currentHabitIndex);
            setRoutineStartTime(new Date(activeRoutineState.startTime).getTime());
            setCurrentView('activeRoutine');  // Auto-open routine view when restored
          }
        }
      }
    } catch (error) {
      console.error('Error restoring active timers:', error);
      // Don't break the app if timer restoration fails
    }
  };

  // Initialize today's data on app load
  const initializeTodayData = async (habitsData, routinesData) => {
    try {
      const today = getTodayString();
      
      // Validate input data
      const validatedHabits = Array.isArray(habitsData) ? habitsData : habits;
      const validatedRoutines = Array.isArray(routinesData) ? routinesData : routines;
      
      // Initialize today's data - this will create fresh data if it doesn't exist
      const todayData = await dataService.initializeTodayData(validatedHabits, validatedRoutines, today);
      
      // Validate today's data structure
      if (!todayData || typeof todayData !== 'object') {
        throw new Error('Invalid today\'s data structure');
      }
      
      // Only update if we don't already have today's data loaded
      if (!habitCompletions[today]) {
        setHabitCompletions(prev => ({
          ...prev,
          [today]: todayData.habitCompletions || {}
        }));
      }
      if (!routineCompletions[today]) {
        setRoutineCompletions(prev => ({
          ...prev,
          [today]: todayData.routineCompletions || {}
        }));
      }
      
      // Update todos (combine persistent todos with today's todos)
      const persistentTodos = await dataService.getTodos();
      const todayTodos = todayData.todos || [];
      const validatedPersistentTodos = Array.isArray(persistentTodos) ? persistentTodos : [];
      const validatedTodayTodos = Array.isArray(todayTodos) ? todayTodos : [];
      setTodos([...validatedPersistentTodos, ...validatedTodayTodos]);
      
      // Restore active timers and routine state
      await restoreActiveTimers(today, validatedRoutines);
      
      console.log('Today\'s data initialized for', today);
    } catch (error) {
      console.error('Error initializing today\'s data:', error);
      throw error;
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setCurrentUser(user);
    if (user) {
      loadUserData();
      setShowUserManager(false);
    }
  };

  // Close data menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDataMenu && !event.target.closest('.data-menu-container')) {
        setShowDataMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDataMenu]);

  // Timer update effect - use a more targeted approach
  useEffect(() => {
    if (!activeTimers || Object.keys(activeTimers).length === 0) return;
    
    const interval = setInterval(() => {
      // Timer update trigger for re-renders
      setTimerUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers ? Object.keys(activeTimers).length : 0]);
  
  // Get today's date string in browser timezone
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get completion time display
  const getCompletionTimeDisplay = (habitId, dateString) => {
    const completion = habitCompletions[dateString]?.[habitId];
    if (!completion) return null;
    return completion.duration ? Math.round(completion.duration * 10) / 10 : null;
  };

  // Get date string for selected date (using local timezone)
  const getSelectedDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get date string in local timezone (replaces toISOString().split('T')[0])
  const getDateStringLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to safely get array data
  const getSafeArray = (array, fallback = []) => {
    return Array.isArray(array) ? array : fallback;
  };
  
  // Modal Components
  
  const GoalModal = ({ onClose }) => {
    const [goalName, setGoalName] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    const [goalDeadline, setGoalDeadline] = useState('');
    
    const handleSubmit = async () => {
      if (goalName.trim()) {
        const newGoal = {
          id: Date.now(),
          name: goalName.trim(),
          description: goalDescription.trim(),
          deadline: goalDeadline,
          tasks: [],
          completed: false,
          createdAt: new Date().toISOString()
        };
        const newGoals = [...goals, newGoal];
        setGoals(newGoals);
        await await dataService.updateGoals(newGoals);
        onClose();
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">New Goal</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Learn Spanish"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Vision (optional)
              </label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="What does success look like?"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const TaskModal = ({ goalId, onClose }) => {
    const [taskName, setTaskName] = useState('');
    const [taskNotes, setTaskNotes] = useState('');
    
    const handleSubmit = async () => {
      if (taskName.trim()) {
        const newGoals = goals.map(g => 
          g.id === goalId
            ? { 
                ...g, 
                tasks: [...g.tasks, { 
                  id: Date.now(), 
                  name: taskName.trim(),
                  notes: taskNotes.trim(),
                  completed: false 
                }] 
              }
            : g
        );
        setGoals(newGoals);
        await await dataService.updateGoals(newGoals);
        onClose();
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">New Task</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Complete chapter 1"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Notes (optional)
              </label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                rows="2"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Routine Modal
  const AddRoutineModal = ({ onClose }) => {
    const [routineName, setRoutineName] = useState('');
    const [routineTime, setRoutineTime] = useState('morning');
    const [routineDays, setRoutineDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    
    const days = [
      { key: 'monday', label: 'Mon' },
      { key: 'tuesday', label: 'Tue' },
      { key: 'wednesday', label: 'Wed' },
      { key: 'thursday', label: 'Thu' },
      { key: 'friday', label: 'Fri' },
      { key: 'saturday', label: 'Sat' },
      { key: 'sunday', label: 'Sun' }
    ];
    
    const handleDayToggle = (day) => {
      setRoutineDays(prev => 
        prev.includes(day) 
          ? prev.filter(d => d !== day)
          : [...prev, day]
      );
    };
    
    const handleSubmit = async () => {
      if (routineName.trim() && routineDays.length > 0) {
        await addRoutine({
          name: routineName.trim(),
          timeOfDay: routineTime,
          days: routineDays
        });
        onClose();
      } else {
        alert('Please enter a routine name and select at least one day');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">New Routine</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Workout Routine"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Time of Day
              </label>
              <select
                value={routineTime}
                onChange={(e) => setRoutineTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="">Any Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Days *
              </label>
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => (
                  <button
                    key={day.key}
                    onClick={() => handleDayToggle(day.key)}
                    className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      routineDays.includes(day.key)
                        ? 'bg-black text-white'
                        : 'bg-stone-100 text-[#333333] hover:bg-stone-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Create Routine
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Single Habit Modal
  const AddSingleHabitModal = ({ onClose }) => {
    const [habitName, setHabitName] = useState('');
    const [habitDescription, setHabitDescription] = useState('');
    const [trackingType, setTrackingType] = useState('simple');
    const [duration, setDuration] = useState('');
    const [expectedTime, setExpectedTime] = useState('');
    const [hasExpectedTime, setHasExpectedTime] = useState(false);
    
    const handleSubmit = async () => {
      if (habitName.trim()) {
        const habitData = {
          name: habitName.trim(),
          description: habitDescription.trim(),
          trackingType: trackingType,
          duration: trackingType === 'timed' && duration ? parseInt(duration) : null,
          expectedCompletionTime: hasExpectedTime && expectedTime ? parseInt(expectedTime) : null
        };
        
        await addSingleHabit(habitData);
        onClose();
      } else {
        alert('Please enter a habit name');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">New Single Habit</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="Drink creatine"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Description (optional)
              </label>
              <textarea
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                placeholder="Why is this habit important?"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                rows="2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Tracking Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTrackingType('simple')}
                  className={`p-3 rounded-lg font-bold uppercase text-sm tracking-wider transition-all ${
                    trackingType === 'simple'
                      ? 'bg-black text-white'
                      : 'bg-stone-100 text-[#333333] hover:bg-stone-200'
                  }`}
                >
                  Simple Check
                </button>
                <button
                  onClick={() => setTrackingType('timed')}
                  className={`p-3 rounded-lg font-bold uppercase text-sm tracking-wider transition-all ${
                    trackingType === 'timed'
                      ? 'bg-black text-white'
                      : 'bg-stone-100 text-[#333333] hover:bg-stone-200'
                  }`}
                >
                  Timed
                </button>
              </div>
            </div>
            
            {trackingType === 'timed' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasExpectedTime}
                      onChange={(e) => setHasExpectedTime(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                      Set Expected Completion Time
                    </span>
                  </label>
                  {hasExpectedTime && (
                    <input
                      type="number"
                      value={expectedTime}
                      onChange={(e) => setExpectedTime(e.target.value)}
                      placeholder="10"
                      className="w-full mt-2 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                    />
                  )}
                </div>
              </>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Routine Confirmation Modal
  const DeleteRoutineModal = ({ routine, onClose }) => {
    const [keepHabitsAsSingles, setKeepHabitsAsSingles] = useState(true);
    
    const handleDelete = async () => {
      await deleteRoutine(routine.id, keepHabitsAsSingles);
      onClose();
    };
    
    const routineHabits = habits.filter(h => h.routineId === routine.id);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">Delete Routine</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-[#333333]">
              Are you sure you want to delete <strong>"{routine.name}"</strong>?
            </p>
            
            {routineHabits.length > 0 && (
              <div>
                <p className="text-sm text-[#333333] mb-2">
                  This routine has {routineHabits.length} habit{routineHabits.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-[#333333] opacity-70 mb-3">
                  {routineHabits.map(habit => (
                    <li key={habit.id}>• {habit.name}</li>
                  ))}
                </ul>
                
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={keepHabitsAsSingles}
                    onChange={(e) => setKeepHabitsAsSingles(e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <span className="text-sm text-[#333333]">
                    Keep habits as single habits (remove from routine but keep them)
                  </span>
                </label>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const RoutineEditModal = ({ routine, onClose }) => {
    const [routineName, setRoutineName] = useState(routine?.name || '');
    const [routineTime, setRoutineTime] = useState(routine?.timeOfDay || 'morning');
    const [routineDays, setRoutineDays] = useState(routine?.days || []);
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [pendingHabits, setPendingHabits] = useState([]);
    const [deletedHabitIds, setDeletedHabitIds] = useState([]);
    
    // Local state for habit reordering during editing
    const [reorderedHabitIds, setReorderedHabitIds] = useState(routine?.habits || []);
    
    // Drag and drop state for habit reordering
    const [draggedHabit, setDraggedHabit] = useState(null);
    const [draggedOverHabit, setDraggedOverHabit] = useState(null);
    
    // New habit form state
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDescription, setNewHabitDescription] = useState('');
    const [newHabitDuration, setNewHabitDuration] = useState('');
    const [newHabitHasDuration, setNewHabitHasDuration] = useState(false);
    const [newHabitExpectedTime, setNewHabitExpectedTime] = useState('');
    const [newHabitHasExpectedTime, setNewHabitHasExpectedTime] = useState(false);
    
    const daysOfWeek = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];
    
    const timeOptions = [
      { value: 'morning', label: 'Morning' },
      { value: 'afternoon', label: 'Afternoon' },
      { value: 'evening', label: 'Evening' }
    ];
    
    // Get current habits for this routine (excluding deleted ones)
    const getCurrentHabits = () => {
      const routineHabits = reorderedHabitIds || [];
      const existingHabits = habits.filter(h => 
        routineHabits.includes(h.id) && !deletedHabitIds.includes(h.id)
      );
      
      // Sort existing habits by the reorderedHabitIds order
      const sortedExistingHabits = existingHabits.sort((a, b) => {
        const indexA = routineHabits.indexOf(a.id);
        const indexB = routineHabits.indexOf(b.id);
        return indexA - indexB;
      });
      
      return [...sortedExistingHabits, ...pendingHabits];
    };
    
    const handleDayToggle = (day) => {
      setRoutineDays(prev => 
        prev.includes(day) 
          ? prev.filter(d => d !== day)
          : [...prev, day]
      );
    };
    
    const handleAddHabit = () => {
      if (newHabitName.trim()) {
        const duration = newHabitDuration && parseInt(newHabitDuration) > 0 ? parseInt(newHabitDuration) : null;
        const expectedTime = newHabitHasExpectedTime && newHabitExpectedTime ? parseInt(newHabitExpectedTime) : null;
        const newHabit = {
          id: Date.now(),
          name: newHabitName.trim(),
          description: newHabitDescription.trim(),
          duration: duration,
          expectedCompletionTime: expectedTime,
          routineId: routine.id,
          createdAt: new Date().toISOString()
        };
        
        setPendingHabits(prev => [...prev, newHabit]);
        
        // Reset form
        setNewHabitName('');
        setNewHabitDescription('');
        setNewHabitDuration('');
        setNewHabitHasDuration(false); // Make duration optional
        setNewHabitExpectedTime('');
        setNewHabitHasExpectedTime(false);
        setShowAddHabit(false);
      } else {
        alert('Please enter a habit name');
      }
    };
    
    const handleDeleteHabit = (habitId) => {
      if (window.confirm('Are you sure you want to delete this habit?')) {
        // If it's a pending habit, remove from pending
        if (pendingHabits.some(h => h.id === habitId)) {
          setPendingHabits(prev => prev.filter(h => h.id !== habitId));
        } else {
          // If it's an existing habit, mark for deletion
          setDeletedHabitIds(prev => [...prev, habitId]);
        }
      }
    };
    
    const handleEditHabit = (habitId) => {
      setEditingHabitId(editingHabitId === habitId ? null : habitId);
    };
    
    const handleSaveHabitEdit = async (habitId, updatedHabit) => {
      if (pendingHabits.some(h => h.id === habitId)) {
        // Update pending habit
        setPendingHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      } else {
        // Update existing habit
        const updatedHabits = habits.map(h => h.id === habitId ? updatedHabit : h);
        setHabits(updatedHabits);
        await dataService.updateHabits(updatedHabits);
      }
      setEditingHabitId(null);
    };
    
    const handleSubmit = async () => {
      if (routineName.trim() && routineDays.length > 0) {
        // Update routine details with reordered habits
        const finalHabitIds = [
          ...reorderedHabitIds.filter(id => !deletedHabitIds.includes(id)), 
          ...pendingHabits.map(h => h.id)
        ];
        
        const updatedRoutines = routines.map(r => 
          r.id === routine.id 
            ? { 
                ...r, 
                name: routineName.trim(),
                timeOfDay: routineTime,
                days: routineDays,
                habits: finalHabitIds
              }
            : r
        );
        setRoutines(updatedRoutines);
        await dataService.updateRoutines(updatedRoutines);
        
        // Add new habits
        if (pendingHabits.length > 0) {
          const newHabits = [...habits, ...pendingHabits];
          setHabits(newHabits);
          await dataService.updateHabits(newHabits);
        }
        
        // Remove deleted habits
        if (deletedHabitIds.length > 0) {
          const updatedHabits = habits.filter(h => !deletedHabitIds.includes(h.id));
          setHabits(updatedHabits);
          await dataService.updateHabits(updatedHabits);
        }
        
        onClose();
      }
    };
    
    // Drag and drop handlers for habit reordering
    const handleDragStart = (e, habit) => {
      setDraggedHabit(habit);
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
    };

    const handleDragOver = (e, habit) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDraggedOverHabit(habit);
    };

    const handleDragLeave = () => {
      setDraggedOverHabit(null);
    };

    const handleDrop = (e, targetHabit) => {
      e.preventDefault();
      
      if (!draggedHabit || draggedHabit.id === targetHabit.id) {
        setDraggedHabit(null);
        setDraggedOverHabit(null);
        return;
      }

      const currentHabitsList = getCurrentHabits();
      const draggedIndex = currentHabitsList.findIndex(h => h.id === draggedHabit.id);
      const targetIndex = currentHabitsList.findIndex(h => h.id === targetHabit.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder habits
      const newHabitsList = [...currentHabitsList];
      const [removedHabit] = newHabitsList.splice(draggedIndex, 1);
      newHabitsList.splice(targetIndex, 0, removedHabit);

      // Update local reorderedHabitIds state with new order
      const newHabitIds = newHabitsList.map(h => h.id);
      setReorderedHabitIds(newHabitIds);

      setDraggedHabit(null);
      setDraggedOverHabit(null);
    };

    const handleDragEnd = (e) => {
      e.target.style.opacity = '1';
      setDraggedHabit(null);
      setDraggedOverHabit(null);
    };
    
    const currentHabits = getCurrentHabits();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-stone-200">
              <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">Edit Routine</h3>
              <button onClick={onClose} className="text-[#333333] hover:opacity-60">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Routine Details Section */}
              <div>
                <h4 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      placeholder="Morning Routine"
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                      Time of Day *
                    </label>
                    <select
                      value={routineTime}
                      onChange={(e) => setRoutineTime(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                    >
                      {timeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                      Days of Week *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={routineDays.includes(day.key)}
                            onChange={() => handleDayToggle(day.key)}
                            className="w-4 h-4 text-[#333333] border-2 border-stone-300 rounded focus:ring-[#333333]"
                          />
                          <span className="text-sm text-[#333333]">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Habits List Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#333333] text-sm uppercase tracking-wide">Habits</h4>
                  <span className="text-xs text-[#333333] opacity-60">Drag to reorder</span>
                </div>
                <div className="space-y-2">
                  {currentHabits.length > 0 ? (
                    currentHabits.map((habit, index) => (
                      <div
                        key={habit.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, habit)}
                        onDragOver={(e) => handleDragOver(e, habit)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, habit)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all ${
                          draggedOverHabit?.id === habit.id 
                            ? 'border-2 border-[#333333] bg-stone-50 rounded-lg' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Order number */}
                          <div className="flex-shrink-0 w-8 h-8 bg-[#333333] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          {/* Habit item */}
                          <div className="flex-grow">
                            <HabitItem
                              habit={habit}
                              isEditing={editingHabitId === habit.id}
                              onEdit={() => handleEditHabit(habit.id)}
                              onDelete={() => handleDeleteHabit(habit.id)}
                              onSave={(updatedHabit) => handleSaveHabitEdit(habit.id, updatedHabit)}
                              onCancel={() => setEditingHabitId(null)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#333333] opacity-50 text-sm text-center py-4">No habits in this routine yet.</p>
                  )}
                </div>
              </div>
              
              {/* Add Habit Section */}
              <div>
                {!showAddHabit ? (
                  <button
                    onClick={() => setShowAddHabit(true)}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                    Add Habit
                  </button>
                ) : (
                  <div className="border-2 border-stone-300 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-[#333333] text-sm uppercase tracking-wide">New Habit</h5>
                      <button
                        onClick={() => setShowAddHabit(false)}
                        className="text-[#333333] hover:opacity-60"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="Morning meditation"
                        className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                        Why (optional)
                      </label>
                      <textarea
                        value={newHabitDescription}
                        onChange={(e) => setNewHabitDescription(e.target.value)}
                        placeholder="Why is this habit important?"
                        className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                        rows="2"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHabitHasDuration}
                          onChange={(e) => setNewHabitHasDuration(e.target.checked)}
                          className="w-4 h-4 text-[#333333] border-2 border-stone-300 rounded focus:ring-[#333333] focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                          Set Timer Duration
                        </span>
                      </label>
                      {newHabitHasDuration && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            value={newHabitDuration}
                            onChange={(e) => setNewHabitDuration(e.target.value)}
                            placeholder="20"
                            min="1"
                            max="1440"
                            className="w-20 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                          />
                          <span className="text-sm text-[#333333] font-medium">minutes</span>
                        </div>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        Optional: How long this habit should take to complete
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHabitHasExpectedTime}
                          onChange={(e) => setNewHabitHasExpectedTime(e.target.checked)}
                          className="w-4 h-4 text-[#333333] border-2 border-stone-300 rounded focus:ring-[#333333] focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                          Set Expected Completion Time
                        </span>
                      </label>
                      {newHabitHasExpectedTime && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            value={newHabitExpectedTime}
                            onChange={(e) => setNewHabitExpectedTime(e.target.value)}
                            placeholder="15"
                            min="1"
                            max="1440"
                            className="w-20 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                          />
                          <span className="text-sm text-[#333333] font-medium">minutes</span>
                          <span className="text-xs text-stone-500">(for progress visualization)</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddHabit(false)}
                        className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddHabit}
                        className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
                      >
                        Add Habit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-2 pt-6 mt-6 border-t border-stone-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                  setRoutineToDelete(routine);
                  setShowDeleteRoutineModal(true);
                }}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Habit Item Component for inline editing
  const HabitItem = ({ habit, isEditing, onEdit, onDelete, onSave, onCancel }) => {
    const [editName, setEditName] = useState(habit.name);
    const [editDescription, setEditDescription] = useState(habit.description || '');
    const [editDuration, setEditDuration] = useState(habit.duration || '');
    const [editHasDuration, setEditHasDuration] = useState(!!habit.duration);
    const [editExpectedTime, setEditExpectedTime] = useState(habit.expectedCompletionTime || '');
    const [editHasExpectedTime, setEditHasExpectedTime] = useState(!!habit.expectedCompletionTime);
    
    // Timer display logic
    const getTimerDisplay = () => {
      if (!activeTimers[habit.id]) return null;
      
      const startTime = activeTimers[habit.id];
      const duration = timerDurations[habit.id];
      const elapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      
      // Reference timerUpdateTrigger to ensure re-renders when timer updates
      const _ = timerUpdateTrigger;
      
      if (duration) {
        // Capped timer
        const remaining = Math.max(duration - elapsed, 0);
        return {
          elapsed: Math.floor(elapsed),
          remaining: Math.ceil(remaining),
          progress: Math.min((elapsed / duration) * 100, 100),
          isCapped: true
        };
      } else {
        // Uncapped timer
        return {
          elapsed: Math.floor(elapsed),
          remaining: null,
          progress: null,
          isCapped: false
        };
      }
    };
    
    const timerDisplay = getTimerDisplay();
    
    const handleSave = () => {
      const duration = editHasDuration && editDuration ? parseInt(editDuration) : null;
      const expectedTime = editHasExpectedTime && editExpectedTime ? parseInt(editExpectedTime) : null;
      const updatedHabit = {
        ...habit,
        name: editName.trim(),
        description: editDescription.trim(),
        duration: duration,
        expectedCompletionTime: expectedTime
      };
      onSave(updatedHabit);
    };
    
    if (isEditing) {
      return (
        <div className="border-2 border-[#1a252f]/40 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <h6 className="font-bold text-[#333333] text-sm uppercase tracking-wide">Edit Habit</h6>
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                title="Save"
              >
                <Check size={16} strokeWidth={2.5} className="text-[#4b5320]" />
              </button>
              <button
                onClick={onCancel}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Cancel"
              >
                <X size={16} strokeWidth={2.5} className="text-red-600" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wider">
              Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#333333]"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wider">
              Why (optional)
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#333333]"
              rows="2"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editHasDuration}
                onChange={(e) => setEditHasDuration(e.target.checked)}
                className="w-3 h-3 text-[#333333] border border-stone-300 rounded focus:ring-[#333333] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                Set Timer Cap
              </span>
            </label>
            {editHasDuration && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="20"
                  min="1"
                  max="1440"
                  className="w-16 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#333333]"
                />
                <span className="text-xs text-[#333333] font-medium">minutes</span>
              </div>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editHasExpectedTime}
                onChange={(e) => setEditHasExpectedTime(e.target.checked)}
                className="w-3 h-3 text-[#333333] border border-stone-300 rounded focus:ring-[#333333] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                Expected Time
              </span>
            </label>
            {editHasExpectedTime && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={editExpectedTime}
                  onChange={(e) => setEditExpectedTime(e.target.value)}
                  placeholder="15"
                  min="1"
                  max="1440"
                  className="w-16 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#333333]"
                />
                <span className="text-xs text-[#333333] font-medium">minutes</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
        <div className="flex-grow">
          <div className="font-medium text-[#333333]">{habit.name}</div>
          {habit.description && (
            <div className="text-sm text-[#333333] opacity-70 italic">{habit.description}</div>
          )}
          {habit.duration && (
            <div className="text-xs text-[#333333] opacity-50 font-mono">
              Timer: {formatMinutesToHours(habit.duration)}
            </div>
          )}
          {habit.expectedCompletionTime && (
            <div className="text-xs text-[#333333] opacity-50 font-mono">
              Expected: {formatMinutesToHours(habit.expectedCompletionTime)}
            </div>
          )}
          {timerDisplay && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                {timerDisplay.isCapped ? (
                  <>
                    <span className="text-xs bg-[#1a252f]/100 text-white px-2 py-1 font-mono rounded">
                      {formatMinutesToHours(timerDisplay.remaining)} remaining
                    </span>
                    <span className="text-xs text-[#333333] opacity-70">
                      ({formatMinutesToHours(timerDisplay.elapsed)} elapsed)
                    </span>
                  </>
                ) : (
                  <span className="text-xs bg-[#4b5320]/100 text-white px-2 py-1 font-mono rounded">
                    {formatMinutesToHours(timerDisplay.elapsed)} elapsed
                  </span>
                )}
              </div>
              {timerDisplay.isCapped && (
                <div className="w-full bg-stone-200 h-2 rounded-full">
                  <div
                    className="bg-[#1a252f]/100 h-2 rounded-full transition-all"
                    style={{ width: `${timerDisplay.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {/* Expected Time Progress Bar */}
          {activeTimers[habit.id] && habit.expectedCompletionTime && (
            <ExpectedTimeProgressBar habitId={habit.id} />
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="p-1 text-[#333333] opacity-40 cursor-move" title="Drag to reorder">
            <GripVertical size={16} strokeWidth={2.5} />
          </div>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-stone-200 rounded transition-colors"
            title="Edit Habit"
          >
            <Edit2 size={16} strokeWidth={2.5} className="text-[#333333] opacity-60" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete Habit"
          >
            <Trash2 size={16} strokeWidth={2.5} className="text-red-600" />
          </button>
        </div>
      </div>
    );
  };
  
  const HabitEditModal = ({ habit, onClose }) => {
    const [habitName, setHabitName] = useState(habit?.name || '');
    const [habitDescription, setHabitDescription] = useState(habit?.description || '');
    const [habitDuration, setHabitDuration] = useState(habit?.duration || '');
    const [hasDuration, setHasDuration] = useState(true);
    const [expectedCompletionTime, setExpectedCompletionTime] = useState(habit?.expectedCompletionTime || '');
    const [hasExpectedTime, setHasExpectedTime] = useState(!!habit?.expectedCompletionTime);
    
    const handleSubmit = async () => {
      if (habitName.trim() && habitDuration && parseInt(habitDuration) > 0) {
        const duration = parseInt(habitDuration);
        const expectedTime = hasExpectedTime && expectedCompletionTime ? parseInt(expectedCompletionTime) : null;
        const updatedHabits = habits.map(h => 
          h.id === habit.id 
            ? { 
                ...h, 
                name: habitName.trim(),
                description: habitDescription.trim(),
                duration: duration,
                expectedCompletionTime: expectedTime
              }
            : h
        );
        setHabits(updatedHabits);
        await dataService.updateHabits(updatedHabits);
        onClose();
      } else {
        alert('Please enter a habit name and duration (in minutes)');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">Edit Habit</h3>
            <button onClick={onClose} className="text-[#333333] hover:opacity-60">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="Morning meditation"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Why (optional)
              </label>
              <textarea
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                placeholder="Why is this habit important?"
                className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                Duration (Required) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={habitDuration}
                  onChange={(e) => setHabitDuration(e.target.value)}
                  placeholder="20"
                  min="1"
                  max="1440"
                  required
                  className="w-20 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                />
                <span className="text-sm text-[#333333] font-medium">minutes</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                How long this habit should take to complete
              </p>
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpectedTime}
                  onChange={(e) => setHasExpectedTime(e.target.checked)}
                  className="w-4 h-4 text-[#333333] border-2 border-stone-300 rounded focus:ring-[#333333] focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                  Set Expected Completion Time
                </span>
              </label>
              {hasExpectedTime && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={expectedCompletionTime}
                    onChange={(e) => setExpectedCompletionTime(e.target.value)}
                    placeholder="15"
                    min="1"
                    max="1440"
                    className="w-20 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                  />
                  <span className="text-sm text-[#333333] font-medium">minutes</span>
                  <span className="text-xs text-stone-500">(for progress visualization)</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Order Routines Modal
  const OrderRoutinesModal = ({ onClose }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggedOverItem, setDraggedOverItem] = useState(null);
    const [orderedItems, setOrderedItems] = useState([]);

    // Initialize ordered items on modal open
    useEffect(() => {
      // Use dashboard order if available, otherwise use routine order
      if (dashboardOrder.length > 0) {
        const safeHabits = getSafeArray(habits);
        const safeRoutines = getSafeArray(routines);
        const singleHabits = safeHabits.filter(h => h.routineId === null);
        const allItems = [
          ...safeRoutines.map(r => ({ ...r, type: 'routine' })),
          ...singleHabits.map(h => ({ ...h, type: 'habit' }))
        ];
        
        // Sort by dashboard order
        const orderedItems = dashboardOrder
          .map(orderItem => allItems.find(item => item.type === orderItem.type && item.id === orderItem.id))
          .filter(Boolean);
        
        setOrderedItems(orderedItems);
      } else {
        // Fallback to routine order
        const routinesSorted = [...routines].sort((a, b) => a.order - b.order);
        const singleHabits = habits.filter(h => h.routineId === null);
        
        const items = [
          ...routinesSorted.map(routine => ({ ...routine, type: 'routine' })),
          ...singleHabits.map(habit => ({ ...habit, type: 'habit' }))
        ];
        
        setOrderedItems(items);
      }
    }, [routines, habits, dashboardOrder]);

    const handleDragStart = (e, item) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
    };

    const handleDragOver = (e, item) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDraggedOverItem(item);
    };

    const handleDragLeave = () => {
      setDraggedOverItem(null);
    };

    const handleDrop = (e, targetItem) => {
      e.preventDefault();
      
      if (!draggedItem || draggedItem.id === targetItem.id) {
        setDraggedItem(null);
        setDraggedOverItem(null);
        return;
      }

      const newOrderedItems = [...orderedItems];
      const draggedIndex = newOrderedItems.findIndex(item => item.id === draggedItem.id);
      const targetIndex = newOrderedItems.findIndex(item => item.id === targetItem.id);

      // Remove dragged item
      const [removedItem] = newOrderedItems.splice(draggedIndex, 1);
      
      // Insert at new position
      newOrderedItems.splice(targetIndex, 0, removedItem);

      setOrderedItems(newOrderedItems);
      setDraggedItem(null);
      setDraggedOverItem(null);
    };

    const handleDragEnd = (e) => {
      e.target.style.opacity = '1';
      setDraggedItem(null);
      setDraggedOverItem(null);
    };

    const handleSave = async () => {
      try {
        // Update routine orders
        const updatedRoutines = orderedItems
          .filter(item => item.type === 'routine')
          .map((item, index) => ({ ...item, order: index }));

        // Update habit orders (if they have order property)
        const updatedHabits = habits.map(habit => {
          const orderedItem = orderedItems.find(item => item.type === 'habit' && item.id === habit.id);
          if (orderedItem) {
            const newOrder = orderedItems.findIndex(item => item.type === 'habit' && item.id === habit.id);
            return { ...habit, order: newOrder };
          }
          return habit;
        });

        // Update dashboard order to match the new ordering
        const newDashboardOrder = orderedItems.map((item, index) => ({
          type: item.type,
          id: item.id,
          order: index
        }));

        await dataService.updateRoutines(updatedRoutines);
        await dataService.updateHabits(updatedHabits);
        await dataService.updateDashboardOrder(newDashboardOrder);
        
        setRoutines(updatedRoutines);
        setHabits(updatedHabits);
        setDashboardOrder(newDashboardOrder);
        onClose();
      } catch (error) {
        console.error('Error saving order:', error);
        alert('Error saving order. Please try again.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#333333] uppercase tracking-wide">
                Order Routines & Habits
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} strokeWidth={2.5} className="text-[#333333] opacity-60" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mt-2">
              Drag and drop to reorder your routines and habits
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {orderedItems.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-move ${
                    draggedOverItem?.id === item.id 
                      ? 'border-[#333333] bg-stone-50' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <GripVertical 
                    size={20} 
                    strokeWidth={2.5} 
                    className="text-stone-400 flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#333333] truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-stone-500 uppercase tracking-wide">
                      {item.type === 'routine' ? 'Routine' : 'Single Habit'}
                    </div>
                  </div>
                  <div className="text-xs text-stone-400 font-mono">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-stone-200">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Choice Modal
  const AddChoiceModal = ({ onClose }) => {
    const handleRoutineChoice = () => {
      onClose();
      setShowAddRoutineModal(true);
    };

    const handleHabitChoice = () => {
      onClose();
      setShowAddSingleHabitModal(true);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#333333] uppercase tracking-wide">
                Add New Item
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} strokeWidth={2.5} className="text-[#333333] opacity-60" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mt-2">
              Choose what you'd like to add
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={handleRoutineChoice}
                disabled={routines.length >= 5}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-[#4b5320]/30 bg-[#4b5320]/10 hover:bg-[#4b5320]/20 hover:border-[#4b5320]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4b5320]/10 disabled:hover:border-[#4b5320]/30"
              >
                <div className="w-10 h-10 bg-[#4b5320]/100 rounded-lg flex items-center justify-center">
                  <Calendar size={20} strokeWidth={2.5} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-[#333333] uppercase tracking-wide">
                    Add Routine
                  </div>
                  <div className="text-sm text-stone-600">
                    {routines.length >= 5 ? 'Maximum 5 routines reached' : 'Create a new routine with multiple habits'}
                  </div>
                </div>
                <ChevronRight size={20} strokeWidth={2.5} className="text-[#333333] opacity-60" />
              </button>

              <button
                onClick={handleHabitChoice}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-[#1a252f]/30 bg-[#1a252f]/10 hover:bg-[#1a252f]/20 hover:border-[#1a252f]/40 transition-all"
              >
                <div className="w-10 h-10 bg-[#1a252f]/100 rounded-lg flex items-center justify-center">
                  <CheckSquare size={20} strokeWidth={2.5} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-[#333333] uppercase tracking-wide">
                    Add Single Habit
                  </div>
                  <div className="text-sm text-stone-600">
                    Create a standalone habit outside of routines
                  </div>
                </div>
                <ChevronRight size={20} strokeWidth={2.5} className="text-[#333333] opacity-60" />
              </button>
            </div>
          </div>

          <div className="p-6 border-t border-stone-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Circular Progress Component
  const CircularProgress = ({ habitId, size = 200, strokeWidth = 8 }) => {
    const progress = getCircularProgress(habitId);
    const color = getTimerColor(habitId);
    const displayTime = getTimerDisplayTime(habitId);
    const mode = getTimerDisplayMode(habitId);
    
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    
    // Calculate progress for main ring (capped at 100%)
    const mainProgress = Math.min(progress, 100);
    const strokeDashoffset = circumference - (mainProgress / 100) * circumference;
    
    // Calculate progress for overflow ring (red ring when over 100%)
    const overflowProgress = Math.max(progress - 100, 0);
    const overflowStrokeDashoffset = circumference - (overflowProgress / 100) * circumference;
    
    return (
      <div 
        className="relative cursor-pointer hover:scale-105 transition-transform duration-200" 
        style={{ width: size, height: size }}
        onClick={() => handleTimerTap(habitId)}
        title={activeTimers[habitId] ? "Timer running" : "Tap to start"}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
          {/* Overflow ring (red ring when progress > 100%) */}
          {overflowProgress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={overflowStrokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          )}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-[#333333] font-mono">
            {displayTime !== null ? displayTime : '0:00'}
          </div>
          <div className="text-xs text-[#333333] opacity-60 uppercase tracking-wide mb-2">
            {mode === 'countdown' ? 'remaining' : mode === 'countup' ? 'elapsed' : mode === 'overestimate' ? 'over' : 'ready'}
          </div>
          {/* Play Icon */}
          <div className="text-[#333333] opacity-70">
            {activeTimers[habitId] ? (
              <div className="w-4 h-4 border-2 border-[#333333] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#333333] rounded-full"></div>
              </div>
            ) : (
              <Play size={16} strokeWidth={2.5} className="ml-0.5" />
            )}
          </div>
        </div>
      </div>
    );
  };

  
  // Get current day of week
  const getCurrentDay = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    return days[now.getDay()];
  };
  
  // Get quote of the day based on weekly virtue
  const getDailyQuote = () => {
    // If no quotes loaded from Firestore, use fallback
    if (quotes.length === 0) {
      const now = new Date();
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      return fallbackQuotes[dayOfYear % fallbackQuotes.length];
    }

    // Get current weekly virtue focus
    const weeklyFocus = getWeeklyFocus();
    
    // Filter quotes by current virtue
    const virtueQuotes = quotes.filter(quote => quote.virtue === weeklyFocus.virtue);
    
    // If no quotes for current virtue, use all quotes
    const quotesToUse = virtueQuotes.length > 0 ? virtueQuotes : quotes;
    
    // Use day-based rotation within the selected quotes
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const selectedQuote = quotesToUse[dayOfYear % quotesToUse.length];
    
    // Return formatted quote with author if available
    if (selectedQuote && selectedQuote.quote) {
      return selectedQuote.author ? `"${selectedQuote.quote}" — ${selectedQuote.author}` : selectedQuote.quote;
    }
    
    // Fallback to hardcoded quotes if something goes wrong
    return fallbackQuotes[dayOfYear % fallbackQuotes.length];
  };
  
  // Get weekly focus
  const getWeeklyFocus = () => {
    const now = new Date();
    
    // Get the start of this year in local timezone
    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    
    // Find the first Sunday of the year (or the year start if it's already Sunday)
    const firstSunday = new Date(yearStart);
    const dayOfWeek = firstSunday.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (dayOfWeek !== 0) {
      // Move forward to the next Sunday
      firstSunday.setDate(firstSunday.getDate() + (7 - dayOfWeek));
    }
    
    // If we're before the first Sunday, we're in "week 0" (the partial week at year start)
    if (now < firstSunday) {
      return weeklyFocuses[0];
    }
    
    // Calculate number of complete weeks since the first Sunday
    const daysSinceFirstSunday = Math.floor((now - firstSunday) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.floor(daysSinceFirstSunday / 7);
    
    return weeklyFocuses[weekNumber % weeklyFocuses.length];
  };

  // Get daily challenge for a specific date
  const getDailyChallengeForDate = (date) => {
    const weeklyFocus = getWeeklyFocus();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (challenges.length === 0) {
      console.warn('No challenges available in database');
      return null;
    }
    
    const virtueChallenges = challenges.filter(c => c.virtue === weeklyFocus.virtue);
    if (virtueChallenges.length === 0) {
      console.warn(`No challenges available for virtue: ${weeklyFocus.virtue}`);
      return null;
    }
    
    // Use day of week to select challenge (0-6)
    const challengeIndex = dayOfWeek % virtueChallenges.length;
    return virtueChallenges[challengeIndex];
  };

  // Get current daily challenge for selected date
  const getCurrentDailyChallenge = () => {
    const dateString = getSelectedDateString(selectedDate);
    return dailyChallenges[dateString] || null;
  };

  // Accept daily challenge
  const acceptDailyChallenge = async () => {
    const dateString = getSelectedDateString(selectedDate);
    const challenge = getDailyChallengeForDate(selectedDate);
    
    if (!challenge) {
      console.error('No challenge available to accept');
      setError('No challenge available for this date');
      return;
    }
    
    const challengeData = {
      challengeId: challenge.id,
      virtue: challenge.virtue,
      challenge: challenge.challenge,
      difficulty: challenge.difficulty,
      accepted: true,
      completed: false,
      acceptedAt: dateString,
      completedAt: null
    };
    
    try {
      await dataService.updateDailyChallenge(dateString, challengeData);
      setDailyChallenges(prev => ({
        ...prev,
        [dateString]: challengeData
      }));
      setShowChallengeModal(false);
    } catch (error) {
      console.error('Error accepting challenge:', error);
      setError(`Failed to accept challenge: ${error.message}`);
    }
  };

  // Complete daily challenge
  const completeDailyChallenge = async () => {
    const dateString = getSelectedDateString(selectedDate);
    const currentChallenge = getCurrentDailyChallenge();
    
    if (!currentChallenge) {
      console.error('No challenge to complete');
      setError('No challenge to complete');
      return;
    }
    
    const updatedChallenge = {
      ...currentChallenge,
      completed: true,
      completedAt: dateString
    };
    
    try {
      await dataService.updateDailyChallenge(dateString, updatedChallenge);
      setDailyChallenges(prev => ({
        ...prev,
        [dateString]: updatedChallenge
      }));
    } catch (error) {
      console.error('Error completing challenge:', error);
      setError(`Failed to complete challenge: ${error.message}`);
    }
  };

  // Show challenge modal
  const showChallenge = () => {
    const challenge = getDailyChallengeForDate(selectedDate);
    if (challenge) {
      setCurrentChallenge(challenge);
      setShowChallengeModal(true);
    } else {
      setError('No challenge available for this date');
    }
  };

  // Check if user can check in for a specific date (today or yesterday only)
  const canCheckInForDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(date);
    const todayString = getDateStringLocal(today);
    const yesterdayString = getDateStringLocal(yesterday);
    const targetDateString = getDateStringLocal(targetDate);
    
    return targetDateString === todayString || targetDateString === yesterdayString;
  };

  // Toggle virtue check-in (legacy - for backward compatibility)
  const toggleVirtueCheckIn = async (virtueName) => {
    const dateString = getSelectedDateString(selectedDate);
    
    if (!canCheckInForDate(selectedDate)) {
      return; // Don't allow editing for dates other than today/yesterday
    }
    
    try {
      const currentVirtues = virtueCheckIns[dateString] || {};
      const newVirtues = {
        ...currentVirtues,
        [virtueName]: !currentVirtues[virtueName]
      };
      
      // Update local state
      setVirtueCheckIns(prev => ({
        ...prev,
        [dateString]: newVirtues
      }));
      
      // Update in Firestore
      await dataService.updateTodayVirtues(newVirtues, dateString);
      
      // Habit completion tracking removed - no longer update virtue check-in habit completion
      
    } catch (error) {
      console.error('Error updating virtue check-in:', error);
      // Revert local state on error
      setVirtueCheckIns(prev => ({
        ...prev,
        [dateString]: virtueCheckIns[dateString] || {}
      }));
    }
  };

  // New paginated virtue check-in handlers

  const completeVirtueCheckIn = async (virtueResponses) => {
    const dateString = getSelectedDateString(selectedDate);
    
    if (!canCheckInForDate(selectedDate)) {
      return;
    }
    
    try {
      // Update local state
      setVirtueCheckIns(prev => ({
        ...prev,
        [dateString]: virtueResponses
      }));
      
      // Update in Firestore
      await dataService.updateTodayVirtues(virtueResponses, dateString);
      
      // Close modal
      setExpandedVirtues(false);
      
    } catch (error) {
      console.error('Error completing virtue check-in:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const startVirtueCheckIn = () => {
    // Don't open modal if we're currently in an active routine and the virtue habit is active
    if (activeRoutine) {
      const currentHabitId = activeRoutine.habits[activeRoutineIndex];
      const currentHabit = habits.find(h => h.id === currentHabitId);
      if (currentHabit?.isVirtueCheckIn) {
        return;
      }
    }
    
    // Open the modal
    setExpandedVirtues(true);
  };
  
  // Get next routine based on time of day
  const getNextRoutine = () => {
    const now = new Date();
    const hour = now.getHours();
    const currentDay = getCurrentDay();
    
    const activeRoutines = routines.filter(r => r.days.includes(currentDay));
    
    if (hour < 12) {
      return activeRoutines.find(r => r.timeOfDay === "morning") || activeRoutines[0];
    } else if (hour < 17) {
      return activeRoutines.find(r => r.timeOfDay === "afternoon") || activeRoutines[0];
    } else {
      return activeRoutines.find(r => r.timeOfDay === "evening") || activeRoutines[0];
    }
  };

  // Get all routines active for the current day, sorted by time
  const getAllDayRoutines = () => {
    const currentDay = getCurrentDay();
    const activeRoutines = routines.filter(r => r.days.includes(currentDay));
    
    // Sort by time of day: morning, afternoon, evening
    const timeOrder = { morning: 0, afternoon: 1, evening: 2 };
    return activeRoutines.sort((a, b) => timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay]);
  };

  // Get routine completion percentage
  const getRoutineCompletionPercentage = (routineId, dateString = null) => {
    const today = dateString || getTodayString();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine || !routine.habits || routine.habits.length === 0) {
      return 0;
    }
    
    const todayHabitCompletions = habitCompletions[today] || {};
    const completedHabits = routine.habits.filter(habitId => 
      todayHabitCompletions[habitId]?.completed === true
    );
    
    const percentage = Math.round((completedHabits.length / routine.habits.length) * 100);
    return percentage;
  };

  // Get routine completion stats
  const getRoutineCompletionStats = (routineId, dateString = null) => {
    const today = dateString || getTodayString();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine || !routine.habits || routine.habits.length === 0) {
      return { completed: false, totalTime: 0, percentage: 0 };
    }
    
    const todayHabitCompletions = habitCompletions[today] || {};
    const completedHabits = routine.habits.filter(habitId => 
      todayHabitCompletions[habitId]?.completed === true
    );
    
    const percentage = Math.round((completedHabits.length / routine.habits.length) * 100);
    const completed = completedHabits.length === routine.habits.length;
    
    // Calculate total time from completed habits
    let totalTime = 0;
    completedHabits.forEach(habitId => {
      const habitCompletion = todayHabitCompletions[habitId];
      if (habitCompletion?.duration) {
        totalTime += habitCompletion.duration;
      }
    });
    
    return { 
      completed, 
      totalTime: Math.round(totalTime * 10) / 10, 
      percentage 
    };
  };

  // Get next incomplete routine based on time and completion
  const getNextIncompleteRoutine = () => {
    const allRoutines = getAllDayRoutines();
    const now = new Date();
    const hour = now.getHours();
    
    // Determine which routine should be active based on time
    let targetTimeOfDay;
    if (hour < 12) {
      targetTimeOfDay = "morning";
    } else if (hour < 17) {
      targetTimeOfDay = "afternoon";
    } else {
      targetTimeOfDay = "evening";
    }
    
    // Find the routine for the current time period
    const currentTimeRoutine = allRoutines.find(r => r.timeOfDay === targetTimeOfDay);
    
    // If current time routine is incomplete, return it
    if (currentTimeRoutine) {
      const stats = getRoutineCompletionStats(currentTimeRoutine.id);
      if (!stats.completed) {
        return currentTimeRoutine;
      }
    }
    
    // Otherwise, find the next incomplete routine
    return allRoutines.find(routine => {
      const stats = getRoutineCompletionStats(routine.id);
      return !stats.completed;
    });
  };

  // Toggle routine expanded state
  const toggleRoutineExpanded = (routineId) => {
    setExpandedRoutines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routineId)) {
        newSet.delete(routineId);
      } else {
        newSet.add(routineId);
      }
      return newSet;
    });
  };
  
  // Get active goal (first incomplete goal)
  const getActiveGoal = () => {
    return goals.find(g => !g.completed) || null;
  };

  // Validation helpers for data consistency
  const validateRoutineHabits = (routine, habits) => {
    return routine.habits.every(hId => 
      habits.find(h => h.id === hId)
    );
  };

  // Get habit details for routine
  const getRoutineHabitsWithDetails = (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return [];
    
    return routine.habits
      .map(hId => habits.find(h => h.id === hId))
      .filter(Boolean); // Remove undefined (deleted habits)
  };
  
  // Check and mark completed routines automatically
  const checkAndMarkCompletedRoutines = async (today, habitCompletionsForToday) => {
    try {
      const updates = {};
      
      routines.forEach(routine => {
        if (routine.habits.length === 0) return;
        
        const allComplete = routine.habits.every(hId => 
          habitCompletionsForToday[hId]?.completed === true
        );
        
        if (allComplete && !routineCompletions[today]?.[routine.id]?.completed) {
          // Calculate total duration from habit completions
          const habitTimes = {};
          let totalDuration = 0;
          
          routine.habits.forEach(hId => {
            const habitComp = habitCompletionsForToday[hId];
            if (habitComp?.duration) {
              habitTimes[hId] = habitComp.duration;
              totalDuration += habitComp.duration;
            }
          });
          
          updates[routine.id] = {
            completed: true,
            completedAt: new Date().toISOString(),
            totalDuration: totalDuration,
            habitTimes: habitTimes
          };
        }
      });
      
      if (Object.keys(updates).length > 0) {
        setRoutineCompletions(prev => ({
          ...prev,
          [today]: { ...prev[today], ...updates }
        }));
        await dataService.updateTodayRoutines(updates, today);
      }
    } catch (error) {
      console.error('Error checking and marking completed routines:', error);
    }
  };

  // Toggle habit completion
  const toggleHabitCompletion = async (habitId, dateString = null) => {
    try {
      // If a routine is active, prevent manual toggling of other habits
      if (activeRoutine && activeRoutine.habits[activeRoutineIndex] !== habitId) {
        return; // Don't allow manual toggle of other habits during routine
      }

      const today = dateString || getTodayString();
      const currentCompletion = habitCompletions[today]?.[habitId];
      const isComplete = currentCompletion?.completed || false;
      
      // Only handle timer logic if we're in an active routine
      if (activeRoutine) {
        // If completing the habit and it has a timer running, stop the timer and save time
        if (!isComplete && activeTimers[habitId]) {
          stopTimer(habitId, true);
        }
        
        // If starting the habit and it doesn't have a duration cap, start an uncapped timer
        if (isComplete && !activeTimers[habitId]) {
          const habit = habits.find(h => h.id === habitId);
          if (habit && !habit.duration) {
            startUncappedTimer(habitId);
          }
        }
      }

      const newCompletion = {
        completed: !isComplete,
        completedAt: !isComplete ? new Date().toISOString() : null,
        duration: currentCompletion?.duration || null,
        startTime: currentCompletion?.startTime || null,
        endTime: currentCompletion?.endTime || null,
        notes: currentCompletion?.notes || ""
      };
      
      // Update state
      setHabitCompletions(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          [habitId]: newCompletion
        }
      }));
      
      // Update database
      await dataService.updateTodayHabits({ [habitId]: newCompletion }, today);

      // Check if this habit completion completes any routines
      const updatedHabitCompletions = { ...habitCompletions[today], [habitId]: newCompletion };
      await checkAndMarkCompletedRoutines(today, updatedHabitCompletions);

      // If this is the current habit in an active routine, complete it
      if (activeRoutine && activeRoutine.habits[activeRoutineIndex] === habitId) {
        completeRoutineHabit(habitId);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      // Don't break the app if habit toggle fails
    }
  };

  // Timer functions
  const startTimer = async (habitId, duration) => {
    const startTime = Date.now();
    setActiveTimers(prev => ({
      ...prev,
      [habitId]: startTime
    }));
    setTimerDurations(prev => ({
...prev,
      [habitId]: duration
    }));

    // Persist timer state to database
    const timerData = {
      startTime: new Date(startTime).toISOString(),
      duration: duration
    };
    
    const currentActiveTimers = activeTimers || {};
    const newActiveTimers = {
      ...currentActiveTimers,
      [habitId]: timerData
    };
    
    await dataService.updateActiveHabitTimers(newActiveTimers, getTodayString());
  };

  const startUncappedTimer = async (habitId) => {
    const startTime = Date.now();
    setActiveTimers(prev => ({
      ...prev,
      [habitId]: startTime
    }));
    // No duration set for uncapped timers

    // Persist timer state to database
    const timerData = {
      startTime: new Date(startTime).toISOString(),
      duration: null
    };
    
    const currentActiveTimers = activeTimers || {};
    const newActiveTimers = {
      ...currentActiveTimers,
      [habitId]: timerData
    };
    
    await dataService.updateActiveHabitTimers(newActiveTimers, getTodayString());
  };

  const stopTimer = async (habitId, completed = false) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    
    // If completed, save the completion time with start/end timestamps
    if (completed && startTime) {
      const endTime = Date.now();
      const completionTime = (endTime - startTime) / 1000 / 60; // in minutes
      const today = getTodayString();
      
      const completion = {
        completed: true,
        completedAt: new Date(endTime).toISOString(),
        duration: completionTime,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        notes: ""
      };
      
      // Update state
      setHabitCompletions(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          [habitId]: completion
        }
      }));
      
      // Update database
      await dataService.updateTodayHabits({ [habitId]: completion }, today);
    }
    
    // Clear the timer from active timers in database
    const currentActiveTimers = activeTimers || {};
    const newActiveTimers = { ...currentActiveTimers };
    delete newActiveTimers[habitId];
    await dataService.updateActiveHabitTimers(newActiveTimers, getTodayString());
    
    // Clear the timer from state
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });
    setTimerDurations(prev => {
      const newDurations = { ...prev };
      delete newDurations[habitId];
      return newDurations;
    });

    // If in routine mode and this habit was completed, handle routine flow
    if (activeRoutine && completed && activeRoutine.habits[activeRoutineIndex] === habitId) {
      completeRoutineHabit(habitId);
    }
  };

  const getTimerProgress = (habitId) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    if (!startTime || !duration) return 0;
    
    const elapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    // Reference timerUpdateTrigger to ensure re-renders when timer updates
    const _ = timerUpdateTrigger; // This ensures the function depends on timerUpdateTrigger
    return Math.min((elapsed / duration) * 100, 100);
  };

  const getTimerTimeRemaining = (habitId) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    if (!startTime || !duration) return null;
    
    // Use timerUpdateTrigger to ensure this recalculates on timer updates
    // This forces the component to re-render when timerUpdateTrigger changes
    const elapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const remaining = Math.max(duration - elapsed, 0);
    // Reference timerUpdateTrigger to ensure re-renders when timer updates
    const _ = timerUpdateTrigger; // This ensures the function depends on timerUpdateTrigger
    return Math.ceil(remaining);
  };

  // Enhanced timer functions for music player UI
  const getTimerDisplayTime = (habitId) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    
    let elapsed = 0;
    if (startTime) {
      elapsed = (Date.now() - startTime) / 1000; // in seconds
    } else {
      return null;
    }
    
    const _ = timerUpdateTrigger; // Ensure re-renders
    
    if (!duration) {
      // Non-estimated habit: show elapsed time in mm:ss format
      const minutes = Math.floor(elapsed / 60);
      const seconds = Math.floor(elapsed % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Estimated habit: show remaining time, or elapsed if over estimate
      const remaining = Math.max((duration * 60) - elapsed, 0);
      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  };

  const getTimerDisplayMode = (habitId) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    
    if (!startTime) return 'ready';
    
    let elapsed = 0;
    if (startTime) {
      elapsed = (Date.now() - startTime) / 1000; // in seconds
    }
    
    const _ = timerUpdateTrigger;
    
    if (!duration) {
      return 'countup'; // Non-estimated: count up
    } else {
      const remaining = Math.max((duration * 60) - elapsed, 0);
      return remaining > 0 ? 'countdown' : 'overestimate'; // Estimated: count down, then count up when over
    }
  };

  const getTimerColor = (habitId) => {
    const mode = getTimerDisplayMode(habitId);
    switch (mode) {
      case 'countdown': return '#4b5320'; // green
      case 'countup': return '#1a252f'; // blue
      case 'overestimate': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getCircularProgress = (habitId) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    
    if (!startTime) return 0;
    
    let elapsed = 0;
    if (startTime) {
      elapsed = (Date.now() - startTime) / 1000; // in seconds
    }
    
    const _ = timerUpdateTrigger;
    
    if (!duration) {
      // For non-estimated habits, show progress based on a reasonable default (30 min = 1800 seconds)
      return (elapsed / 1800) * 100; // Allow values over 100%
    } else {
      // For estimated habits, show progress based on duration (convert minutes to seconds)
      const durationSeconds = duration * 60;
      return (elapsed / durationSeconds) * 100; // Allow values over 100%
    }
  };

  // Handle tapping the circular timer for play/stop
  const handleTimerTap = (habitId) => {
    if (!activeRoutine) return;
    
    const currentHabit = habits.find(h => h.id === habitId);
    if (!currentHabit) return;
    
    if (activeTimers[habitId]) {
      // Timer is already running, do nothing
      return;
    } else {
      // No timer, start it
      if (currentHabit.duration) {
        startTimer(habitId, currentHabit.duration);
      } else {
        startUncappedTimer(habitId);
      }
    }
  };

  // Calculate average completion time for a habit
  const getAverageCompletionTime = (habitId) => {
    const allTimes = [];
    
    // Check if habitCompletions exists and is an object
    if (!habitCompletions || typeof habitCompletions !== 'object') {
      return null;
    }
    
    // Get all completion times for this habit across all dates
    Object.keys(habitCompletions).forEach(date => {
      const completion = habitCompletions[date]?.[habitId];
      if (completion?.duration) {
        allTimes.push(completion.duration);
      }
    });
    
    if (allTimes.length === 0) return null;
    
    const average = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  };

  // Get expected completion time progress for a habit
  const getExpectedTimeProgress = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.expectedCompletionTime) return null;
    
    const startTime = activeTimers[habitId];
    if (!startTime) return null;
    
    const elapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const expectedTime = habit.expectedCompletionTime;
    
    // Reference timerUpdateTrigger to ensure re-renders when timer updates
    const _ = timerUpdateTrigger;
    
    return {
      elapsed: Math.floor(elapsed),
      expectedTime: expectedTime,
      progress: Math.min((elapsed / expectedTime) * 100, 100),
      isOverExpected: elapsed > expectedTime,
      overTime: Math.max(elapsed - expectedTime, 0)
    };
  };

  // Visual Progress Bar Component
  const ExpectedTimeProgressBar = ({ habitId }) => {
    const progress = getExpectedTimeProgress(habitId);
    if (!progress) return null;
    
    const { elapsed, expectedTime, isOverExpected, overTime } = progress;
    
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#333333] opacity-70">
            {elapsed}m elapsed
          </span>
          <span className={`font-mono ${isOverExpected ? 'text-red-600' : 'text-[#1a252f]'}`}>
            Expected: {expectedTime}m
          </span>
        </div>
        
        <div className="relative w-full bg-stone-200 h-3 rounded-full overflow-hidden">
          {/* Blue progress bar (up to expected time) */}
          <div
            className="absolute top-0 left-0 bg-[#1a252f]/100 h-full transition-all duration-300"
            style={{ 
              width: `${Math.min((elapsed / expectedTime) * 100, 100)}%` 
            }}
          />
          
          {/* Red progress bar (over expected time) */}
          {isOverExpected && (
            <div
              className="absolute top-0 bg-red-500 h-full transition-all duration-300"
              style={{ 
                left: '100%',
                width: `${Math.min((overTime / expectedTime) * 100, 50)}%` // Cap at 50% additional width
              }}
            />
          )}
        </div>
        
        {isOverExpected && (
          <div className="text-xs text-red-600 font-mono">
            +{Math.round(overTime * 10) / 10}m over expected
          </div>
        )}
      </div>
    );
  };
  
  // Calculate habit streak
  const getHabitStreak = (habitId) => {
    let streak = 0;
    let date = new Date();
    
    // Check if habitCompletions exists and is an object
    if (!habitCompletions || typeof habitCompletions !== 'object') {
      return 0;
    }
    
    while (true) {
      const dateString = getDateStringLocal(date);
      const completion = habitCompletions[dateString]?.[habitId];
      if (completion?.completed) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Calculate total routine duration from habit durations
  const calculateRoutineDuration = (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine || !routine.habits) {
      return {
        totalDuration: 0,
        unknownDurationCount: 0,
        hasUnknownDurations: false
      };
    }
    
    const today = getTodayString();
    const todayHabitCompletions = habitCompletions[today] || {};
    
    let totalDuration = 0;
    let unknownDurationCount = 0;
    
    routine.habits.forEach(habitId => {
      const habitCompletion = todayHabitCompletions[habitId];
      if (habitCompletion?.duration) {
        totalDuration += habitCompletion.duration;
      } else {
        unknownDurationCount++;
      }
    });
    
    return {
      totalDuration: Math.round(totalDuration * 10) / 10,
      unknownDurationCount,
      hasUnknownDurations: unknownDurationCount > 0
    };
  };

  // Routine Control Functions
  const startRoutine = async (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
  
    // Check if there's an active routine
    if (activeRoutine) {
      // If clicking the same routine that's already active, just resume it
      if (activeRoutine.id === routineId) {
        setCurrentView('activeRoutine'); // Show music player
        return;
      }
      
      // Different routine - show confirmation dialog
      const confirmed = window.confirm(`Are you done with routine "${activeRoutine.name}"?`);
      if (confirmed) {
        // Finish current routine with skip
        await finishRoutineWithSkip();
      } else {
        // User wants to continue with current routine
        setCurrentView('activeRoutine'); // Go back to the active routine
        return;
      }
    }

    // Find first uncompleted habit in routine
    const today = getTodayString();
    let firstIncompleteIndex = 0;
    
    for (let i = 0; i < routine.habits.length; i++) {
      const habitId = routine.habits[i];
      const completion = habitCompletions[today]?.[habitId];
      const isComplete = completion?.completed || false;
      if (!isComplete) {
        firstIncompleteIndex = i;
        break;
      }
    }

    const routineStartTime = Date.now();

    // Set as active routine
    setActiveRoutine(routine);
    setActiveRoutineIndex(firstIncompleteIndex);
    setRoutineStartTime(routineStartTime);

    // Persist routine state to database
    const routineState = {
      routineId: routineId,
      startTime: new Date(routineStartTime).toISOString(),
      currentHabitIndex: firstIncompleteIndex
    };
    await dataService.updateActiveRoutine(routineState, today);

    // Start timer for first incomplete habit
    const firstHabitId = routine.habits[firstIncompleteIndex];
    const firstHabit = habits.find(h => h.id === firstHabitId);
    if (firstHabit) {
      if (firstHabit.duration) {
        await startTimer(firstHabitId, firstHabit.duration);
      } else {
        await startUncappedTimer(firstHabitId);
      }
    }

    // Navigate to active routine screen
    setCurrentView('activeRoutine');
  };

  const completeRoutineHabit = async (habitId) => {
    const today = getTodayString();
    const startTime = activeTimers[habitId];
    const endTime = Date.now();
    const duration = startTime ? (endTime - startTime) / 1000 / 60 : null;
    
    const completion = {
      completed: true,
      completedAt: new Date(endTime).toISOString(),
      duration: duration,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: new Date(endTime).toISOString(),
      notes: ""
    };
    
    // Single atomic update
    setHabitCompletions(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [habitId]: completion
      }
    }));
    
    await dataService.updateTodayHabits({ [habitId]: completion }, today);

    // Check if this habit completion completes any routines
    const updatedHabitCompletions = { ...habitCompletions[today], [habitId]: completion };
    await checkAndMarkCompletedRoutines(today, updatedHabitCompletions);

    // Clear the timer from active timers in database
    const currentActiveTimers = activeTimers || {};
    const newActiveTimers = { ...currentActiveTimers };
    delete newActiveTimers[habitId];
    await dataService.updateActiveHabitTimers(newActiveTimers, today);

    // Clear the timer from state
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });
    setTimerDurations(prev => {
      const newDurations = { ...prev };
      delete newDurations[habitId];
      return newDurations;
    });

    // If this was part of an active routine, handle progression
    if (activeRoutine) {
      const habitIndex = activeRoutine.habits.indexOf(habitId);
      if (habitIndex !== -1) {
        // Move to next habit in the active routine
        const nextIndex = habitIndex + 1;
        if (nextIndex < activeRoutine.habits.length) {
          setActiveRoutineIndex(nextIndex);
          const nextHabitId = activeRoutine.habits[nextIndex];
          const nextHabit = habits.find(h => h.id === nextHabitId);
          if (nextHabit) {
            if (nextHabit.duration) {
              startTimer(nextHabitId, nextHabit.duration);
            } else {
              startUncappedTimer(nextHabitId);
            }
          }
        } else {
          // Active routine complete
          finishRoutine();
        }
      }
    }
  };

  const goToPreviousHabit = () => {
    if (!activeRoutine || activeRoutineIndex <= 0) return;

    // Stop current timer
    const currentHabitId = activeRoutine.habits[activeRoutineIndex];
    if (activeTimers[currentHabitId]) {
      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[currentHabitId];
        return newTimers;
      });
      setTimerDurations(prev => {
        const newDurations = { ...prev };
        delete newDurations[currentHabitId];
        return newDurations;
      });
    }

    // Go to previous habit
    const prevIndex = activeRoutineIndex - 1;
    setActiveRoutineIndex(prevIndex);
  };

  const skipCurrentHabit = () => {
    if (!activeRoutine) return;

    // Stop current timer
    const currentHabitId = activeRoutine.habits[activeRoutineIndex];
    if (activeTimers[currentHabitId]) {
      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[currentHabitId];
        return newTimers;
      });
      setTimerDurations(prev => {
        const newDurations = { ...prev };
        delete newDurations[currentHabitId];
        return newDurations;
      });
    }

    // Move to next habit and auto-start
    const nextIndex = activeRoutineIndex + 1;
    if (nextIndex < activeRoutine.habits.length) {
      setActiveRoutineIndex(nextIndex);
      // Auto-start the next habit
      const nextHabitId = activeRoutine.habits[nextIndex];
      const nextHabit = habits.find(h => h.id === nextHabitId);
      if (nextHabit) {
        if (nextHabit.duration) {
          startTimer(nextHabitId, nextHabit.duration);
        } else {
          startUncappedTimer(nextHabitId);
        }
      }
    } else {
      // Routine complete
      finishRoutine();
    }
  };



  const stopRoutine = () => {
    // Just close the view and return to dashboard
    // Keep the routine active so it can be resumed
    setCurrentView('dashboard');
  };

  const closeRoutine = (routineId) => {
    // If this was the active routine, just close the view but keep routine active
    if (activeRoutine && activeRoutine.id === routineId) {
      setCurrentView('dashboard'); // Return to homepage but keep routine active
    }
  };

  const finishRoutine = async () => {
    if (!activeRoutine) return;
    
    const today = getTodayString();
    
    // Calculate total duration from all completed habits in the routine
    const todayHabitCompletions = habitCompletions[today] || {};
    const habitTimes = {};
    let totalDuration = 0;
    let lastHabitEndTime = null;
    
    activeRoutine.habits.forEach(habitId => {
      const habitCompletion = todayHabitCompletions[habitId];
      if (habitCompletion?.duration) {
        habitTimes[habitId] = habitCompletion.duration;
        totalDuration += habitCompletion.duration;
        // Track the last completed habit's end time
        if (habitCompletion.endTime) {
          lastHabitEndTime = habitCompletion.endTime;
        }
      }
    });
    
    // Create routine completion object
    const routineCompletion = {
      completed: true,
      completedAt: lastHabitEndTime || new Date().toISOString(),
      totalDuration: Math.round(totalDuration * 10) / 10,
      startTime: routineStartTime ? new Date(routineStartTime).toISOString() : null,
      endTime: lastHabitEndTime || new Date().toISOString(),
      habitTimes: habitTimes
    };
    
    // Update routine completions state
    setRoutineCompletions(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [activeRoutine.id]: routineCompletion
      }
    }));
    
    // Update database
    await dataService.updateTodayRoutines({ [activeRoutine.id]: routineCompletion }, today);
    
    // Clear active routine state and return to homepage
    setActiveRoutine(null);
    setActiveRoutineIndex(0);
    setRoutineStartTime(null);
    setCurrentView('dashboard'); // Return to homepage
    
    // Clear active routine from database
    await dataService.updateActiveRoutine(null, today);
  };

  const finishRoutineWithSkip = async () => {
    if (!activeRoutine) return;
    
    const today = getTodayString();
    
    // Skip the current active habit
    const currentHabitId = activeRoutine.habits[activeRoutineIndex];
    if (currentHabitId) {
      const skipCompletion = {
        completed: false,
        completedAt: null,
        duration: null,
        startTime: null,
        endTime: new Date().toISOString(),
        notes: "Skipped"
      };
      
      // Update habit completion
      setHabitCompletions(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          [currentHabitId]: skipCompletion
        }
      }));
      
      await dataService.updateTodayHabits({ [currentHabitId]: skipCompletion }, today);
    }
    
    // Calculate total duration from all completed habits in the routine
    const todayHabitCompletions = habitCompletions[today] || {};
    const habitTimes = {};
    let totalDuration = 0;
    let lastHabitEndTime = null;
    
    activeRoutine.habits.forEach(habitId => {
      const habitCompletion = todayHabitCompletions[habitId];
      if (habitCompletion?.duration) {
        habitTimes[habitId] = habitCompletion.duration;
        totalDuration += habitCompletion.duration;
        // Track the last completed habit's end time
        if (habitCompletion.endTime) {
          lastHabitEndTime = habitCompletion.endTime;
        }
      }
    });
    
    // Create routine completion object
    const routineCompletion = {
      completed: true,
      completedAt: lastHabitEndTime || new Date().toISOString(),
      totalDuration: Math.round(totalDuration * 10) / 10,
      startTime: routineStartTime ? new Date(routineStartTime).toISOString() : null,
      endTime: lastHabitEndTime || new Date().toISOString(),
      habitTimes: habitTimes
    };
    
    // Update routine completions state
    setRoutineCompletions(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [activeRoutine.id]: routineCompletion
      }
    }));
    
    // Update database
    await dataService.updateTodayRoutines({ [activeRoutine.id]: routineCompletion }, today);
    
    // Clear active routine state
    setActiveRoutine(null);
    setActiveRoutineIndex(0);
    setRoutineStartTime(null);
    
    // Clear active routine from database
    await dataService.updateActiveRoutine(null, today);
  };
  
  // Add goal
  const addGoal = async (goalName) => {
    const newGoal = {
      id: Date.now(),
      name: goalName,
      tasks: [],
      completed: false,
      createdAt: new Date().toISOString()
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    await dataService.updateGoals(newGoals);
  };
  
  // Add task to goal
  const addTaskToGoal = async (goalId, taskName) => {
    const newGoals = goals.map(g => 
      g.id === goalId
        ? { ...g, tasks: [...g.tasks, { id: Date.now(), name: taskName, completed: false }] }
        : g
    );
    setGoals(newGoals);
    await dataService.updateGoals(newGoals);
  };
  
  // Toggle task completion
  const toggleTaskCompletion = async (goalId, taskId) => {
    const newGoals = goals.map(g => 
      g.id === goalId
        ? {
            ...g,
            tasks: g.tasks.map(t => 
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        : g
    );
    setGoals(newGoals);
    await dataService.updateGoals(newGoals);
  };
  
  // Add task to daily todo
  const addTaskToTodo = async (task, goalId) => {
    const newTodo = {
      id: Date.now(),
      name: task.name,
      completed: false,
      goalId: goalId,
      addedAt: getTodayString()
    };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    // Update today's todos in daily data
    const todayTodos = newTodos.filter(t => t.addedAt === getTodayString());
    await dataService.updateTodayTodos(todayTodos, getTodayString());
  };
  
  // Add custom todo
  const addCustomTodo = async (todoName, goalId = null) => {
    const newTodo = {
      id: Date.now(),
      name: todoName,
      completed: false,
      goalId: goalId,
      addedAt: getTodayString()
    };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    // Update today's todos in daily data
    const todayTodos = newTodos.filter(t => t.addedAt === getTodayString());
    await dataService.updateTodayTodos(todayTodos, getTodayString());
  };

  // New functions for routine and single habit management
  const addRoutine = async (routineData) => {
    try {
      const newRoutine = await dataService.addRoutine(routineData);
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    } catch (error) {
      console.error('Error adding routine:', error);
      alert(error.message);
    }
  };

  const updateRoutine = async (routineId, routineData) => {
    try {
      const updatedRoutine = await dataService.updateRoutine(routineId, routineData);
      setRoutines(prev => prev.map(r => r.id === routineId ? updatedRoutine : r));
      return updatedRoutine;
    } catch (error) {
      console.error('Error updating routine:', error);
      alert(error.message);
    }
  };

  const deleteRoutine = async (routineId, keepHabitsAsSingles = false) => {
    try {
      await dataService.deleteRoutine(routineId, keepHabitsAsSingles);
      setRoutines(prev => prev.filter(r => r.id !== routineId));
      
      if (keepHabitsAsSingles) {
        // Reload habits to get updated data
        const updatedHabits = await dataService.getHabits();
        setHabits(updatedHabits);
      } else {
        // Remove habits that belonged to this routine
        setHabits(prev => prev.filter(h => h.routineId !== routineId));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting routine:', error);
      alert(error.message);
    }
  };


  const addSingleHabit = async (habitData) => {
    try {
      const newHabit = await dataService.addSingleHabit(habitData);
      setHabits(prev => [...prev, newHabit]);
      return newHabit;
    } catch (error) {
      console.error('Error adding single habit:', error);
      alert(error.message);
    }
  };

  const updateHabit = async (habitId, habitData) => {
    try {
      const updatedHabit = await dataService.updateHabit(habitId, habitData);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      return updatedHabit;
    } catch (error) {
      console.error('Error updating habit:', error);
      alert(error.message);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await dataService.deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert(error.message);
    }
  };

  const updateDashboardOrder = async (newOrder) => {
    try {
      setDashboardOrder(newOrder);
      await dataService.updateDashboardOrder(newOrder);
    } catch (error) {
      console.error('Error updating dashboard order:', error);
    }
  };

  // Get ordered dashboard items
  const getOrderedDashboardItems = () => {
    const safeHabits = getSafeArray(habits);
    const safeRoutines = getSafeArray(routines);
    const singleHabits = safeHabits.filter(h => h.routineId === null);
    const allItems = [
      ...safeRoutines.map(r => ({ type: 'routine', id: r.id, data: r })),
      ...singleHabits.map(h => ({ type: 'habit', id: h.id, data: h }))
    ];

    // If no custom order exists, use default order
    if (dashboardOrder.length === 0) {
      return allItems.sort((a, b) => {
        if (a.type === 'routine' && b.type === 'habit') return -1;
        if (a.type === 'habit' && b.type === 'routine') return 1;
        return a.data.order - b.data.order;
      });
    }

    // Sort by custom order, but filter out any dashboardOrder items that no longer exist
    const validDashboardOrder = dashboardOrder.filter(orderItem => 
      orderItem && orderItem.type && orderItem.id && 
      allItems.some(item => item.type === orderItem.type && item.id === orderItem.id)
    );

    return allItems.sort((a, b) => {
      const aOrder = validDashboardOrder.find(item => item.type === a.type && item.id === a.id)?.order ?? 999;
      const bOrder = validDashboardOrder.find(item => item.type === b.type && item.id === b.id)?.order ?? 999;
      return aOrder - bOrder;
    });
  };

  // Initialize dashboard order if empty
  const initializeDashboardOrder = async () => {
    if (dashboardOrder.length === 0) {
      const safeHabits = getSafeArray(habits);
      const safeRoutines = getSafeArray(routines);
      const singleHabits = safeHabits.filter(h => h.routineId === null);
      const allItems = [
        ...safeRoutines.map(r => ({ type: 'routine', id: r.id, order: r.order })),
        ...singleHabits.map(h => ({ type: 'habit', id: h.id, order: 999 }))
      ];
      
      // Sort by default order (routines first, then habits)
      allItems.sort((a, b) => {
        if (a.type === 'routine' && b.type === 'habit') return -1;
        if (a.type === 'habit' && b.type === 'routine') return 1;
        return a.order - b.order;
      });
      
      // Assign new order values
      const newOrder = allItems.map((item, index) => ({
        type: item.type,
        id: item.id,
        order: index
      }));
      
      await updateDashboardOrder(newOrder);
    } else {
      // Clean up any invalid items in existing dashboard order
      const safeHabits = getSafeArray(habits);
      const safeRoutines = getSafeArray(routines);
      const singleHabits = safeHabits.filter(h => h.routineId === null);
      const validItems = [
        ...safeRoutines.map(r => ({ type: 'routine', id: r.id })),
        ...singleHabits.map(h => ({ type: 'habit', id: h.id }))
      ];
      
      const cleanedOrder = dashboardOrder.filter(orderItem => 
        orderItem && 
        orderItem.type && 
        orderItem.id && 
        validItems.some(item => item.type === orderItem.type && item.id === orderItem.id)
      );
      
      if (cleanedOrder.length !== dashboardOrder.length) {
        setDashboardOrder(cleanedOrder);
        await dataService.updateDashboardOrder(cleanedOrder);
      }
    }
  };

  
  // Toggle todo completion
  const toggleTodoCompletion = async (todoId) => {
    const newTodos = todos.map(t => 
      t.id === todoId ? { ...t, completed: !t.completed } : t
    );
    setTodos(newTodos);
    // Update today's todos in daily data
    const todayTodos = newTodos.filter(t => t.addedAt === getTodayString());
    await dataService.updateTodayTodos(todayTodos, getTodayString());
  };
  
  // Delete todo
  const deleteTodo = async (todoId) => {
    const newTodos = todos.filter(t => t.id !== todoId);
    setTodos(newTodos);
    // Update today's todos in daily data
    const todayTodos = newTodos.filter(t => t.addedAt === getTodayString());
    await dataService.updateTodayTodos(todayTodos, getTodayString());
  };
  
  // Dashboard View
  const DashboardView = ({ selectedDate, setSelectedDate }) => {
    
    // Navigate dates
    const changeDate = (increment) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + increment);
      setSelectedDate(newDate);
    };
    
    
    // Get routine completions for a specific date
    const getRoutineCompletionsForDate = (date) => {
      const dateStr = getSelectedDateString(date);
      return routineCompletions[dateStr] || {};
    };
    
    // Get day of week for a specific date
    const getDayOfWeekForDate = (date) => {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      return days[date.getDay()];
    };
    
    // Get routines scheduled for a specific date
    const getRoutinesForDate = (date) => {
      const dayOfWeek = getDayOfWeekForDate(date);
      return routines.filter(r => r.days.includes(dayOfWeek));
    };
    
    // Get ordered dashboard items for a specific date
    const getOrderedDashboardItemsForDate = (date) => {
      const routinesForDate = getRoutinesForDate(date);
      const safeHabits = getSafeArray(habits);
      const singleHabits = safeHabits.filter(h => h.routineId === null);
      const allItems = [
        ...routinesForDate.map(r => ({ type: 'routine', id: r.id, data: r })),
        ...singleHabits.map(h => ({ type: 'habit', id: h.id, data: h }))
      ];

      // If no custom order exists, use default order
      if (dashboardOrder.length === 0) {
        return allItems.sort((a, b) => {
          if (a.type === 'routine' && b.type === 'habit') return -1;
          if (a.type === 'habit' && b.type === 'routine') return 1;
          return a.data.order - b.data.order;
        });
      }

      // Apply custom order
      const orderedItems = [];
      dashboardOrder.forEach(itemId => {
        const item = allItems.find(item => item.id === itemId);
        if (item) orderedItems.push(item);
      });

      // Add any new items not in the custom order
      allItems.forEach(item => {
        if (!dashboardOrder.includes(item.id)) {
          orderedItems.push(item);
        }
      });

      return orderedItems;
    };
    
    // Load historical data when selected date changes
    useEffect(() => {
      const loadHistoricalData = async () => {
        try {
          const dateString = getSelectedDateString(selectedDate);
          const todayString = getTodayString();
          
          // Only load historical data if it's not today and we don't already have the data
          if (dateString !== todayString && !habitCompletions[dateString]) {
            const historicalData = await dataService.getTodayData(dateString);
            if (historicalData) {
              // Update habit completions for the selected date (unified structure)
              setHabitCompletions(prev => ({
                ...prev,
                [dateString]: historicalData.habitCompletions || {}
              }));
              
              // Update routine completions for the selected date (unified structure)
              setRoutineCompletions(prev => ({
                ...prev,
                [dateString]: historicalData.routineCompletions || {}
              }));

              // Update virtue check-ins for the selected date
              setVirtueCheckIns(prev => ({
                ...prev,
                [dateString]: historicalData.virtueCheckIns || {}
              }));
            }
          }
        } catch (error) {
          console.error('Error loading historical data:', error);
          // Don't break the app if historical data loading fails
        }
      };
      
      loadHistoricalData();
    }, [selectedDate]);
    
    const activeGoal = getActiveGoal();
    const todaysTodos = todos.filter(t => t.addedAt === getSelectedDateString(selectedDate));
    const weeklyFocus = getWeeklyFocus();
    const orderedItems = getOrderedDashboardItemsForDate(selectedDate);
    
    return (
      <div className="space-y-4">
        
        {/* Active Routine Indicator */}
        {activeRoutine && (
          <div className="bg-[#1a252f] text-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-bold text-white text-lg uppercase tracking-wide">
                    {activeRoutine.name} Running
                  </h3>
                  <p className="text-sm text-white/80">
                    Habit {activeRoutineIndex + 1} of {activeRoutine.habits.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('activeRoutine')}
                className="bg-white text-[#1a252f] px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}
        
        {/* Weekly Focus */}
        <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#333333]">
          <h3 className="font-bold text-[#333333] opacity-70 mb-2 tracking-wider text-sm uppercase">This Week's Virtue</h3>
          <p className="text-xl font-bold mb-1 text-[#333333]">{weeklyFocus.virtue}</p>
          <p className="text-sm text-[#333333] mb-4">{weeklyFocus.focus}</p>
          
          {/* Daily Challenge Section */}
          {(() => {
            const currentChallenge = getCurrentDailyChallenge();
            const canEdit = canCheckInForDate(selectedDate);
            const availableChallenge = getDailyChallengeForDate(selectedDate);
            
            // Show loading state
            if (challengesLoading) {
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 text-center">
                      Loading daily challenge...
                    </p>
                  </div>
                </div>
              );
            }
            
            // Check if no challenges are available
            if (challenges.length === 0) {
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>No challenges available.</strong> Please check back later or contact support.
                    </p>
                  </div>
                </div>
              );
            }
            
            // Check if no challenges available for current virtue
            if (!availableChallenge) {
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>No challenges available for {weeklyFocus.virtue}.</strong> Check back tomorrow for new challenges.
                    </p>
                  </div>
                </div>
              );
            }
            
            if (!currentChallenge || !currentChallenge.accepted) {
              // Show challenge button if not accepted yet
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={showChallenge}
                    disabled={!canEdit}
                    className="w-full bg-[#1a252f] text-white px-4 py-2 rounded-lg hover:bg-[#1a252f] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {canEdit ? 'Daily Challenge' : 'Challenge (View Only)'}
                  </button>
                </div>
              );
            } else if (currentChallenge.accepted && !currentChallenge.completed) {
              // Show challenge description with complete button
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-[#1a252f]/10 p-3 rounded-lg mb-3">
                    <p className="text-sm font-medium text-[#1a252f] mb-1">Today's Challenge:</p>
                    <p className="text-sm text-[#1a252f]">{currentChallenge.challenge}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                      currentChallenge.difficulty === 'easy' ? 'bg-[#4b5320]/20 text-[#4b5320]' :
                      currentChallenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentChallenge.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={completeDailyChallenge}
                    disabled={!canEdit}
                    className="w-full bg-[#4b5320] text-white px-4 py-2 rounded-lg hover:bg-[#4b5320] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {canEdit ? 'Mark Complete' : 'Completed'}
                  </button>
                </div>
              );
            } else if (currentChallenge.completed) {
              // Show completed challenge
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-[#4b5320]/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#4b5320] text-lg">✓</span>
                      <p className="text-sm font-medium text-[#4b5320]">Challenge Completed!</p>
                    </div>
                    <p className="text-sm text-[#4b5320]">{currentChallenge.challenge}</p>
                    <p className="text-xs text-[#4b5320] mt-1">
                      Completed at {new Date(currentChallenge.completedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
        
        
        
        {/* Daily Quote */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-base leading-relaxed text-[#333333] font-serif italic">{getDailyQuote()}</p>
        </div>
        
        {/* Date Navigator */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} strokeWidth={2.5} className="text-[#333333]" />
            </button>
            
            <div className="text-center">
              <p className="text-lg font-bold text-[#333333]">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <p className="text-sm text-[#333333] opacity-70 font-mono">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              disabled={getSelectedDateString(selectedDate) === getSelectedDateString(new Date())}
            >
              <ChevronRight 
                size={24} 
                strokeWidth={2.5} 
                className={getSelectedDateString(selectedDate) === getSelectedDateString(new Date()) ? "text-[#333333] opacity-30" : "text-[#333333]"} 
              />
            </button>
          </div>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="w-full py-2 bg-stone-100 text-[#333333] rounded-lg hover:bg-stone-200 font-bold uppercase text-xs tracking-wider transition-colors"
          >
            Today
          </button>
        </div>
        
        {/* Ordered Dashboard Items */}
        {orderedItems.map((item, index) => {
          if (item.type === 'routine') {
            const routine = item.data;
            const isExpanded = expandedRoutines.has(routine.id);
            const stats = getRoutineCompletionStats(routine.id, getTodayString());
            
            return (
              <div key={`routine-${routine.id}`} className="bg-white rounded-xl shadow-md">
                {/* Clickable Header */}
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-stone-50 transition-colors"
                  onClick={() => toggleRoutineExpanded(routine.id)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[#333333] text-lg uppercase tracking-wide">{routine.name}</h3>
                    {stats.completed && (
                      <span className="text-sm text-stone-600 font-mono">
                        {Math.round(stats.totalTime * 10) / 10}m total
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-mono px-2 py-1 rounded ${
                      stats.completed 
                        ? 'bg-[#4b5320]/30 text-[#4b5320]' 
                        : stats.percentage > 0 
                          ? 'bg-[#1a252f]/30 text-[#1a252f]' 
                          : 'bg-stone-200 text-stone-600'
                    }`}>
                      {stats.percentage}%
                    </span>
                    <ChevronRight 
                      size={20} 
                      strokeWidth={2.5} 
                      className={`text-[#333333] transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </div>
                
                
                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      {routine.habits.map(habitId => {
                        const habit = habits.find(h => h.id === habitId);
                        if (!habit) return null;
                        const completion = habitCompletions[getTodayString()]?.[habitId];
                        const isComplete = completion?.completed || false;
                        const streak = getHabitStreak(habitId);
                        
                        
                        return (
                          <div
                            key={habitId}
                            className="flex items-center justify-between p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => toggleHabitCompletion(habitId, getTodayString())}
                          >
                            <div className="flex items-center gap-3">
                              {isComplete ? (
                                <CheckSquare className="text-[#333333]" size={20} strokeWidth={2.5} />
                              ) : (
                                <Circle className="text-[#333333] opacity-40" size={20} strokeWidth={2.5} />
                              )}
                              <div className="flex flex-col">
                                <span className={isComplete ? "line-through text-[#333333] opacity-50" : "text-[#333333] font-medium"}>
                                  {habit.name}
                                </span>
                                {isComplete && getCompletionTimeDisplay(habitId, getSelectedDateString(selectedDate)) && (
                                  <span className="text-xs text-[#4b5320] font-mono">
                                    Completed in {getCompletionTimeDisplay(habitId, getSelectedDateString(selectedDate))}m
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {streak > 0 && (
                                <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                                  {streak}D
                                </span>
                              )}
                              {/* Only show timer controls when in active routine */}
                              {activeRoutine && (habit.duration || habit.expectedCompletionTime || activeTimers[habit.id]) && (
                                <div className="flex items-center gap-1">
                                  {activeTimers[habit.id] ? (
                                    <>
                                      {habit.duration ? (
                                        <span className="text-xs bg-[#1a252f]/100 text-white px-2 py-1 font-mono rounded">
                                          {formatMinutesToHours(getTimerTimeRemaining(habit.id))}
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-[#4b5320]/100 text-white px-2 py-1 font-mono rounded">
                                          {formatMinutesToHours(Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60))}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          stopTimer(habit.id, true);
                                          toggleHabitCompletion(habit.id, getTodayString());
                                        }}
                                        className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                                        title="Complete Habit"
                                      >
                                        <Check size={14} strokeWidth={2.5} className="text-[#4b5320]" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          stopTimer(habit.id, false);
                                        }}
                                        className="p-1 hover:bg-red-100 rounded transition-colors"
                                        title="Stop Timer"
                                      >
                                        <X size={14} strokeWidth={2.5} className="text-red-600" />
                                      </button>
                                    </>
                                  ) : habit.duration ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startTimer(habit.id, habit.duration);
                                      }}
                                      className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                                      title="Start Timer"
                                    >
                                      <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                                    </button>
                                  ) : habit.expectedCompletionTime ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startUncappedTimer(habit.id);
                                      }}
                                      className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                                      title="Start Timer"
                                    >
                                      <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                                    </button>
                                  ) : null}
                                  {getAverageCompletionTime(habit.id) && (
                                    <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                                      Avg: {getAverageCompletionTime(habit.id)}m
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Expected Time Progress Bar - only in routine */}
                              {activeRoutine && activeTimers[habit.id] && habit.expectedCompletionTime && (
                                <ExpectedTimeProgressBar habitId={habit.id} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {routine.habits.length === 0 && (
                        <p className="text-[#333333] opacity-50 text-sm">No habits in this routine yet.</p>
                      )}
                    </div>
                    
                    {/* Routine Completion Info - Only show if completed through active routine */}
                    {(() => {
                      const today = getTodayString();
                      const routineCompletion = routineCompletions[today]?.[routine.id];
                      // Only show green box if routine was completed through active routine (has timing data)
                      if (routineCompletion && routineCompletion.completed && routineCompletion.totalTime > 0) {
                        return (
                          <div className="mt-3 p-3 bg-[#4b5320]/10 border border-[#4b5320]/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[#4b5320]">Routine Completed Today</span>
                              <span className="text-sm font-mono text-[#4b5320]">
                                {Math.round(routineCompletion.totalTime * 10) / 10}m total
                              </span>
                            </div>
                            {routineCompletion.startTime && routineCompletion.endTime && (
                              <div className="text-xs text-[#4b5320] mt-1">
                                {new Date(routineCompletion.startTime).toLocaleTimeString()} - {new Date(routineCompletion.endTime).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                      {/* Start Routine Button */}
                      {routine.habits.length > 0 && !stats.completed && getSelectedDateString(selectedDate) === getSelectedDateString(new Date()) && (
                        <button
                          onClick={() => startRoutine(routine.id)}
                          disabled={activeRoutine !== null && activeRoutine.id !== routine.id} 
                          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#4b5320]/100 text-white py-3 rounded-lg hover:bg-[#4b5320] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <Play size={20} strokeWidth={2.5} />
                          {activeRoutine?.id === routine.id ? 'Resume Routine' : 'Start Routine'} 
                        </button>
                      )}
                  </div>
                )}
              </div>
            );
          } else if (item.type === 'habit') {
            const habit = item.data;
            const completion = habitCompletions[getTodayString()]?.[habit.id];
            const isComplete = completion?.completed || false;
            const streak = getHabitStreak(habit.id);
            
            return (
              <div key={`habit-${habit.id}`} className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleHabitCompletion(habit.id, getTodayString())}
                    >
                      {isComplete ? (
                        <CheckSquare className="text-[#333333]" size={24} strokeWidth={2.5} />
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={24} strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h3 className={`font-bold text-lg uppercase tracking-wide ${
                        isComplete ? "line-through opacity-50" : "text-[#333333]"
                      }`}>
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-sm text-[#333333] opacity-70">{habit.description}</p>
                      )}
                      {isComplete && getCompletionTimeDisplay(habit.id, getTodayString()) && (
                        <span className="text-xs text-[#4b5320] font-mono">
                          Completed in {getCompletionTimeDisplay(habit.id, getTodayString())}m
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                        {streak}D
                      </span>
                    )}
                    {habit.trackingType === 'timed' && !activeRoutine && (
                      <div className="flex items-center gap-1">
                        {activeTimers[habit.id] ? (
                          <>
                            {habit.duration ? (
                              <span className="text-xs bg-[#1a252f]/100 text-white px-2 py-1 font-mono rounded">
                                {formatMinutesToHours(getTimerTimeRemaining(habit.id))}
                              </span>
                            ) : (
                              <span className="text-xs bg-[#4b5320]/100 text-white px-2 py-1 font-mono rounded">
                                {formatMinutesToHours(Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60))}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                stopTimer(habit.id, true);
                                toggleHabitCompletion(habit.id, getTodayString());
                              }}
                              className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                              title="Complete Habit"
                            >
                              <Check size={14} strokeWidth={2.5} className="text-[#4b5320]" />
                            </button>
                            <button
                              onClick={() => stopTimer(habit.id, false)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Stop Timer"
                            >
                              <X size={14} strokeWidth={2.5} className="text-red-600" />
                            </button>
                          </>
                        ) : habit.duration ? (
                          <button
                            onClick={() => startTimer(habit.id, habit.duration)}
                            className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                            title="Start Timer"
                          >
                            <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                          </button>
                        ) : habit.expectedCompletionTime ? (
                          <button
                            onClick={() => startUncappedTimer(habit.id)}
                            className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                            title="Start Timer"
                          >
                            <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                          </button>
                        ) : null}
                        {getAverageCompletionTime(habit.id) && (
                          <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                            Avg: {getAverageCompletionTime(habit.id)}m
                          </span>
                        )}
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
        
        {/* Routine Completions for Selected Date */}
        {(() => {
          const dayRoutineCompletions = getRoutineCompletionsForDate(selectedDate);
          const routineIds = Object.keys(dayRoutineCompletions);
          
          if (routineIds.length > 0) {
            return (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Completions</h3>
                <div className="space-y-2">
                  {routineIds.map(routineId => {
                    const routine = routines.find(r => r.id === parseInt(routineId));
                    const completion = dayRoutineCompletions[routineId];
                    if (!routine || !completion) return null;
                    
                    return (
                      <div key={routineId} className="p-3 bg-stone-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-[#333333]">{routine.name}</span>
                          <span className={`text-xs px-2 py-1 rounded font-mono ${
                            completion.completed 
                              ? 'bg-[#4b5320]/30 text-[#4b5320]' 
                              : 'bg-orange-200 text-orange-800'
                          }`}>
                            {completion.completed ? 'Completed' : 'Abandoned'}
                          </span>
                        </div>
                        <div className="text-sm text-[#333333] opacity-70">
                          <div className="flex items-center gap-4 mb-1">
                            <p>Actual: {Math.round(completion.totalTime * 10) / 10}m</p>
                            {completion.estimatedTime && (
                              <p>Estimated: {completion.estimatedTime}m</p>
                            )}
                            {completion.estimatedTime && (
                              <p className={`font-medium ${
                                completion.totalTime <= completion.estimatedTime 
                                  ? 'text-[#4b5320]' 
                                  : 'text-orange-600'
                              }`}>
                                {completion.totalTime <= completion.estimatedTime ? '✓' : '⚠'} 
                                {Math.round(((completion.totalTime / completion.estimatedTime) - 1) * 100)}%
                              </p>
                            )}
                          </div>
                          {completion.startTime && (
                            <p>Started: {new Date(completion.startTime).toLocaleTimeString()}</p>
                          )}
                          {completion.endTime && (
                            <p>Ended: {new Date(completion.endTime).toLocaleTimeString()}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Active Goal */}
        {activeGoal && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Active Goal</h3>
            <p className="text-lg font-bold mb-3 text-[#333333]">{activeGoal.name}</p>
            <div className="w-full bg-stone-200 h-2 rounded-full mb-2">
              <div
                className="bg-[#333333] h-2 rounded-full transition-all"
                style={{
                  width: `${activeGoal.tasks.length > 0 
                    ? (activeGoal.tasks.filter(t => t.completed).length / activeGoal.tasks.length) * 100 
                    : 0}%`
                }}
              ></div>
            </div>
            <p className="text-xs text-[#333333] opacity-70 font-mono uppercase tracking-wider">
              {activeGoal.tasks.filter(t => t.completed).length} / {activeGoal.tasks.length} complete
            </p>
          </div>
        )}
        
        {/* Daily Todo List */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">
            {getSelectedDateString(selectedDate) === getSelectedDateString(new Date()) ? "Today's Tasks" : "Tasks"}
          </h3>
          <div className="space-y-2 mb-3">
            {todaysTodos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg"
              >
                <div
                  className="flex-grow flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleTodoCompletion(todo.id)}
                >
                  {todo.completed ? (
                    <CheckSquare className="text-[#333333]" size={18} strokeWidth={2.5} />
                  ) : (
                    <Circle className="text-[#333333] opacity-40" size={18} strokeWidth={2.5} />
                  )}
                  <span className={todo.completed ? "line-through text-[#333333] opacity-50 text-sm" : "text-[#333333] text-sm"}>
                    {todo.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-[#333333] opacity-40 hover:text-[#333333] hover:opacity-100"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {todaysTodos.length === 0 && (
              <p className="text-[#333333] opacity-50 text-sm">No tasks for today.</p>
            )}
          </div>
          <button
            onClick={() => {
              const name = prompt("New todo item:");
              if (name) addCustomTodo(name);
            }}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <Plus size={20} strokeWidth={2.5} />
            Add Task
          </button>
        </div>
      </div>
    );
  };
  
  // Routines View
  const RoutinesView = ({ selectedDate }) => {
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    
    if (showHistory) {
      return <HistoryView onClose={() => setShowHistory(false)} />;
    }
    
    const singleHabits = habits.filter(h => h.routineId === null);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Routines & Habits</h2>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#333333] font-bold uppercase text-xs tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <TrendingUp size={18} strokeWidth={2.5} />
            History
          </button>
        </div>
        
        {/* Management Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddChoiceModal(true)}
            className="flex items-center gap-2 bg-[#4b5320]/100 text-white px-4 py-2 rounded-lg hover:bg-[#4b5320] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add
          </button>
          <button
            onClick={() => setShowOrderRoutinesModal(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <GripVertical size={18} strokeWidth={2.5} />
            Order Routines
          </button>
        </div>
        
        {routines.sort((a, b) => a.order - b.order).map((routine, index) => (
          <div key={routine.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-[#333333] uppercase tracking-wide">{routine.name}</h3>
                <button
                  onClick={() => {
                    setEditingRoutine(routine);
                    setShowRoutineEditModal(true);
                  }}
                  className="p-1 hover:bg-stone-100 rounded transition-colors"
                  title="Edit Routine"
                >
                  <Edit2 size={16} strokeWidth={2.5} className="text-[#333333] opacity-60" />
                </button>
              </div>
              <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono rounded">
                {routine.days.map(d => d.substring(0, 3).toUpperCase()).join(' ')}
              </span>
            </div>
            
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                {routine.timeOfDay.toUpperCase()}
              </span>
              {(() => {
                const durationInfo = calculateRoutineDuration(routine.id);
                if (durationInfo.totalDuration > 0) {
                  return (
                    <span className="text-xs bg-[#1a252f]/20 text-[#1a252f] px-2 py-1 font-mono rounded">
                      {formatMinutesToHours(durationInfo.totalDuration)} total
                      {durationInfo.hasUnknownDurations && ` (+${durationInfo.unknownDurationCount} unknown)`}
                    </span>
                  );
                }
                return (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 font-mono rounded">
                    Duration unknown
                  </span>
                );
              })()}
            </div>
            
            <div className="space-y-2">
              {routine.habits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                const completion = habitCompletions[getTodayString()]?.[habitId];
                const isComplete = completion?.completed || false;
                const streak = getHabitStreak(habitId);
                
                return (
                  <div
                    key={habitId}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div 
                      className="flex-grow flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleHabitCompletion(habitId, getTodayString())}
                    >
                      {isComplete ? (
                        <CheckSquare className="text-[#333333]" size={20} strokeWidth={2.5} />
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={20} strokeWidth={2.5} />
                      )}
                      <span className={isComplete ? "line-through text-[#333333] opacity-50" : "text-[#333333] font-medium"}>
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {streak > 0 && (
                        <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                          {streak}D
                        </span>
                      )}
                      {/* Only show timer controls when in active routine */}
                      {activeRoutine && (habit.duration || activeTimers[habit.id]) && (
                        <div className="flex items-center gap-1">
                          {activeTimers[habit.id] ? (
                            <>
                              {habit.duration ? (
                                <span className="text-xs bg-[#1a252f]/100 text-white px-2 py-1 font-mono rounded">
                                  {formatMinutesToHours(getTimerTimeRemaining(habit.id))}
                                </span>
                              ) : (
                                <span className="text-xs bg-[#4b5320]/100 text-white px-2 py-1 font-mono rounded">
                                  {formatMinutesToHours(Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60))}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopTimer(habit.id, true);
                                  toggleHabitCompletion(habit.id, getTodayString());
                                }}
                                className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                                title="Complete Habit"
                              >
                                <Check size={14} strokeWidth={2.5} className="text-[#4b5320]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopTimer(habit.id, false);
                                }}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Stop Timer"
                              >
                                <X size={14} strokeWidth={2.5} className="text-red-600" />
                              </button>
                            </>
                          ) : habit.duration ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startTimer(habit.id, habit.duration);
                              }}
                              className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                              title="Start Timer"
                            >
                              <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                            </button>
                          ) : null}
                          {getAverageCompletionTime(habit.id) && (
                            <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                              Avg: {getAverageCompletionTime(habit.id)}m
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHabit(habit);
                          setShowHabitEditModal(true);
                        }}
                        className="p-1 hover:bg-stone-200 rounded transition-colors"
                        title="Edit Habit"
                      >
                        <Edit2 size={16} strokeWidth={2.5} className="text-[#333333] opacity-60" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {routine.habits.length === 0 && (
                <p className="text-[#333333] opacity-50 text-sm text-center py-4">No habits in this routine yet.</p>
              )}
            </div>
            
            {routine.habits.length > 0 && getSelectedDateString(selectedDate) === getSelectedDateString(new Date()) && (
              <div className="mt-3">
                <button
                  onClick={() => startRoutine(routine.id)}
                  disabled={activeRoutine !== null && activeRoutine.id !== routine.id}
                  className="w-full flex items-center justify-center gap-2 bg-[#4b5320]/100 text-white py-3 rounded-lg hover:bg-[#4b5320] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Play size={20} strokeWidth={2.5} />
                  {activeRoutine?.id === routine.id ? 'Resume Routine' : 'Start Routine'} 
                </button>
              </div>
            )}
          </div>
        ))}
        
        {/* Virtue Check-in Modal */}
        {expandedVirtues && (
          <VirtueCheckInModal
            isOpen={expandedVirtues}
            onClose={() => setExpandedVirtues(false)}
            weeklyFocuses={weeklyFocuses}
            selectedDate={selectedDate}
            existingResponses={virtueCheckIns[getSelectedDateString(selectedDate)] || {}}
            canCheckIn={canCheckInForDate(selectedDate)}
            onComplete={completeVirtueCheckIn}
            getDateString={getSelectedDateString}
            getWeeklyFocus={getWeeklyFocus}
          />
        )}
        
        {/* Single Habits Section */}
        {singleHabits.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-[#333333] mb-4 text-lg uppercase tracking-wide">Single Habits</h3>
            <div className="space-y-2">
              {singleHabits.map(habit => {
                const completion = habitCompletions[getTodayString()]?.[habit.id];
                const isComplete = completion?.completed || false;
                const streak = getHabitStreak(habit.id);
                
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div 
                      className="flex-grow flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleHabitCompletion(habit.id, getTodayString())}
                    >
                      {isComplete ? (
                        <CheckSquare className="text-[#333333]" size={20} strokeWidth={2.5} />
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={20} strokeWidth={2.5} />
                      )}
                      <div className="flex flex-col">
                        <span className={isComplete ? "line-through text-[#333333] opacity-50" : "text-[#333333] font-medium"}>
                          {habit.name}
                        </span>
                        {habit.description && (
                          <span className="text-xs text-[#333333] opacity-70">{habit.description}</span>
                        )}
                        {isComplete && getCompletionTimeDisplay(habit.id, getTodayString()) && (
                          <span className="text-xs text-[#4b5320] font-mono">
                            Completed in {getCompletionTimeDisplay(habit.id, getTodayString())}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {streak > 0 && (
                        <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                          {streak}D
                        </span>
                      )}
                      {habit.trackingType === 'timed' && !activeRoutine && (
                        <div className="flex items-center gap-1">
                          {activeTimers[habit.id] ? (
                            <>
                              {habit.duration ? (
                                <span className="text-xs bg-[#1a252f]/100 text-white px-2 py-1 font-mono rounded">
                                  {formatMinutesToHours(getTimerTimeRemaining(habit.id))}
                                </span>
                              ) : (
                                <span className="text-xs bg-[#4b5320]/100 text-white px-2 py-1 font-mono rounded">
                                  {formatMinutesToHours(Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60))}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  stopTimer(habit.id, true);
                                  toggleHabitCompletion(habit.id, getTodayString());
                                }}
                                className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                                title="Complete Habit"
                              >
                                <Check size={14} strokeWidth={2.5} className="text-[#4b5320]" />
                              </button>
                              <button
                                onClick={() => stopTimer(habit.id, false)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Stop Timer"
                              >
                                <X size={14} strokeWidth={2.5} className="text-red-600" />
                              </button>
                            </>
                          ) : habit.duration ? (
                            <button
                              onClick={() => startTimer(habit.id, habit.duration)}
                              className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                              title="Start Timer"
                            >
                              <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                            </button>
                          ) : habit.expectedCompletionTime ? (
                            <button
                              onClick={() => startUncappedTimer(habit.id)}
                              className="p-1 hover:bg-[#4b5320]/20 rounded transition-colors"
                              title="Start Timer"
                            >
                              <div className="w-3 h-3 bg-[#4b5320]/100 rounded-full"></div>
                            </button>
                          ) : null}
                          {getAverageCompletionTime(habit.id) && (
                            <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                              Avg: {getAverageCompletionTime(habit.id)}m
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEditingHabit(habit);
                          setShowHabitEditModal(true);
                        }}
                        className="p-1 hover:bg-stone-200 rounded transition-colors"
                        title="Edit Habit"
                      >
                        <Edit2 size={16} strokeWidth={2.5} className="text-[#333333] opacity-60" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this habit?')) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 size={16} strokeWidth={2.5} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Goals View
  const GoalsView = () => {
    const [expandedGoal, setExpandedGoal] = useState(null);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Goals</h2>
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} strokeWidth={2.5} />
            New Goal
          </button>
        </div>
        
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-xl shadow-md p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
            >
              <h3 className="font-bold text-[#333333]">{goal.name}</h3>
              <ChevronRight 
                className={`transform transition-transform text-[#333333] ${expandedGoal === goal.id ? 'rotate-90' : ''}`}
                size={20}
                strokeWidth={2.5}
              />
            </div>
            
            {goal.tasks.length > 0 && (
              <div className="mt-3">
                <div className="w-full bg-stone-200 h-2 rounded-full">
                  <div
                    className="bg-[#333333] h-2 rounded-full transition-all"
                    style={{
                      width: `${(goal.tasks.filter(t => t.completed).length / goal.tasks.length) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-[#333333] opacity-70 mt-1 font-mono uppercase tracking-wider">
                  {goal.tasks.filter(t => t.completed).length} / {goal.tasks.length} complete
                </p>
              </div>
            )}
            
            {expandedGoal === goal.id && (
              <div className="mt-4 space-y-2">
                {goal.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div
                      className="flex-grow flex items-center gap-2 p-2 bg-stone-50 rounded-lg cursor-pointer"
                      onClick={() => toggleTaskCompletion(goal.id, task.id)}
                    >
                      {task.completed ? (
                        <CheckSquare className="text-[#333333]" size={18} strokeWidth={2.5} />
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={18} strokeWidth={2.5} />
                      )}
                      <span className={task.completed ? "line-through text-[#333333] opacity-50 text-sm" : "text-[#333333] text-sm"}>
                        {task.name}
                      </span>
                    </div>
                    <button
                      onClick={() => addTaskToTodo(task, goal.id)}
                      className="bg-stone-600 text-white px-2 py-1 text-xs rounded hover:bg-stone-700 transition-colors font-mono uppercase tracking-wider"
                    >
                      →
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    setSelectedGoalForTask(goal.id);
                    setShowTaskModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider mt-3 shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Add Task
                </button>
              </div>
            )}
          </div>
        ))}
        
        {goals.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-[#333333] opacity-50 uppercase text-sm tracking-wide">No goals yet</p>
          </div>
        )}
      </div>
    );
  };
  
  // History View
  const HistoryView = ({ onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month', 'year'
    
    // Navigate dates based on view mode
    const changeDate = (increment) => {
      const newDate = new Date(selectedDate);
      
      switch (viewMode) {
        case 'day':
          newDate.setDate(newDate.getDate() + increment);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (increment * 7));
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + increment);
          break;
        case 'year':
          newDate.setFullYear(newDate.getFullYear() + increment);
          break;
        default:
          newDate.setDate(newDate.getDate() + increment);
      }
      
      setSelectedDate(newDate);
    };
    
    // Get date string
    const getDateString = (date) => {
      return getDateStringLocal(date);
    };
    
    // Get habits for a specific date
    const getHabitsForDate = (date) => {
      const dateStr = getDateString(date);
      const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
      
      // Get all active routines for this day
      const activeRoutines = routines.filter(r => r.days.includes(dayOfWeek));
      
      // Get all habits from these routines
      const activeHabits = habits.filter(h => 
        activeRoutines.some(r => r.habits.includes(h.id))
      );
      
      return activeHabits.map(habit => ({
        ...habit,
        completed: habitCompletions[dateStr]?.[habit.id]?.completed || false
      }));
    };
    
    // Calculate completion rate for a date
    const getCompletionRate = (date) => {
      const habitsForDate = getHabitsForDate(date);
      if (habitsForDate.length === 0) return 0;
      const completed = habitsForDate.filter(h => h.completed).length;
      return Math.round((completed / habitsForDate.length) * 100);
    };

    // Helper functions for month and year views
    const getWeeksInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const weeks = [];
      let currentWeekStart = new Date(firstDay);
      
      // Adjust to start of week (Sunday)
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        weeks.push({
          start: new Date(currentWeekStart),
          end: new Date(weekEnd)
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
      
      return weeks;
    };

    const getMonthsInYear = (year) => {
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push(new Date(year, i, 1));
      }
      return months;
    };

    const getWeeklyStats = (startDate, endDate) => {
      const days = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      const completionRates = days.map(date => getCompletionRate(date));
      const avgRate = completionRates.length > 0 
        ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
        : 0;
      
      const perfectDays = completionRates.filter(rate => rate === 100).length;
      const totalHabits = days.reduce((sum, date) => sum + getHabitsForDate(date).length, 0);
      const completedHabits = days.reduce((sum, date) => {
        const habits = getHabitsForDate(date);
        return sum + habits.filter(h => h.completed).length;
      }, 0);
      
      return {
        avgRate,
        perfectDays,
        totalHabits,
        completedHabits,
        days: days.length
      };
    };

    const getMonthlyStats = (month, year) => {
      const weeks = getWeeksInMonth(new Date(year, month, 1));
      const weeklyStats = weeks.map(week => getWeeklyStats(week.start, week.end));
      
      const totalAvgRate = weeklyStats.length > 0
        ? Math.round(weeklyStats.reduce((sum, stats) => sum + stats.avgRate, 0) / weeklyStats.length)
        : 0;
      
      const totalPerfectDays = weeklyStats.reduce((sum, stats) => sum + stats.perfectDays, 0);
      const totalHabits = weeklyStats.reduce((sum, stats) => sum + stats.totalHabits, 0);
      const totalCompletedHabits = weeklyStats.reduce((sum, stats) => sum + stats.completedHabits, 0);
      
      return {
        avgRate: totalAvgRate,
        perfectDays: totalPerfectDays,
        totalHabits,
        completedHabits: totalCompletedHabits,
        weeks: weeklyStats
      };
    };

    const getYearlyStats = (year) => {
      const months = getMonthsInYear(year);
      const monthlyStats = months.map(month => getMonthlyStats(month.getMonth(), year));
      
      const totalAvgRate = monthlyStats.length > 0
        ? Math.round(monthlyStats.reduce((sum, stats) => sum + stats.avgRate, 0) / monthlyStats.length)
        : 0;
      
      const totalPerfectDays = monthlyStats.reduce((sum, stats) => sum + stats.perfectDays, 0);
      const totalHabits = monthlyStats.reduce((sum, stats) => sum + stats.totalHabits, 0);
      const totalCompletedHabits = monthlyStats.reduce((sum, stats) => sum + stats.completedHabits, 0);
      
      return {
        avgRate: totalAvgRate,
        perfectDays: totalPerfectDays,
        totalHabits,
        completedHabits: totalCompletedHabits,
        months: monthlyStats
      };
    };
    
    // Get last 7 days for week view
    const getLast7Days = () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - i);
        days.push(date);
      }
      return days;
    };

    // Get routine completions for a specific date
    const getRoutineCompletionsForDate = (date) => {
      const dateStr = getDateString(date);
      return routineCompletions[dateStr] || {};
    };

    // Calculate routine statistics
    const getRoutineStats = () => {
      const allRoutineCompletions = Object.values(routineCompletions).flatMap(dayCompletions => 
        Object.values(dayCompletions)
      );
      
      if (allRoutineCompletions.length === 0) {
        return {
          totalRoutines: 0,
          completedRoutines: 0,
          averageTime: 0,
          totalTime: 0
        };
      }

      const completedRoutines = allRoutineCompletions.filter(r => r.completed);
      const totalTime = allRoutineCompletions.reduce((sum, r) => sum + (r.totalTime || 0), 0);
      const averageTime = completedRoutines.length > 0 
        ? completedRoutines.reduce((sum, r) => sum + (r.totalTime || 0), 0) / completedRoutines.length 
        : 0;

      return {
        totalRoutines: allRoutineCompletions.length,
        completedRoutines: completedRoutines.length,
        averageTime: Math.round(averageTime * 10) / 10,
        totalTime: Math.round(totalTime * 10) / 10
      };
    };
    
    const selectedDateStr = getDateString(selectedDate);
    const habitsForSelectedDate = getHabitsForDate(selectedDate);
    const completionRate = getCompletionRate(selectedDate);
    const last7Days = getLast7Days();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">History</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-stone-200 text-[#333333] px-4 py-2 rounded-lg hover:bg-stone-300 font-bold uppercase text-xs tracking-wider transition-all"
          >
            <X size={18} strokeWidth={2.5} />
            Close
          </button>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month', 'year'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-[#333333] text-white'
                  : 'bg-white text-[#333333] hover:bg-stone-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        
        
        {viewMode === 'day' ? (
          <>
            {/* Date Navigator */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={24} strokeWidth={2.5} className="text-[#333333]" />
                </button>
                
                <div className="text-center">
                  <p className="text-lg font-bold text-[#333333]">
                    {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    {viewMode === 'week' && `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    {viewMode === 'year' && selectedDate.getFullYear().toString()}
                  </p>
                  <p className="text-sm text-[#333333] opacity-70 font-mono">
                    {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {viewMode === 'week' && selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    {viewMode === 'year' && selectedDate.getFullYear().toString()}
                  </p>
                </div>
                
                <button
                  onClick={() => changeDate(1)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  disabled={getDateString(selectedDate) === getDateString(new Date())}
                >
                  <ChevronRight 
                    size={24} 
                    strokeWidth={2.5} 
                    className={getDateString(selectedDate) === getDateString(new Date()) ? "text-[#333333] opacity-30" : "text-[#333333]"} 
                  />
                </button>
              </div>
              
              <button
                onClick={() => setSelectedDate(new Date())}
                className="w-full py-2 bg-stone-100 text-[#333333] rounded-lg hover:bg-stone-200 font-bold uppercase text-xs tracking-wider transition-colors"
              >
                Today
              </button>
            </div>
            
            {/* Completion Stats */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <div className="w-full bg-stone-200 h-4 rounded-full">
                    <div
                      className="bg-black h-4 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${completionRate}%` }}
                    >
                      {completionRate > 15 && (
                        <span className="text-white font-bold text-xs">{completionRate}%</span>
                      )}
                    </div>
                  </div>
                </div>
                {completionRate <= 15 && (
                  <span className="font-bold text-lg text-[#333333] font-mono">{completionRate}%</span>
                )}
              </div>
              <p className="text-xs text-[#333333] opacity-70 mt-2 font-mono uppercase tracking-wider">
                {habitsForSelectedDate.filter(h => h.completed).length} / {habitsForSelectedDate.length} habits completed
              </p>
            </div>
            
            {/* Day Routine Completions */}
            {(() => {
              const dayRoutineCompletions = getRoutineCompletionsForDate(selectedDate);
              const routineIds = Object.keys(dayRoutineCompletions);
              
              if (routineIds.length > 0) {
                return (
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Completions</h3>
                    <div className="space-y-2">
                      {routineIds.map(routineId => {
                        const routine = routines.find(r => r.id === parseInt(routineId));
                        const completion = dayRoutineCompletions[routineId];
                        if (!routine || !completion) return null;
                        
                        return (
                          <div key={routineId} className="p-3 bg-stone-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-[#333333]">{routine.name}</span>
                              <span className={`text-xs px-2 py-1 rounded font-mono ${
                                completion.completed 
                                  ? 'bg-[#4b5320]/30 text-[#4b5320]' 
                                  : 'bg-orange-200 text-orange-800'
                              }`}>
                                {completion.completed ? 'Completed' : 'Abandoned'}
                              </span>
                            </div>
                            <div className="text-sm text-[#333333] opacity-70">
                              <div className="flex items-center gap-4 mb-1">
                                <p>Actual: {Math.round(completion.totalTime * 10) / 10}m</p>
                                {completion.estimatedTime && (
                                  <p>Estimated: {completion.estimatedTime}m</p>
                                )}
                                {completion.estimatedTime && (
                                  <p className={`font-medium ${
                                    completion.totalTime <= completion.estimatedTime 
                                      ? 'text-[#4b5320]' 
                                      : 'text-orange-600'
                                  }`}>
                                    {completion.totalTime <= completion.estimatedTime ? '✓' : '⚠'} 
                                    {Math.round(((completion.totalTime / completion.estimatedTime) - 1) * 100)}%
                                  </p>
                                )}
                              </div>
                              {completion.startTime && (
                                <p>Started: {new Date(completion.startTime).toLocaleTimeString()}</p>
                              )}
                              {completion.endTime && (
                                <p>Finished: {new Date(completion.endTime).toLocaleTimeString()}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </>
        ) : viewMode === 'week' ? (
          <>
            {/* Week Summary */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Week Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#333333] font-mono">
                    {Math.round(last7Days.reduce((sum, date) => sum + getCompletionRate(date), 0) / 7)}%
                  </p>
                  <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Rate</p>
                </div>
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#333333] font-mono">
                    {last7Days.filter(date => getCompletionRate(date) === 100).length}
                  </p>
                  <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Perfect Days</p>
                </div>
              </div>
            </div>

            {/* Routine Statistics */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Statistics</h3>
              {(() => {
                const stats = getRoutineStats();
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.completedRoutines}/{stats.totalRoutines}
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.averageTime}m
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Time</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Week View */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">Last 7 Days</h3>
              <div className="space-y-3">
                {last7Days.map((date, index) => {
                  const dateHabits = getHabitsForDate(date);
                  const rate = getCompletionRate(date);
                  const isToday = getDateString(date) === getDateString(new Date());
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg ${isToday ? 'bg-stone-100 border-2 border-[#333333]' : 'bg-stone-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#333333] text-sm">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-xs text-[#333333] opacity-70 font-mono">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[#333333] font-mono">{rate}%</p>
                          <p className="text-xs text-[#333333] opacity-70">
                            {dateHabits.filter(h => h.completed).length}/{dateHabits.length}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : viewMode === 'month' ? (
          <>
            {/* Month Summary */}
            {(() => {
              const monthStats = getMonthlyStats(selectedDate.getMonth(), selectedDate.getFullYear());
              return (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Month Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">{monthStats.avgRate}%</p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Rate</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">{monthStats.perfectDays}</p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Perfect Days</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Routine Statistics */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Statistics</h3>
              {(() => {
                const stats = getRoutineStats();
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.completedRoutines}/{stats.totalRoutines}
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.averageTime}m
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Time</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Month View - Week by Week */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">Weeks in {selectedDate.toLocaleDateString('en-US', { month: 'long' })}</h3>
              <div className="space-y-3">
                {(() => {
                  const weeks = getWeeksInMonth(selectedDate);
                  return weeks.map((week, index) => {
                    const weekStats = getWeeklyStats(week.start, week.end);
                    const isCurrentWeek = week.start <= new Date() && week.end >= new Date();
                    
                    return (
                      <div key={index} className={`p-3 rounded-lg ${isCurrentWeek ? 'bg-stone-100 border-2 border-[#333333]' : 'bg-stone-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-[#333333] text-sm">
                              Week {index + 1}
                            </p>
                            <p className="text-xs text-[#333333] opacity-70 font-mono">
                              {week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-[#333333] font-mono">{weekStats.avgRate}%</p>
                            <p className="text-xs text-[#333333] opacity-70">
                              {weekStats.completedHabits}/{weekStats.totalHabits} habits
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full">
                          <div
                            className="bg-black h-2 rounded-full transition-all"
                            style={{ width: `${weekStats.avgRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        ) : viewMode === 'year' ? (
          <>
            {/* Year Summary */}
            {(() => {
              const yearStats = getYearlyStats(selectedDate.getFullYear());
              return (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Year Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">{yearStats.avgRate}%</p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Rate</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">{yearStats.perfectDays}</p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Perfect Days</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Routine Statistics */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Routine Statistics</h3>
              {(() => {
                const stats = getRoutineStats();
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.completedRoutines}/{stats.totalRoutines}
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-stone-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#333333] font-mono">
                        {stats.averageTime}m
                      </p>
                      <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Avg Time</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Year View - Month by Month */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">Months in {selectedDate.getFullYear()}</h3>
              <div className="space-y-3">
                {(() => {
                  const months = getMonthsInYear(selectedDate.getFullYear());
                  return months.map((month, index) => {
                    const monthStats = getMonthlyStats(month.getMonth(), month.getFullYear());
                    const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
                    
                    return (
                      <div key={index} className={`p-3 rounded-lg ${isCurrentMonth ? 'bg-stone-100 border-2 border-[#333333]' : 'bg-stone-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-[#333333] text-sm">
                              {month.toLocaleDateString('en-US', { month: 'long' })}
                            </p>
                            <p className="text-xs text-[#333333] opacity-70 font-mono">
                              {monthStats.perfectDays} perfect days
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-[#333333] font-mono">{monthStats.avgRate}%</p>
                            <p className="text-xs text-[#333333] opacity-70">
                              {monthStats.completedHabits}/{monthStats.totalHabits} habits
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full">
                          <div
                            className="bg-black h-2 rounded-full transition-all"
                            style={{ width: `${monthStats.avgRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  };
  
  // Helper functions for weekly grid view
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };
  
  const getVirtueDataForWeek = (weekStartDate) => {
    const weekDays = getWeekDays(weekStartDate);
    const weekData = {};
    
    weekDays.forEach(date => {
      const dateStr = getDateStringLocal(date);
      weekData[dateStr] = virtueCheckIns[dateStr] || {};
    });
    
    return weekData;
  };
  
  const formatWeekRange = (weekStartDate) => {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const startStr = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  };

  // Virtues View
  const VirtuesView = ({ selectedDate }) => {
    const [showVirtueHistory, setShowVirtueHistory] = useState(false);
    const [historyViewMode, setHistoryViewMode] = useState('week');
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
    
    // Get current week's virtue focus
    const currentWeeklyFocus = getWeeklyFocus();
    const currentVirtues = virtueCheckIns[getSelectedDateString(selectedDate)] || {};
    const checkedVirtuesCount = Object.values(currentVirtues).filter(Boolean).length;
    const hasCheckedVirtues = checkedVirtuesCount > 0;
    
    // Start virtue check-in
    const startVirtueCheckIn = () => {
      // Don't open modal if we're currently in an active routine and the virtue habit is active
      if (activeRoutine) {
        const currentHabitId = activeRoutine.habits[activeRoutineIndex];
        const currentHabit = habits.find(h => h.id === currentHabitId);
        if (currentHabit?.isVirtueCheckIn) {
          return;
        }
      }
      
      // Open the modal
      setExpandedVirtues(true);
    };
    
    // Get virtue check-in completion rate for a date
    const getVirtueCompletionRate = (date) => {
      const dateStr = getDateStringLocal(date);
      const virtues = virtueCheckIns[dateStr] || {};
      const checkedCount = Object.values(virtues).filter(Boolean).length;
      return Math.round((checkedCount / weeklyFocuses.length) * 100);
    };
    
    // Get last 7 days for history
    const getLast7Days = () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
      }
      return days;
    };
    
    // Week navigation functions
    const navigateWeek = (direction) => {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
      setCurrentWeekStart(newWeekStart);
    };
    
    const goToCurrentWeek = () => {
      setCurrentWeekStart(getWeekStart(new Date()));
    };
    
    
    if (showVirtueHistory) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Virtue History</h2>
            <button
              onClick={() => setShowVirtueHistory(false)}
              className="flex items-center gap-2 bg-stone-200 text-[#333333] px-4 py-2 rounded-lg hover:bg-stone-300 font-bold uppercase text-xs tracking-wider transition-all"
            >
              <X size={18} strokeWidth={2.5} />
              Close
            </button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-6">
            {['week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setHistoryViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  historyViewMode === mode
                    ? 'bg-[#333333] text-white'
                    : 'bg-white text-[#333333] hover:bg-stone-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          {/* History Content */}
          
          {historyViewMode === 'week' && (
            <div className="space-y-4">
              {/* Week Navigation */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => navigateWeek(-1)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} className="text-[#333333]" />
                  </button>
                  
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#333333]">
                      {formatWeekRange(currentWeekStart)}
                    </p>
                    <p className="text-sm text-[#333333] opacity-70 font-mono">
                      Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigateWeek(1)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} className="text-[#333333]" />
                  </button>
                </div>
                
                <button
                  onClick={goToCurrentWeek}
                  className="w-full py-2 bg-stone-100 text-[#333333] rounded-lg hover:bg-stone-200 font-bold uppercase text-xs tracking-wider transition-colors"
                >
                  Current Week
                </button>
              </div>

              {/* Week Summary Stats */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Week Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const weekDays = getWeekDays(currentWeekStart);
                    const weekData = getVirtueDataForWeek(currentWeekStart);
                    
                    // Calculate virtue check-ins
                    let totalVirtueChecks = 0;
                    let completedVirtueChecks = 0;
                    weekDays.forEach(date => {
                      const dateStr = getDateStringLocal(date);
                      const virtues = weekData[dateStr] || {};
                      const checked = Object.values(virtues).filter(Boolean).length;
                      if (checked > 0) completedVirtueChecks++;
                      totalVirtueChecks++;
                    });
                    
                    // Calculate challenge completions
                    let completedChallenges = 0;
                    weekDays.forEach(date => {
                      const dateStr = getDateStringLocal(date);
                      const challenge = dailyChallenges[dateStr];
                      if (challenge?.completed) completedChallenges++;
                    });
                    
                    const virtueRate = totalVirtueChecks > 0 ? Math.round((completedVirtueChecks / totalVirtueChecks) * 100) : 0;
                    
                    return (
                      <>
                        <div className="text-center p-3 bg-stone-50 rounded-lg">
                          <p className="text-2xl font-bold text-[#333333] font-mono">{virtueRate}%</p>
                          <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Virtue Rate</p>
                        </div>
                        <div className="text-center p-3 bg-stone-50 rounded-lg">
                          <p className="text-2xl font-bold text-[#333333] font-mono">{completedVirtueChecks}</p>
                          <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider mt-1">Days Checked</p>
                        </div>
                        <div className="text-center p-3 bg-[#1a252f]/10 rounded-lg border-2 border-[#1a252f]/30">
                          <p className="text-2xl font-bold text-[#1a252f] font-mono">{completedChallenges}</p>
                          <p className="text-xs text-[#1a252f] uppercase tracking-wider mt-1">Challenges</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Weekly Virtue Grid */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">Weekly Virtue Grid</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b border-stone-200 font-semibold text-[#333333] min-w-[120px]">Virtue</th>
                        {getWeekDays(currentWeekStart).map((date, index) => {
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <th key={index} className={`text-center p-2 border-b border-stone-200 font-semibold text-[#333333] ${isToday ? 'bg-[#1a252f]/10' : ''}`}>
                              <div className="text-xs uppercase tracking-wider">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-xs text-[#333333] opacity-70 font-mono">
                                {date.getDate()}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyFocuses.map((virtue, virtueIndex) => {
                        const weekData = getVirtueDataForWeek(currentWeekStart);
                        return (
                          <tr key={virtue.virtue} className="border-b border-stone-100">
                            <td className="p-2 font-medium text-[#333333] text-sm">
                              {virtue.virtue}
                            </td>
                            {getWeekDays(currentWeekStart).map((date, dayIndex) => {
                              const dateStr = getDateStringLocal(date);
                              const virtueResponse = weekData[dateStr]?.[virtue.virtue];
                              const isToday = date.toDateString() === new Date().toDateString();
                              
                              return (
                                <td key={dayIndex} className={`text-center p-2 ${isToday ? 'bg-[#1a252f]/10' : ''}`}>
                                  {virtueResponse === true ? (
                                    <span className="text-[#4b5320] text-lg font-bold">✓</span>
                                  ) : (
                                    <span className="text-stone-300 text-lg">○</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Challenges Row */}
                      <tr className="border-t-2 border-stone-300 bg-[#1a252f]/10">
                        <td className="p-2 font-bold text-[#333333] text-sm">
                          Daily Challenges
                        </td>
                        {getWeekDays(currentWeekStart).map((date, dayIndex) => {
                          const dateStr = getDateStringLocal(date);
                          const dailyChallenge = dailyChallenges[dateStr];
                          const isToday = date.toDateString() === new Date().toDateString();
                          const isCompleted = dailyChallenge?.completed === true;
                          
                          return (
                            <td key={dayIndex} className={`text-center p-2 ${isToday ? 'bg-[#1a252f]/20' : ''}`}>
                              {isCompleted ? (
                                <span className="text-[#1a252f] text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-stone-300 text-lg">○</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Active Routine Indicator */}
        {activeRoutine && (
          <div className="bg-[#1a252f] text-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-bold text-white text-lg uppercase tracking-wide">
                    {activeRoutine.name} Running
                  </h3>
                  <p className="text-sm text-white/80">
                    Habit {activeRoutineIndex + 1} of {activeRoutine.habits.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('activeRoutine')}
                className="bg-white text-[#1a252f] px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Daily Virtue Check-in</h2>
          <button
            onClick={() => setShowVirtueHistory(true)}
            className="flex items-center gap-2 bg-stone-200 text-[#333333] px-4 py-2 rounded-lg hover:bg-stone-300 font-bold uppercase text-xs tracking-wider transition-all"
          >
            <Calendar size={18} strokeWidth={2.5} />
            History
          </button>
        </div>
        
        {/* Current Week's Focus */}
        <div className="bg-[#1a252f]/10 rounded-xl shadow-md p-6 border-2 border-[#1a252f]/30">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#1a252f] mb-2">This Week's Focus</h3>
            <p className="text-2xl font-bold text-[#333333] mb-2">{currentWeeklyFocus.virtue}</p>
            <p className="text-lg text-[#1a252f] mb-4">{currentWeeklyFocus.focus}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{currentWeeklyFocus.description}</p>
          </div>
        </div>
        
        {/* Progress and Start Button */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#333333] mb-2">Today's Progress</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-3xl font-bold text-[#333333] font-mono">
                  {checkedVirtuesCount} / {weeklyFocuses.length}
                </div>
                <div className="text-sm text-gray-600">
                  virtues completed
                </div>
              </div>
              <div className="w-full bg-stone-200 h-4 rounded-full">
                <div
                  className="bg-[#1a252f] h-4 rounded-full transition-all"
                  style={{ width: `${Math.round((checkedVirtuesCount / weeklyFocuses.length) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={startVirtueCheckIn}
              className="px-8 py-4 bg-[#1a252f] text-white font-bold rounded-lg hover:bg-[#1a252f] transition-colors text-lg"
            >
              {hasCheckedVirtues ? 'Continue Check-in' : 'Start Check-in'}
            </button>
          </div>
        </div>
        
        {/* Daily Summary (if completed) */}
        {hasCheckedVirtues && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-[#333333] mb-4 text-center">Today's Summary</h3>
            <div className="space-y-3">
              {weeklyFocuses.map((virtue, index) => {
                const response = currentVirtues[virtue.virtue];
                const isCurrentWeekVirtue = virtue.virtue === currentWeeklyFocus.virtue;
                
                return (
                  <div 
                    key={virtue.virtue}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 ${
                      response === true 
                        ? 'bg-[#4b5320]/10 border-[#4b5320]/30' 
                        : response === false 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                    } ${isCurrentWeekVirtue ? 'ring-2 ring-[#1a252f]/40' : ''}`}
                  >
                    <div className="text-xl">
                      {response === true ? '✓' : response === false ? '✗' : '○'}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          response === true ? 'text-[#4b5320]' : response === false ? 'text-red-800' : 'text-gray-600'
                        }`}>
                          {virtue.virtue}
                        </span>
                        {isCurrentWeekVirtue && (
                          <span className="text-xs text-[#1a252f] bg-[#1a252f]/20 px-2 py-1 rounded">This Week's Focus</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {virtue.focus}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Navigation
  const Navigation = () => {
    // Only hide navigation when actively viewing the routine screen
    if (currentView === 'activeRoutine') return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-sm bg-white/95 shadow-lg border-t border-stone-200 z-50 pb-safe">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center p-3 min-h-[68px] justify-center transition-all duration-200 ${
              currentView === 'dashboard' 
                ? 'text-[#333333] scale-105' 
                : 'text-[#333333] opacity-40 hover:opacity-70'
            }`}
          >
            <Home size={24} strokeWidth={2.5} />
            <span className="text-xs mt-1 font-mono uppercase tracking-wider">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('routines')}
            className={`flex flex-col items-center p-3 min-h-[68px] justify-center transition-all duration-200 ${
              currentView === 'routines' 
                ? 'text-[#333333] scale-105' 
                : 'text-[#333333] opacity-40 hover:opacity-70'
            }`}
          >
            <Calendar size={24} strokeWidth={2.5} />
            <span className="text-xs mt-1 font-mono uppercase tracking-wider">Routines</span>
          </button>
          <button
            onClick={() => setCurrentView('goals')}
            className={`flex flex-col items-center p-3 min-h-[68px] justify-center transition-all duration-200 ${
              currentView === 'goals' 
                ? 'text-[#333333] scale-105' 
                : 'text-[#333333] opacity-40 hover:opacity-70'
            }`}
          >
            <Target size={24} strokeWidth={2.5} />
            <span className="text-xs mt-1 font-mono uppercase tracking-wider">Goals</span>
          </button>
          <button
            onClick={() => setCurrentView('virtues')}
            className={`flex flex-col items-center p-3 min-h-[68px] justify-center transition-all duration-200 ${
              currentView === 'virtues' 
                ? 'text-[#333333] scale-105' 
                : 'text-[#333333] opacity-40 hover:opacity-70'
            }`}
          >
            <CheckCircle2 size={24} strokeWidth={2.5} />
            <span className="text-xs mt-1 font-mono uppercase tracking-wider">Virtues</span>
          </button>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#333333] mx-auto mb-4"></div>
          <p className="text-[#333333] font-medium">Loading your habits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} strokeWidth={2.5} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#333333] mb-2">Loading Error</h1>
            <p className="text-[#333333] opacity-70 mb-4">{error}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 bg-[#333333] text-white py-4 rounded-lg hover:bg-black font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <RefreshCw size={20} strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto">
        
        {/* Main Content - Add top padding to account for fixed header */}
        <div className={`pt-4 ${activeRoutine ? 'pb-0' : 'pb-20'}`}>
        {currentView === 'activeRoutine' ? (
            <ActiveRoutineScreen
              activeRoutine={activeRoutine}
              activeRoutineIndex={activeRoutineIndex}
              routineStartTime={routineStartTime}
              habits={habits}
              habitCompletions={habitCompletions}
              activeTimers={activeTimers}
              timerDurations={timerDurations}
              onStopRoutine={stopRoutine}
              onCompleteHabit={completeRoutineHabit}
              onSkipHabit={skipCurrentHabit}
              onGoToPreviousHabit={goToPreviousHabit}
              onGoToNextHabit={skipCurrentHabit}
              onToggleTimer={handleTimerTap}
              getTodayString={getTodayString}
              calculateRoutineDuration={calculateRoutineDuration}
              formatMinutesToHours={formatMinutesToHours}
              getCircularProgress={getCircularProgress}
              getTimerColor={getTimerColor}
              getTimerDisplayTime={getTimerDisplayTime}
              getTimerDisplayMode={getTimerDisplayMode}
              handleTimerTap={handleTimerTap}
            />
          ) : (
            <div className="p-4">
              {currentView === 'dashboard' && <DashboardView selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
              {currentView === 'routines' && <RoutinesView selectedDate={selectedDate} />}
              {currentView === 'goals' && <GoalsView />}
              {currentView === 'virtues' && <VirtuesView selectedDate={selectedDate} />}
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <Navigation />
        
        {/* Modals */}
        {showUserManager && (
          <UserManager 
            onUserSelect={handleUserSelect}
            onClose={() => setShowUserManager(false)} 
          />
        )}
        
        
        {showGoalModal && (
          <GoalModal 
            onClose={() => setShowGoalModal(false)} 
          />
        )}
        
        {showTaskModal && (
          <TaskModal 
            goalId={selectedGoalForTask}
            onClose={() => {
              setShowTaskModal(false);
              setSelectedGoalForTask(null);
            }} 
          />
        )}

        {showRoutineEditModal && (
          <RoutineEditModal 
            routine={editingRoutine}
            onClose={() => {
              setShowRoutineEditModal(false);
              setEditingRoutine(null);
            }} 
          />
        )}
        
        {showHabitEditModal && (
          <HabitEditModal 
            habit={editingHabit}
            onClose={() => {
              setShowHabitEditModal(false);
              setEditingHabit(null);
            }} 
          />
        )}


        {showAddRoutineModal && (
          <AddRoutineModal 
            key="add-routine-modal"
            onClose={() => setShowAddRoutineModal(false)} 
          />
        )}

        {showAddSingleHabitModal && (
          <AddSingleHabitModal 
            key="add-single-habit-modal"
            onClose={() => setShowAddSingleHabitModal(false)} 
          />
        )}

        {showOrderRoutinesModal && (
          <OrderRoutinesModal 
            onClose={() => setShowOrderRoutinesModal(false)} 
          />
        )}

        {showAddChoiceModal && (
          <AddChoiceModal 
            onClose={() => setShowAddChoiceModal(false)} 
          />
        )}

        {showDeleteRoutineModal && routineToDelete && (
          <DeleteRoutineModal 
            routine={routineToDelete}
            onClose={() => {
              setShowDeleteRoutineModal(false);
              setRoutineToDelete(null);
            }} 
          />
        )}

        {/* Virtue Check-in Modal */}
        {expandedVirtues && (
          <VirtueCheckInModal
            isOpen={expandedVirtues}
            onClose={() => setExpandedVirtues(false)}
            weeklyFocuses={weeklyFocuses}
            selectedDate={selectedDate}
            existingResponses={virtueCheckIns[getSelectedDateString(selectedDate)] || {}}
            canCheckIn={canCheckInForDate(selectedDate)}
            onComplete={completeVirtueCheckIn}
            getDateString={getSelectedDateString}
            getWeeklyFocus={getWeeklyFocus}
          />
        )}

        {/* Challenge Modal */}
        {showChallengeModal && currentChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[#333333] mb-4">Today's Daily Challenge</h3>
                
                <div className="mb-6">
                  <div className="bg-[#1a252f]/10 p-4 rounded-lg mb-4">
                    <p className="text-lg font-medium text-[#1a252f] mb-3">{currentChallenge.challenge}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#1a252f]">Virtue: <strong>{currentChallenge.virtue}</strong></span>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                        currentChallenge.difficulty === 'easy' ? 'bg-[#4b5320]/20 text-[#4b5320]' :
                        currentChallenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentChallenge.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Accept this challenge to practice today's virtue. You can mark it complete when you've accomplished it.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                  >
                    Not Today
                  </button>
                  <button
                    onClick={acceptDailyChallenge}
                    className="flex-1 px-6 py-3 rounded-lg bg-[#1a252f] text-white font-medium hover:bg-[#1a252f] transition-colors"
                  >
                    Accept Challenge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default HabitGoalTracker;