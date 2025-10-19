import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * VirtueCheckInModal Component
 * 
 * A standalone modal component for daily virtue check-ins.
 * Handles the paginated flow of checking in on multiple virtues.
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - called when modal is closed
 * - weeklyFocuses: array - list of virtue objects with virtue, focus, and description
 * - selectedDate: Date - the date being checked in for
 * - existingResponses: object - previously saved responses for the date
 * - canCheckIn: boolean - whether user can check in for this date
 * - onComplete: async function(responses) - called when check-in is completed with all responses
 * - getDateString: function(date) - converts date to string format
 * - getWeeklyFocus: function - returns current week's focus virtue
 */
const VirtueCheckInModal = ({ 
  isOpen, 
  onClose, 
  weeklyFocuses,
  selectedDate,
  existingResponses = {},
  canCheckIn = true,
  onComplete,
  getDateString,
  getWeeklyFocus
}) => {
  // Local state for managing the check-in flow
  const [currentVirtueIndex, setCurrentVirtueIndex] = useState(0);
  const [tempVirtueResponses, setTempVirtueResponses] = useState(existingResponses);
  const [showVirtueSummary, setShowVirtueSummary] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setTempVirtueResponses(existingResponses);
      setCurrentVirtueIndex(0);
      setShowVirtueSummary(false);
    }
  }, [isOpen, existingResponses]);

  // Handle closing modal
  const handleClose = () => {
    setCurrentVirtueIndex(0);
    setTempVirtueResponses({});
    setShowVirtueSummary(false);
    onClose();
  };

  // Handle selecting a response (Yes/No)
  const selectVirtueResponse = (virtueName, response) => {
    setTempVirtueResponses(prev => ({
      ...prev,
      [virtueName]: response
    }));
    
    // Auto-advance to next virtue after selection
    setTimeout(() => {
      goToNextVirtue();
    }, 300);
  };

  // Navigate to next virtue
  const goToNextVirtue = () => {
    if (currentVirtueIndex < weeklyFocuses.length - 1) {
      setCurrentVirtueIndex(prev => prev + 1);
    } else {
      setShowVirtueSummary(true);
    }
  };

  // Navigate to previous virtue
  const goToPreviousVirtue = () => {
    if (currentVirtueIndex > 0) {
      setCurrentVirtueIndex(prev => prev - 1);
    }
  };

  // Go back from summary to virtues
  const goBackToVirtues = () => {
    setShowVirtueSummary(false);
  };

  // Complete the check-in
  const handleComplete = async () => {
    try {
      await onComplete(tempVirtueResponses);
      handleClose();
    } catch (error) {
      console.error('Error completing virtue check-in:', error);
      // You could add error handling UI here
    }
  };

  if (!isOpen) return null;

  const currentVirtue = weeklyFocuses[currentVirtueIndex];
  const currentWeeklyFocus = getWeeklyFocus ? getWeeklyFocus() : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#333333]">Daily Virtue Check-in</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X size={24} strokeWidth={2.5} className="text-[#333333]" />
            </button>
          </div>
          
          {!showVirtueSummary ? (
            /* Virtue Question Display */
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#333333] mb-2">
                {currentVirtue?.virtue}
              </h3>
              <p className="text-lg text-[#1a252f] mb-6 font-medium">
                {currentVirtue?.focus}
              </p>
              <div className="text-left mb-8">
                <p className="text-gray-700 leading-relaxed">
                  {currentVirtue?.description}
                </p>
              </div>
              
              {/* Yes/No Buttons */}
              {canCheckIn ? (
                <div className="flex gap-4 justify-center mb-8">
                  <button
                    onClick={() => selectVirtueResponse(currentVirtue?.virtue, true)}
                    className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
                      tempVirtueResponses[currentVirtue?.virtue] === true
                        ? 'bg-[#4b5320] text-white shadow-lg transform scale-105'
                        : 'bg-[#4b5320]/20 text-[#4b5320] hover:bg-[#4b5320]/30'
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    onClick={() => selectVirtueResponse(currentVirtue?.virtue, false)}
                    className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
                      tempVirtueResponses[currentVirtue?.virtue] === false
                        ? 'bg-red-600 text-white shadow-lg transform scale-105'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    ✗ No
                  </button>
                </div>
              ) : (
                <div className="mb-8">
                  <p className="text-gray-500 italic">
                    You can only check in for today and yesterday
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-center items-center">
                <button
                  onClick={goToPreviousVirtue}
                  disabled={currentVirtueIndex === 0}
                  className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
              </div>
            </div>
          ) : (
            /* Summary Page View */
            <div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#333333] mb-4">Your Virtue Check-in Summary</h3>
                <div className="text-lg text-gray-600">
                  {Object.values(tempVirtueResponses).filter(Boolean).length} of {weeklyFocuses.length} virtues achieved today
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {weeklyFocuses.map((virtue, index) => {
                  const response = tempVirtueResponses[virtue.virtue];
                  const isCurrentWeekVirtue = currentWeeklyFocus && virtue.virtue === currentWeeklyFocus.virtue;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                        response === true 
                          ? 'bg-[#4b5320]/10 border-[#4b5320]/30' 
                          : response === false 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                      } ${isCurrentWeekVirtue ? 'ring-2 ring-[#1a252f]/40' : ''}`}
                    >
                      <div className="text-2xl">
                        {response === true ? '✓' : response === false ? '✗' : '○'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[#333333]">{virtue.virtue}</div>
                          {isCurrentWeekVirtue && (
                            <span className="text-xs bg-[#1a252f] text-white px-2 py-1 rounded-full">
                              This Week's Focus
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{virtue.focus}</div>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentVirtueIndex(index);
                          setShowVirtueSummary(false);
                        }}
                        className="text-sm text-[#4b5320] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBackToVirtues}
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 px-6 py-3 rounded-lg bg-[#4b5320] text-white font-semibold hover:bg-[#3d4419] transition-colors shadow-lg"
                >
                  Complete Check-in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtueCheckInModal;
