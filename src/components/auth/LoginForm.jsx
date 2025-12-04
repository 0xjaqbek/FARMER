// src/components/auth/LoginForm.jsx
// Updated LoginForm that uses Civic Auth instead of email/password

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithCivic } = useAuth();

  const handleCivicLogin = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Starting Civic Auth login...');
      const result = await signInWithCivic();
      
      console.log('✅ Login successful:', result.user.uid);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (error.message.includes('cancelled') || error.message.includes('declined')) {
        setError('Login was cancelled. Please try again when ready.');
      } else if (error.message.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-gray-600">
          Sign in securely with Civic Auth
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Civic Auth Benefits */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex items-center gap-2 text-blue-800">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Secure Identity Verification</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span>No passwords to remember</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span>Protected by blockchain technology</span>
          </div>
        </div>

        {/* Civic Auth Login Button */}
        <Button 
          onClick={handleCivicLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Civic...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Sign in with Civic Auth
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Information */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            New to Farm Direct?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium">
              Create an account
            </a>
          </p>
          <p>
            By signing in, you agree to use Civic's secure identity verification.
          </p>
        </div>

        {/* How it works */}
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-900">
            How does Civic Auth work?
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            <p>• Civic Auth uses blockchain-based identity verification</p>
            <p>• Your identity is verified once and reused securely</p>
            <p>• No passwords needed - your identity is your key</p>
            <p>• All data is encrypted and decentralized</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default LoginForm;