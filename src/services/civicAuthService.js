// src/services/civicAuthService.js
// Compatibility bridge for Civic Auth - updated to work properly with React hooks

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

class CivicAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = new Set();
    this.initialized = false;
    this.clientId = 'b2c9fa1e-d978-4e3d-9a3d-4a36d2ef49e6';
  }

  // Initialize - now just logs helpful info
  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Civic Auth Service initialized as compatibility bridge');
    console.log('✅ Use @civic/auth React hooks in components instead of service methods');
    console.log('📖 Client ID:', this.clientId);
    
    this.initialized = true;
  }

  // Helper method to create Firebase-compatible user from Civic user
  static createFirebaseCompatibleUser(civicUser) {
    if (!civicUser) return null;
    
    // Helper function to safely handle undefined values
    const safeValue = (value, defaultValue = null) => {
      return value !== undefined ? value : defaultValue;
    };
    
    const user = {
      uid: civicUser.id,
      email: safeValue(civicUser.email, ''),
      displayName: civicUser.name || `${civicUser.given_name || ''} ${civicUser.family_name || ''}`.trim() || 'Anonymous User',
      photoURL: safeValue(civicUser.picture),
      emailVerified: !!civicUser.email_verified,
      authProvider: 'civic',
      civicId: civicUser.id,
      createdAt: new Date()
    };

    // Only add optional fields if they exist (avoid undefined values)
    if (civicUser.given_name !== undefined) {
      user.given_name = civicUser.given_name;
    }
    if (civicUser.family_name !== undefined) {
      user.family_name = civicUser.family_name;
    }
    if (civicUser.picture !== undefined) {
      user.picture = civicUser.picture;
    }
    if (civicUser.sid !== undefined) {
      user.sid = civicUser.sid;
    }
    if (civicUser.jti !== undefined) {
      user.jti = civicUser.jti;
    }
    
    return user;
  }

  // Save Civic user to Firestore
  static async saveCivicUserToFirestore(civicUser) {
    try {
      console.log('💾 Saving Civic user to Firestore:', civicUser);

      const firebaseUser = CivicAuthService.createFirebaseCompatibleUser(civicUser);
      const userRef = doc(db, 'users', firebaseUser.uid);
      
      // Check if user already exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await setDoc(userRef, {
          ...firebaseUser,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('✅ Existing Civic user updated in Firestore');
      } else {
        // Create new user
        await setDoc(userRef, {
          ...firebaseUser,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: 'customer', // Default role
          profileComplete: false
        });
        console.log('✅ New Civic user created in Firestore');
      }

      return firebaseUser;
    } catch (error) {
      console.error('❌ Error saving Civic user:', error);
      throw error;
    }
  }

  // Deprecated methods that guide developers to use React hooks
  async signInWithCivic() {
    console.warn('⚠️ civicAuthService.signInWithCivic() is deprecated');
    console.log('✅ Use the useUser hook from @civic/auth/react instead:');
    console.log(`
    import { useUser } from '@civic/auth/react';
    
    function LoginComponent() {
      const { user, signIn, signOut } = useUser();
      
      return (
        <button onClick={signIn}>
          Sign In with Civic
        </button>
      );
    }
    `);
    
    throw new Error('Use useUser hook from @civic/auth/react instead of service methods');
  }

  async signUpWithCivic() {
    return this.signInWithCivic();
  }

  async signOut() {
    console.warn('⚠️ civicAuthService.signOut() is deprecated');
    console.log('✅ Use signOut from useUser hook instead');
    throw new Error('Use signOut from useUser hook instead of service method');
  }

  getCurrentUser() {
    console.warn('⚠️ civicAuthService.getCurrentUser() is deprecated');
    console.log('✅ Use user from useUser hook instead');
    return this.currentUser;
  }

  isSignedIn() {
    console.warn('⚠️ civicAuthService.isSignedIn() is deprecated');
    console.log('✅ Check user from useUser hook instead');
    return !!this.currentUser;
  }

  // Compatibility methods - all redirect to proper React hook usage
  isAuthenticated() {
    return this.isSignedIn();
  }

  async loginUser() {
    return this.signInWithCivic();
  }

  async registerUser() {
    return this.signUpWithCivic();
  }

  async authenticate() {
    return this.signInWithCivic();
  }

  async login() {
    return this.signInWithCivic();
  }

  async register() {
    return this.signUpWithCivic();
  }

  // Auth state management (for compatibility with existing code)
  onAuthStateChanged(callback) {
    this.authStateListeners.add(callback);
    callback(this.currentUser);
    return () => this.authStateListeners.delete(callback);
  }

  notifyAuthStateChange(user) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  async updateProfile(updates) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    this.notifyAuthStateChange(this.currentUser);
  }

  // Set current user (called by CivicAuthProvider bridge)
  setCurrentUser(user) {
    this.currentUser = user;
    this.notifyAuthStateChange(user);
  }
}

// Create singleton
const civicAuthService = new CivicAuthService();

// Export Firebase-compatible auth object (for compatibility)
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => civicAuthService.onAuthStateChanged(callback),
  signOut: () => {
    console.warn('⚠️ auth.signOut() should be replaced with useUser hook');
    throw new Error('Use signOut from useUser hook instead');
  },
  updateCurrentUser: (user) => {
    auth.currentUser = user;
    civicAuthService.setCurrentUser(user);
    return Promise.resolve();
  }
};

// Initialize
civicAuthService.initialize().catch(error => {
  console.error('Civic Auth Service initialization failed:', error.message);
});

// Export service for compatibility (but methods will guide to proper usage)
export { civicAuthService };
export default civicAuthService;

// Export helper methods that still work
export const createFirebaseCompatibleUser = CivicAuthService.createFirebaseCompatibleUser;
export const saveCivicUserToFirestore = CivicAuthService.saveCivicUserToFirestore;