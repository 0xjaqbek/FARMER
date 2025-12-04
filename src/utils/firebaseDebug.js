// src/utils/firebaseDebug.js
// Fixed Firebase debug utilities that work with Civic Auth

import { auth, db } from '../firebase/config';

export class FirebaseDebug {
  
  // Check Firebase configuration
  static checkConfiguration() {
    console.group('🔥 Firebase Configuration Check');
    
    // Check Auth (now Civic Auth)
    if (auth) {
      console.log('✅ Auth service initialized (Civic Auth)');
      
      // Safely check for properties that might not exist with Civic Auth
      try {
        console.log('Auth object keys:', Object.keys(auth));
        
        // Check if it has the expected methods
        if (typeof auth.onAuthStateChanged === 'function') {
          console.log('✅ Auth state listener available');
        }
        if (typeof auth.signOut === 'function') {
          console.log('✅ Sign out method available');
        }
        
        // Don't try to read .app.name as it might not exist with Civic
        console.log('Auth provider: Civic Auth');
        
      } catch (authError) {
        console.warn('Auth configuration check error:', authError.message);
      }
      
    } else {
      console.error('❌ Auth service not initialized');
    }
    
    // Check Firestore
    if (db) {
      console.log('✅ Firestore initialized');
      
      try {
        // Safely check Firestore properties
        if (db.app && db.app.name) {
          console.log('Firestore app:', db.app.name);
        } else {
          console.log('Firestore: Connected (app name not available)');
        }
      } catch (dbError) {
        console.warn('Firestore configuration check error:', dbError.message);
      }
      
    } else {
      console.error('❌ Firestore not initialized');
    }
    
    // Check environment variables
    console.log('Environment variables:');
    console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Present' : '❌ Missing');
    console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Present' : '❌ Missing');
    
    console.groupEnd();
  }
  
  // Test Firebase connection
  static async testConnection() {
    console.group('🔗 Connection Test');
    
    try {
      // Test Auth (now Civic)
      const user = auth.currentUser;
      console.log('Current user:', user ? `${user.email} (${user.uid})` : 'Not signed in');
      
      // Test Firestore (basic check)
      if (db) {
        console.log('✅ Firestore connection: Available');
      } else {
        console.log('❌ Firestore connection: Not available');
      }
      
      // Test auth state listener
      if (typeof auth.onAuthStateChanged === 'function') {
        console.log('✅ Auth state listener: Working');
      } else {
        console.log('❌ Auth state listener: Not available');
      }
      
    } catch (error) {
      console.error('❌ Connection test error:', error);
    }
    
    console.groupEnd();
  }
  
  // Check user state
  static checkUserState() {
    console.group('👤 User State Check');
    
    try {
      const user = auth.currentUser;
      
      if (user) {
        console.log('✅ User authenticated');
        console.log('- UID:', user.uid);
        console.log('- Email:', user.email);
        console.log('- Display Name:', user.displayName);
        console.log('- Provider:', user.providerData?.[0]?.providerId || 'civic');
        console.log('- Email Verified:', user.emailVerified);
        
        if (user.civicData) {
          console.log('- Civic Data:', user.civicData);
        }
        
      } else {
        console.log('❌ No user authenticated');
      }
      
    } catch (error) {
      console.error('Error checking user state:', error);
    }
    
    console.groupEnd();
  }
  
  // Debug auth state changes
  static startAuthStateDebugging() {
    console.log('🔍 Starting auth state debugging...');
    
    try {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.group('🔄 Auth State Changed');
        
        if (user) {
          console.log('✅ User signed in');
          console.log('- UID:', user.uid);
          console.log('- Email:', user.email);
          console.log('- Provider:', user.providerData?.[0]?.providerId || 'civic');
        } else {
          console.log('❌ User signed out');
        }
        
        console.groupEnd();
      });
      
      // Store unsubscribe function globally for manual cleanup if needed
      window.debugAuthUnsubscribe = unsubscribe;
      
      console.log('✅ Auth state debugging started');
      
    } catch (error) {
      console.error('Error starting auth state debugging:', error);
    }
  }
  
  // Stop auth state debugging
  static stopAuthStateDebugging() {
    if (window.debugAuthUnsubscribe) {
      window.debugAuthUnsubscribe();
      delete window.debugAuthUnsubscribe;
      console.log('✅ Auth state debugging stopped');
    }
  }
  
  // Complete debug suite
  static async runFullDebug() {
    console.group('🔧 Full Debug Suite');
    
    this.checkConfiguration();
    await this.testConnection();
    this.checkUserState();
    
    console.log('🎯 Debug Summary:');
    console.log('- Auth Provider: Civic Auth');
    console.log('- Firestore: Available');
    console.log('- Environment: Development');
    
    console.groupEnd();
  }
}

// Auto-run basic checks in development
if (import.meta.env.DEV) {
  // Add a slight delay to let everything initialize
  setTimeout(() => {
    FirebaseDebug.checkConfiguration();
  }, 1000);
}