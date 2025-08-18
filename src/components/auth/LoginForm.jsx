// src/components/auth/LoginForm.jsx - FINAL FIX FOR REDIRECT LOOP
import React, { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCivicAuth } from '../../hooks/useCivicAuth';

const LoginForm = () => {
  const location = useLocation();
  const { loginUser, isAuthenticated, loading, authProvider: currentAuthProvider, enableCivicAuth } = useAuth();
  const civicAuthHook = useCivicAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authProvider, setAuthProvider] = useState(null);

  // Debug logs - simplified
  console.log('🔍 LoginForm state:', {
    authenticated: isAuthenticated(),
    loading,
    authProvider: currentAuthProvider,
    user: !!civicAuthHook?.user,
    pathname: location.pathname
  });

  // CRITICAL FIX: Use Navigate component instead of useEffect with navigate()
  // This prevents the infinite re-render loop
  if (isAuthenticated() && !loading && location.pathname === '/login') {
    console.log('🔄 User authenticated, using Navigate component to redirect...');
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading if auth state is still being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if we're in the middle of auth callback
  if (location.pathname.includes('/callback')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Processing authentication...</p>
        </div>
      </div>
    );
  }

  // Handle Firebase email/password login
  const handleFirebaseLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setAuthProvider('firebase');
      console.log('Firebase login form submitted with:', { email });
      
      // Try to sign out from Civic first if authenticated there
      try {
        if (civicAuthHook.user) {
          await civicAuthHook.signOut();
          console.log('Signed out from Civic before Firebase login');
        }
      } catch {
        console.log('No Civic session to sign out from');
      }
      
      // Firebase login
      const user = await loginUser(email, password);
      console.log('Firebase login successful, user:', user.uid);
      
      // Don't manually redirect - the component will re-render and Navigate will handle it
      
    } catch (error) {
      console.error('Firebase login error:', error);
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        setError('User not found');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setAuthProvider(null);
    }
  };

  // Handle Civic login
  const handleCivicLogin = async () => {
    // Prevent multiple login attempts
    if (isLoading) {
      console.log('🚫 Login already in progress, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setAuthProvider('civic');
      console.log('🔘 User clicked Civic login - enabling Civic auth');

      // Check if Civic Auth is available and ready
      if (!civicAuthHook || civicAuthHook.isLoading) {
        setError('Civic Auth is still loading. Please wait a moment and try again.');
        return;
      }

      if (!civicAuthHook.signIn) {
        setError('Civic Auth is not properly initialized. Please refresh the page and try again.');
        return;
      }

      // Enable Civic auth before starting authentication
      console.log('🔘 Enabling Civic auth...');
      enableCivicAuth();

      // Brief pause to let state settle
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🔄 Starting Civic authentication...');
      
      // Start Civic authentication
      const result = await civicAuthHook.signIn();
      
      if (result && result.user) {
        console.log('✅ Civic login initiated successfully');
        // Don't manually redirect - the component will re-render and Navigate will handle it
      } else {
        throw new Error('Civic authentication failed - no user data received');
      }
      
    } catch (error) {
      console.error('❌ Civic login error:', error);
      
      // Handle Civic-specific errors
      if (error.message?.includes('cancelled')) {
        setError('Login was cancelled. Please try again.');
      } else if (error.message?.includes('configuration')) {
        setError('Civic authentication is not properly configured. Please contact support.');
      } else if (error.message?.includes('network')) {
        setError('Network error during authentication. Please check your connection and try again.');
      } else {
        setError(`Civic login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setAuthProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleFirebaseLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || authProvider === 'firebase'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && authProvider === 'firebase' ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </span>
              ) : (
                'Sign in with Email'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleCivicLogin}
              disabled={isLoading || authProvider === 'civic'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && authProvider === 'civic' ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting to Civic...
                </span>
              ) : (
                'Sign in with Civic'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;