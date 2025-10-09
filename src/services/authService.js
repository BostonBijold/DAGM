import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return auth && googleProvider;
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  // Sign in with Google
  async signInWithGoogle() {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Extract user data
      const userData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime
      };

      this.currentUser = userData;
      this.notifyListeners();
      
      return userData;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    if (!isFirebaseAvailable()) {
      this.currentUser = null;
      this.notifyListeners();
      return;
    }

    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of auth state changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Initialize auth state listener
  init() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available, skipping auth initialization');
      return;
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime
        };
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
