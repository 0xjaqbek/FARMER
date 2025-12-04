// src/services/authService.js
// Updated auth service that uses Civic Auth while maintaining Firebase compatibility

import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import civicAuthService from './civicAuthService';

console.log('🔥 Civic-enabled Auth service loaded');

// Register new user with Civic Auth
export const registerUser = async (email, password, userData) => {
  console.log('=== CIVIC REGISTER USER CALLED ===');
  console.log('✅ UserData parameter:', userData);
  
  try {
    // Use Civic Auth instead of Firebase Auth
    const result = await civicAuthService.signUpWithCivic();
    const user = result.user;

    console.log('✅ Civic user created successfully:', user.uid);

    // Get the Firestore document that was created by Civic service
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Update with additional registration data
      const updateData = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'klient',
        postalCode: userData.postalCode || '',
        displayName: userData.displayName || userData.name || `${userData.firstName} ${userData.lastName}`.trim() || user.displayName,
        
        // Update role-specific data if provided
        ...(userData.role === 'rolnik' ? {
          farmInfo: {
            farmName: userData.farmName || '',
            description: userData.farmDescription || '',
            established: userData.established || null,
            farmSize: userData.farmSize || 0,
            farmingMethods: userData.farmingMethods || [],
            specialties: userData.specialties || [],
            certifications: userData.certifications || [],
            website: userData.website || '',
            socialMedia: userData.socialMedia || {}
          }
        } : {}),

        updatedAt: serverTimestamp()
      };

      await updateDoc(userDocRef, updateData);
      console.log('✅ User registration data updated in Firestore');

      // Get the updated document
      const updatedDoc = await getDoc(userDocRef);
      
      return {
        user,
        userDoc: updatedDoc.data()
      };
    } else {
      throw new Error('User document not found after Civic registration');
    }

  } catch (error) {
    console.error('❌ Civic registration error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.message.includes('User declined')) {
      errorMessage = 'Registration cancelled. Please try again when ready.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message && !error.code) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Login user with Civic Auth
export const loginUser = async () => {
  console.log('=== CIVIC LOGIN USER CALLED ===');
  console.log('Note: Email/password not used with Civic Auth');
  
  try {
    // Use Civic Auth instead of Firebase Auth
    const result = await civicAuthService.signInWithCivic();
    const user = result.user;

    console.log('✅ User signed in successfully with Civic:', user.uid);

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.warn('User document not found, this should not happen with Civic');
      throw new Error('User profile not found. Please contact support.');
    }

    const userData = userDoc.data();

    // Update last login timestamp
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
    } catch (updateError) {
      console.warn('Could not update last login timestamp:', updateError);
    }

    return {
      user,
      userDoc: userData
    };

  } catch (error) {
    console.error('❌ Civic login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.message.includes('User declined')) {
      errorMessage = 'Login cancelled. Please try again when ready.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message && !error.code) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await civicAuthService.signOut();
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

// Get current user profile
export const getCurrentUserProfile = async (userId) => {
  try {
    console.log('Getting user profile for:', userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to load user profile');
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userRef, updateData, { merge: true });
    
    // Also update Civic Auth profile if display name changed
    if (updates.displayName && civicAuthService.getCurrentUser()) {
      await civicAuthService.updateProfile({
        displayName: updates.displayName
      });
    }
    
    console.log('✅ User profile updated successfully');
    
  } catch (error) {
    console.error('❌ Profile update error:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

// Export getUserProfile as an alias for compatibility
export const getUserProfile = getCurrentUserProfile;

// Civic-specific helper functions
export const signInWithCivic = () => civicAuthService.signInWithCivic();
export const signUpWithCivic = () => civicAuthService.signUpWithCivic();
export const isCivicUser = () => civicAuthService.isSignedIn();