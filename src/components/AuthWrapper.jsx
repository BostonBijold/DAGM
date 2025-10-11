import React, { useState, useEffect } from 'react';
import { LogIn, User } from 'lucide-react';
import authService from '../services/authService';

const AuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth service
    authService.init();
    
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      if (error.message.includes('Firebase is not configured')) {
        alert('Firebase is not configured. Please set up your Firebase project and environment variables.');
      } else {
        alert('Sign in failed. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Sign out failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#333333] mx-auto mb-4"></div>
          <p className="text-[#333333] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} strokeWidth={2.5} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#333333] mb-2">Habit Tracker</h1>
            <p className="text-[#333333] opacity-70 mb-4">
              Sign in with your Google account to start tracking your habits and goals
            </p>
            
            {/* Firebase Setup Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-bold text-yellow-800 mb-2">Firebase Setup Required</h3>
              <p className="text-sm text-yellow-700 mb-2">
                To use this app, you need to set up Firebase:
              </p>
              <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Create a Firebase project at console.firebase.google.com</li>
                <li>Enable Authentication (Google provider)</li>
                <li>Enable Firestore Database</li>
                <li>Copy .env.example to .env and add your Firebase config</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
          
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#333333] text-white py-4 rounded-lg hover:bg-black font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <LogIn size={20} strokeWidth={2.5} />
            Sign in with Google
          </button>
          
          <p className="text-xs text-[#333333] opacity-50 mt-4">
            Your data will be securely stored in the cloud
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header with user info and sign out - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-stone-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#333333] rounded-full flex items-center justify-center">
                <User size={16} strokeWidth={2.5} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-[#333333]">{user.name}</p>
                <p className="text-xs text-[#333333] opacity-70">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm bg-stone-100 text-[#333333] px-4 py-2 rounded-lg hover:bg-stone-200 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main app content - Add top padding to account for fixed header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {children}
      </div>
    </div>
  );
};

export default AuthWrapper;
