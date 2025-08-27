// src/firebase/config.jsx
// Updated Firebase config that uses Civic Auth instead of Firebase Auth

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Import Civic auth service instead of Firebase auth
import { auth } from '../services/civicAuthService';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase Configuration:', {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId,
});

let app, db, storage;

// Initialize Firebase (without Auth)
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  // Initialize Firestore
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  // Initialize Storage
  storage = getStorage(app);
  console.log('Firebase Storage initialized');
  
  console.log('🎯 Using Civic Auth instead of Firebase Auth');
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Export Civic auth as 'auth' for compatibility
export { auth, db, storage };
export default app;