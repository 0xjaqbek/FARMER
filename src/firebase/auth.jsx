// src/firebase/auth.jsx - Enhanced version that saves ALL user data
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

// Enhanced registerUser function that saves complete profile data
export const registerUser = async (email, password, userData) => {
  console.log('=== ENHANCED REGISTRATION STARTED ===');
  console.log('Email:', email);
  console.log('Password provided:', !!password);
  console.log('Complete user data:', userData);
  
  try {
    // Validate inputs
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long');
    if (!userData.firstName) throw new Error('First name is required');
    if (!userData.lastName) throw new Error('Last name is required');
    if (!userData.role) throw new Error('Role is required');

    console.log('✅ Input validation passed');

    // Create user with Firebase Auth
    console.log('🔥 Creating user with Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User created successfully in Firebase Auth:', user.uid);
    
    // Update display name in Firebase Auth
    const displayName = userData.displayName || `${userData.firstName} ${userData.lastName}`;
    await updateProfile(user, {
      displayName: displayName
    });
    console.log('✅ Display name updated to:', displayName);
    
    // Create comprehensive user profile document
    const userProfile = {
      // === BASIC INFORMATION ===
      uid: user.uid,
      id: user.uid, // For compatibility
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: displayName,
      role: userData.role, // 'klient' or 'rolnik'
      
      // === CONTACT INFORMATION ===
      phone: userData.phone || '',
      bio: userData.bio || '',
      profileImage: '',
      
      // === ADDRESS INFORMATION ===
      address: {
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        postalCode: userData.address?.postalCode || '',
        country: userData.address?.country || 'Poland'
      },
      
      // === LOCATION DATA (Enhanced) ===
      location: {
        coordinates: { lat: 0, lng: 0 },
        geoHash: '',
        region: userData.address?.state || '',
        deliveryAddresses: []
      },
      
      // === NOTIFICATION PREFERENCES ===
      notificationPreferences: {
        email: {
          orderUpdates: userData.notificationPreferences?.email?.orderUpdates ?? true,
          newMessages: userData.notificationPreferences?.email?.newMessages ?? true,
          lowStock: userData.notificationPreferences?.email?.lowStock ?? (userData.role === 'rolnik'),
          reviews: userData.notificationPreferences?.email?.reviews ?? true,
          marketing: userData.notificationPreferences?.email?.marketing ?? false,
          newsletters: userData.notificationPreferences?.email?.newsletters ?? false
        },
        sms: {
          orderUpdates: userData.notificationPreferences?.sms?.orderUpdates ?? false,
          newMessages: userData.notificationPreferences?.sms?.newMessages ?? false,
          lowStock: userData.notificationPreferences?.sms?.lowStock ?? false,
          reviews: userData.notificationPreferences?.sms?.reviews ?? false
        },
        inApp: {
          orderUpdates: userData.notificationPreferences?.inApp?.orderUpdates ?? true,
          newMessages: userData.notificationPreferences?.inApp?.newMessages ?? true,
          lowStock: userData.notificationPreferences?.inApp?.lowStock ?? true,
          reviews: userData.notificationPreferences?.inApp?.reviews ?? true,
          marketing: userData.notificationPreferences?.inApp?.marketing ?? true
        }
      },
      
      // === PRIVACY SETTINGS ===
      privacy: {
        profilePublic: userData.privacy?.profilePublic ?? true,
        showContactInfo: userData.privacy?.showContactInfo ?? false,
        allowMessaging: userData.privacy?.allowMessaging ?? true,
        shareLocation: userData.privacy?.shareLocation ?? false
      },
      
      // === ACCOUNT STATUS ===
      isVerified: false,
      profileComplete: userData.profileComplete ?? true,
      isPublic: userData.privacy?.profilePublic ?? true,
      acceptsOrders: userData.role === 'rolnik' ? true : false,
      
      // === ROLE-SPECIFIC DATA ===
      ...(userData.role === 'rolnik' ? {
        // === FARMER-SPECIFIC INFORMATION ===
        farmInfo: {
          farmName: userData.farmInfo?.farmName || '',
          description: userData.farmInfo?.description || '',
          established: userData.farmInfo?.established || null,
          farmSize: userData.farmInfo?.farmSize || '',
          farmingMethods: userData.farmInfo?.farmingMethods || [],
          specialties: userData.farmInfo?.specialties || [],
          certifications: userData.farmInfo?.certifications || [],
          website: userData.farmInfo?.website || '',
          socialMedia: {
            facebook: userData.farmInfo?.socialMedia?.facebook || '',
            instagram: userData.farmInfo?.socialMedia?.instagram || '',
            twitter: userData.farmInfo?.socialMedia?.twitter || ''
          },
          deliveryOptions: {
            deliveryAvailable: userData.farmInfo?.deliveryOptions?.deliveryAvailable ?? false,
            deliveryRadius: userData.farmInfo?.deliveryOptions?.deliveryRadius ?? 10,
            pickupAvailable: userData.farmInfo?.deliveryOptions?.pickupAvailable ?? true,
            deliveryFee: userData.farmInfo?.deliveryOptions?.deliveryFee ?? 0
          },
          businessInfo: {
            registrationNumber: userData.farmInfo?.businessInfo?.registrationNumber || '',
            taxId: userData.farmInfo?.businessInfo?.taxId || '',
            insurance: userData.farmInfo?.businessInfo?.insurance ?? false
          }
        },
        
        // === FARMER STATISTICS ===
        farmerStats: {
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalReviews: 0,
          joinedDate: serverTimestamp()
        }
      } : {
        // === CUSTOMER-SPECIFIC INFORMATION ===
        customerInfo: {
          dietaryRestrictions: userData.customerInfo?.dietaryRestrictions || [],
          allergies: userData.customerInfo?.allergies || '',
          preferredCategories: userData.customerInfo?.preferredCategories || [],
          budgetRange: userData.customerInfo?.budgetRange || '',
          orderFrequency: userData.customerInfo?.orderFrequency || '',
          deliveryPreferences: {
            preferredDays: userData.customerInfo?.deliveryPreferences?.preferredDays || [],
            preferredTimes: userData.customerInfo?.deliveryPreferences?.preferredTimes || '',
            specialInstructions: userData.customerInfo?.deliveryPreferences?.specialInstructions || ''
          }
        },
        
        // === CUSTOMER STATISTICS ===
        customerStats: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          favoriteCategories: [],
          joinedDate: serverTimestamp()
        }
      }),
      
      // === SOCIAL MEDIA (General) ===
      socialMedia: {
        facebook: userData.farmInfo?.socialMedia?.facebook || '',
        instagram: userData.farmInfo?.socialMedia?.instagram || '',
        twitter: userData.farmInfo?.socialMedia?.twitter || '',
        website: userData.farmInfo?.website || ''
      },
      
      // === TIMESTAMPS ===
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      verificationDate: null,
      
      // === REGISTRATION TRACKING ===
      registrationStep: userData.registrationStep || 'completed',
      registrationMethod: 'form',
      registrationVersion: '2.0' // Track which registration version was used
    };
    
    console.log('💾 Saving comprehensive user profile to Firestore...');
    console.log('Profile size:', JSON.stringify(userProfile).length, 'characters');
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ Complete user profile created in Firestore successfully');
      
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
      throw new Error('Failed to save user profile. Please try again.');
    }
    
    console.log('🎉 Enhanced registration completed successfully!');
    return {
      user,
      userProfile
    };
    
  } catch (error) {
    console.error('❌ Enhanced registration error:', error.code, error.message);
    
    // Clean up Auth user if Firestore save failed
    if (auth.currentUser && error.message.includes('save user profile')) {
      try {
        await auth.currentUser.delete();
        console.log('🧹 Cleaned up Auth user after Firestore failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup Auth user:', cleanupError);
      }
    }
    
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

// Enhanced getUserProfile function to handle new data structure
export const getUserProfile = async (uid) => {
  try {
    console.log('Getting enhanced user profile for:', uid);
    
    if (!uid) {
      console.warn('No UID provided to getUserProfile');
      return null;
    }
    
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    console.log('User document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('Enhanced user profile found with keys:', Object.keys(data));
      
      return {
        uid: userDoc.id,
        ...data,
        // Convert Firestore timestamps to Date objects
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        verificationDate: data.verificationDate?.toDate() || null
      };
    } else {
      console.log('No user profile found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error getting enhanced user profile:', error);
    throw error;
  }
};

// Enhanced updateUserProfile function
export const updateUserProfile = async (uid, updates) => {
  try {
    console.log('Updating user profile with enhanced data:', uid, Object.keys(updates));
    
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('Enhanced user profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating enhanced user profile:', error);
    throw error;
  }
};

// Login user (unchanged)
export const loginUser = async (email, password) => {
  console.log('=== LOGIN USER CALLED ===');
  
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User logged in successfully:', userCredential.user.uid);

    // Update last login time
    try {
      await updateUserProfile(userCredential.user.uid, {
        lastLoginAt: serverTimestamp()
      });
    } catch (updateError) {
      console.warn('Could not update last login time:', updateError);
      // Don't fail login for this
    }

    return userCredential.user;
  } catch (error) {
    console.error('❌ Login error:', error.code, error.message);
    
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed login attempts. Please try again later.';
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

// Logout user (unchanged)
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
};

// Send password reset email (unchanged)
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