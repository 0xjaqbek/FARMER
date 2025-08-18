// src/pages/auth/CivicCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { civicAuthService } from '../../civic/auth';

export const CivicCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Handling Civic callback...');
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        console.log('Callback params:', { code: !!code, state: !!state });

        if (!code) {
          throw new Error('No authorization code received from Civic');
        }

        // The Civic SDK should handle the callback automatically
        // We just need to check if authentication was successful
        setStatus('checking');
        
        // Wait a moment for the SDK to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we now have a user
        const user = civicAuthService.getCurrentUser();
        console.log('User after callback:', user);
        
        if (user) {
          console.log('✅ Civic authentication successful');
          setStatus('success');
          
          // Sync with Firebase
          try {
            await civicAuthService.syncWithFirebase();
            console.log('✅ User synced with Firebase');
          } catch (syncError) {
            console.warn('⚠️ Sync warning:', syncError);
            // Don't fail for sync errors
          }
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          throw new Error('Authentication completed but no user data available');
        }
      } catch (error) {
        console.error('❌ Civic callback error:', error);
        setStatus('error');
        setError(error.message);
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login?error=civic_auth_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Authentication
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your sign-in...
              </p>
            </>
          )}
          
          {status === 'checking' && (
            <>
              <div className="animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Account
              </h2>
              <p className="text-gray-600">
                Confirming your identity and setting up your account...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                Welcome!
              </h2>
              <p className="text-gray-600">
                Authentication successful. Redirecting to your dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Something went wrong during authentication.'}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};