// src/pages/CivicLogin.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import CivicLoginForm from '../components/auth/CivicLoginForm';
import { Loader2 } from 'lucide-react';

const CivicLogin = () => {
  const { loading } = useAuth();

  // Don't handle redirect here - let CivicLoginForm handle it
  // This prevents duplicate redirect logic

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CivicLoginForm />
      </div>
    </div>
  );
};

export default CivicLogin;