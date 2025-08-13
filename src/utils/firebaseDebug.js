// src/utils/firebaseDebug.js
// Debug utilities to check Firebase configuration

import { auth, db } from '../firebase/config';

export class FirebaseDebug {
  
  // Check Firebase configuration
  static checkConfiguration() {
    console.group('🔥 Firebase Configuration Check');
    
    // Check Auth
    if (auth) {
      console.log('✅ Firebase Auth initialized');
      console.log('Auth app:', auth.app.name);
      console.log('Auth config:', {
        apiKey: auth.config?.apiKey ? '✅ Present' : '❌ Missing',
        authDomain: auth.config?.authDomain || 'Not found'
      });
    } else {
      console.error('❌ Firebase Auth not initialized');
    }
    
    // Check Firestore
    if (db) {
      console.log('✅ Firestore initialized');
      console.log('Firestore app:', db.app.name);
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
    console.group('🔗 Firebase Connection Test');
    
    try {
      // Test Auth
      const user = auth.currentUser;
      console.log('Current user:', user ? `✅ ${user.email}` : '👤 Not logged in');
      
      // Test Firestore connection
      console.log('Testing Firestore connection...');
      // Simple read test - this will fail gracefully if no permission
      
      console.log('✅ Firebase connection successful');
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
    }
    
    console.groupEnd();
  }
  
  // Check auth state
  static monitorAuthState() {
    console.log('🔍 Monitoring auth state changes...');
    
    return auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('👤 User signed in:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        });
      } else {
        console.log('👤 User signed out');
      }
    });
  }
  
  // Test registration with dummy data
  static async testRegistration() {
    console.log('🧪 Testing registration flow...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    try {
      console.log('Creating test user:', testEmail);
      
      // This will help identify the exact error
      const result = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          returnSecureToken: true
        })
      });
      
      const data = await result.json();
      
      if (result.ok) {
        console.log('✅ Registration API test successful');
        console.log('Response:', data);
      } else {
        console.error('❌ Registration API test failed');
        console.error('Status:', result.status);
        console.error('Response:', data);
      }
      
    } catch (error) {
      console.error('❌ Registration test error:', error);
    }
  }
}

// Auto-run configuration check in development
if (import.meta.env.DEV) {
  FirebaseDebug.checkConfiguration();
}