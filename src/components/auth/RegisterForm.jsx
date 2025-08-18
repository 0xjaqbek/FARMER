// src/components/auth/EnhancedRegisterForm.jsx
// Complete multi-step registration with Civic Auth integration

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  Phone, 
  Briefcase, 
  ArrowRight, 
  ArrowLeft,
  Check,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { registerUser } from '../../firebase/auth';
import { useUser } from "@civic/auth/react";

const RegisterForm = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authMethod, setAuthMethod] = useState(null); // 'civic' or 'traditional'

  // Civic Auth hook
  const civicAuth = useUser();

  const [formData, setFormData] = useState({
    // Step 1: Basic Account Info
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',

    // Step 2: Contact & Location
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Poland'
    },
    bio: '',

    // Step 3: Role-Specific Info
    // For Farmers:
    farmInfo: {
      farmName: '',
      description: '',
      established: '',
      farmSize: '',
      farmingMethods: [],
      specialties: [],
      certifications: [],
      website: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: ''
      },
      deliveryOptions: {
        deliveryAvailable: false,
        deliveryRadius: 10,
        pickupAvailable: true,
        deliveryFee: 0
      },
      businessInfo: {
        registrationNumber: '',
        taxId: '',
        insurance: false
      }
    },

    // For Customers:
    customerInfo: {
      dietaryRestrictions: [],
      allergies: '',
      preferredCategories: [],
      budgetRange: '',
      orderFrequency: '',
      deliveryPreferences: {
        preferredDays: [],
        preferredTimes: '',
        specialInstructions: ''
      }
    },

    // Step 4: Preferences & Settings
    notificationPreferences: {
      email: {
        orderUpdates: true,
        newMessages: true,
        lowStock: true,
        reviews: true,
        marketing: false,
        newsletters: false
      },
      sms: {
        orderUpdates: false,
        newMessages: false,
        lowStock: false,
        reviews: false
      },
      inApp: {
        orderUpdates: true,
        newMessages: true,
        lowStock: true,
        reviews: true,
        marketing: true
      }
    },

    privacy: {
      profilePublic: true,
      showContactInfo: false,
      allowMessaging: true,
      shareLocation: false
    },

    agreements: {
      termsOfService: false,
      privacyPolicy: false,
      marketingEmails: false
    }
  });

  const steps = [
    { 
      id: 1, 
      title: 'Authentication', 
      description: 'Choose your signup method',
      icon: Shield,
      fields: ['authMethod']
    },
    { 
      id: 2, 
      title: 'Personal Info', 
      description: 'Your details & role',
      icon: User,
      fields: ['firstName', 'lastName', 'role', 'email', 'password']
    },
    { 
      id: 3, 
      title: 'Contact & Location', 
      description: 'How to reach you',
      icon: MapPin,
      fields: ['phone', 'address', 'bio']
    },
    { 
      id: 4, 
      title: 'Professional Info', 
      description: 'Role-specific details',
      icon: Briefcase,
      fields: ['farmInfo', 'customerInfo']
    },
    { 
      id: 5, 
      title: 'Preferences', 
      description: 'Settings and agreements',
      icon: Check,
      fields: ['notificationPreferences', 'privacy', 'agreements']
    }
  ];

  const farmingMethods = [
    'Organic', 'Conventional', 'Sustainable', 'Biodynamic', 
    'Permaculture', 'Hydroponic', 'Greenhouse', 'Free-range'
  ];

  const productCategories = [
    'Vegetables', 'Fruits', 'Herbs', 'Grains', 'Dairy', 
    'Meat', 'Eggs', 'Honey', 'Preserves', 'Baked Goods'
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Organic Only', 
    'Locally Sourced', 'Seasonal Only', 'Raw Foods'
  ];

  const certifications = [
    'USDA Organic', 'EU Organic', 'Rainforest Alliance', 
    'Fair Trade', 'Non-GMO', 'Biodynamic', 'Local Certified'
  ];

  // Handle Civic authentication completion
  React.useEffect(() => {
    if (civicAuth.user && authMethod === 'civic') {
      // Pre-fill form data from Civic user info
      setFormData(prev => ({
        ...prev,
        email: civicAuth.user.email || '',
        firstName: civicAuth.user.given_name || '',
        lastName: civicAuth.user.family_name || '',
      }));
      
      // Skip to step 2 (Personal Info) since authentication is done
      setCurrentStep(2);
    }
  }, [civicAuth.user, authMethod]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (parent, field, value) => {
    setFormData(prev => {
      const currentArray = prev[parent][field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: newArray
        }
      };
    });
  };

  const handleCivicSignup = async () => {
    try {
      setLoading(true);
      setAuthMethod('civic');
      await civicAuth.signIn();
    } catch (error) {
      console.error('Civic signup error:', error);
      toast({
        title: "Civic Authentication Failed",
        description: error.message || "Please try again or use traditional signup.",
        variant: "destructive",
      });
      setAuthMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!authMethod) newErrors.authMethod = 'Please choose a signup method';
        break;

      case 2:
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.role) newErrors.role = 'Please select your role';
        if (!formData.email) newErrors.email = 'Email is required';
        
        // Only validate password for traditional signup
        if (authMethod === 'traditional') {
          if (!formData.password) newErrors.password = 'Password is required';
          if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
          if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 3:
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.address.street) newErrors['address.street'] = 'Street address is required';
        if (!formData.address.city) newErrors['address.city'] = 'City is required';
        if (!formData.address.postalCode) newErrors['address.postalCode'] = 'Postal code is required';
        break;

      case 4:
        if (formData.role === 'farmer') {
          if (!formData.farmInfo.farmName) newErrors['farmInfo.farmName'] = 'Farm name is required';
          if (!formData.farmInfo.description) newErrors['farmInfo.description'] = 'Farm description is required';
          if (formData.farmInfo.specialties.length === 0) newErrors['farmInfo.specialties'] = 'Please select at least one specialty';
        }
        break;

      case 5:
        if (!formData.agreements.termsOfService) newErrors['agreements.termsOfService'] = 'You must agree to the terms of service';
        if (!formData.agreements.privacyPolicy) newErrors['agreements.privacyPolicy'] = 'You must agree to the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      // Prepare complete user data
      const userData = {
        // Basic info
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        
        // Contact info
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        
        // Role-specific info
        ...(formData.role === 'farmer' ? {
          farmInfo: formData.farmInfo
        } : {
          customerInfo: formData.customerInfo
        }),
        
        // Preferences
        notificationPreferences: formData.notificationPreferences,
        privacy: formData.privacy,
        
        // Authentication method tracking
        authenticationMethod: authMethod,
        civicId: civicAuth.user?.id || null,
        
        // Additional fields
        profileComplete: true,
        registrationStep: 'completed'
      };

      console.log('Submitting complete registration:', userData);

      if (authMethod === 'civic') {
        // For Civic users, sync data to Firebase without creating auth account
        const { db } = await import('../../firebase/config');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        
        const userRef = doc(db, 'users', `civic_${civicAuth.user.id}`);
        await setDoc(userRef, {
          uid: `civic_${civicAuth.user.id}`,
          email: civicAuth.user.email,
          provider: 'civic',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...userData
        }, { merge: true });

        toast({
          title: "Registration Complete!",
          description: "Your Civic account has been set up successfully.",
        });
      } else {
        // Traditional Firebase registration
        await registerUser(formData.email, formData.password, userData);

        toast({
          title: "Registration Complete!",
          description: "Your account has been created successfully. Please check your email for verification.",
        });
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100;
  };

  // Step 1: Authentication Method Selection
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your Signup Method</h3>
        <p className="text-gray-600">Select how you'd like to create your account</p>
      </div>

      <div className="grid gap-4">
        {/* Civic Auth Option */}
        <Card 
          className={`cursor-pointer transition-all ${authMethod === 'civic' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
          onClick={() => setAuthMethod('civic')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Quick Signup with Civic</h4>
                <p className="text-gray-600 text-sm">Secure identity verification with minimal setup</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Fast</Badge>
                  <Badge variant="secondary">Secure</Badge>
                  <Badge variant="secondary">Verified</Badge>
                </div>
              </div>
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                {authMethod === 'civic' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traditional Email/Password Option */}
        <Card 
          className={`cursor-pointer transition-all ${authMethod === 'traditional' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'}`}
          onClick={() => setAuthMethod('traditional')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Traditional Email Signup</h4>
                <p className="text-gray-600 text-sm">Create account with email and password</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Familiar</Badge>
                  <Badge variant="secondary">Complete Control</Badge>
                </div>
              </div>
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                {authMethod === 'traditional' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {errors.authMethod && <p className="text-red-500 text-sm text-center">{errors.authMethod}</p>}

      {/* Civic Authentication Button */}
      {authMethod === 'civic' && (
        <div className="text-center">
          <Button 
            onClick={handleCivicSignup}
            disabled={loading || civicAuth.isLoading}
            className="w-full max-w-md"
            size="lg"
          >
            {loading || civicAuth.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating with Civic...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Continue with Civic
              </div>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            You'll be redirected to Civic for secure identity verification
          </p>
        </div>
      )}

      {civicAuth.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {civicAuth.error.message || 'Civic authentication failed. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Step 2: Personal Information
  const renderStep2 = () => (
    <div className="space-y-4">
      {authMethod === 'civic' && civicAuth.user && (
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Great! Your identity has been verified with Civic. Please complete your profile information.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'border-red-500' : ''}
            disabled={authMethod === 'civic' && civicAuth.user?.given_name}
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
            disabled={authMethod === 'civic' && civicAuth.user?.family_name}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email ? 'border-red-500' : ''}
          disabled={authMethod === 'civic' && civicAuth.user?.email}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Only show password fields for traditional signup */}
      {authMethod === 'traditional' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="role">I am a *</Label>
        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
          <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer - I want to buy fresh products</SelectItem>
            <SelectItem value="farmer">Farmer - I want to sell my products</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
      </div>
    </div>
  );

  // Step 3: Contact & Location
  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+48 123 456 789"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          value={formData.address.street}
          onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
          className={errors['address.street'] ? 'border-red-500' : ''}
        />
        {errors['address.street'] && <p className="text-red-500 text-sm mt-1">{errors['address.street']}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.address.city}
            onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
            className={errors['address.city'] ? 'border-red-500' : ''}
          />
          {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
        </div>
        
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.address.state}
            onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            value={formData.address.postalCode}
            onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
            className={errors['address.postalCode'] ? 'border-red-500' : ''}
          />
          {errors['address.postalCode'] && <p className="text-red-500 text-sm mt-1">{errors['address.postalCode']}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Tell us about yourself</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Share a bit about yourself, your interests, or what you're looking for..."
          rows={3}
        />
      </div>
    </div>
  );

  // Step 4: Role-specific information
  const renderStep4 = () => {
    if (formData.role === 'farmer') {
      return (
        <div className="space-y-6">
          <div>
            <Label htmlFor="farmName">Farm Name *</Label>
            <Input
              id="farmName"
              value={formData.farmInfo.farmName}
              onChange={(e) => handleNestedChange('farmInfo', 'farmName', e.target.value)}
              className={errors['farmInfo.farmName'] ? 'border-red-500' : ''}
            />
            {errors['farmInfo.farmName'] && <p className="text-red-500 text-sm mt-1">{errors['farmInfo.farmName']}</p>}
          </div>

          <div>
            <Label htmlFor="farmDescription">Farm Description *</Label>
            <Textarea
              id="farmDescription"
              value={formData.farmInfo.description}
              onChange={(e) => handleNestedChange('farmInfo', 'description', e.target.value)}
              placeholder="Describe your farm, what you grow, your farming practices..."
              rows={4}
              className={errors['farmInfo.description'] ? 'border-red-500' : ''} />
          </div>

          <div>
            <Label className="text-base font-medium">Preferred Product Categories</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {productCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`customer-${category}`}
                    checked={formData.customerInfo.preferredCategories.includes(category)}
                    onCheckedChange={() => handleArrayToggle('customerInfo', 'preferredCategories', category)}
                  />
                  <Label htmlFor={`customer-${category}`} className="text-sm">{category}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetRange">Monthly Budget Range</Label>
              <Select 
                value={formData.customerInfo.budgetRange} 
                onValueChange={(value) => handleNestedChange('customerInfo', 'budgetRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-100">Under 100 PLN</SelectItem>
                  <SelectItem value="100-300">100-300 PLN</SelectItem>
                  <SelectItem value="300-500">300-500 PLN</SelectItem>
                  <SelectItem value="500-1000">500-1000 PLN</SelectItem>
                  <SelectItem value="over-1000">Over 1000 PLN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="orderFrequency">How often do you shop?</Label>
              <Select 
                value={formData.customerInfo.orderFrequency} 
                onValueChange={(value) => handleNestedChange('customerInfo', 'orderFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="seasonal">Seasonally</SelectItem>
                  <SelectItem value="occasional">Occasionally</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }
  };

  // Step 5: Preferences & Settings
  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-3 block">Email Notifications</Label>
        <div className="space-y-3">
          {[
            { key: 'orderUpdates', label: 'Order updates and status changes' },
            { key: 'newMessages', label: 'New messages from other users' },
            { key: 'reviews', label: 'New reviews and ratings' },
            { key: 'marketing', label: 'Marketing and promotional emails' },
            { key: 'newsletters', label: 'Weekly newsletters and tips' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-sm">{label}</Label>
              <Switch
                id={key}
                checked={formData.notificationPreferences.email[key]}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      email: {
                        ...prev.notificationPreferences.email,
                        [key]: checked
                      }
                    }
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">Privacy Settings</Label>
        <div className="space-y-3">
          {[
            { key: 'profilePublic', label: 'Make my profile public' },
            { key: 'showContactInfo', label: 'Show contact information on profile' },
            { key: 'allowMessaging', label: 'Allow other users to message me' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-sm">{label}</Label>
              <Switch
                id={key}
                checked={formData.privacy[key]}
                onCheckedChange={(checked) => handleNestedChange('privacy', key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">Legal Agreements</Label>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreements.termsOfService}
              onCheckedChange={(checked) => handleNestedChange('agreements', 'termsOfService', checked)}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> *
            </Label>
          </div>
          {errors['agreements.termsOfService'] && <p className="text-red-500 text-sm">{errors['agreements.termsOfService']}</p>}
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={formData.agreements.privacyPolicy}
              onCheckedChange={(checked) => handleNestedChange('agreements', 'privacyPolicy', checked)}
            />
            <Label htmlFor="privacy" className="text-sm">
              I agree to the <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> *
            </Label>
          </div>
          {errors['agreements.privacyPolicy'] && <p className="text-red-500 text-sm">{errors['agreements.privacyPolicy']}</p>}
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketing"
              checked={formData.agreements.marketingEmails}
              onCheckedChange={(checked) => handleNestedChange('agreements', 'marketingEmails', checked)}
            />
            <Label htmlFor="marketing" className="text-sm">
              I agree to receive marketing emails (optional)
            </Label>
          </div>
        </div>
      </div>

      {formData.role === 'farmer' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            As a farmer, your account will be reviewed before activation. This process typically takes 1-2 business days.
          </AlertDescription>
        </Alert>
      )}

      {authMethod === 'civic' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your account will be secured with Civic's verified identity. No password required!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Farm Direct</CardTitle>
          <p className="text-gray-600">Create your account to connect with local farmers</p>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' :
                      isActive ? 'bg-blue-500 border-blue-500 text-white' :
                      'bg-gray-200 border-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-96">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </span>
              {authMethod === 'civic' && civicAuth.user && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Civic Verified
                </Badge>
              )}
            </div>
            
            {/* Step 1 special handling */}
            {currentStep === 1 && authMethod === 'traditional' ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : currentStep === 1 && authMethod === 'civic' && !civicAuth.user ? (
              <Button disabled className="flex items-center gap-2 opacity-50">
                Complete Civic Auth First
              </Button>
            ) : currentStep < 5 ? (
              <Button
                onClick={nextStep}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;