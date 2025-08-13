// src/context/AuthContext.jsx
// Fixed AuthContext with import fallback and error handling

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility function to convert Firestore timestamps (moved here to avoid import issues)
const convertTimestamps = (data) => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // Handle common timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'lastLogin', 'verificationDate'];
  
  timestampFields.forEach(field => {
    if (converted[field]) {
      try {
        // Check if it's a Firestore Timestamp object
        if (converted[field].toDate && typeof converted[field].toDate === 'function') {
          converted[field] = converted[field].toDate();
        }
        // If it's already a Date object, leave it as is
        else if (converted[field] instanceof Date) {
          // Already a Date object, keep it
        }
        // If it's a string, convert to Date
        else if (typeof converted[field] === 'string') {
          converted[field] = new Date(converted[field]);
        }
        // If it's a number (Unix timestamp), convert to Date
        else if (typeof converted[field] === 'number') {
          converted[field] = new Date(converted[field]);
        }
      } catch (error) {
        console.warn(`Error converting timestamp field ${field}:`, error);
        // Keep the original value if conversion fails
      }
    }
  });
  
  return converted;
};

// Local function to get user profile (to avoid import issues)
const getUserProfile = async (userId) => {
  try {
    console.log('Getting user profile for:', userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.warn('User profile not found, creating basic profile');
      
      // Return a basic user profile if it doesn't exist
      const basicProfile = {
        id: userId,
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || 'User',
        role: 'klient',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return basicProfile;
    }
    
    const userData = userDoc.data();
    console.log('Raw user data from Firestore:', userData);
    
    const convertedData = convertTimestamps(userData);
    console.log('Converted user data:', convertedData);
    
    return convertedData;
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    
    // Return a fallback profile instead of throwing
    return {
      id: userId,
      email: auth.currentUser?.email || '',
      displayName: auth.currentUser?.displayName || 'User',
      role: 'klient',
      createdAt: new Date(),
      updatedAt: new Date(),
      error: error.message
    };
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test Firebase connection
  useEffect(() => {
    console.log('Testing Firebase connection...');
    console.log('Auth instance exists:', !!auth);
    console.log('Auth currentUser:', auth.currentUser ? auth.currentUser.email : 'No user');
    
    if (!auth) {
      console.error('Firebase Auth not initialized!');
      setError('Firebase Auth not initialized');
      setLoading(false);
      return;
    }
    
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. User:', user ? user.email : 'No user');
      
      try {
        setError(null); // Clear any previous errors
        
        if (user) {
          console.log('User logged in, fetching profile...');
          
          // Get user profile from Firestore
          try {
            const profile = await getUserProfile(user.uid);
            console.log('User profile loaded:', profile);
            
            setCurrentUser(user);
            setUserProfile(profile);
          } catch (profileError) {
            console.error('Error loading user profile:', profileError);
            
            // If profile loading fails, still set the user but with a basic profile
            setCurrentUser(user);
            setUserProfile({
              id: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              role: 'klient',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            // Set a non-critical error
            setError(`Profile loading issue: ${profileError.message}`);
          }
        } else {
          console.log('User logged out');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (authError) {
        console.error('Auth state change error:', authError);
        setError(`Authentication error: ${authError.message}`);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Refreshing user profile...');
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      setError(null);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      setError(`Profile refresh failed: ${error.message}`);
    }
  };

  // Update user profile in context
  const updateUserProfileContext = (updates) => {
    if (userProfile) {
      setUserProfile(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date()
      }));
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    refreshUserProfile,
    updateUserProfileContext,
    clearError,
    
    // Helper functions
    isAuthenticated: !!currentUser,
    isFarmer: userProfile?.role === 'rolnik' || userProfile?.role === 'farmer',
    isCustomer: userProfile?.role === 'klient' || userProfile?.role === 'customer',
    isAdmin: userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}