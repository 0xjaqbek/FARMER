// src/context/BaseMiniAppAuthContext.jsx
// Simplified authentication using Base Mini App SIWF (Sign In with Farcaster)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthenticate } from '@coinbase/onchainkit/minikit';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Use Base Mini App authentication (SIWF - Sign In with Farcaster)
  const { user: authenticatedUser, authenticate } = useAuthenticate();

  // Use context for UX hints (non-security features)
  const { context } = useMiniKit();

  // Local state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Convert Base Mini App authenticated user to our app format
   */
  const convertToAppUser = useCallback((authUser) => {
    if (!authUser) return null;

    return {
      uid: authUser.fid, // Use Farcaster ID as unique identifier
      fid: authUser.fid,
      email: null, // SIWF doesn't provide email
      displayName: `User ${authUser.fid}`,
      photoURL: null,
      // Base Mini App specific fields
      signature: authUser.signature,
      message: authUser.message,
      // Auth method
      authMethod: 'siwf', // Sign In with Farcaster
      // Timestamps
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }, []);

  /**
   * Fetch or create user profile in Firestore
   */
  const fetchOrCreateUserProfile = useCallback(async (fid) => {
    if (!fid || !db) return null;

    try {
      const userRef = doc(db, 'users', fid.toString());
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log('✅ User profile loaded from Firestore:', fid);
        return userSnap.data();
      } else {
        // Create new user profile
        const newProfile = {
          fid: fid.toString(),
          displayName: `User ${fid}`,
          role: 'customer',
          accountType: 'standard',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          authMethod: 'siwf',
          // Default settings
          settings: {
            notifications: true,
            theme: 'light'
          }
        };

        await setDoc(userRef, newProfile);
        console.log('✅ Created new user profile in Firestore:', fid);

        return {
          ...newProfile,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ Error fetching/creating user profile:', error);
      return null;
    }
  }, []);

  /**
   * Handle authenticated user changes
   */
  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        if (authenticatedUser) {
          console.log('🔐 User authenticated with SIWF:', authenticatedUser.fid);

          // Convert to app user format
          const appUser = convertToAppUser(authenticatedUser);
          setCurrentUser(appUser);

          // Fetch or create user profile
          const profile = await fetchOrCreateUserProfile(authenticatedUser.fid);
          setUserProfile(profile);

        } else {
          console.log('👤 No authenticated user');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error handling auth change:', error);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    handleAuthChange();
  }, [authenticatedUser, convertToAppUser, fetchOrCreateUserProfile]);

  /**
   * Sign in with Farcaster
   */
  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔑 Initiating SIWF authentication...');

      const result = await authenticate();

      if (result) {
        console.log('✅ Authentication successful:', result.fid);
        return result;
      } else {
        console.log('❌ Authentication cancelled or failed');
        return null;
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [authenticate]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      console.log('👋 Signing out...');

      // Clear local state
      setCurrentUser(null);
      setUserProfile(null);

      // Note: SIWF doesn't have explicit sign out in the SDK
      // The user remains authenticated until they close the app
      // or the session expires

      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }, []);

  /**
   * Update user profile in Firestore
   */
  const updateUserProfile = useCallback(async (updates) => {
    if (!currentUser?.fid) {
      throw new Error('No authenticated user');
    }

    try {
      const userRef = doc(db, 'users', currentUser.fid.toString());
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      }));

      console.log('✅ User profile updated');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Get context data (for UX hints only, not for security)
   */
  const getContextData = useCallback(() => {
    return context?.user || null;
  }, [context]);

  const value = {
    // User state
    currentUser,
    userProfile,
    loading,

    // Authentication methods
    signIn,
    signOut,

    // Profile management
    updateUserProfile,

    // Context data (for UX, not security)
    getContextData,

    // Helpers
    isAuthenticated: !!currentUser,
    isFarmer: userProfile?.role === 'farmer',
    isAdmin: userProfile?.role === 'admin',

    // Direct access to authenticated user (for security operations)
    authenticatedUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;