// src/components/auth/CivicRegisterForm.jsx - Updated for Civic Auth React hooks
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@civic/auth/react'; // Use Civic Auth hook directly
import { updateUserProfile } from '../../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Mail, 
  Chrome, 
  Shield, 
  User,
  Briefcase,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sprout,
  ShoppingCart
} from 'lucide-react';

const CivicRegisterForm = () => {
  // Use Civic Auth React hook instead of service
  const { user: civicUser, signIn, isLoading: civicLoading, error: civicError } = useUser();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Form data for additional profile info
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Poland'
    },
    farmInfo: {
      farmName: '',
      farmSize: '',
      certifications: [],
      specialties: []
    },
    termsAccepted: false,
    marketingConsent: false
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { number: 1, title: 'Authentication', description: 'Sign in with Civic' },
    { number: 2, title: 'Account Type', description: 'Choose your role' },
    { number: 3, title: 'Profile Info', description: 'Complete your profile' },
    { number: 4, title: 'Confirmation', description: 'Review and submit' }
  ];

  // Handle Civic user authentication success
  useEffect(() => {
    if (civicUser && !civicLoading) {
      console.log('✅ Civic user authenticated:', civicUser.email);
      
      // Pre-fill form with Civic data
      setFormData(prev => ({
        ...prev,
        firstName: civicUser.given_name || '',
        lastName: civicUser.family_name || '',
      }));
      
      // Move to next step
      setCurrentStep(2);
    }
  }, [civicUser, civicLoading]);

  // Handle Civic errors
  useEffect(() => {
    if (civicError) {
      console.error('Civic Auth Error:', civicError);
      setError(civicError.message || 'Authentication failed. Please try again.');
    }
  }, [civicError]);

  const handleCivicAuth = async () => {
    try {
      setError('');
      console.log('Starting Civic registration...');
      
      // Use the signIn method from the useUser hook
      await signIn();
      
      // The useEffect above will handle moving to the next step
      
    } catch (error) {
      console.error('Civic auth error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 2:
        if (!formData.role) newErrors.role = 'Please select your account type';
        break;
      case 3:
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.address.city) newErrors['address.city'] = 'City is required';
        if (formData.role === 'rolnik' && !formData.farmInfo.farmName) {
          newErrors['farmInfo.farmName'] = 'Farm name is required';
        }
        break;
      case 4:
        if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms of service';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !civicUser) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 Completing registration with profile data...');
      
      // Update user profile in Firestore with additional data
      await updateUserProfile(civicUser.id, {
        ...formData,
        displayName: `${formData.firstName} ${formData.lastName}`,
        profileComplete: true,
        registrationCompleted: true
      });
      
      console.log('✅ Registration complete');
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Registration completion error:', error);
      setError(error.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Create Your Account</h3>
              <p className="text-gray-600">
                Sign in with Civic Auth to get started securely
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCivicAuth}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={civicLoading || loading}
            >
              {(civicLoading || loading) ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sign up with Civic Auth
                </div>
              )}
            </Button>

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
                <span className="text-sm">Crypto Wallet</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm">Passkey</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                New to Web3? Don't worry - we'll set up everything for you automatically!
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Choose Your Account Type</h3>
              <p className="text-gray-600">
                This helps us customize your experience
              </p>
            </div>

            {civicUser && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Authenticated as {civicUser.email}
                  </span>
                </div>
              </div>
            )}

            {errors.role && (
              <Alert variant="destructive">
                <AlertDescription>{errors.role}</AlertDescription>
              </Alert>
            )}

            <RadioGroup
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="klient" id="klient" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="klient" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Customer</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      I want to buy fresh produce directly from local farmers
                    </p>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="rolnik" id="rolnik" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="rolnik" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Sprout className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Farmer</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      I'm a farmer who wants to sell products and run campaigns
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Complete Your Profile</h3>
              <p className="text-gray-600">
                Tell us a bit more about yourself
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Your first name"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Your last name"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Your city"
                  className={errors['address.city'] ? 'border-red-500' : ''}
                />
                {errors['address.city'] && (
                  <p className="text-sm text-red-600 mt-1">{errors['address.city']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  placeholder="Your state"
                />
              </div>
            </div>

            {formData.role === 'rolnik' && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-800">Farm Information</h4>
                
                <div>
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input
                    id="farmName"
                    value={formData.farmInfo.farmName}
                    onChange={(e) => handleInputChange('farmInfo.farmName', e.target.value)}
                    placeholder="Your farm name"
                    className={errors['farmInfo.farmName'] ? 'border-red-500' : ''}
                  />
                  {errors['farmInfo.farmName'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['farmInfo.farmName']}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="farmSize">Farm Size (Optional)</Label>
                  <Input
                    id="farmSize"
                    value={formData.farmInfo.farmSize}
                    onChange={(e) => handleInputChange('farmInfo.farmSize', e.target.value)}
                    placeholder="e.g., 5 hectares"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Review & Confirm</h3>
              <p className="text-gray-600">
                Please review your information and accept our terms
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </div>
              <div>
                <strong>Email:</strong> {civicUser?.email}
              </div>
              <div>
                <strong>Role:</strong> {formData.role === 'rolnik' ? 'Farmer' : 'Customer'}
              </div>
              <div>
                <strong>Location:</strong> {formData.address.city}, {formData.address.state}
              </div>
              {formData.role === 'rolnik' && formData.farmInfo.farmName && (
                <div>
                  <strong>Farm:</strong> {formData.farmInfo.farmName}
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                  className={errors.termsAccepted ? 'border-red-500' : ''}
                />
                <div>
                  <Label htmlFor="terms" className="text-sm">
                    I accept the{' '}
                    <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                      Privacy Policy
                    </a>
                  </Label>
                  {errors.termsAccepted && (
                    <p className="text-sm text-red-600 mt-1">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => handleInputChange('marketingConsent', checked)}
                />
                <Label htmlFor="marketing" className="text-sm text-gray-600">
                  I'd like to receive updates about new features and promotions (optional)
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
        </div>
        
        <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
        
        <div className="flex justify-between text-xs text-gray-500">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`text-center ${
                currentStep >= step.number ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className="font-medium">{step.title}</div>
              <div className="hidden sm:block">{step.description}</div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {renderStepContent()}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              disabled={!civicUser || loading}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !civicUser}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Registration
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CivicRegisterForm;