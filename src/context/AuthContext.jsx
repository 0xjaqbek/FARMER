// src/context/AuthContext.jsx - FIXED VERSION - Prevents redirect loops
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from "@civic/auth/react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState(null); // 'firebase' or 'civic'
  const [civicAuthEnabled, setCivicAuthEnabled] = useState(false);
  const [authStateSettled, setAuthStateSettled] = useState(false); // NEW: Prevent premature decisions

  // Civic Auth hook
  const civicAuth = useUser();

  // Function to get user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      console.log('Getting user profile for:', uid);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User profile found:', Object.keys(data));
        return {
          uid: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        };
      } else {
        console.log('No user profile found in Firestore for:', uid);
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // FIXED: Firebase auth state listener with better coordination
  useEffect(() => {
    console.log('Setting up Firebase auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? 
        firebaseUser.email : 'signed out');
      
      // Wait briefly for Civic auth to settle if it's loading
      if (civicAuth.isLoading) {
        console.log('⏳ Waiting for Civic auth to settle before processing Firebase state...');
        return;
      }

      // PRIORITY: If both Firebase and Civic are authenticated, Civic takes precedence
      if (firebaseUser && civicAuth.user && civicAuthEnabled) {
        console.log('🚫 Both Firebase and Civic users present - Civic takes precedence');
        return; // Let Civic handle the auth state
      }

      // Process Firebase user ONLY if no Civic user is active
      if (firebaseUser && !civicAuth.user) {
        console.log('✅ Processing Firebase user authentication');
        setUser(firebaseUser);
        setAuthProvider('firebase');
        
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        
        console.log('Firebase user authenticated:', firebaseUser.email);
      } else if (!firebaseUser && !civicAuth.user) {
        // Clear everything if no users in either system
        console.log('🔄 Clearing auth state - no users in either system');
        setUser(null);
        setUserProfile(null);
        setAuthProvider(null);
        console.log('No user authenticated');
      }
      
      // Mark auth state as settled
      if (!authStateSettled) {
        setAuthStateSettled(true);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [civicAuth.user, civicAuth.isLoading, civicAuthEnabled, authStateSettled]);

  // FIXED: Civic auth state handler with conflict resolution
  useEffect(() => {
    const handleCivicAuth = async () => {
      console.log('🔄 Civic auth state changed:', { 
        hasUser: !!civicAuth.user, 
        isLoading: civicAuth.isLoading,
        userEmail: civicAuth.user?.email,
        civicAuthEnabled 
      });

      if (civicAuth.isLoading) {
        console.log('⏳ Civic is still loading...');
        return;
      }

      // FIXED: Auto-enable civic auth when user appears (common case for login)
      if (civicAuth.user && !civicAuthEnabled) {
        console.log('🔘 Auto-enabling Civic auth due to user presence');
        setCivicAuthEnabled(true);
      }

      // Process Civic auth if user exists (either enabled or auto-enabled)
      if (civicAuth.user) {
        console.log('👤 Civic user authenticated:', civicAuth.user.email);
        
        // Sign out Firebase user if present to avoid conflicts
        if (auth.currentUser) {
          console.log('🚫 Signing out Firebase user to prevent conflicts');
          try {
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
          } catch (error) {
            console.warn('Warning signing out Firebase user:', error);
          }
        }

        // Set Civic user as the main user
        const civicUserId = `civic_${civicAuth.user.id}`;
        const civicUser = {
          uid: civicUserId,
          email: civicAuth.user.email,
          displayName: civicAuth.user.name,
          photoURL: civicAuth.user.picture,
          provider: 'civic'
        };

        setUser(civicUser);
        setAuthProvider('civic');
        
        // Get user profile from Firestore
        try {
          console.log('📋 Getting user profile for:', civicUserId);
          const profile = await getUserProfile(civicUserId);
          
          if (profile) {
            setUserProfile(profile);
            console.log('✅ Civic user profile loaded:', profile.role);
          } else {
            console.log('⚠️ No profile found for Civic user');
            setUserProfile({
              uid: civicUserId,
              email: civicAuth.user.email,
              displayName: civicAuth.user.name || civicAuth.user.email,
              role: 'customer',
              provider: 'civic',
              profileComplete: false
            });
          }
        } catch (error) {
          console.error('Error loading Civic user profile:', error);
        }

        // Mark auth state as settled
        if (!authStateSettled) {
          setAuthStateSettled(true);
        }
        
        setLoading(false);
      } else if (!civicAuth.user && authProvider === 'civic') {
        // Civic user signed out
        console.log('👤 Civic user signed out');
        setUser(null);
        setUserProfile(null);
        setAuthProvider(null);
        setCivicAuthEnabled(false);
        setLoading(false);
      }
    };

    // Add a small delay to prevent race conditions, but trigger immediately on user change
    const timer = setTimeout(handleCivicAuth, civicAuth.user ? 50 : 100);
    return () => clearTimeout(timer);
  }, [civicAuth.user, civicAuth.isLoading, civicAuthEnabled, authProvider, authStateSettled]);

  // Enable Civic auth (called from login form)
  const enableCivicAuth = () => {
    console.log('🔘 Enabling Civic auth...');
    setCivicAuthEnabled(true);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const hasUser = !!user;
    const hasProfile = !!userProfile;
    const notLoading = !loading;
    const stateSettled = authStateSettled;
    
    return hasUser && hasProfile && notLoading && stateSettled;
  };

  // Get current user regardless of provider
  const getCurrentUser = () => {
    return user;
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      
      if (authProvider === 'firebase') {
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        await firebaseSignOut(auth);
        console.log('Firebase user signed out');
      } else if (authProvider === 'civic') {
        if (civicAuth && civicAuth.signOut) {
          await civicAuth.signOut();
          console.log('Civic user signed out');
        }
      }
      
      // Clear all state
      setUser(null);
      setUserProfile(null);
      setAuthProvider(null);
      setCivicAuthEnabled(false);
      setAuthStateSettled(false);
      
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to inspect current auth state
  const getDebugInfo = () => {
    return {
      user: user ? { uid: user.uid, email: user.email, provider: user.provider } : null,
      userProfile: userProfile ? { uid: userProfile.uid, role: userProfile.role } : null,
      authProvider,
      civicUser: civicAuth.user ? { id: civicAuth.user.id, email: civicAuth.user.email } : null,
      civicLoading: civicAuth.isLoading,
      civicAuthEnabled,
      firebaseUser: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null,
      loading,
      authStateSettled,
      isAuthenticated: isAuthenticated()
    };
  };

  const value = {
    // User state
    user,
    userProfile,
    loading,
    authProvider,
    
    // Authentication status
    isAuthenticated,
    authStateSettled, // NEW: Expose this for components to check
    
    // Functions
    getCurrentUser,
    signOut,
    enableCivicAuth,
    
    // Civic specific
    civicUser: civicAuth.user,
    civicAuth,
    civicAuthEnabled,
    
    // Debug
    getDebugInfo
  };

  // Development debugging
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.authContext = value;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};