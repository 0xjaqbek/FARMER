// src/components/auth/CivicLoginForm.jsx - COMPLETE FIX
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@civic/auth/react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Mail, 
  Chrome, 
  Shield, 
  Smartphone,
  Github,
  Facebook,
  Twitter,
  Loader2,
  CheckCircle
} from 'lucide-react';

const CivicLoginForm = () => {
  const { _user, signIn, isLoading, error: civicError } = useUser();
  const { signOut, currentUser } = useAuth(); // Use AuthContext for signOut and currentUser
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use ref to track if we've already redirected to prevent infinite loops
  const hasRedirectedRef = useRef(false);
  
  // Handle authentication redirect - use AuthContext currentUser instead of Civic user
  useEffect(() => {
    // Only redirect if we have a currentUser from AuthContext (fully processed)
    if (currentUser && !isLoading && !hasRedirectedRef.current) {
      console.log('✅ AuthContext user authenticated, preparing redirect...');
      hasRedirectedRef.current = true;
      
      const from = location.state?.from?.pathname || '/dashboard';
      
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [currentUser?.email, isLoading]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!currentUser) {
      hasRedirectedRef.current = false;
    }
  }, [currentUser]);

  // Handle Civic Auth errors
  useEffect(() => {
    if (civicError) {
      console.error('Civic Auth Error:', civicError);
      setError(civicError.message || 'Authentication failed. Please try again.');
    }
  }, [civicError]);
  
  const handleCivicLogin = async () => {
    try {
      setError('');
      console.log('Starting Civic authentication...');
      
      await signIn();
      // Let the useEffect handle redirect after AuthContext processes the user
      
    } catch (error) {
      console.error('Civic login error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleCivicLogout = async () => {
    try {
      setError('');
      hasRedirectedRef.current = false; // Reset redirect flag
      
      console.log('🚀 Signing out via AuthContext...');
      await signOut(); // Use AuthContext signOut method
      
      console.log('✅ Successfully signed out, redirecting to home...');
      
      // Force immediate redirect to home with window.location to avoid any React state issues
      window.location.href = '/';
      
    } catch (error) {
      console.error('Civic logout error:', error);
      setError(error.message || 'Sign out failed. Please try again.');
      
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </CardContent>
      </Card>
    );
  }

  // If user is already authenticated, show logout option
  if (currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">
              You're signed in as <strong>{currentUser.email}</strong>
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleCivicLogout}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sign In to Farm Direct
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Connect with local farmers and fresh produce
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Civic Auth Login Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleCivicLogin}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-auto"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Sign In with Civic</span>
              </div>
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              Secure, privacy-first authentication powered by Civic
            </p>
          </div>

          <Separator />

          {/* Benefits section */}
          <div className="space-y-4">
            <h3 className="font-medium text-center text-gray-900">
              Why choose Civic Auth?
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">Privacy-first identity verification</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">Secure mobile authentication</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">No passwords to remember</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              New to Farm Direct?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Create an account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional login methods can be added here if needed */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-green-600 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default CivicLoginForm;