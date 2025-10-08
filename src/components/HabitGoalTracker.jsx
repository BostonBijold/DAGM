import React, { useState, useEffect } from 'react';
import { Check, Circle, Plus, X, ChevronRight, Home, Target, Calendar, CheckSquare, Edit2, Trash2, Download, Upload, TrendingUp, ChevronLeft, User } from 'lucide-react';
import dataService from '../services/dataService';
import UserManager from './UserManager';

const HabitGoalTracker = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedRoutineForHabit, setSelectedRoutineForHabit] = useState(null);
  const [selectedGoalForTask, setSelectedGoalForTask] = useState(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
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
  
  // Initialize data from data service
  useEffect(() => {
    const user = dataService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserData();
    } else {
      // No user found, show user manager
      setShowUserManager(true);
    }
  }, []);

  // Load user data from data service
  const loadUserData = () => {
    setRoutines(dataService.getRoutines());
    setHabits(dataService.getHabits());
    setGoals(dataService.getGoals());
    setTodos(dataService.getTodos());
    setHabitCompletions(dataService.getHabitCompletions());
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
  
  // Get today's date string
  const getTodayString = () => {
    return currentDate.toISOString().split('T')[0];
  };
  
  // Modal Components
  const HabitModal = ({ routineId, onClose }) => {
    const [habitName, setHabitName] = useState('');
    const [habitDescription, setHabitDescription] = useState('');
    
    const handleSubmit = () => {
      if (habitName.trim()) {
        addHabitToRoutine(routineId, habitName.trim(), habitDescription.trim());
        onClose();
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
            <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">New Habit</h3>
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
        setGoals([...goals, newGoal]);
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
        setGoals(goals.map(g => 
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
        ));
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
    const today = getTodayString();
    const newHabitCompletions = {
      ...habitCompletions,
      [today]: {
        ...(habitCompletions[today] || {}),
        [habitId]: !(habitCompletions[today]?.[habitId] || false)
      }
    };
    setHabitCompletions(newHabitCompletions);
    dataService.updateHabitCompletions(newHabitCompletions);
  };
  
  // Calculate habit streak
  const getHabitStreak = (habitId) => {
    let streak = 0;
    let date = new Date(currentDate);
    
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
  
  // Add habit to routine
  const addHabitToRoutine = (routineId, habitName, habitDescription = '') => {
    const newHabit = {
      id: Date.now(),
      name: habitName,
      description: habitDescription,
      routineId: routineId,
      createdAt: new Date().toISOString()
    };
    const newHabits = [...habits, newHabit];
    const newRoutines = routines.map(r => 
      r.id === routineId 
        ? { ...r, habits: [...r.habits, newHabit.id] }
        : r
    );
    setHabits(newHabits);
    setRoutines(newRoutines);
    dataService.updateHabits(newHabits);
    dataService.updateRoutines(newRoutines);
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
                      <span className={isComplete ? "line-through text-[#333333] opacity-50" : "text-[#333333] font-medium"}>
                        {habit.name}
                      </span>
                    </div>
                    {streak > 0 && (
                      <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                        {streak}D
                      </span>
                    )}
                  </div>
                );
              })}
              {nextRoutine.habits.length === 0 && (
                <p className="text-[#333333] opacity-50 text-sm">No habits in this routine yet.</p>
              )}
            </div>
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
    const [showHistory, setShowHistory] = useState(false);
    
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
              <h3 className="font-bold text-[#333333] uppercase tracking-wide">{routine.name}</h3>
              <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono rounded">
                {routine.days.map(d => d.substring(0, 3).toUpperCase()).join(' ')}
              </span>
            </div>
            
            <div className="space-y-2">
              {routine.habits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return null;
                const streak = getHabitStreak(habitId);
                
                return (
                  <div key={habitId} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                    <span className="text-[#333333]">{habit.name}</span>
                    {streak > 0 && (
                      <span className="text-xs bg-[#333333] text-white px-2 py-1 font-mono font-bold rounded">
                        {streak}D
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                setSelectedRoutineForHabit(routine.id);
                setShowHabitModal(true);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <Plus size={20} strokeWidth={2.5} />
              Add Habit
            </button>
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
        
        {showHabitModal && (
          <HabitModal 
            routineId={selectedRoutineForHabit} 
            onClose={() => {
              setShowHabitModal(false);
              setSelectedRoutineForHabit(null);
            }} 
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
      </div>
    </div>
  );
};

export default HabitGoalTracker;