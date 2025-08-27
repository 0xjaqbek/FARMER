// src/components/auth/CivicAuthProvider.jsx
import React from 'react';
import { CivicAuthProvider as CivicProvider, UserButton } from '@civic/auth/react';

const CivicAuthWrapper = ({ children }) => {
  const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;

  if (!clientId) {
    console.error('Civic Auth Client ID is not configured. Please set VITE_CIVIC_CLIENT_ID in your .env file');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Configuration Error</h2>
          <p className="text-gray-600">
            Civic Auth is not properly configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CivicProvider 
      clientId={clientId}
      displayMode="modal"
      // Optional configurations
      onLoginSuccess={(user) => {
        console.log('Civic login success:', user);
      }}
      onLoginError={(error) => {
        console.error('Civic login error:', error);
      }}
    >
      {children}
    </CivicProvider>
  );
};

export default CivicAuthWrapper;