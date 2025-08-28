// src/components/auth/RegisterForm.jsx
// Complete multi-step registration with Civic Auth and comprehensive data collection

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@civic/auth/react'; // Use Civic Auth hook
import { updateUserProfile } from '../../services/authService';
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
import { 
  Wallet,
  Shield, 
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
  Loader2,
  CheckCircle,
  Sprout,
  ShoppingCart
} from 'lucide-react';

const RegisterForm = () => {
  // Use Civic Auth React hook
  const { user: civicUser, signIn, isLoading: civicLoading, error: civicError } = useUser();
  
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Basic info (pre-filled from Civic)
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

  const [errors, setErrors] = useState({});

  const steps = [
    { 
      id: 1, 
      title: 'Account Type', 
      description: 'Choose your role',
      icon: User,
      fields: ['role', 'firstName', 'lastName']
    },
    { 
      id: 2, 
      title: 'Contact & Location', 
      description: 'How to reach you',
      icon: MapPin,
      fields: ['phone', 'address', 'bio']
    },
    { 
      id: 3, 
      title: 'Professional Info', 
      description: 'Role-specific details',
      icon: Briefcase,
      fields: ['farmInfo', 'customerInfo']
    },
    { 
      id: 4, 
      title: 'Preferences', 
      description: 'Settings and agreements',
      icon: Check,
      fields: ['notificationPreferences', 'privacy', 'agreements']
    },
    { 
      id: 5, 
      title: 'Authentication', 
      description: 'Secure identity with Civic',
      icon: Shield,
      fields: []
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

  const preferredDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Handle Civic user authentication success (final step)
  useEffect(() => {
    console.log('🔍 useEffect triggered:', { 
      civicUser: !!civicUser, 
      civicLoading, 
      civicUserEmail: civicUser?.email 
    });
    
    if (civicUser && !civicLoading) {
      console.log('✅ Civic user authenticated:', civicUser.email);
      
      // Try to restore form data from localStorage if current state is empty
      const storedFormData = localStorage.getItem('registrationFormData');
      let registrationData = formData;
      
      if (storedFormData) {
        try {
          const parsedData = JSON.parse(storedFormData);
          console.log('📥 Found stored registration data:', parsedData);
          
          // If current form data is empty but we have stored data, restore it
          if (!formData.firstName && parsedData.firstName) {
            console.log('🔄 Restoring form data from localStorage');
            registrationData = parsedData;
            setFormData(parsedData);
          }
        } catch (error) {
          console.error('❌ Error parsing stored form data:', error);
        }
      }
      
      // Check if this is a registration flow by looking at the registration data
      const hasRegistrationData = registrationData.firstName && registrationData.role && 
        (registrationData.agreements.termsOfService || registrationData.agreements.privacyPolicy);
      
      console.log('🔍 Registration data check:', {
        hasFirstName: !!registrationData.firstName,
        hasRole: !!registrationData.role, 
        hasAgreements: !!(registrationData.agreements.termsOfService || registrationData.agreements.privacyPolicy),
        hasRegistrationData
      });
      
      if (hasRegistrationData) {
        console.log('🎯 Detected registration flow - triggering completeRegistration...');
        completeRegistration(registrationData);
      } else {
        console.log('ℹ️  No registration data detected - this is a regular login');
      }
    }
  }, [civicUser, civicLoading]);

  // Handle Civic errors
  useEffect(() => {
    if (civicError) {
      console.error('Civic Auth Error:', civicError);
      setError(civicError.message || 'Authentication failed. Please try again.');
    }
  }, [civicError]);



  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Persist form data to localStorage during registration
    localStorage.setItem('registrationFormData', JSON.stringify(newFormData));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    const newFormData = {
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    };
    
    setFormData(newFormData);
    
    // Persist form data to localStorage during registration
    localStorage.setItem('registrationFormData', JSON.stringify(newFormData));
  };

  const handleArrayToggle = (parent, field, value) => {
    const currentArray = formData[parent][field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    const newFormData = {
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: newArray
      }
    };
    
    setFormData(newFormData);
    
    // Persist form data to localStorage during registration
    localStorage.setItem('registrationFormData', JSON.stringify(newFormData));
  };

  const handleDeepNestedChange = (parent, subParent, field, value) => {
    const newFormData = {
      ...formData,
      [parent]: {
        ...formData[parent],
        [subParent]: {
          ...formData[parent][subParent],
          [field]: value
        }
      }
    };
    
    setFormData(newFormData);
    
    // Persist form data to localStorage during registration
    localStorage.setItem('registrationFormData', JSON.stringify(newFormData));
  };

  const validateStep = (step) => {
    const newErrors = {};
    console.log(`🔍 Validating step ${step} with data:`, formData);

    switch (step) {
      case 1:
        console.log('🔍 Validating step 1 - Account Type');
        if (!formData.role) {
          newErrors.role = 'Please select your account type';
          console.log('❌ Role missing');
        }
        if (!formData.firstName) {
          newErrors.firstName = 'First name is required';
          console.log('❌ First name missing');
        }
        if (!formData.lastName) {
          newErrors.lastName = 'Last name is required';
          console.log('❌ Last name missing');
        }
        console.log('📋 Step 1 data check:', { 
          role: formData.role, 
          firstName: formData.firstName, 
          lastName: formData.lastName 
        });
        break;

      case 2:
        console.log('🔍 Validating step 2 - Contact & Location');
        if (!formData.phone) {
          newErrors.phone = 'Phone number is required';
          console.log('❌ Phone missing');
        }
        if (!formData.address.street) {
          newErrors['address.street'] = 'Street address is required';
          console.log('❌ Street address missing');
        }
        if (!formData.address.city) {
          newErrors['address.city'] = 'City is required';
          console.log('❌ City missing');
        }
        if (!formData.address.postalCode) {
          newErrors['address.postalCode'] = 'Postal code is required';
          console.log('❌ Postal code missing');
        }
        console.log('📋 Step 2 data check:', { 
          phone: formData.phone, 
          address: formData.address 
        });
        break;

      case 3:
        console.log('🔍 Validating step 3 - Professional Info');
        console.log('👤 User role:', formData.role);
        if (formData.role === 'rolnik') {
          console.log('🚜 Validating farmer info...');
          if (!formData.farmInfo.farmName) {
            newErrors['farmInfo.farmName'] = 'Farm name is required';
            console.log('❌ Farm name missing');
          }
          if (!formData.farmInfo.description) {
            newErrors['farmInfo.description'] = 'Farm description is required';
            console.log('❌ Farm description missing');
          }
          if (formData.farmInfo.specialties.length === 0) {
            newErrors['farmInfo.specialties'] = 'Please select at least one specialty';
            console.log('❌ Farm specialties missing');
          }
          console.log('📋 Farmer data check:', formData.farmInfo);
        } else {
          console.log('🛒 Customer info validation (optional)');
          console.log('📋 Customer data check:', formData.customerInfo);
        }
        break;

      case 4:
        console.log('🔍 Validating step 4 - Preferences & Agreements');
        if (!formData.agreements.termsOfService) {
          newErrors['agreements.termsOfService'] = 'You must agree to the terms of service';
          console.log('❌ Terms of service not agreed');
        }
        if (!formData.agreements.privacyPolicy) {
          newErrors['agreements.privacyPolicy'] = 'You must agree to the privacy policy';
          console.log('❌ Privacy policy not agreed');
        }
        console.log('📋 Agreements data check:', formData.agreements);
        break;
    }

    console.log(`🔍 Step ${step} validation results:`, { 
      hasErrors: Object.keys(newErrors).length > 0, 
      errors: newErrors 
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    console.log(`📝 Validating step ${currentStep}...`);
    console.log(`📋 Current form data:`, formData);
    
    if (validateStep(currentStep)) {
      console.log(`✅ Step ${currentStep} validated successfully`);
      const newStep = Math.min(currentStep + 1, 5);
      console.log(`➡️  Moving to step ${newStep}`);
      setCurrentStep(newStep);
    } else {
      console.log(`❌ Step ${currentStep} validation failed`);
      console.log(`❌ Validation errors:`, errors);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const completeRegistration = async (registrationFormData = formData) => {
    setLoading(true);
    try {
      console.log('🚀 Completing registration with profile data...');
      console.log('📋 Registration form data:', registrationFormData);
      console.log('👤 Civic user:', civicUser);
      
      // Prepare complete user data with all form fields
      const userData = {
        // Basic info from form
        firstName: registrationFormData.firstName || '',
        lastName: registrationFormData.lastName || '',
        displayName: `${registrationFormData.firstName || ''} ${registrationFormData.lastName || ''}`.trim(),
        role: registrationFormData.role || '',
        
        // Contact info from form  
        phone: registrationFormData.phone || '',
        bio: registrationFormData.bio || '',
        
        // Address data - map to expected structure
        address: registrationFormData.address || {},
        location: {
          address: registrationFormData.address?.street || '',
          city: registrationFormData.address?.city || '',
          region: registrationFormData.address?.state || '',
          country: registrationFormData.address?.country || 'Poland',
          coordinates: {
            lat: 0,
            lng: 0
          },
          geoHash: '',
          deliveryAddresses: []
        },
        
        // Role-specific info
        ...(registrationFormData.role === 'rolnik' ? {
          farmInfo: {
            ...registrationFormData.farmInfo,
            // Ensure all farm info fields are included
            farmName: registrationFormData.farmInfo?.farmName || '',
            description: registrationFormData.farmInfo?.description || '',
            established: registrationFormData.farmInfo?.established || '',
            farmSize: registrationFormData.farmInfo?.farmSize || '',
            farmingMethods: registrationFormData.farmInfo?.farmingMethods || [],
            specialties: registrationFormData.farmInfo?.specialties || [],
            certifications: registrationFormData.farmInfo?.certifications || [],
            website: registrationFormData.farmInfo?.website || '',
            socialMedia: registrationFormData.farmInfo?.socialMedia || {
              facebook: '',
              instagram: '',
              twitter: ''
            },
            deliveryOptions: registrationFormData.farmInfo?.deliveryOptions || {
              deliveryAvailable: false,
              deliveryRadius: 10,
              pickupAvailable: true,
              deliveryFee: 0
            },
            businessInfo: registrationFormData.farmInfo?.businessInfo || {
              registrationNumber: '',
              taxId: '',
              insurance: false
            }
          }
        } : {
          customerInfo: {
            ...registrationFormData.customerInfo,
            // Ensure all customer info fields are included
            dietaryRestrictions: registrationFormData.customerInfo?.dietaryRestrictions || [],
            allergies: registrationFormData.customerInfo?.allergies || '',
            preferredCategories: registrationFormData.customerInfo?.preferredCategories || [],
            budgetRange: registrationFormData.customerInfo?.budgetRange || '',
            orderFrequency: registrationFormData.customerInfo?.orderFrequency || '',
            deliveryPreferences: registrationFormData.customerInfo?.deliveryPreferences || {
              preferredDays: [],
              preferredTimes: '',
              specialInstructions: ''
            },
            // Add default customer stats
            totalOrders: 0,
            averageOrderValue: 0
          }
        }),
        
        // Notification preferences from form
        notificationPreferences: {
          email: registrationFormData.notificationPreferences?.email || {
            orderUpdates: true,
            newMessages: true,
            lowStock: true,
            reviews: true,
            marketing: false,
            newsletters: false
          },
          sms: registrationFormData.notificationPreferences?.sms || {
            orderUpdates: false,
            newMessages: false,
            lowStock: false,
            reviews: false
          },
          inApp: registrationFormData.notificationPreferences?.inApp || {
            orderUpdates: true,
            newMessages: true,
            lowStock: true,
            reviews: true,
            marketing: true
          }
        },
        
        // Privacy settings from form
        privacy: registrationFormData.privacy || {
          profilePublic: true,
          showContactInfo: false,
          allowMessaging: true,
          shareLocation: false
        },
        
        // Agreement flags
        agreements: registrationFormData.agreements || {
          termsOfService: false,
          privacyPolicy: false,
          marketingEmails: false
        },
        
        // Registration completion flags
        profileComplete: true,
        registrationStep: 'completed',
        registrationCompleted: true
      };

      console.log('📤 Sending userData:', userData);

      // Update user profile in Firestore with additional data
      await updateUserProfile(civicUser.id, userData);

      console.log('✅ Registration complete');

      // Clean up localStorage after successful registration
      localStorage.removeItem('registrationFormData');

      toast({
        title: "Registration Complete!",
        description: "Your account has been created successfully with Civic Auth.",
      });

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error details:', error.message);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === 5) {
      // First validate step 4 (agreements) before proceeding with Civic Auth
      if (!validateStep(4)) {
        console.log('❌ Step 4 validation failed, cannot proceed with Civic Auth');
        return;
      }

      console.log('✅ Step 4 validated, proceeding with Civic Auth');
      console.log('📋 Form data before Civic Auth:', formData);
      
      // Step 5 is Civic Auth
      try {
        setError('');
        console.log('🔐 Starting Civic authentication...');
        
        // Use the signIn method from the useUser hook
        await signIn();
        
        // The useEffect above will detect registration data and complete automatically
        
      } catch (error) {
        console.error('❌ Civic auth error:', error);
        setError(error.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Welcome to Farm Direct!</h3>
        <p className="text-sm text-gray-600">
          Let's start by setting up your account profile
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
        <Label className="text-base font-medium mb-4 block">I am joining Farm Direct as a *</Label>
        <div className="grid grid-cols-1 gap-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              formData.role === 'klient' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleInputChange('role', 'klient')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.role === 'klient' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {formData.role === 'klient' && <div className="w-full h-full bg-white rounded-full scale-50"></div>}
              </div>
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Customer</h3>
                <p className="text-sm text-gray-600">I want to buy fresh, local products</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              formData.role === 'rolnik' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleInputChange('role', 'rolnik')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.role === 'rolnik' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {formData.role === 'rolnik' && <div className="w-full h-full bg-white rounded-full scale-50"></div>}
              </div>
              <Sprout className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Farmer</h3>
                <p className="text-sm text-gray-600">I want to sell my farm products directly to customers</p>
              </div>
            </div>
          </div>
        </div>
        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
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

  const renderStep3 = () => {
    return formData.role === 'rolnik' ? renderFarmerStep3() : renderCustomerStep3();
  };

  const renderFarmerStep3 = () => (
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
          className={errors['farmInfo.description'] ? 'border-red-500' : ''}
        />
        {errors['farmInfo.description'] && <p className="text-red-500 text-sm mt-1">{errors['farmInfo.description']}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="established">Farm Established</Label>
          <Input
            id="established"
            type="number"
            value={formData.farmInfo.established}
            onChange={(e) => handleNestedChange('farmInfo', 'established', e.target.value)}
            placeholder="Year"
          />
        </div>
        
        <div>
          <Label htmlFor="farmSize">Farm Size</Label>
          <Input
            id="farmSize"
            value={formData.farmInfo.farmSize}
            onChange={(e) => handleNestedChange('farmInfo', 'farmSize', e.target.value)}
            placeholder="e.g., 5 acres, 2 hectares"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Farming Methods</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {farmingMethods.map(method => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                id={method}
                checked={formData.farmInfo.farmingMethods.includes(method)}
                onCheckedChange={() => handleArrayToggle('farmInfo', 'farmingMethods', method)}
              />
              <Label htmlFor={method} className="text-sm">{method}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">What do you grow? *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {productCategories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={formData.farmInfo.specialties.includes(category)}
                onCheckedChange={() => handleArrayToggle('farmInfo', 'specialties', category)}
              />
              <Label htmlFor={category} className="text-sm">{category}</Label>
            </div>
          ))}
        </div>
        {errors['farmInfo.specialties'] && <p className="text-red-500 text-sm mt-1">{errors['farmInfo.specialties']}</p>}
      </div>

      <div>
        <Label className="text-base font-medium">Certifications</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {certifications.map(cert => (
            <div key={cert} className="flex items-center space-x-2">
              <Checkbox
                id={cert}
                checked={formData.farmInfo.certifications.includes(cert)}
                onCheckedChange={() => handleArrayToggle('farmInfo', 'certifications', cert)}
              />
              <Label htmlFor={cert} className="text-sm">{cert}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Online Presence</Label>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.farmInfo.website}
              onChange={(e) => handleNestedChange('farmInfo', 'website', e.target.value)}
              placeholder="https://yourfarm.com"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.farmInfo.socialMedia.facebook}
                onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'facebook', e.target.value)}
                placeholder="@yourfarm"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.farmInfo.socialMedia.instagram}
                onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'instagram', e.target.value)}
                placeholder="@yourfarm"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.farmInfo.socialMedia.twitter}
                onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'twitter', e.target.value)}
                placeholder="@yourfarm"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Delivery Options</Label>
        <div className="space-y-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deliveryAvailable"
              checked={formData.farmInfo.deliveryOptions.deliveryAvailable}
              onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryAvailable', checked)}
            />
            <Label htmlFor="deliveryAvailable">I offer delivery</Label>
          </div>
          
          {formData.farmInfo.deliveryOptions.deliveryAvailable && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  value={formData.farmInfo.deliveryOptions.deliveryRadius}
                  onChange={(e) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryRadius', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Delivery Fee (PLN)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  value={formData.farmInfo.deliveryOptions.deliveryFee}
                  onChange={(e) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pickupAvailable"
              checked={formData.farmInfo.deliveryOptions.pickupAvailable}
              onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'pickupAvailable', checked)}
            />
            <Label htmlFor="pickupAvailable">Customers can pick up from farm</Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Business Information</Label>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registrationNumber">Business Registration Number</Label>
              <Input
                id="registrationNumber"
                value={formData.farmInfo.businessInfo.registrationNumber}
                onChange={(e) => handleDeepNestedChange('farmInfo', 'businessInfo', 'registrationNumber', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID / NIP</Label>
              <Input
                id="taxId"
                value={formData.farmInfo.businessInfo.taxId}
                onChange={(e) => handleDeepNestedChange('farmInfo', 'businessInfo', 'taxId', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="insurance"
              checked={formData.farmInfo.businessInfo.insurance}
              onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'businessInfo', 'insurance', checked)}
            />
            <Label htmlFor="insurance">I have business insurance</Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Dietary Preferences</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {dietaryOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={formData.customerInfo.dietaryRestrictions.includes(option)}
                onCheckedChange={() => handleArrayToggle('customerInfo', 'dietaryRestrictions', option)}
              />
              <Label htmlFor={option} className="text-sm">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="allergies">Allergies & Special Requirements</Label>
        <Textarea
          id="allergies"
          value={formData.customerInfo.allergies}
          onChange={(e) => handleNestedChange('customerInfo', 'allergies', e.target.value)}
          placeholder="Please list any food allergies or special dietary requirements..."
          rows={3}
        />
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

      <div>
        <Label className="text-base font-medium">Delivery Preferences</Label>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium">Preferred Delivery Days</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {preferredDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.customerInfo.deliveryPreferences.preferredDays.includes(day)}
                    onCheckedChange={() => handleArrayToggle('customerInfo', 'deliveryPreferences', day)}
                  />
                  <Label htmlFor={day} className="text-xs">{day}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="preferredTimes">Preferred Delivery Times</Label>
            <Input
              id="preferredTimes"
              value={formData.customerInfo.deliveryPreferences.preferredTimes}
              onChange={(e) => handleDeepNestedChange('customerInfo', 'deliveryPreferences', 'preferredTimes', e.target.value)}
              placeholder="e.g., 9 AM - 12 PM, evenings after 5 PM"
            />
          </div>
          
          <div>
            <Label htmlFor="specialInstructions">Special Delivery Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={formData.customerInfo.deliveryPreferences.specialInstructions}
              onChange={(e) => handleDeepNestedChange('customerInfo', 'deliveryPreferences', 'specialInstructions', e.target.value)}
              placeholder="Any special instructions for delivery (gate code, preferred location, etc.)"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-3 block">Email Notifications</Label>
        <div className="space-y-3">
          {[
            { key: 'orderUpdates', label: 'Order updates and status changes' },
            { key: 'newMessages', label: 'New messages from other users' },
            { key: 'lowStock', label: 'Low stock alerts (farmers only)' },
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
        <Label className="text-base font-medium mb-3 block">SMS Notifications</Label>
        <div className="space-y-3">
          {[
            { key: 'orderUpdates', label: 'Order updates and status changes' },
            { key: 'newMessages', label: 'New messages from other users' },
            { key: 'lowStock', label: 'Low stock alerts (farmers only)' },
            { key: 'reviews', label: 'New reviews and ratings' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`sms-${key}`} className="text-sm">{label}</Label>
              <Switch
                id={`sms-${key}`}
                checked={formData.notificationPreferences.sms[key]}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      sms: {
                        ...prev.notificationPreferences.sms,
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
            { key: 'allowMessaging', label: 'Allow other users to message me' },
            { key: 'shareLocation', label: 'Share my location on the map' }
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

      {formData.role === 'rolnik' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            As a farmer, your account will be reviewed before activation. This process typically takes 1-2 business days.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Secure Identity Verification
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete your registration using Civic's blockchain-based identity verification. 
            No passwords needed - your identity is your key.
          </p>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Decentralized identity verification</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No passwords to remember</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Protected by blockchain technology</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Your data stays private and secure</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {civicLoading && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Creating your account...</p>
          </div>
        )}
      </div>
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
            </div>
            
            {currentStep < 5 ? (
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
                disabled={loading || civicLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading || civicLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Complete with Civic Auth
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