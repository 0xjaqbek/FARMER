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

// Register new user
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, postalCode, role } = userData;
  
  console.log('Registering user with email:', email);
  console.log('Password length:', password ? password.length : 0);
  
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User created successfully in Firebase Auth:', user.uid);
    
    // Update display name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });
    console.log('Display name updated to:', `${firstName} ${lastName}`);
    
    // Create user profile in Firestore (removed blockchain fields)
    const userProfile = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      postalCode,
      role, // 'customer', 'farmer', or 'admin'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isVerified: false,
      verificationDate: null,
      profileComplete: false,
      lastLoginAt: serverTimestamp()
    };
    
    console.log('Attempting to save user profile to Firestore:', userProfile);
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('User profile created in Firestore successfully');
      
      // Send email verification
      await sendEmailVerification(user);
      console.log('Verification email sent');
      
    } catch (firestoreError) {
      console.error('Failed to create user profile in Firestore:', firestoreError);
      console.error('Firestore error code:', firestoreError.code);
      console.error('Firestore error message:', firestoreError.message);
      // Continue anyway for now, so user can at least log in
    }
    
    return user;
  } catch (error) {
    console.error('Registration error:', error.code, error.message);
    throw error;
  }
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
  CUSTOMER: 'customer',
  FARMER: 'farmer', 
  ADMIN: 'admin'
};