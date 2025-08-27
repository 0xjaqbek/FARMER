// src/services/civicAuthService.js
// REAL Civic Auth implementation using the correct @civic/auth React API

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

class CivicAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = new Set();
    this.initialized = false;
    this.clientId = 'b2c9fa1e-d978-4e3d-9a3d-4a36d2ef49e6';
    this.civicHooks = null;
  }

  // Initialize with REAL @civic/auth React hooks
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing REAL @civic/auth React implementation');
      console.log('Client ID:', this.clientId);
      
      // Import the real @civic/auth React hooks
      const civicModule = await import('@civic/auth/react');
      console.log('✅ @civic/auth/react loaded, exports:', Object.keys(civicModule));
      
      // Store the hooks for use
      this.civicHooks = civicModule;
      this.initialized = true;
      
      console.log('✅ REAL Civic Auth React hooks ready');
      console.log('📖 Note: Full integration requires CivicAuthProvider in your React app');
      
    } catch (error) {
      console.error('❌ REAL Civic Auth React initialization failed:', error);
      throw new Error(`Failed to load @civic/auth/react: ${error.message}`);
    }
  }

  // Bridge method to work with React hooks
  // This service now acts as a bridge between React hooks and Firebase Auth compatibility
  async signInWithCivic() {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const errorMessage = `
🚨 CIVIC AUTH INTEGRATION REQUIRED 🚨

The real @civic/auth uses React Provider pattern, not service methods.

TO PROPERLY INTEGRATE:

1. Wrap your app with CivicAuthProvider:
   import { CivicAuthProvider } from '@civic/auth/react';
   
   <CivicAuthProvider clientId="${this.clientId}">
     <YourApp />
   </CivicAuthProvider>

2. Use the useUser hook in components:
   import { useUser } from '@civic/auth/react';
   
   function LoginButton() {
     const { user, signIn, signOut } = useUser();
     return (
       <div>
         {!user && <button onClick={signIn}>Sign In</button>}
         {user && <button onClick={signOut}>Sign Out</button>}
       </div>
     );
   }

3. Update your auth service to work with Civic's React pattern.

CURRENT ISSUE:
You're trying to use service-based auth, but @civic/auth is React-hook based.
`;
      
      console.error(errorMessage);
      reject(new Error('Civic Auth requires React Provider integration. See console for details.'));
    });
  }

  // Compatibility methods that explain the required changes
  async signUpWithCivic() {
    return this.signInWithCivic();
  }

  async signOut() {
    console.log('⚠️ signOut should be called from useUser hook, not service');
    throw new Error('Use signOut from useUser hook instead of service method');
  }

  getCurrentUser() {
    console.log('⚠️ getCurrentUser should be accessed from useUser hook');
    return this.currentUser;
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  // Compatibility methods
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

  // Auth state management (for compatibility)
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

  // Helper method to create Firebase-compatible user from Civic user
  static createFirebaseCompatibleUser(civicUser) {
    return {
      uid: civicUser.id,
      email: civicUser.email || '',
      displayName: civicUser.name || `${civicUser.given_name || ''} ${civicUser.family_name || ''}`.trim(),
      photoURL: civicUser.picture || null,
      emailVerified: !!civicUser.email,
      phoneNumber: '',
      isAnonymous: false,
      metadata: {
        creationTime: civicUser.updated_at || new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [{
        providerId: 'civic',
        uid: civicUser.id,
        email: civicUser.email || '',
        displayName: civicUser.name || '',
        photoURL: civicUser.picture || null
      }],
      civicData: {
        ...civicUser,
        provider: 'civic_real_react',
        integratedAt: new Date().toISOString()
      }
    };
  }

  // Helper method to save Civic user to Firestore
  static async saveUserToFirestore(civicUser) {
    try {
      const firebaseUser = this.createFirebaseCompatibleUser(civicUser);
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const existingDoc = await getDoc(userDocRef);

      const baseUserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        authProvider: 'civic_real_react',
        isVerified: true,
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      if (existingDoc.exists()) {
        await setDoc(userDocRef, baseUserData, { merge: true });
        console.log('✅ REAL Civic user updated in Firestore');
      } else {
        const newUserData = {
          ...baseUserData,
          firstName: civicUser.given_name || '',
          lastName: civicUser.family_name || '',
          role: 'klient',
          profileImage: civicUser.picture || '',
          createdAt: serverTimestamp(),

          location: {
            address: '',
            coordinates: { lat: 0, lng: 0 },
            geoHash: '',
            city: '',
            region: '',
            country: '',
            deliveryAddresses: []
          },

          verification: {
            provider: 'civic_real_react',
            civicId: civicUser.id,
            verifiedAt: new Date().toISOString()
          },

          notificationPreferences: {
            email: {
              orderUpdates: true,
              newMessages: true,
              lowStock: false,
              reviews: true,
              marketing: false
            },
            sms: {
              orderUpdates: false,
              newMessages: false,
              lowStock: false,
              reviews: false
            },
            inApp: {
              orderUpdates: true,
              newMessages: true,
              lowStock: true,
              reviews: true,
              marketing: true
            }
          },

          customerInfo: {
            preferredCategories: [],
            dietaryRestrictions: [],
            averageOrderValue: 0,
            totalOrders: 0
          }
        };

        await setDoc(userDocRef, newUserData);
        console.log('✅ REAL Civic user created in Firestore');
      }

      return firebaseUser;
    } catch (error) {
      console.error('❌ Error saving real Civic user:', error);
      throw error;
    }
  }
}

// Create singleton
const civicAuthService = new CivicAuthService();

// Export Firebase-compatible auth object (for compatibility)
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => civicAuthService.onAuthStateChanged(callback),
  signOut: () => civicAuthService.signOut(),
  updateCurrentUser: (user) => {
    auth.currentUser = user;
    return Promise.resolve();
  }
};

civicAuthService.onAuthStateChanged((user) => {
  auth.currentUser = user;
});

// Initialize
civicAuthService.initialize().catch(error => {
  console.error('🚨 REAL Civic Auth React initialization failed:', error.message);
});

// Export service for compatibility
export { civicAuthService };
export default civicAuthService;

// Export individual methods (they will show integration guidance)
export const isAuthenticated = () => civicAuthService.isAuthenticated();
export const loginUser = () => civicAuthService.loginUser();
export const registerUser = () => civicAuthService.registerUser();
export const signInWithCivic = () => civicAuthService.signInWithCivic();
export const signUpWithCivic = () => civicAuthService.signUpWithCivic();
export const signOut = () => civicAuthService.signOut();
export const getCurrentUser = () => civicAuthService.getCurrentUser();