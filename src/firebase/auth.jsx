// src/firebase/auth.jsx
// FIXED VERSION - Replace your current file with this

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config.jsx';

// Register new user - FIXED TO ACCEPT THREE PARAMETERS
export const registerUser = async (email, password, userData) => {
  console.log('=== FIXED REGISTERUSER FUNCTION CALLED ===');
  console.log('✅ Email parameter:', email);
  console.log('✅ Password parameter:', password ? `[${password.length} chars provided]` : '[MISSING]');
  console.log('✅ UserData parameter:', userData);
  
  try {
    // Validate inputs
    if (!email) {
      throw new Error('Email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    console.log('✅ Input validation passed');

    // Create auth user
    console.log('🔥 Creating user with Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User created successfully in Firebase Auth:', user.uid);
    
    // Update display name
    const displayName = `${userData.firstName} ${userData.lastName}`;
    await updateProfile(user, {
      displayName: displayName
    });
    console.log('✅ Display name updated to:', displayName);
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      postalCode: userData.postalCode,
      role: userData.role, // 'klient', 'rolnik', or 'admin'
      displayName: displayName,
      
      // Additional profile fields
      phoneNumber: '',
      profileImage: '',
      isVerified: false,
      profileComplete: false,
      
      // Location data (for enhanced features)
      location: {
        address: '',
        coordinates: { lat: 0, lng: 0 },
        geoHash: '',
        city: '',
        region: '',
        country: 'Poland',
        deliveryAddresses: []
      },
      
      // Notification preferences
      notificationPreferences: {
        email: {
          orderUpdates: true,
          newMessages: true,
          lowStock: userData.role === 'rolnik',
          reviews: true,
          marketing: false
        },
        sms: {
          orderUpdates: false,
          newMessages: false,
          lowStock: userData.role === 'rolnik',
          reviews: false
        },
        inApp: {
          orderUpdates: true,
          newMessages: true,
          lowStock: true,
          reviews: true,
          marketing: true
        }
      },
      
      // Role-specific data
      ...(userData.role === 'rolnik' ? {
        farmInfo: {
          farmName: '',
          description: '',
          established: null,
          farmSize: 0,
          farmingMethods: [],
          specialties: [],
          certifications: [],
          website: '',
          socialMedia: {}
        }
      } : {
        customerInfo: {
          preferredCategories: [],
          dietaryRestrictions: [],
          averageOrderValue: 0,
          totalOrders: 0
        }
      }),
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      verificationDate: null,
      lastLoginAt: serverTimestamp()
    };
    
    console.log('💾 Attempting to save user profile to Firestore...');
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ User profile created in Firestore successfully');
      
      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log('✅ Verification email sent');
      } catch (emailError) {
        console.warn('⚠️ Could not send verification email:', emailError);
        // Don't fail registration for this
      }
      
    } catch (firestoreError) {
      console.error('❌ Failed to create user profile in Firestore:', firestoreError);
      console.error('Firestore error code:', firestoreError.code);
      console.error('Firestore error message:', firestoreError.message);
      // Continue anyway for now, so user can at least log in
    }
    
    console.log('🎉 Registration completed successfully!');
    return {
      user,
      userDoc: userProfile
    };
    
  } catch (error) {
    console.error('❌ Registration error:', error.code, error.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/admin-restricted-operation':
        errorMessage = 'User registration is currently disabled. Please contact support.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      default:
        // If it's a custom error message, use it
        if (error.message && !error.code) {
          errorMessage = error.message;
        }
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// ALTERNATIVE: Keep the old function signature for backward compatibility
export const registerUserOld = async (userData) => {
  const { email, password, firstName, lastName, postalCode, role } = userData;
  return await registerUser(email, password, { firstName, lastName, postalCode, role });
};

// Login user
export const loginUser = async (email, password) => {
  console.log('Attempting login with email:', email);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful for uid:', userCredential.user.uid);
    
    // Update last login time
    try {
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.warn('Could not update last login time:', updateError);
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error.code, error.message);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  console.log('Getting user profile for uid:', uid);
  
  try {
    const userDocRef = doc(db, 'users', uid);
    console.log('Firestore document reference created');
    
    const userDoc = await getDoc(userDocRef);
    console.log('Firestore getDoc completed. Document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User profile found:', data);
      return {
        uid: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date()
      };
    } else {
      console.log('No user profile found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Alternative name for compatibility
export const getCurrentUserProfile = getUserProfile;

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('User profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Complete user profile (additional info)
export const completeUserProfile = async (uid, additionalData) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...additionalData,
      profileComplete: true,
      updatedAt: serverTimestamp()
    });
    console.log('User profile completed successfully');
    return true;
  } catch (error) {
    console.error('Error completing user profile:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Verify user account (admin function)
export const verifyUserAccount = async (uid, isVerified = true) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      isVerified,
      verificationDate: isVerified ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    console.log('User verification status updated');
    return true;
  } catch (error) {
    console.error('Error updating user verification:', error);
    throw error;
  }
};

// User roles
export const USER_ROLES = {
  CUSTOMER: 'klient',
  FARMER: 'rolnik', 
  ADMIN: 'admin'
};