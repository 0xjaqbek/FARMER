// src/context/AuthContext.jsx
// Updated AuthContext that properly integrates with Civic Auth React hooks

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@civic/auth/react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createFirebaseCompatibleUser, saveCivicUserToFirestore } from '../services/civicAuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Get Civic Auth state from the useUser hook
  const { 
    user: civicUser, 
    signIn: civicSignIn, 
    signOut: civicSignOut, 
    isLoading: civicLoading,
    error: civicError 
  } = useUser();

  // Local state for Firebase-compatible user and profile
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convert Civic user to Firebase-compatible format and save to Firestore
  useEffect(() => {
    const handleCivicUser = async () => {
      try {
        if (civicUser && !civicLoading) {
          console.log('🔄 Processing Civic user:', civicUser.email);
          
          // Convert to Firebase-compatible user
          const firebaseUser = createFirebaseCompatibleUser(civicUser);
          
          // Save to Firestore
          await saveCivicUserToFirestore(civicUser);
          
          // Set current user
          setCurrentUser(firebaseUser);
          
          // Load user profile
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          console.log('✅ Civic user processed successfully');
          
        } else if (!civicUser && !civicLoading) {
          // User logged out
          console.log('🔄 User logged out');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error processing Civic user:', error);
      } finally {
        setLoading(civicLoading);
      }
    };

    handleCivicUser();
  }, [civicUser, civicLoading]);

  // Get user profile from Firestore
  const getUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updateData, { merge: true });
      
      // Update local state
      if (currentUser && currentUser.uid === userId) {
        setUserProfile(prev => ({ ...prev, ...updateData }));
      }
      
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

  // Civic Auth wrapper functions
  const signInWithCivic = async () => {
    try {
      console.log('🚀 Starting Civic sign in...');
      await civicSignIn();
      // User state will be updated by the useEffect above
    } catch (error) {
      console.error('❌ Civic sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚀 Starting sign out...');
      await civicSignOut();
      setCurrentUser(null);
      setUserProfile(null);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  // Update profile with Civic integration
  const updateProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      await updateUserProfile(currentUser.uid, updates);
      console.log('✅ Profile update successful');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    // Core auth state
    currentUser,
    userProfile,
    loading: loading || civicLoading,
    error: civicError,
    
    // Auth methods
    signInWithCivic,
    signOut,
    updateProfile,
    
    // Profile methods
    getUserProfile,
    updateUserProfile,
    refreshUserProfile,
    
    // Civic-specific state
    civicUser,
    isCivicUser: !!civicUser,
    
    // Legacy compatibility
    signUpWithCivic: signInWithCivic, // Civic handles both sign in and sign up
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};