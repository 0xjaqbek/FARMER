// src/services/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

console.log('🔥 Auth service loaded');

// Register new user - FIXED FUNCTION WITH CORRECT PARAMETERS
export const registerUser = async (email, password, userData) => {
  console.log('=== NEW REGISTERUSER FUNCTION CALLED ===');
  console.log('✅ Email parameter:', email);
  console.log('✅ Password parameter:', password ? `[${password.length} chars provided]` : '[MISSING - THIS IS THE PROBLEM]');
  console.log('✅ UserData parameter:', userData);
  
  // Log the exact parameters received
  console.log('Function signature check:');
  console.log('- Argument 0 (email):', typeof email, email);
  console.log('- Argument 1 (password):', typeof password, password ? `${password.length} chars` : 'UNDEFINED');
  console.log('- Argument 2 (userData):', typeof userData, userData);
  
  try {
    // Validate inputs
    if (!email) {
      console.error('❌ Email is missing!');
      throw new Error('Email is required');
    }
    if (!password) {
      console.error('❌ Password is missing!');
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      console.error('❌ Password too short!');
      throw new Error('Password must be at least 6 characters long');
    }

    console.log('✅ Input validation passed');

    // Create user with Firebase Auth
    console.log('🔥 Calling createUserWithEmailAndPassword with:', email, '[password]');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Firebase user created successfully:', user.uid);

    // Update user profile in Firebase Auth
    const displayName = userData.displayName || userData.name || `${userData.firstName} ${userData.lastName}`;
    await updateProfile(user, {
      displayName: displayName
    });

    console.log('✅ Firebase profile updated');

    // Create user document in Firestore
    const userDoc = {
      id: user.uid,
      email: user.email,
      displayName: displayName,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'klient',
      postalCode: userData.postalCode || '',
      
      // Additional profile fields
      phoneNumber: '',
      profileImage: '',
      isVerified: false,
      
      // Location data
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
      lastLogin: serverTimestamp()
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', user.uid), userDoc);

    console.log('✅ User document created in Firestore');

    return {
      user,
      userDoc
    };

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
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

// Login user
export const loginUser = async (email, password) => {
  console.log('=== LOGIN USER CALLED ===');
  console.log('Email:', email);
  console.log('Password provided:', !!password);
  
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User signed in successfully:', user.uid);

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.warn('User document not found, creating basic profile');
      
      // Create basic user document if it doesn't exist
      const basicUserDoc = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        role: 'klient',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), basicUserDoc);
      
      return {
        user,
        userDoc: basicUserDoc
      };
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
    console.error('❌ Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address. Please check your email or register for a new account.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed login attempts. Please wait a moment and try again.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        break;
      default:
        if (error.message && !error.code) {
          errorMessage = error.message;
        }
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
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
    
    // Also update Firebase Auth profile if display name changed
    if (updates.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
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