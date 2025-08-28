// src/components/auth/CivicLoginForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@civic/auth/react'; // Use the actual Civic Auth hook
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
  // Use the actual Civic Auth React hook instead of service
  const { user, signIn, signOut, isLoading, error: civicError } = useUser();
  const [error, setError] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already authenticated and redirect (only once)
  useEffect(() => {
    if (user && !isLoading && !hasRedirected) {
      console.log('✅ User authenticated, redirecting...');
      setHasRedirected(true);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, isLoading, hasRedirected, navigate, location.state?.from?.pathname]);

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
      
      // Use the signIn method from the useUser hook
      await signIn();
      
      // The useEffect above will handle navigation after successful auth
      
    } catch (error) {
      console.error('Civic login error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleCivicLogout = async () => {
    try {
      setError('');
      await signOut();
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error('Civic logout error:', error);
      setError(error.message || 'Sign out failed. Please try again.');
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
  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back!
          </CardTitle>
          <div className="flex items-center justify-center mt-4">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Authenticated as {user.email}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={handleCivicLogout}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show login form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Welcome to Farm Direct
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Connect directly with local farmers and fresh produce
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Civic Login Button */}
        <Button
          onClick={handleCivicLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Sign in with Civic
            </>
          )}
        </Button>

        <div className="text-center">
          <Separator className="my-4" />
          <p className="text-xs text-gray-500 mb-4">
            Sign in securely with Civic's identity verification
          </p>
        </div>

        {/* Features showcase */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-blue-500" />
            <span>Secure identity verification</span>
          </div>
          <div className="flex items-center">
            <Wallet className="w-4 h-4 mr-2 text-green-500" />
            <span>Crypto wallet integration</span>
          </div>
          <div className="flex items-center">
            <Smartphone className="w-4 h-4 mr-2 text-purple-500" />
            <span>Mobile-first experience</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CivicLoginForm;