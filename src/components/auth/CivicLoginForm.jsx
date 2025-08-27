// src/components/auth/CivicLoginForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { civicAuthService } from '../../services/civicAuthService';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await civicAuthService.isAuthenticated();
        if (auth) {
          setIsAuthenticated(true);
          // Redirect to dashboard or intended page
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [navigate, location]);
  
  const handleCivicLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Starting Civic authentication...');
      
      // Civic Auth handles the entire authentication flow
      const result = await civicAuthService.loginUser();
      console.log('Civic login successful:', result);
      
      // Navigate to dashboard or intended page
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
      
    } catch (error) {
      console.error('Civic login error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Already Logged In</h3>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Farm Direct
          </CardTitle>
          <p className="text-center text-gray-600">
            Sign in to access your account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Civic Auth Button */}
          <Button 
            onClick={handleCivicLogin}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sign in with Civic Auth
              </div>
            )}
          </Button>

          <Separator className="my-6" />

          {/* Login Options Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-center text-gray-700">
              Choose your preferred sign-in method:
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Email</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <Chrome className="w-4 h-4 text-red-600" />
                <span className="text-sm">Google</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Wallet</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <Github className="w-4 h-4 text-gray-800" />
                <span className="text-sm">GitHub</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Don't have a wallet? We'll create one for you automatically!
              </p>
            </div>
          </div>

          <Separator />

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              New to Farm Direct?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900">Secure & Private</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your login is protected by advanced encryption and blockchain security.
                Choose any sign-in method you prefer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CivicLoginForm;