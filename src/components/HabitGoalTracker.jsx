import React, { useState, useEffect } from 'react';
import { Check, Circle, Plus, X, ChevronRight, Home, Target, Calendar, CheckSquare, Edit2, Trash2, Download, Upload, TrendingUp, ChevronLeft, User, Play } from 'lucide-react';
import dataService from '../services/dataService';
import UserManager from './UserManager';
import { debugStorage, addTestData } from '../utils/debugStorage';

const HabitGoalTracker = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedGoalForTask, setSelectedGoalForTask] = useState(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRoutineEditModal, setShowRoutineEditModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showHabitEditModal, setShowHabitEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [activeTimers, setActiveTimers] = useState({});
  const [timerDurations, setTimerDurations] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [timerUpdateTrigger, setTimerUpdateTrigger] = useState(0);
  
  // Sample motivational quotes
  const quotes = [
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts repeated day in and day out.",
    "You don't have to be great to start, but you have to start to be great.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there."
  ];
  
  // "What Is A Good Man?" virtues for weekly focus
  const weeklyFocuses = [
    { virtue: "Present", focus: "A Good Man Is Present. Be fully where you are this week." },
    { virtue: "Determined", focus: "A Good Man Is Determined. Know your why and stand firm this week." },
    { virtue: "Confident", focus: "A Good Man Is Confident. Keep your promises to yourself this week." },
    { virtue: "Patient", focus: "A Good Man Is Patient. Do not complain this week." },
    { virtue: "Genuine", focus: "A Good Man Is Genuine. Be your authentic self this week." },
    { virtue: "Responsible", focus: "A Good Man Is Responsible. Take ownership this week." },
    { virtue: "Strong", focus: "A Good Man Is Strong. Build your strength in all forms this week." },
    { virtue: "Disciplined", focus: "A Good Man Is Disciplined. Master yourself this week." },
    { virtue: "Humble", focus: "A Good Man Is Humble. Serve others before yourself this week." }
  ];
  
  // State for data - initialized from data service
  const [routines, setRoutines] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [todos, setTodos] = useState([]);
  const [habitCompletions, setHabitCompletions] = useState({});
  const [habitCompletionTimes, setHabitCompletionTimes] = useState({});
  const [activeRoutine, setActiveRoutine] = useState(null); // Currently running routine
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0); // Current habit index
  const [routineStartTime, setRoutineStartTime] = useState(null);
  const [routinePaused, setRoutinePaused] = useState(false);
  const [routineCompletions, setRoutineCompletions] = useState({});
  
  // Initialize data from data service
  useEffect(() => {
    // Debug localStorage on startup
    debugStorage();
    
    const user = dataService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserData();
      checkAndResetDailyHabits();
    } else {
      // No user found, show user manager
      setShowUserManager(true);
    }
  }, []);

  // Load user data from data service
  const loadUserData = () => {
    // Ensure default routines exist
    dataService.ensureDefaultRoutines();
    
    setRoutines(dataService.getRoutines());
    setHabits(dataService.getHabits());
    setGoals(dataService.getGoals());
    setTodos(dataService.getTodos());
    setHabitCompletions(dataService.getHabitCompletions());
    setHabitCompletionTimes(dataService.getHabitCompletionTimes());
    setRoutineCompletions(dataService.getRoutineCompletions());
  };

  // Check if we need to reset habits for a new day
  const checkAndResetDailyHabits = () => {
    const today = getTodayString();
    const lastResetDate = localStorage.getItem('habitTrackerLastResetDate');
    
    // If this is a new day, reset all habit completions
    if (lastResetDate !== today) {
      // Clear today's habit completions and completion times
      const currentCompletions = dataService.getHabitCompletions();
      const currentCompletionTimes = dataService.getHabitCompletionTimes();
      
      // Remove today's data if it exists
      if (currentCompletions[today]) {
        delete currentCompletions[today];
      }
      if (currentCompletionTimes[today]) {
        delete currentCompletionTimes[today];
      }
      
      // Update the data
      dataService.updateHabitCompletions(currentCompletions);
      dataService.updateHabitCompletionTimes(currentCompletionTimes);
      
      // Update local state
      setHabitCompletions(currentCompletions);
      setHabitCompletionTimes(currentCompletionTimes);
      
      // Update last reset date
      localStorage.setItem('habitTrackerLastResetDate', today);
      
      // Also reset daily todos (remove todos that were added today)
      const currentTodos = dataService.getTodos();
      const filteredTodos = currentTodos.filter(todo => todo.addedAt !== today);
      dataService.updateTodos(filteredTodos);
      setTodos(filteredTodos);
      
      console.log('Daily habit reset completed for', today);
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
      // Check if any timers have reached their cap
      Object.keys(activeTimers).forEach(habitId => {
        const startTime = activeTimers[habitId];
        const duration = timerDurations[habitId];
        
        if (startTime && duration) {
          const elapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
          if (elapsed >= duration) {
            // Timer reached cap, auto-stop and save completion time
            stopTimer(habitId, true);
          }
        }
      });
      
      setTimerUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers ? Object.keys(activeTimers).length : 0]);
  
  // Get today's date string
  const getTodayString = () => {
    return currentDate.toISOString().split('T')[0];
  };
  
  // Modal Components
  
  const GoalModal = ({ onClose }) => {
    const [goalName, setGoalName] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    const [goalDeadline, setGoalDeadline] = useState('');
    
    const handleSubmit = () => {
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
        dataService.updateGoals(newGoals);
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
    
    const handleSubmit = () => {
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
        dataService.updateGoals(newGoals);
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
  
  const RoutineEditModal = ({ routine, onClose }) => {
    const [routineName, setRoutineName] = useState(routine?.name || '');
    const [routineTime, setRoutineTime] = useState(routine?.timeOfDay || 'morning');
    const [routineDays, setRoutineDays] = useState(routine?.days || []);
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [pendingHabits, setPendingHabits] = useState([]);
    const [deletedHabitIds, setDeletedHabitIds] = useState([]);
    
    // New habit form state
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDescription, setNewHabitDescription] = useState('');
    const [newHabitDuration, setNewHabitDuration] = useState('');
    const [newHabitHasDuration, setNewHabitHasDuration] = useState(false);
    
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
      const routineHabits = routine?.habits || [];
      const existingHabits = habits.filter(h => 
        routineHabits.includes(h.id) && !deletedHabitIds.includes(h.id)
      );
      return [...existingHabits, ...pendingHabits];
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
        const duration = newHabitHasDuration && newHabitDuration ? parseInt(newHabitDuration) : null;
        const newHabit = {
          id: Date.now(),
          name: newHabitName.trim(),
          description: newHabitDescription.trim(),
          duration: duration,
          routineId: routine.id,
          createdAt: new Date().toISOString()
        };
        
        setPendingHabits(prev => [...prev, newHabit]);
        
        // Reset form
        setNewHabitName('');
        setNewHabitDescription('');
        setNewHabitDuration('');
        setNewHabitHasDuration(false);
        setShowAddHabit(false);
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
    
    const handleSaveHabitEdit = (habitId, updatedHabit) => {
      if (pendingHabits.some(h => h.id === habitId)) {
        // Update pending habit
        setPendingHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      } else {
        // Update existing habit
        const updatedHabits = habits.map(h => h.id === habitId ? updatedHabit : h);
        setHabits(updatedHabits);
        dataService.updateHabits(updatedHabits);
      }
      setEditingHabitId(null);
    };
    
    const handleSubmit = () => {
      if (routineName.trim() && routineDays.length > 0) {
        // Update routine details
        const updatedRoutines = routines.map(r => 
          r.id === routine.id 
            ? { 
                ...r, 
                name: routineName.trim(),
                timeOfDay: routineTime,
                days: routineDays,
                habits: [...r.habits.filter(id => !deletedHabitIds.includes(id)), ...pendingHabits.map(h => h.id)]
              }
            : r
        );
        setRoutines(updatedRoutines);
        dataService.updateRoutines(updatedRoutines);
        
        // Add new habits
        if (pendingHabits.length > 0) {
          const newHabits = [...habits, ...pendingHabits];
          setHabits(newHabits);
          dataService.updateHabits(newHabits);
        }
        
        // Remove deleted habits
        if (deletedHabitIds.length > 0) {
          const updatedHabits = habits.filter(h => !deletedHabitIds.includes(h.id));
          setHabits(updatedHabits);
          dataService.updateHabits(updatedHabits);
        }
        
        onClose();
      }
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
                <h4 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Habits</h4>
                <div className="space-y-2">
                  {currentHabits.length > 0 ? (
                    currentHabits.map(habit => (
                      <HabitItem
                        key={habit.id}
                        habit={habit}
                        isEditing={editingHabitId === habit.id}
                        onEdit={() => handleEditHabit(habit.id)}
                        onDelete={() => handleDeleteHabit(habit.id)}
                        onSave={(updatedHabit) => handleSaveHabitEdit(habit.id, updatedHabit)}
                        onCancel={() => setEditingHabitId(null)}
                      />
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
                        autoFocus
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
                          Set Timer Cap
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
      const updatedHabit = {
        ...habit,
        name: editName.trim(),
        description: editDescription.trim(),
        duration: duration
      };
      onSave(updatedHabit);
    };
    
    if (isEditing) {
      return (
        <div className="border-2 border-blue-300 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <h6 className="font-bold text-[#333333] text-sm uppercase tracking-wide">Edit Habit</h6>
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="p-1 hover:bg-green-100 rounded transition-colors"
                title="Save"
              >
                <Check size={16} strokeWidth={2.5} className="text-green-600" />
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
              autoFocus
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
              Timer: {habit.duration}m
            </div>
          )}
          {timerDisplay && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                {timerDisplay.isCapped ? (
                  <>
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 font-mono rounded">
                      {timerDisplay.remaining}m remaining
                    </span>
                    <span className="text-xs text-[#333333] opacity-70">
                      ({timerDisplay.elapsed}m elapsed)
                    </span>
                  </>
                ) : (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 font-mono rounded">
                    {timerDisplay.elapsed}m elapsed
                  </span>
                )}
              </div>
              {timerDisplay.isCapped && (
                <div className="w-full bg-stone-200 h-2 rounded-full">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${timerDisplay.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
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
    const [hasDuration, setHasDuration] = useState(!!habit?.duration);
    
    const handleSubmit = () => {
      if (habitName.trim()) {
        const duration = hasDuration && habitDuration ? parseInt(habitDuration) : null;
        const updatedHabits = habits.map(h => 
          h.id === habit.id 
            ? { 
                ...h, 
                name: habitName.trim(),
                description: habitDescription.trim(),
                duration: duration
              }
            : h
        );
        setHabits(updatedHabits);
        dataService.updateHabits(updatedHabits);
        onClose();
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
                autoFocus
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
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDuration}
                  onChange={(e) => setHasDuration(e.target.checked)}
                  className="w-4 h-4 text-[#333333] border-2 border-stone-300 rounded focus:ring-[#333333] focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                  Set Timer Cap
                </span>
              </label>
              {hasDuration && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={habitDuration}
                    onChange={(e) => setHabitDuration(e.target.value)}
                    placeholder="20"
                    min="1"
                    max="1440"
                    className="w-20 px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                  />
                  <span className="text-sm text-[#333333] font-medium">minutes</span>
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

  // Routine Overlay Component
  const RoutineOverlay = () => {
    if (!activeRoutine) return null;

    const currentHabitId = activeRoutine.habits[activeRoutineIndex];
    const currentHabit = habits.find(h => h.id === currentHabitId);
    const today = getTodayString();
    
    // Calculate routine elapsed time
    const routineElapsed = routineStartTime ? (Date.now() - routineStartTime) / 1000 / 60 : 0;
    
    // Get habit completion status
    const getHabitStatus = (habitId) => {
      const isComplete = habitCompletions[today]?.[habitId] || false;
      const habitTime = habitCompletionTimes[today]?.[habitId];
      return { isComplete, habitTime };
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">
                {activeRoutine.name}
              </h2>
              <button
                onClick={stopRoutine}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                title="Stop Routine"
              >
                <X size={24} strokeWidth={2.5} className="text-[#333333]" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-[#333333] opacity-70 uppercase tracking-wider">Progress</p>
                <p className="text-lg font-bold text-[#333333]">
                  {activeRoutineIndex + 1} / {activeRoutine.habits.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#333333] opacity-70 uppercase tracking-wider">Total Time</p>
                <p className="text-lg font-bold text-[#333333] font-mono">
                  {Math.floor(routineElapsed)}m {Math.round((routineElapsed % 1) * 60)}s
                </p>
              </div>
            </div>
          </div>

          {/* Current Habit Display */}
          {currentHabit && (
            <div className="p-6 border-b border-stone-200">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-[#333333] mb-2">
                  {currentHabit.name}
                </h3>
                {currentHabit.description && (
                  <p className="text-lg text-[#333333] opacity-70 italic">
                    {currentHabit.description}
                  </p>
                )}
              </div>

              {/* Timer Display */}
              {currentHabit.duration && (
                <div className="text-center mb-6">
                  {activeTimers[currentHabit.id] ? (
                    <div>
                      <div className="text-4xl font-bold text-[#333333] font-mono mb-2">
                        {getTimerTimeRemaining(currentHabit.id)}m
                      </div>
                      <div className="w-full bg-stone-200 h-3 rounded-full mb-4">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${getTimerProgress(currentHabit.id)}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xl text-[#333333] opacity-50">
                      {routinePaused ? 'Paused' : 'Ready to Start'}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                {activeTimers[currentHabit.id] ? (
                  <>
                    <button
                      onClick={() => completeRoutineHabit(currentHabit.id)}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                      Complete
                    </button>
                    <button
                      onClick={routinePaused ? resumeRoutine : pauseRoutine}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                      {routinePaused ? 'Resume' : 'Pause'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (currentHabit.duration) {
                        startTimer(currentHabit.id, currentHabit.duration);
                      } else {
                        completeRoutineHabit(currentHabit.id);
                      }
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    {currentHabit.duration ? 'Start Timer' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="p-6 border-b border-stone-200">
            <div className="flex justify-center gap-4">
              <button
                onClick={goToPreviousHabit}
                disabled={activeRoutineIndex <= 0}
                className="px-4 py-2 bg-stone-200 text-[#333333] rounded-lg hover:bg-stone-300 font-bold uppercase text-sm tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={skipCurrentHabit}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold uppercase text-sm tracking-wider transition-all hover:shadow-lg"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Habit List Preview */}
          <div className="p-6">
            <h4 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">
              Routine Progress
            </h4>
            <div className="space-y-2">
              {activeRoutine.habits.map((habitId, index) => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                
                const { isComplete, habitTime } = getHabitStatus(habitId);
                const isCurrent = index === activeRoutineIndex;
                
                return (
                  <div
                    key={habitId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrent 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : isComplete 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-stone-50 border border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <CheckSquare className="text-green-600" size={20} strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={20} strokeWidth={2.5} />
                      )}
                      <span className={`font-medium ${
                        isComplete ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-[#333333]'
                      }`}>
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isComplete && habitTime && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 font-mono rounded">
                          {Math.round(habitTime * 10) / 10}m
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 font-mono rounded">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Get current day of week
  const getCurrentDay = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[currentDate.getDay()];
  };
  
  // Get quote of the day
  const getDailyQuote = () => {
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return quotes[dayOfYear % quotes.length];
  };
  
  // Get weekly focus
  const getWeeklyFocus = () => {
    const weekNumber = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    return weeklyFocuses[weekNumber % weeklyFocuses.length];
  };
  
  // Get next routine based on time of day
  const getNextRoutine = () => {
    const hour = currentDate.getHours();
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
  
  // Get active goal (first incomplete goal)
  const getActiveGoal = () => {
    return goals.find(g => !g.completed) || null;
  };
  
  // Toggle habit completion
  const toggleHabitCompletion = (habitId) => {
    // If a routine is active, prevent manual toggling of other habits
    if (activeRoutine && activeRoutine.habits[activeRoutineIndex] !== habitId) {
      return; // Don't allow manual toggle of other habits during routine
    }

    const today = getTodayString();
    const currentCompletions = habitCompletions || {};
    const isCurrentlyComplete = currentCompletions[today]?.[habitId] || false;
    
    // If completing the habit and it has a timer running, stop the timer and save time
    if (!isCurrentlyComplete && activeTimers[habitId]) {
      stopTimer(habitId, true);
    }
    
    // If starting the habit and it doesn't have a duration cap, start an uncapped timer
    if (isCurrentlyComplete && !activeTimers[habitId]) {
      const habit = habits.find(h => h.id === habitId);
      if (habit && !habit.duration) {
        startUncappedTimer(habitId);
      }
    }

    const newHabitCompletions = {
      ...currentCompletions,
      [today]: {
        ...(currentCompletions[today] || {}),
        [habitId]: !isCurrentlyComplete
      }
    };
    setHabitCompletions(newHabitCompletions);
    dataService.updateHabitCompletions(newHabitCompletions);

    // If this is the current habit in an active routine, complete it
    if (activeRoutine && activeRoutine.habits[activeRoutineIndex] === habitId) {
      completeRoutineHabit(habitId);
    }
  };

  // Timer functions
  const startTimer = (habitId, duration) => {
    const startTime = Date.now();
    setActiveTimers(prev => ({
      ...prev,
      [habitId]: startTime
    }));
    setTimerDurations(prev => ({
      ...prev,
      [habitId]: duration
    }));
  };

  const startUncappedTimer = (habitId) => {
    const startTime = Date.now();
    setActiveTimers(prev => ({
      ...prev,
      [habitId]: startTime
    }));
    // No duration set for uncapped timers
  };

  const stopTimer = (habitId, completed = false) => {
    const startTime = activeTimers[habitId];
    const duration = timerDurations[habitId];
    
    // If completed, save the completion time
    if (completed && startTime) {
      const completionTime = (Date.now() - startTime) / 1000 / 60; // in minutes
      const today = getTodayString();
      const currentCompletionTimes = habitCompletionTimes || {};
      
      const newCompletionTimes = {
        ...currentCompletionTimes,
        [today]: {
          ...(currentCompletionTimes[today] || {}),
          [habitId]: completionTime
        }
      };
      
      setHabitCompletionTimes(newCompletionTimes);
      dataService.updateHabitCompletionTimes(newCompletionTimes);
    }
    
    // Clear the timer
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

  // Calculate average completion time for a habit
  const getAverageCompletionTime = (habitId) => {
    const allTimes = [];
    
    // Check if habitCompletionTimes exists and is an object
    if (!habitCompletionTimes || typeof habitCompletionTimes !== 'object') {
      return null;
    }
    
    // Get all completion times for this habit across all dates
    Object.keys(habitCompletionTimes).forEach(date => {
      if (habitCompletionTimes[date] && habitCompletionTimes[date][habitId]) {
        allTimes.push(habitCompletionTimes[date][habitId]);
      }
    });
    
    if (allTimes.length === 0) return null;
    
    const average = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  };
  
  // Calculate habit streak
  const getHabitStreak = (habitId) => {
    let streak = 0;
    let date = new Date(currentDate);
    
    // Check if habitCompletions exists and is an object
    if (!habitCompletions || typeof habitCompletions !== 'object') {
      return 0;
    }
    
    while (true) {
      const dateString = date.toISOString().split('T')[0];
      if (habitCompletions[dateString]?.[habitId]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Routine Control Functions
  const startRoutine = (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Find first uncompleted habit in routine
    const today = getTodayString();
    let firstIncompleteIndex = 0;
    
    for (let i = 0; i < routine.habits.length; i++) {
      const habitId = routine.habits[i];
      const isComplete = habitCompletions[today]?.[habitId] || false;
      if (!isComplete) {
        firstIncompleteIndex = i;
        break;
      }
    }

    // Set routine state
    setActiveRoutine(routine);
    setActiveRoutineIndex(firstIncompleteIndex);
    setRoutineStartTime(Date.now());
    setRoutinePaused(false);

    // Start timer for first incomplete habit
    const firstHabitId = routine.habits[firstIncompleteIndex];
    const firstHabit = habits.find(h => h.id === firstHabitId);
    if (firstHabit) {
      if (firstHabit.duration) {
        startTimer(firstHabitId, firstHabit.duration);
      } else {
        startUncappedTimer(firstHabitId);
      }
    }
  };

  const completeRoutineHabit = (habitId) => {
    if (!activeRoutine) return;

    // Stop current timer and save time
    const startTime = activeTimers[habitId];
    if (startTime) {
      const completionTime = (Date.now() - startTime) / 1000 / 60; // in minutes
      const today = getTodayString();
      const currentCompletionTimes = habitCompletionTimes || {};
      
      const newCompletionTimes = {
        ...currentCompletionTimes,
        [today]: {
          ...(currentCompletionTimes[today] || {}),
          [habitId]: completionTime
        }
      };
      
      setHabitCompletionTimes(newCompletionTimes);
      dataService.updateHabitCompletionTimes(newCompletionTimes);
    }

    // Mark habit complete
    const today = getTodayString();
    const currentCompletions = habitCompletions || {};
    const newHabitCompletions = {
      ...currentCompletions,
      [today]: {
        ...(currentCompletions[today] || {}),
        [habitId]: true
      }
    };
    setHabitCompletions(newHabitCompletions);
    dataService.updateHabitCompletions(newHabitCompletions);

    // Clear the timer
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

    // Move to next habit
    const nextIndex = activeRoutineIndex + 1;
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
      // Routine complete
      finishRoutine();
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
    const prevHabitId = activeRoutine.habits[prevIndex];
    const prevHabit = habits.find(h => h.id === prevHabitId);
    if (prevHabit) {
      if (prevHabit.duration) {
        startTimer(prevHabitId, prevHabit.duration);
      } else {
        startUncappedTimer(prevHabitId);
      }
    }
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

    // Move to next habit
    const nextIndex = activeRoutineIndex + 1;
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
      // Routine complete
      finishRoutine();
    }
  };

  const pauseRoutine = () => {
    if (!activeRoutine) return;
    
    // Pause current timer
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
    
    setRoutinePaused(true);
  };

  const resumeRoutine = () => {
    if (!activeRoutine) return;
    
    // Resume current habit timer
    const currentHabitId = activeRoutine.habits[activeRoutineIndex];
    const currentHabit = habits.find(h => h.id === currentHabitId);
    if (currentHabit) {
      if (currentHabit.duration) {
        startTimer(currentHabitId, currentHabit.duration);
      } else {
        startUncappedTimer(currentHabitId);
      }
    }
    
    setRoutinePaused(false);
  };

  const stopRoutine = () => {
    // Stop current timer
    const currentHabitId = activeRoutine?.habits[activeRoutineIndex];
    if (currentHabitId && activeTimers[currentHabitId]) {
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

    // Clear routine state
    setActiveRoutine(null);
    setActiveRoutineIndex(0);
    setRoutineStartTime(null);
    setRoutinePaused(false);
  };

  const finishRoutine = () => {
    if (!activeRoutine || !routineStartTime) return;

    // Calculate total routine time
    const totalTime = (Date.now() - routineStartTime) / 1000 / 60; // in minutes
    const today = getTodayString();
    
    // Collect habit times for this routine
    const habitTimes = {};
    activeRoutine.habits.forEach(habitId => {
      const habitTime = habitCompletionTimes[today]?.[habitId];
      if (habitTime) {
        habitTimes[habitId] = habitTime;
      }
    });

    // Save routine completion
    const currentRoutineCompletions = routineCompletions || {};
    const newRoutineCompletions = {
      ...currentRoutineCompletions,
      [today]: {
        ...(currentRoutineCompletions[today] || {}),
        [activeRoutine.id]: {
          totalTime: totalTime,
          startTime: new Date(routineStartTime).toISOString(),
          endTime: new Date().toISOString(),
          completed: true,
          habitTimes: habitTimes
        }
      }
    };
    
    setRoutineCompletions(newRoutineCompletions);
    dataService.updateRoutineCompletions(newRoutineCompletions);

    // Clear routine state
    setActiveRoutine(null);
    setActiveRoutineIndex(0);
    setRoutineStartTime(null);
    setRoutinePaused(false);
  };
  
  
  // Add goal
  const addGoal = (goalName) => {
    const newGoal = {
      id: Date.now(),
      name: goalName,
      tasks: [],
      completed: false,
      createdAt: new Date().toISOString()
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    dataService.updateGoals(newGoals);
  };
  
  // Add task to goal
  const addTaskToGoal = (goalId, taskName) => {
    const newGoals = goals.map(g => 
      g.id === goalId
        ? { ...g, tasks: [...g.tasks, { id: Date.now(), name: taskName, completed: false }] }
        : g
    );
    setGoals(newGoals);
    dataService.updateGoals(newGoals);
  };
  
  // Toggle task completion
  const toggleTaskCompletion = (goalId, taskId) => {
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
    dataService.updateGoals(newGoals);
  };
  
  // Add task to daily todo
  const addTaskToTodo = (task, goalId) => {
    const newTodo = {
      id: Date.now(),
      name: task.name,
      completed: false,
      goalId: goalId,
      addedAt: getTodayString()
    };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    dataService.updateTodos(newTodos);
  };
  
  // Add custom todo
  const addCustomTodo = (todoName, goalId = null) => {
    const newTodo = {
      id: Date.now(),
      name: todoName,
      completed: false,
      goalId: goalId,
      addedAt: getTodayString()
    };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    dataService.updateTodos(newTodos);
  };
  
  // Toggle todo completion
  const toggleTodoCompletion = (todoId) => {
    const newTodos = todos.map(t => 
      t.id === todoId ? { ...t, completed: !t.completed } : t
    );
    setTodos(newTodos);
    dataService.updateTodos(newTodos);
  };
  
  // Delete todo
  const deleteTodo = (todoId) => {
    const newTodos = todos.filter(t => t.id !== todoId);
    setTodos(newTodos);
    dataService.updateTodos(newTodos);
  };
  
  // Export data to JSON file
  const exportData = () => {
    const data = dataService.exportUserData();
    if (!data) return;
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `growth-tracker-backup-${currentUser?.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (dataService.importUserData(data)) {
          loadUserData(); // Reload data from service
          alert('Data imported successfully!');
          setShowDataMenu(false);
        } else {
          alert('Error importing data. Please check the file format.');
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };
  
  // Dashboard View
  const DashboardView = () => {
    const nextRoutine = getNextRoutine();
    const activeGoal = getActiveGoal();
    const todaysTodos = todos.filter(t => t.addedAt === getTodayString());
    const weeklyFocus = getWeeklyFocus();
    
    return (
      <div className="space-y-4">
        {/* Daily Quote */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-base leading-relaxed text-[#333333] font-serif italic">"{getDailyQuote()}"</p>
        </div>
        
        {/* Weekly Focus */}
        <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#333333]">
          <h3 className="font-bold text-[#333333] opacity-70 mb-2 tracking-wider text-sm uppercase">This Week's Virtue</h3>
          <p className="text-xl font-bold mb-1 text-[#333333]">{weeklyFocus.virtue}</p>
          <p className="text-sm text-[#333333]">{weeklyFocus.focus}</p>
        </div>
        
        {/* Next Routine */}
        {nextRoutine && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-[#333333] mb-3 text-lg uppercase tracking-wide">{nextRoutine.name}</h3>
            <div className="space-y-2">
              {nextRoutine.habits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                const isComplete = habitCompletions[getTodayString()]?.[habitId] || false;
                const streak = getHabitStreak(habitId);
                
                return (
                  <div
                    key={habitId}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => toggleHabitCompletion(habitId)}
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
                        {isComplete && habitCompletionTimes[getTodayString()]?.[habitId] && (
                          <span className="text-xs text-green-600 font-mono">
                            Completed in {Math.round(habitCompletionTimes[getTodayString()][habitId] * 10) / 10}m
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
                      {(habit.duration || activeTimers[habit.id]) && (
                        <div className="flex items-center gap-1">
                          {activeTimers[habit.id] ? (
                            <>
                              {habit.duration ? (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 font-mono rounded">
                                  {getTimerTimeRemaining(habit.id)}m
                                </span>
                              ) : (
                                <span className="text-xs bg-green-500 text-white px-2 py-1 font-mono rounded">
                                  {Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60)}m
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopTimer(habit.id, true);
                                  toggleHabitCompletion(habit.id);
                                }}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                                title="Complete Habit"
                              >
                                <Check size={14} strokeWidth={2.5} className="text-green-600" />
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
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                              title="Start Timer"
                            >
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
                );
              })}
              {nextRoutine.habits.length === 0 && (
                <p className="text-[#333333] opacity-50 text-sm">No habits in this routine yet.</p>
              )}
            </div>
            
            {/* Routine Completion Info */}
            {(() => {
              const today = getTodayString();
              const routineCompletion = routineCompletions[today]?.[nextRoutine.id];
              if (routineCompletion && routineCompletion.completed) {
                return (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Routine Completed Today</span>
                      <span className="text-sm font-mono text-green-600">
                        {Math.round(routineCompletion.totalTime * 10) / 10}m total
                      </span>
                    </div>
                    {routineCompletion.startTime && routineCompletion.endTime && (
                      <div className="text-xs text-green-600 mt-1">
                        {new Date(routineCompletion.startTime).toLocaleTimeString()} - {new Date(routineCompletion.endTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Start Routine Button */}
            {nextRoutine.habits.length > 0 && (
              <button
                onClick={() => startRoutine(nextRoutine.id)}
                disabled={activeRoutine !== null}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Play size={20} strokeWidth={2.5} />
                {activeRoutine ? 'Routine In Progress' : 'Start Routine'}
              </button>
            )}
          </div>
        )}
        
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
          <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Today's Tasks</h3>
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
  const RoutinesView = () => {
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    
    if (showHistory) {
      return <HistoryView onClose={() => setShowHistory(false)} />;
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Routines</h2>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#333333] font-bold uppercase text-xs tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <TrendingUp size={18} strokeWidth={2.5} />
            History
          </button>
        </div>
        
        {routines.map(routine => (
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
            
            <div className="mb-2">
              <span className="text-xs bg-stone-200 text-[#333333] px-2 py-1 font-mono rounded">
                {routine.timeOfDay.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-2">
              {routine.habits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                const isComplete = habitCompletions[getTodayString()]?.[habitId] || false;
                const streak = getHabitStreak(habitId);
                
                return (
                  <div
                    key={habitId}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div 
                      className="flex-grow flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleHabitCompletion(habitId)}
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
                      {(habit.duration || activeTimers[habit.id]) && (
                        <div className="flex items-center gap-1">
                          {activeTimers[habit.id] ? (
                            <>
                              {habit.duration ? (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 font-mono rounded">
                                  {getTimerTimeRemaining(habit.id)}m
                                </span>
                              ) : (
                                <span className="text-xs bg-green-500 text-white px-2 py-1 font-mono rounded">
                                  {Math.floor((Date.now() - activeTimers[habit.id]) / 1000 / 60)}m
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopTimer(habit.id, true);
                                  toggleHabitCompletion(habit.id);
                                }}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                                title="Complete Habit"
                              >
                                <Check size={14} strokeWidth={2.5} className="text-green-600" />
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
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                              title="Start Timer"
                            >
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
            
            {routine.habits.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => startRoutine(routine.id)}
                  disabled={activeRoutine !== null}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Play size={20} strokeWidth={2.5} />
                  {activeRoutine ? 'Routine In Progress' : 'Start Routine'}
                </button>
              </div>
            )}
          </div>
        ))}
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
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'
    
    // Navigate dates
    const changeDate = (days) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      setSelectedDate(newDate);
    };
    
    // Get date string
    const getDateString = (date) => {
      return date.toISOString().split('T')[0];
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
        completed: habitCompletions[dateStr]?.[habit.id] || false
      }));
    };
    
    // Calculate completion rate for a date
    const getCompletionRate = (date) => {
      const habitsForDate = getHabitsForDate(date);
      if (habitsForDate.length === 0) return 0;
      const completed = habitsForDate.filter(h => h.completed).length;
      return Math.round((completed / habitsForDate.length) * 100);
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
        <div className="bg-white rounded-xl shadow-md p-3 flex gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 py-2 rounded-lg font-bold uppercase text-sm tracking-wider transition-all ${
              viewMode === 'day' 
                ? 'bg-black text-white' 
                : 'bg-stone-100 text-[#333333]'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-2 rounded-lg font-bold uppercase text-sm tracking-wider transition-all ${
              viewMode === 'week' 
                ? 'bg-black text-white' 
                : 'bg-stone-100 text-[#333333]'
            }`}
          >
            Week View
          </button>
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
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <p className="text-sm text-[#333333] opacity-70 font-mono">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
            
            {/* Habits List */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">Habits</h3>
              <div className="space-y-2">
                {habitsForSelectedDate.length > 0 ? (
                  habitsForSelectedDate.map(habit => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg"
                    >
                      {habit.completed ? (
                        <CheckSquare className="text-black" size={20} strokeWidth={2.5} />
                      ) : (
                        <Circle className="text-[#333333] opacity-40" size={20} strokeWidth={2.5} />
                      )}
                      <span className={habit.completed ? "text-[#333333] font-medium" : "text-[#333333] opacity-50"}>
                        {habit.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#333333] opacity-50 text-sm text-center py-4">No habits scheduled for this day</p>
                )}
              </div>
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
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-orange-200 text-orange-800'
                              }`}>
                                {completion.completed ? 'Completed' : 'Abandoned'}
                              </span>
                            </div>
                            <div className="text-sm text-[#333333] opacity-70">
                              <p>Total Time: {Math.round(completion.totalTime * 10) / 10}m</p>
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
        ) : (
          <>
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
          </>
        )}
      </div>
    );
  };
  
  // Navigation
  const Navigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-stone-200">
      <div className="max-w-md mx-auto flex justify-around py-2">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center p-2 ${currentView === 'dashboard' ? 'text-[#333333]' : 'text-[#333333] opacity-40'}`}
        >
          <Home size={24} strokeWidth={2.5} />
          <span className="text-xs mt-1 font-mono uppercase tracking-wider">Home</span>
        </button>
        <button
          onClick={() => setCurrentView('routines')}
          className={`flex flex-col items-center p-2 ${currentView === 'routines' ? 'text-[#333333]' : 'text-[#333333] opacity-40'}`}
        >
          <Calendar size={24} strokeWidth={2.5} />
          <span className="text-xs mt-1 font-mono uppercase tracking-wider">Routines</span>
        </button>
        <button
          onClick={() => setCurrentView('goals')}
          className={`flex flex-col items-center p-2 ${currentView === 'goals' ? 'text-[#333333]' : 'text-[#333333] opacity-40'}`}
        >
          <Target size={24} strokeWidth={2.5} />
          <span className="text-xs mt-1 font-mono uppercase tracking-wider">Goals</span>
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b-2 border-stone-200 p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#333333]">GROWTH TRACKER</h1>
              <p className="text-sm text-[#333333] opacity-70 font-mono">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</p>
              {currentUser && (
                <p className="text-xs text-[#333333] opacity-50 font-mono">User: {currentUser.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  debugStorage();
                  addTestData();
                  window.location.reload();
                }}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors bg-yellow-100"
                title="Debug Storage"
              >
                🐛
              </button>
              <button
                onClick={() => setShowUserManager(true)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                title="Manage Users"
              >
                <User size={20} strokeWidth={2.5} className="text-[#333333]" />
              </button>
              <div className="relative data-menu-container">
                <button
                  onClick={() => setShowDataMenu(!showDataMenu)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="w-5 h-0.5 bg-[#333333]"></div>
                    <div className="w-5 h-0.5 bg-[#333333]"></div>
                    <div className="w-5 h-0.5 bg-[#333333]"></div>
                  </div>
                </button>
                
                {showDataMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-stone-200 z-50">
                    <button
                      onClick={() => {
                        exportData();
                        setShowDataMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-stone-100 flex items-center gap-3 border-b border-stone-200"
                    >
                      <Download size={18} strokeWidth={2.5} className="text-[#333333]" />
                      <span className="font-bold text-sm uppercase tracking-wider text-[#333333]">Export Data</span>
                    </button>
                    <label className="w-full px-4 py-3 hover:bg-stone-100 flex items-center gap-3 cursor-pointer">
                      <Upload size={18} strokeWidth={2.5} className="text-[#333333]" />
                      <span className="font-bold text-sm uppercase tracking-wider text-[#333333]">Import Data</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="p-4">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'routines' && <RoutinesView />}
          {currentView === 'goals' && <GoalsView />}
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

        {/* Routine Overlay */}
        <RoutineOverlay />
      </div>
    </div>
  );
};


export default HabitGoalTracker;