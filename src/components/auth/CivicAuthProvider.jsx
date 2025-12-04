// src/components/auth/CivicAuthProvider.jsx
// Simplified Civic Auth Provider - no Firestore operations (handled by AuthContext)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CivicAuthProvider as RealCivicAuthProvider, useUser } from '@civic/auth/react';

// Context for bridging Civic Auth with your existing auth system
const BridgeAuthContext = createContext(null);

// Bridge component that connects Civic Auth to your Firebase/existing auth system
function CivicAuthBridge({ children }) {
  const { user: civicUser, signIn, signOut, isLoading, error, authStatus } = useUser();
  const [bridgedUser, setBridgedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convert Civic user to Firebase-compatible format (no Firestore operations)
  const createFirebaseCompatibleUser = (civicUser) => {
    if (!civicUser) return null;
    
    return {
      uid: civicUser.id,
      email: civicUser.email || '',
      displayName: civicUser.name || `${civicUser.given_name || ''} ${civicUser.family_name || ''}`.trim(),
      photoURL: civicUser.picture || null,
      emailVerified: !!civicUser.email,
      phoneNumber: '',
      isAnonymous: false,
      metadata: {
        creationTime: civicUser.updated_at || new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [{
        providerId: 'civic',
        uid: civicUser.id,
        email: civicUser.email || '',
        displayName: civicUser.name || '',
        photoURL: civicUser.picture || null
      }],
      civicData: {
        ...civicUser,
        provider: 'civic_real_react',
        integratedAt: new Date().toISOString()
      }
    };
  };

  // Handle Civic auth state changes (no Firestore operations - AuthContext handles that)
  useEffect(() => {
    console.log('🔄 Civic auth state changed:', { 
      user: civicUser?.email || 'none', 
      authStatus, 
      isLoading 
    });

    if (civicUser) {
      // User logged in with Civic - just create compatible user object
      const firebaseUser = createFirebaseCompatibleUser(civicUser);
      setBridgedUser(firebaseUser);
      console.log('✅ Civic sign in successful');
      
      // Note: Firestore operations are handled by AuthContext to prevent duplicates
      
    } else if (!isLoading) {
      // User logged out or not authenticated
      setBridgedUser(null);
    }

    setLoading(isLoading);
  }, [civicUser?.email, authStatus, isLoading]); // Depend on email to reduce triggers

  const value = {
    // Firebase-compatible auth state
    currentUser: bridgedUser,
    userProfile: null, // Will be loaded by your existing AuthContext
    loading,
    error,
    
    // Civic-specific methods
    civicSignIn: signIn,
    civicSignOut: signOut,
    civicUser,
    authStatus,
    
    // Firebase-compatible methods
    signOut: async () => {
      await signOut();
      setBridgedUser(null);
    }
  };

  return (
    <BridgeAuthContext.Provider value={value}>
      {children}
    </BridgeAuthContext.Provider>
  );
}

// Hook to use the bridged auth
export const useBridgedAuth = () => {
  const context = useContext(BridgeAuthContext);
  if (!context) {
    throw new Error('useBridgedAuth must be used within CivicAuthProvider');
  }
  return context;
};

// Main provider component that wraps everything
const CivicAuthProvider = ({ children }) => {
  const clientId = 'b2c9fa1e-d978-4e3d-9a3d-4a36d2ef49e6';
  
  console.log('🚀 Initializing REAL Civic Auth Provider with client ID:', clientId);

  return (
    <RealCivicAuthProvider 
      clientId={clientId}
      onSignIn={(error) => {
        if (error) {
          console.error('❌ Civic sign in error:', error);
        } else {
          console.log('✅ Civic sign in successful');
        }
      }}
      onSignOut={() => {
        console.log('✅ Civic sign out successful');
      }}
    >
      <CivicAuthBridge>
        {children}
      </CivicAuthBridge>
    </RealCivicAuthProvider>
  );
};

export default CivicAuthProvider;