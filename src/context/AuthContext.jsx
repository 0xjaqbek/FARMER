// Fixed AuthContext.jsx - Ensure user profile includes all necessary fields

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
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
          email: userData.email || currentUser?.email,
          firstName: userData.firstName || userData.displayName?.split(' ')[0] || 'User',
          lastName: userData.lastName || userData.displayName?.split(' ')[1] || '',
          displayName: userData.displayName || `${userData.firstName || 'User'} ${userData.lastName || ''}`.trim(),
          role: userData.role || 'klient',
          postalCode: userData.postalCode || '', // Ensure postalCode is always a string
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          ...userData // Include any other fields
        };
        
        return completeProfile;
      } else {
        console.log('User profile not found, creating basic profile');
        
        // Create a basic profile if none exists
        const basicProfile = {
          uid: userId,
          id: userId,
          email: currentUser?.email || '',
          displayName: currentUser?.displayName || 'User',
          firstName: currentUser?.displayName?.split(' ')[0] || 'User',
          lastName: currentUser?.displayName?.split(' ')[1] || '',
          role: 'klient', // Default role
          postalCode: '', // Default empty string
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Save the basic profile to Firestore
        await setDoc(userDocRef, basicProfile);
        console.log('Basic profile created');
        
        // Return with converted timestamps
        return {
          ...basicProfile,
          createdAt: new Date(),
          updatedAt: new Date()
        };
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
  }, []);

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
    updateProfile,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};