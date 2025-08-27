// FIXED: src/services/civicAuthService.js
// Handle undefined values properly

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

class CivicAuthService {
  constructor() {
    this.civicAuth = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Import Civic Auth dynamically
      const { CivicAuth } = await import('@civic/auth/vanillajs');
      
      const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;
      if (!clientId) {
        throw new Error('Civic Auth Client ID is not configured. Please set VITE_CIVIC_CLIENT_ID in your .env file');
      }

      console.log('Initializing Civic Auth with Client ID:', clientId);

      this.civicAuth = await CivicAuth.create({
        clientId: clientId,
        displayMode: 'redirect',
        redirectUrl: window.location.origin + '/auth/callback'
      });
      
      this.initialized = true;
      console.log('✅ Civic Auth initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Civic Auth:', error);
      throw error;
    }
  }

  // FIXED: Check if email is admin with proper undefined handling
  isAdminEmail(email) {
    try {
      // Handle undefined email
      if (!email || typeof email !== 'string') {
        return false;
      }

      // Handle undefined environment variable
      const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS;
      if (!adminEmailsStr || typeof adminEmailsStr !== 'string') {
        console.warn('VITE_ADMIN_EMAILS not configured in environment variables');
        return false;
      }

      const adminEmails = adminEmailsStr.split(',').map(email => email.trim().toLowerCase());
      return adminEmails.includes(email.toLowerCase().trim());
    } catch (error) {
      console.error('Error checking admin email:', error);
      return false;
    }
  }

  // Simplified register - let Civic handle the auth flow
  async registerUser(email, password, userData) {
    console.log('=== CIVIC REGISTRATION STARTED ===');
    
    try {
      await this.initialize();
      
      // Start Civic authentication
      console.log('Starting Civic authentication flow...');
      const { user } = await this.civicAuth.startAuthentication();
      
      console.log('✅ Civic auth successful:', user);

      // Create user profile in Firestore with safe defaults
      const userProfile = {
        uid: user.sub || user.id,
        id: user.sub || user.id,
        email: user.email || '',
        firstName: userData?.firstName || user.given_name || '',
        lastName: userData?.lastName || user.family_name || '',
        displayName: userData?.displayName || user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim() || 'User',
        role: userData?.role || 'klient',
        
        // Address information
        address: {
          street: userData?.address?.street || '',
          city: userData?.address?.city || '',
          state: userData?.address?.state || '',
          postalCode: userData?.address?.postalCode || '',
          country: userData?.address?.country || 'Poland'
        },
        
        // Profile info
        phone: userData?.phone || '',
        bio: userData?.bio || '',
        profileImage: user.picture || '',
        
        // Location
        location: {
          coordinates: { lat: 0, lng: 0 },
          geoHash: '',
          region: userData?.address?.state || '',
          deliveryAddresses: []
        },
        
        // Notification preferences
        notificationPreferences: userData?.notificationPreferences || {
          email: { orderUpdates: true, marketing: false },
          push: { orderUpdates: true, marketing: false }
        },
        
        // Admin check with safe email handling
        isAdmin: this.isAdminEmail(user.email),
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        
        // Civic-specific data
        civicUserId: user.sub || user.id,
        authProvider: 'civic'
      };

      // Save to Firestore
      console.log('Saving user profile to Firestore...');
      const userId = user.sub || user.id;
      await setDoc(doc(db, 'users', userId), userProfile);
      console.log('✅ User profile saved successfully');

      return {
        user: {
          uid: userId,
          email: user.email || '',
          displayName: userProfile.displayName
        },
        userProfile
      };
      
    } catch (error) {
      console.error('❌ Civic registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Simplified login
  async loginUser() {
    console.log('=== CIVIC LOGIN STARTED ===');
    
    try {
      await this.initialize();
      
      console.log('Starting Civic authentication flow...');
      const { user } = await this.civicAuth.startAuthentication();
      
      console.log('✅ Civic auth successful:', user);

      const userId = user.sub || user.id;
      if (!userId) {
        throw new Error('No user ID received from Civic Auth');
      }

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('Creating new user profile...');
        // Create basic profile if doesn't exist
        const basicUserDoc = {
          uid: userId,
          id: userId,
          email: user.email || '',
          displayName: user.name || user.email || 'User',
          role: 'klient',
          isAdmin: this.isAdminEmail(user.email),
          civicUserId: userId,
          authProvider: 'civic',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', userId), basicUserDoc);
        
        return {
          user: {
            uid: userId,
            email: user.email || '',
            displayName: basicUserDoc.displayName
          },
          userDoc: basicUserDoc
        };
      }

      const userData = userDoc.data();

      // Update last login
      await setDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      return {
        user: {
          uid: userId,
          email: user.email || '',
          displayName: userData.displayName || 'User'
        },
        userDoc: userData
      };

    } catch (error) {
      console.error('❌ Civic login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logoutUser() {
    try {
      await this.initialize();
      await this.civicAuth.logout();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  async getCurrentUser() {
    try {
      await this.initialize();
      const user = await this.civicAuth.getUser();
      return user ? {
        uid: user.sub || user.id,
        email: user.email || '',
        displayName: user.name || 'User'
      } : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      await this.initialize();
      return await this.civicAuth.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async getCurrentUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      return userDoc.data();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const userRef = doc(db, 'users', userId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updateData, { merge: true });
      console.log('✅ User profile updated successfully');
      
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }
}

// Export singleton instance
export const civicAuthService = new CivicAuthService();

// Export individual functions for compatibility
export const registerUser = (email, password, userData) => 
  civicAuthService.registerUser(email, password, userData);

export const loginUser = (email, password) => 
  civicAuthService.loginUser(email, password);

export const logoutUser = () => 
  civicAuthService.logoutUser();

export const getCurrentUserProfile = (userId) => 
  civicAuthService.getCurrentUserProfile(userId);

export const updateUserProfile = (userId, updates) => 
  civicAuthService.updateUserProfile(userId, updates);

export const getUserProfile = getCurrentUserProfile;