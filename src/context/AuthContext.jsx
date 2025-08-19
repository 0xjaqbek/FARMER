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
        deliveryAvailable: userData.deliveryAvailable ?? false,
        deliveryRadius: userData.deliveryRadius ?? 10,
        
        // Timestamps
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLoginAt: userData.lastLoginAt
      };
      
      console.log('Complete profile with preserved structure:', completeProfile);
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
    
    console.log('=== AUTH CONTEXT UPDATE DEBUG ===');
    console.log('Updates to save:', updates);
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Prepare the update data with proper structure
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    console.log('Final data being saved to Firestore:', updateData);
    
    // Save to Firestore with merge to preserve existing data
    await setDoc(userDocRef, updateData, { merge: true });
    console.log('✅ Data saved to Firestore successfully');
    
    // Verify the save by reading back immediately
    console.log('🔍 Verifying save by reading document...');
    const verifyDoc = await getDoc(userDocRef);
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log('✅ Verified saved data:', savedData);
      console.log('Farm info in saved data:', savedData.farmInfo);
      console.log('Farm name in saved data:', savedData.farmInfo?.farmName);
    }
    
    // Refresh the user profile with the new data
    const updatedProfile = await getUserProfile(currentUser.uid);
    console.log('✅ Profile refreshed after update:', updatedProfile);
    
    setUserProfile(updatedProfile);
    return updatedProfile;
    
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
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