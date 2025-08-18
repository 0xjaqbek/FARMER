import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../firebase/auth.jsx';
import { useAuth } from '../../context/AuthContext'; // Use the updated AuthContext
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authProvider, setAuthProvider] = useState(null);
  const navigate = useNavigate();
  
  const { isAuthenticated, civicAuth, authProvider: currentAuthProvider, enableCivicAuth } = useAuth();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      console.log('🔍 LoginForm auth check:', { 
        authenticated, 
        loading, 
        authProvider: currentAuthProvider,
        user: !!civicAuth?.user 
      });
      
      if (authenticated && !loading) {
        console.log('✅ User is authenticated, redirecting to dashboard...');
        navigate('/dashboard');
      }
    };

    // Add a small delay to ensure auth state has settled
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, loading, navigate, currentAuthProvider, civicAuth?.user]);

  // Handle Firebase email/password login
  const handleFirebaseLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setAuthProvider('firebase');
      console.log('Firebase login form submitted with:', { email });
      
      // Try to sign out from Civic first if authenticated there
      try {
        if (civicAuth.user) {
          await civicAuth.signOut();
          console.log('Signed out from Civic before Firebase login');
        }
      } catch {
        console.log('No Civic session to sign out from');
      }
      
      // Firebase login
      const user = await loginUser(email, password);
      console.log('Firebase login successful, user:', user.uid);
      
      // Navigation will be handled by useEffect when isAuthenticated becomes true
      
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
      setLoading(false);
      setAuthProvider(null);
    }
  };

  // Handle Civic login
  const handleCivicLogin = async () => {
    try {
      setLoading(true);
      setError('');
      setAuthProvider('civic');
      console.log('🔘 User clicked Civic login - enabling Civic auth');

      // Check if Civic Auth is available and ready
      if (!civicAuth || civicAuth.isLoading) {
        setError('Civic Auth is still loading. Please wait a moment and try again.');
        return;
      }

      if (!civicAuth.signIn) {
        setError('Civic Auth is not properly initialized. Please refresh the page and try again.');
        return;
      }

      // Try to sign out from Firebase first if authenticated there
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../../firebase/config');
        if (auth.currentUser) {
          await signOut(auth);
          console.log('Signed out from Firebase before Civic login');
        }
      } catch  {
        console.log('No Firebase session to sign out from');
      }

      // Enable Civic auth first
      enableCivicAuth();

      // Start Civic authentication
      console.log('🔐 Starting Civic signIn...');
      await civicAuth.signIn();
      
      // The AuthContext will handle setting the user and navigation will happen via useEffect
      console.log('✅ Civic login initiated successfully');
      
    } catch (error) {
      console.error('Civic login error:', error);
      
      // Handle Civic-specific errors
      if (error.message?.includes('Auth not initialized')) {
        setError('Civic Auth is not ready. Please refresh the page and try again.');
      } else if (error.message?.includes('User cancelled')) {
        setError('Login was cancelled');
      } else if (error.message?.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else if (error.message?.includes('Invalid client')) {
        setError('Authentication service configuration error. Please contact support.');
      } else {
        setError('Civic login failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setAuthProvider(null);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Choose your preferred sign-in method
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Civic Auth Login Button */}
        <div className="mb-6">
          <Button 
            onClick={handleCivicLogin}
            variant="outline"
            className="w-full h-12"
            disabled={loading || civicAuth?.isLoading || !civicAuth?.signIn}
          >
            {loading && authProvider === 'civic' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                Authenticating with Civic...
              </div>
            ) : civicAuth?.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                Loading Civic Auth...
              </div>
            ) : !civicAuth?.signIn ? (
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5 opacity-50" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 2L2 7V12C2 16.55 4.84 20.74 9 21.8C10.63 22.27 13.37 22.27 15 21.8C19.16 20.74 22 16.55 22 12V7L12 2Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                Civic Auth Not Ready
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 2L2 7V12C2 16.55 4.84 20.74 9 21.8C10.63 22.27 13.37 22.27 15 21.8C19.16 20.74 22 16.55 22 12V7L12 2Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                Login with Civic
              </div>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            {civicAuth?.isLoading ? 
              'Initializing secure authentication...' : 
              !civicAuth?.signIn ? 
                'Civic Auth is loading...' :
                'Fast, secure authentication with identity verification'
            }
          </p>
        </div>

        {/* Separator */}
        <div className="relative my-6">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white px-2 text-sm text-gray-500">OR</span>
          </div>
        </div>
        
        {/* Firebase Email/Password Login Form */}
        <form onSubmit={handleFirebaseLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading && authProvider === 'firebase' 
              ? 'Logging in...' 
              : 'Login with Email'
            }
          </Button>
        </form>

        {/* Additional Login Options */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <a 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 Your data is protected with enterprise-grade security. 
            Both authentication methods use industry-standard encryption.
          </p>
        </div>

        {/* Debug info for development */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p>Debug - Auth Provider: {currentAuthProvider || 'none'}</p>
            <p>Debug - Is Authenticated: {isAuthenticated() ? 'Yes' : 'No'}</p>
            <p>Debug - Civic User: {civicAuth?.user ? 'Yes' : 'No'}</p>
            <p>Debug - Civic Loading: {civicAuth?.isLoading ? 'Yes' : 'No'}</p>
            <p>Debug - Civic SignIn Available: {civicAuth?.signIn ? 'Yes' : 'No'}</p>
            <p>Debug - Civic Error: {civicAuth?.error?.message || 'None'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginForm;