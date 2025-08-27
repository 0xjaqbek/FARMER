// src/components/auth/CivicAuthProvider.jsx
// src/components/auth/CivicAuthProvider.jsx
// Fixed Civic Auth Provider with proper exports

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CivicAuthProvider as RealCivicAuthProvider, useUser } from '@civic/auth/react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Context for bridging Civic Auth with your existing auth system
const BridgeAuthContext = createContext(null);

// Bridge component that connects Civic Auth to your Firebase/existing auth system
function CivicAuthBridge({ children }) {
  const { user: civicUser, signIn, signOut, isLoading, error, authStatus } = useUser();
  const [bridgedUser, setBridgedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convert Civic user to Firebase-compatible format
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

  // Save/update user in Firestore
  const saveUserToFirestore = async (civicUser) => {
    if (!civicUser) return;

    try {
      console.log('💾 Saving REAL Civic user to Firestore:', civicUser);
      
      const userDocRef = doc(db, 'users', civicUser.id);
      const existingDoc = await getDoc(userDocRef);

      const baseUserData = {
        id: civicUser.id,
        email: civicUser.email || '',
        displayName: civicUser.name || `${civicUser.given_name || ''} ${civicUser.family_name || ''}`.trim(),
        authProvider: 'civic_real_react',
        isVerified: true,
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      if (existingDoc.exists()) {
        await setDoc(userDocRef, baseUserData, { merge: true });
        console.log('✅ REAL Civic user updated in Firestore');
      } else {
        const newUserData = {
          ...baseUserData,
          firstName: civicUser.given_name || '',
          lastName: civicUser.family_name || '',
          role: 'klient',
          profileImage: civicUser.picture || '',
          createdAt: serverTimestamp(),

          location: {
            address: '',
            coordinates: { lat: 0, lng: 0 },
            geoHash: '',
            city: '',
            region: '',
            country: '',
            deliveryAddresses: []
          },

          verification: {
            provider: 'civic_real_react',
            civicId: civicUser.id,
            verifiedAt: new Date().toISOString(),
            authStatus: authStatus
          },

          notificationPreferences: {
            email: {
              orderUpdates: true,
              newMessages: true,
              lowStock: false,
              reviews: true,
              marketing: false
            },
            sms: {
              orderUpdates: false,
              newMessages: false,
              lowStock: false,
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

          customerInfo: {
            preferredCategories: [],
            dietaryRestrictions: [],
            averageOrderValue: 0,
            totalOrders: 0
          }
        };

        await setDoc(userDocRef, newUserData);
        console.log('✅ REAL Civic user created in Firestore');
      }
    } catch (error) {
      console.error('❌ Error saving REAL Civic user to Firestore:', error);
    }
  };

  // Handle Civic auth state changes
  useEffect(() => {
    console.log('🔄 Civic auth state changed:', { 
      user: civicUser?.email || 'none', 
      authStatus, 
      isLoading 
    });

    if (civicUser) {
      // User logged in with Civic
      const firebaseUser = createFirebaseCompatibleUser(civicUser);
      setBridgedUser(firebaseUser);
      
      // Save to Firestore
      saveUserToFirestore(civicUser);
      
    } else if (!isLoading) {
      // User logged out or not authenticated
      setBridgedUser(null);
    }

    setLoading(isLoading);
  }, [civicUser, authStatus, isLoading]);

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

// IMPORTANT: Default export to fix the import issue
export default CivicAuthProvider;