// src/context/AuthContext.jsx
// Updated AuthContext that works with Civic Auth while maintaining the same API

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config'; // Now uses Civic auth
import civicAuthService from '../services/civicAuthService';

const AuthContext = createContext({});

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user profile from Firestore
  const getUserProfile = async (userId) => {
    try {
      console.log('Getting user profile for:', userId);
      
      if (!userId) {
        console.warn('No userId provided to getUserProfile');
        return null;
      }
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Raw user data from Firestore:', userData);
        
        // DON'T FLATTEN THE DATA - PRESERVE THE STRUCTURE
        const completeProfile = {
          uid: userId,
          id: userId,
          
          // Basic fields
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'customer',
          displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
          phone: userData.phone || userData.phoneNumber || '',
          bio: userData.bio || '',
          profileComplete: userData.profileComplete || false,
          authProvider: userData.authProvider || 'civic',
          
          // CRITICAL: Preserve nested structures AS-IS
          address: userData.address || {},
          farmInfo: userData.farmInfo || {}, // This preserves farmInfo.farmName!
          customerInfo: userData.customerInfo || {},
          notificationPreferences: userData.notificationPreferences || {
            email: { orderUpdates: true, newMessages: true, lowStock: true, reviews: true, marketing: false },
            sms: { orderUpdates: false, newMessages: false, lowStock: false, reviews: false },
            inApp: { orderUpdates: true, newMessages: true, lowStock: true, reviews: true, marketing: true }
          },
          privacy: userData.privacy || {},
          
          // Legacy fields (for backwards compatibility)
          farmName: userData.farmName || userData.farmInfo?.farmName || '', // Support both structures
          farmLocation: userData.farmLocation || '',
          isPublic: userData.isPublic ?? true,
          acceptsOrders: userData.acceptsOrders ?? true,
          
          // Timestamps
          createdAt: userData.createdAt || new Date(),
          updatedAt: userData.updatedAt || new Date(),
          lastLogin: userData.lastLogin || new Date()
        };
        
        return completeProfile;
      } else {
        console.log('No user profile found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updateData, { merge: true });
      
      // Also update Civic Auth profile if display name changed
      if (updates.displayName) {
        await civicAuthService.updateProfile({
          displayName: updates.displayName
        });
      }
      
      // Refresh the user profile
      await refreshUserProfile();
      
      console.log('✅ User profile updated successfully');
      
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      return profile;
    }
    return null;
  };

  // Sign out function
  const signOut = async () => {
    try {
      await civicAuthService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update profile (Firebase Auth compatible API)
  const updateProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      await civicAuthService.updateProfile(updates);
      
      // Also update in Firestore
      await updateUserProfile(updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed. User:', user ? user.email : 'No user');
      
      setCurrentUser(user);
      
      if (user) {
        console.log('User logged in, fetching profile...');
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          console.log('User profile loaded:', profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
        }
      } else {
        console.log('User logged out');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []); // Empty dependency array is correct here

  // Debug logging
  useEffect(() => {
    console.log('Current user state:', currentUser ? currentUser.email : 'None');
    console.log('User profile state:', userProfile);
  }, [currentUser, userProfile]);

  const value = {
    currentUser,
    userProfile,
    loading,
    getUserProfile,
    updateUserProfile,
    refreshUserProfile,
    updateProfile,
    signOut,
    // Civic-specific functions
    signInWithCivic: () => civicAuthService.signInWithCivic(),
    signUpWithCivic: () => civicAuthService.signUpWithCivic(),
    isCivicUser: () => civicAuthService.isSignedIn()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};