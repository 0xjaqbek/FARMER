// src/components/auth/CivicRegisterForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { civicAuthService } from '../../services/civicAuthService';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [civicUser, setCivicUser] = useState(null);
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

  const handleCivicAuth = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Starting Civic registration...');
      
      // First, authenticate with Civic
      const result = await civicAuthService.loginUser();
      console.log('Civic auth successful:', result);
      
      setCivicUser(result.user);
      
      // Pre-fill form with Civic data
      setFormData(prev => ({
        ...prev,
        firstName: result.user.given_name || '',
        lastName: result.user.family_name || '',
      }));
      
      setCurrentStep(2);
      
    } catch (error) {
      console.error('Civic auth error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
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
      
      // Complete registration with additional profile data
      const result = await civicAuthService.registerUser(
        civicUser.email,
        null, // No password needed with Civic
        {
          ...formData,
          displayName: `${formData.firstName} ${formData.lastName}`
        }
      );
      
      console.log('Registration complete:', result);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Registration completion error:', error);
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
                Sign in with your preferred method to get started
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
                Select how you'll use Farm Direct
              </p>
            </div>

            <RadioGroup 
              value={formData.role} 
              onValueChange={(value) => handleInputChange('role', value)}
              className="space-y-4"
            >
              <div className={`border rounded-lg p-4 ${formData.role === 'klient' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="klient" id="klient" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <Label htmlFor="klient" className="font-semibold">Customer</Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Browse and buy fresh products from local farmers. Support farming projects through crowdfunding.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${formData.role === 'rolnik' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="rolnik" id="rolnik" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-green-600" />
                      <Label htmlFor="rolnik" className="font-semibold">Farmer</Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Sell your products directly to customers. Create crowdfunding campaigns for your farming projects.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Complete Your Profile</h3>
              <p className="text-gray-600">
                Tell us more about yourself
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={errors['address.city'] ? 'border-red-500' : ''}
                />
                {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
              </div>
              
              <div>
                <Label htmlFor="state">State/Region</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  placeholder="Pomerania"
                />
              </div>
            </div>

            {formData.role === 'rolnik' && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-800">Farm Information</h4>
                
                <div>
                  <Label htmlFor="farmName">Farm Name *</Label>
                  <Input
                    id="farmName"
                    value={formData.farmInfo.farmName}
                    onChange={(e) => handleInputChange('farmInfo.farmName', e.target.value)}
                    className={errors['farmInfo.farmName'] ? 'border-red-500' : ''}
                  />
                  {errors['farmInfo.farmName'] && <p className="text-red-500 text-sm mt-1">{errors['farmInfo.farmName']}</p>}
                </div>

                <div>
                  <Label htmlFor="farmSize">Farm Size</Label>
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
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder={formData.role === 'rolnik' 
                  ? "Tell customers about your farming practices and values..."
                  : "Tell us about your interest in local food and farming..."
                }
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Review Your Information</h3>
              <p className="text-gray-600">
                Please review your details before creating your account
              </p>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div>
                <h4 className="font-semibold">Account Information</h4>
                <p className="text-sm text-gray-600">
                  {formData.firstName} {formData.lastName} • {civicUser?.email}
                </p>
                <p className="text-sm text-gray-600">
                  Role: {formData.role === 'klient' ? 'Customer' : 'Farmer'}
                </p>
              </div>

              {formData.role === 'rolnik' && formData.farmInfo.farmName && (
                <div>
                  <h4 className="font-semibold">Farm Information</h4>
                  <p className="text-sm text-gray-600">
                    {formData.farmInfo.farmName}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold">Location</h4>
                <p className="text-sm text-gray-600">
                  {formData.address.city}, {formData.address.state}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the{' '}
                  <button className="text-blue-600 hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button className="text-blue-600 hover:underline">
                    Privacy Policy
                  </button>
                </Label>
              </div>
              {errors.termsAccepted && <p className="text-red-500 text-sm">{errors.termsAccepted}</p>}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => handleInputChange('marketingConsent', checked)}
                />
                <Label htmlFor="marketing" className="text-sm">
                  Send me updates about new features and local farming news
                </Label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Join Farm Direct
          </CardTitle>
          
          {/* Progress Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;
                
                return (
                  <div key={step.number} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' :
                      isActive ? 'bg-blue-500 border-blue-500 text-white' :
                      'bg-gray-200 border-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="min-h-96">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          {currentStep > 1 && (
            <div className="flex justify-between pt-6 border-t mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              
              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Already have account */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default CivicRegisterForm;