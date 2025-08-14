// src/context/AuthContext.jsx
// Fixed AuthContext - Prevent invalid hook calls

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

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
        console.log('User profile found:', userData);
        
        // Ensure all required fields are present
        const completeProfile = {
          uid: userId,
          id: userId, // Add id field for compatibility
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'customer',
          displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
          farmName: userData.farmName || '',
          farmLocation: userData.farmLocation || '',
          profileComplete: userData.profileComplete || false,
          phone: userData.phone || '',
          address: userData.address || {},
          notificationPreferences: userData.notificationPreferences || {
            email: true,
            sms: false,
            inApp: true
          },
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        
        return completeProfile;
      } else {
        console.log('No user profile found in Firestore for:', userId);
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      
      // Refresh the user profile
      const updatedProfile = await getUserProfile(currentUser.uid);
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Refresh user profile (useful for manual refresh)
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
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update Firebase Auth profile
  const updateProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      await firebaseUpdateProfile(currentUser, updates);
      
      // Also update in Firestore
      await updateUserProfile(updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};