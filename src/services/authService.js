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
        isAdmin: false, // Will be updated from Firestore
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

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch admin status from Firestore
        let isAdmin = false;
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          if (db) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              isAdmin = userDoc.data()?.userInfo?.isAdmin || false;
            }
          }
        } catch (error) {
          console.warn('Could not fetch admin status:', error);
        }

        this.currentUser = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          isAdmin: isAdmin,
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
