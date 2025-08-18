// src/civic/auth.js - Fixed version with better callback handling
import { CivicAuth } from '@civic/auth/vanillajs';

class CivicAuthService {
  constructor() {
    this.authClient = null;
    this.user = null;
    this.isInitialized = false;
    
    // Configuration - inline to avoid import issues
    this.config = {
      clientId: import.meta.env.VITE_CIVIC_CLIENT_ID,
      displayMode: 'modal', // Use modal to avoid redirect issues
      // Remove custom redirect URLs for now to use defaults
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if we have the required client ID
      if (!this.config.clientId) {
        console.warn('⚠️ VITE_CIVIC_CLIENT_ID environment variable is required for Civic Auth');
        return;
      }

      console.log('🔄 Initializing Civic Auth with config:', {
        clientId: this.config.clientId ? '✓ Present' : '✗ Missing',
        displayMode: this.config.displayMode
      });

      // Create with minimal config to avoid callback issues
      this.authClient = await CivicAuth.create({
        clientId: this.config.clientId,
        displayMode: this.config.displayMode
      });
      
      console.log('✅ Civic Auth client created successfully');
      
      // Initialize as null, will be set during authentication
      this.user = null;
      this.isInitialized = true;
      
      console.log('✅ Civic Auth initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Civic Auth:', error);
      this.isInitialized = false;
    }
  }

  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.authClient) {
      throw new Error('Civic Auth not properly initialized. Check your configuration.');
    }

    try {
      console.log('🔄 Starting Civic authentication...');
      
      // Use the direct approach with modal
      const result = await this.authClient.startAuthentication();
      
      if (result && result.user) {
        this.user = result.user;
        console.log('✅ Civic authentication successful:', this.user.email || this.user.id);
        return result;
      } else {
        throw new Error('Authentication completed but no user data received');
      }
    } catch (error) {
      console.error('❌ Civic sign-in error:', error);
      this.user = null;
      
      // Provide more specific error messages
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Authentication failed. This might be a configuration issue. Please try again or contact support.');
      } else if (error.message?.includes('cancelled')) {
        throw new Error('Authentication was cancelled by user.');
      } else {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    }
  }

  async signOut() {
    if (!this.authClient) {
      console.warn('Civic Auth client not initialized');
      this.user = null;
      return;
    }

    try {
      console.log('🔄 Signing out from Civic...');
      await this.authClient.logout();
      this.user = null;
      console.log('✅ Civic sign-out successful');
    } catch (error) {
      console.error('❌ Civic sign-out error:', error);
      // Clear user anyway on sign-out errors
      this.user = null;
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.user !== null;
  }

  // Method to sync Civic user with Firebase (if needed)
  async syncWithFirebase() {
    if (!this.user) {
      console.warn('No Civic user to sync with Firebase');
      return null;
    }

    try {
      console.log('🔄 Syncing Civic user with Firebase...');
      
      // Dynamic imports to avoid circular dependencies
      const { db } = await import('../firebase/config');
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', `civic_${this.user.id}`);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        uid: `civic_${this.user.id}`,
        email: this.user.email,
        displayName: this.user.name || `${this.user.given_name || ''} ${this.user.family_name || ''}`.trim(),
        photoURL: this.user.picture,
        provider: 'civic',
        civicId: this.user.id,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
        userData.role = 'customer'; // Default role
        console.log('📝 Creating new Firebase user document for Civic user');
      } else {
        console.log('🔄 Updating existing Firebase user document');
      }

      await setDoc(userRef, userData, { merge: true });
      console.log('✅ User synced with Firebase successfully');
      
      return userData;
    } catch (error) {
      console.error('❌ Error syncing with Firebase:', error);
      // Don't throw sync errors - the login should still work
      return null;
    }
  }

  // Helper method to check if Civic is properly configured
  isConfigured() {
    return !!this.config.clientId;
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      clientId: this.config.clientId ? 'configured' : 'missing',
      displayMode: this.config.displayMode,
      isInitialized: this.isInitialized,
      hasUser: !!this.user,
      hasAuthClient: !!this.authClient
    };
  }
}

// Export a singleton instance
export const civicAuthService = new CivicAuthService();

// For debugging - make it available on window in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.civicAuthService = civicAuthService;
}