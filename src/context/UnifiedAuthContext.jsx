// src/context/UnifiedAuthContext.jsx - Updated for React version
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useCivicAuth } from '../hooks/useCivicAuth';

const UnifiedAuthContext = createContext();

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

export const UnifiedAuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState(null);
  
  // Use Civic React hooks
  const civic = useCivicAuth();

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase auth state changed:', user ? user.email : 'signed out');
      setFirebaseUser(user);
      
      if (user && !civic.user) {
        setAuthProvider('firebase');
      } else if (!user && !civic.user) {
        setAuthProvider(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [civic.user]);

  // Update auth provider when Civic user changes
  useEffect(() => {
    if (civic.user && !firebaseUser) {
      setAuthProvider('civic');
    } else if (!civic.user && !firebaseUser) {
      setAuthProvider(null);
    }
  }, [civic.user, firebaseUser]);

  const signInWithFirebase = async (email, password) => {
    const { loginUser } = await import('../firebase/auth');
    try {
      console.log('🔄 Signing in with Firebase...');
      
      // Sign out from Civic if authenticated
      if (civic.user) {
        await civic.signOut();
      }
      
      const user = await loginUser(email, password);
      setAuthProvider('firebase');
      console.log('✅ Firebase login successful');
      return user;
    } catch (error) {
      console.error('❌ Firebase login failed:', error);
      throw error;
    }
  };

  const signInWithCivic = async () => {
    try {
      console.log('🔄 Signing in with Civic...');
      
      // Sign out from Firebase if authenticated
      if (firebaseUser) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
      
      // Use Civic React hook to sign in
      await civic.signIn();
      
      // The user will be available via the hook automatically
      console.log('✅ Civic login initiated');
      return civic.user;
    } catch (error) {
      console.error('❌ Civic login failed:', error);
      throw error;
    }
  };

  const signOutFromFirebase = async () => {
    const { signOut } = await import('firebase/auth');
    try {
      await signOut(auth);
      setFirebaseUser(null);
      if (authProvider === 'firebase') {
        setAuthProvider(null);
      }
    } catch (error) {
      console.error('❌ Firebase sign-out error:', error);
    }
  };

  const signOutFromCivic = async () => {
    try {
      await civic.signOut();
      if (authProvider === 'civic') {
        setAuthProvider(null);
      }
    } catch (error) {
      console.error('❌ Civic sign-out error:', error);
    }
  };

  const signOut = async () => {
    if (authProvider === 'firebase') {
      await signOutFromFirebase();
    } else if (authProvider === 'civic') {
      await signOutFromCivic();
    }
  };

  const getCurrentUser = () => {
    if (authProvider === 'firebase') {
      return firebaseUser;
    } else if (authProvider === 'civic') {
      return civic.user;
    }
    return null;
  };

  const isAuthenticated = () => {
    return getCurrentUser() !== null;
  };

  const value = {
    // Current state
    firebaseUser,
    civicUser: civic.user,
    currentUser: getCurrentUser(),
    authProvider,
    loading: loading || civic.isLoading,
    isAuthenticated: isAuthenticated(),
    civicAvailable: true, // Always available with React provider

    // Authentication methods
    signInWithFirebase,
    signInWithCivic,
    signOut,
    signOutFromFirebase,
    signOutFromCivic,

    // Civic specific
    civicAuthStatus: civic.authStatus,
    civicError: civic.error,

    // Utility methods
    getCurrentUser
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};