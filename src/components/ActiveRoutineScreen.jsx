import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  SkipBack, 
  SkipForward, 
  Play
} from 'lucide-react';

const ActiveRoutineScreen = ({
  activeRoutine,
  activeRoutineIndex,
  routineStartTime,
  habits,
  habitCompletions,
  activeTimers,
  timerDurations,
  onStopRoutine,
  onCompleteHabit,
  onSkipHabit,
  onGoToPreviousHabit,
  onGoToNextHabit,
  onToggleTimer,
  getTodayString,
  calculateRoutineDuration,
  formatMinutesToHours,
  getCircularProgress,
  getTimerColor,
  getTimerDisplayTime,
  getTimerDisplayMode,
  handleTimerTap
}) => {
  if (!activeRoutine) return null;

  const currentHabitId = activeRoutine.habits[activeRoutineIndex];
  const currentHabit = habits.find(h => h.id === currentHabitId);
  const today = getTodayString();
  
  // Calculate routine elapsed time
  const routineElapsed = routineStartTime ? (Date.now() - routineStartTime) / 1000 / 60 : 0;
  
  // Get habit completion status
  const getHabitStatus = (habitId) => {
    const completion = habitCompletions[today]?.[habitId];
    const isComplete = completion?.completed || false;
    const habitTime = completion?.duration || null;
    return { isComplete, habitTime, habitTimeData: completion };
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

  return (
    <div className="min-h-screen bg-[#333333] text-white">
      <div className="max-w-md mx-auto bg-white text-[#333333] min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#333333] uppercase tracking-wide">
              {activeRoutine.name}
            </h2>
            <button
                  onClick={onStopRoutine}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Close (routine keeps running)"  
                >
              <X size={20} strokeWidth={2.5} className="text-[#333333]" />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider">Progress</p>
              <p className="text-sm font-bold text-[#333333]">
                {activeRoutineIndex + 1} / {activeRoutine.habits.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider">Elapsed Time</p>
              <p className="text-sm font-bold text-[#333333] font-mono">
                {Math.floor(routineElapsed)}m {Math.round((routineElapsed % 1) * 60)}s
              </p>
            </div>
            <div>
              <p className="text-xs text-[#333333] opacity-70 uppercase tracking-wider">Estimated</p>
              <p className="text-sm font-bold text-[#333333] font-mono">
                {(() => {
                  const durationInfo = calculateRoutineDuration(activeRoutine.id);
                  return durationInfo.totalDuration > 0 ? formatMinutesToHours(durationInfo.totalDuration) : 'Unknown';
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Current Habit Display - Music Player Style */}
        {currentHabit && (
          <div className="p-8 text-center">
            {/* Habit Name */}
            <h3 className="text-2xl font-bold text-[#333333] mb-2">
              {currentHabit.name}
            </h3>
            {currentHabit.description && (
              <p className="text-sm text-[#333333] opacity-70 mb-8">
                {currentHabit.description}
              </p>
            )}

            {/* Circular Timer */}
            <div className="flex justify-center mb-8">
              <CircularProgress habitId={currentHabit.id} size={240} strokeWidth={10} />
            </div>

            {/* Music Player Controls */}
            <div className="flex items-center justify-center gap-8 mb-8">
              {/* Skip Back */}
              <button
                onClick={onGoToPreviousHabit}
                disabled={activeRoutineIndex <= 0}
                className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Habit"
              >
                <SkipBack size={24} strokeWidth={2.5} className="text-[#333333]" />
              </button>

              {/* Complete Button */}
              <button
                onClick={() => onCompleteHabit(currentHabit.id)}
                className="p-4 rounded-full bg-[#4b5320]/100 hover:bg-[#4b5320] transition-colors shadow-lg"
                title="Mark Complete"
              >
                <CheckCircle size={28} strokeWidth={2.5} className="text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={onSkipHabit}
                disabled={activeRoutineIndex >= activeRoutine.habits.length - 1}
                className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Skip Habit"
              >
                <SkipForward size={24} strokeWidth={2.5} className="text-[#333333]" />
              </button>
            </div>
          </div>
        )}

        {/* Habit Playlist */}
        <div className="p-6 border-t border-stone-200 flex-1 overflow-hidden flex flex-col">
          <h4 className="font-bold text-[#333333] mb-4 text-sm uppercase tracking-wide">
            Upcoming Habits
          </h4>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {activeRoutine.habits.map((habitId, index) => {
              const habit = habits.find(h => h.id === habitId);
              if (!habit) return null;
              
              const { isComplete, habitTime } = getHabitStatus(habitId);
              const isCurrent = index === activeRoutineIndex;
              
              return (
                <div
                  key={habitId}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isCurrent 
                      ? 'bg-[#1a252f]/10 border border-[#1a252f]/30' 
                      : isComplete 
                        ? 'bg-[#4b5320]/10 border border-[#4b5320]/30' 
                        : 'bg-stone-50 border border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle className="text-[#4b5320]" size={18} strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-[#1a252f] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#1a252f]/100 rounded-full"></div>
                      </div>
                    ) : (
                      <X className="text-[#333333] opacity-40" size={18} strokeWidth={2.5} />
                    )}
                    <span className={`text-sm font-medium ${
                      isComplete ? 'text-[#4b5320]' : isCurrent ? 'text-[#1a252f]' : 'text-[#333333]'
                    }`}>
                      {habit.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && habitTime && (
                      <span className="text-xs bg-[#4b5320]/30 text-[#4b5320] px-2 py-1 font-mono rounded">
                        {formatMinutesToHours(Math.round(habitTime * 10) / 10)}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-[#1a252f]/30 text-[#1a252f] px-2 py-1 font-mono rounded">
                        Now
                      </span>
                    )}
                    {habit.duration && !isComplete && !isCurrent && (
                      <span className="text-xs bg-stone-200 text-stone-600 px-2 py-1 font-mono rounded">
                        {formatMinutesToHours(habit.duration)}
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

export default ActiveRoutineScreen;
