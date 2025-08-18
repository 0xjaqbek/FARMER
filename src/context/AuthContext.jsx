// src/context/AuthContext.jsx - Updated to work with Civic Auth
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
  const [civicAuthEnabled, setCivicAuthEnabled] = useState(false); // Control when to use Civic auth

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
          // Convert Firestore timestamps to Date objects
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

  // Handle Firebase auth state changes
  useEffect(() => {
    console.log('Setting up Firebase auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'signed out');
      
      if (firebaseUser && !civicAuth.user) {
        // Firebase user is authenticated and no Civic user
        setUser(firebaseUser);
        setAuthProvider('firebase');
        
        // Get user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        
        console.log('Firebase user authenticated:', firebaseUser.email);
      } else if (!firebaseUser && !civicAuth.user) {
        // No user authenticated in either system
        setUser(null);
        setUserProfile(null);
        setAuthProvider(null);
        console.log('No user authenticated');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [civicAuth.user]);

  // Handle Civic auth state changes
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
        return; // Don't do anything while loading
      }

      // Only process Civic auth if it's been explicitly enabled
      if (civicAuth.user && civicAuthEnabled) {
        console.log('👤 Civic user authenticated:', civicAuth.user.email);
        
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
            console.log('⚠️ No profile found for Civic user, creating basic profile');
            setUserProfile({
              uid: civicUserId,
              email: civicAuth.user.email,
              displayName: civicAuth.user.name,
              role: 'customer', // Default role
              provider: 'civic'
            });
          }
        } catch (error) {
          console.error('❌ Error loading Civic user profile:', error);
          // Still set a basic profile so user isn't stuck
          setUserProfile({
            uid: civicUserId,
            email: civicAuth.user.email,
            displayName: civicAuth.user.name,
            role: 'customer',
            provider: 'civic'
          });
        }
        
        setLoading(false);
      } else if (!auth.currentUser && !civicAuth.isLoading && !civicAuth.user) {
        // No Civic user, no Firebase user, and not loading
        console.log('🚫 No user authenticated');
        setUser(null);
        setUserProfile(null);
        setAuthProvider(null);
        setLoading(false);
      } else if (!civicAuthEnabled && !auth.currentUser) {
        // Civic auth is disabled and no Firebase user
        setLoading(false);
      }
    };

    handleCivicAuth();
  }, [civicAuth.user, civicAuth.isLoading, civicAuthEnabled]);

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    const hasUser = user !== null;
    const hasProfile = userProfile !== null;
    console.log('🔍 Auth check:', { hasUser, hasProfile, loading, authProvider });
    return hasUser; // User is authenticated if we have a user object
  };

  // Function to get current user
  const getCurrentUser = () => {
    return user;
  };

  // Function to enable Civic auth (called when user clicks Civic login)
  const enableCivicAuth = () => {
    console.log('🔓 Enabling Civic authentication');
    setCivicAuthEnabled(true);
  };

  // Function to sign out
  const signOut = async () => {
    try {
      console.log('🔄 Signing out from current provider:', authProvider);
      
      if (authProvider === 'firebase') {
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        await firebaseSignOut(auth);
      } else if (authProvider === 'civic') {
        await civicAuth.signOut();
        setCivicAuthEnabled(false); // Disable Civic auth after sign out
      }
      
      setUser(null);
      setUserProfile(null);
      setAuthProvider(null);
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // Debug function
  const getDebugInfo = () => {
    return {
      user: user ? { uid: user.uid, email: user.email, provider: user.provider } : null,
      userProfile: userProfile ? { uid: userProfile.uid, role: userProfile.role } : null,
      authProvider,
      civicUser: civicAuth.user ? { id: civicAuth.user.id, email: civicAuth.user.email } : null,
      civicLoading: civicAuth.isLoading,
      firebaseUser: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null,
      loading,
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
    
    // Functions
    getCurrentUser,
    signOut,
    enableCivicAuth, // New function to enable Civic auth
    
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