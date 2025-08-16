// src/pages/Profile.jsx - Enhanced to handle comprehensive registration data
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Save, 
  X, 
  Edit,
  RefreshCw,
  Shield,
  Bell,
  Settings,
  Globe,
  Store,
  Heart,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Package,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Leaf,
  Truck
} from 'lucide-react';

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Poland'
    },
    
    // Role-specific data
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
    
    // Notification Preferences
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
    
    // Privacy Settings
    privacy: {
      profilePublic: true,
      showContactInfo: false,
      allowMessaging: true,
      shareLocation: false
    },
    
    // Settings
    isPublic: true,
    acceptsOrders: true,
    deliveryAvailable: false,
    deliveryRadius: 10
  });

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

  useEffect(() => {
    if (userProfile) {
      console.log('Loading comprehensive profile data:', userProfile);
      setFormData({
        // Basic Information
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        
        // Address Information
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          postalCode: userProfile.address?.postalCode || '',
          country: userProfile.address?.country || 'Poland'
        },
        
        // Farm Information (for farmers)
        farmInfo: {
          farmName: userProfile.farmInfo?.farmName || userProfile.farmName || '',
          description: userProfile.farmInfo?.description || userProfile.farmDescription || '',
          established: userProfile.farmInfo?.established || '',
          farmSize: userProfile.farmInfo?.farmSize || '',
          farmingMethods: userProfile.farmInfo?.farmingMethods || userProfile.farmInfo?.practices || [],
          specialties: userProfile.farmInfo?.specialties || [],
          certifications: userProfile.farmInfo?.certifications || [],
          website: userProfile.farmInfo?.website || userProfile.website || '',
          socialMedia: {
            facebook: userProfile.farmInfo?.socialMedia?.facebook || userProfile.socialMedia?.facebook || '',
            instagram: userProfile.farmInfo?.socialMedia?.instagram || userProfile.socialMedia?.instagram || '',
            twitter: userProfile.farmInfo?.socialMedia?.twitter || userProfile.socialMedia?.twitter || ''
          },
          deliveryOptions: {
            deliveryAvailable: userProfile.farmInfo?.deliveryOptions?.deliveryAvailable ?? userProfile.deliveryAvailable ?? false,
            deliveryRadius: userProfile.farmInfo?.deliveryOptions?.deliveryRadius ?? userProfile.deliveryRadius ?? 10,
            pickupAvailable: userProfile.farmInfo?.deliveryOptions?.pickupAvailable ?? true,
            deliveryFee: userProfile.farmInfo?.deliveryOptions?.deliveryFee ?? 0
          },
          businessInfo: {
            registrationNumber: userProfile.farmInfo?.businessInfo?.registrationNumber || userProfile.businessRegistration || '',
            taxId: userProfile.farmInfo?.businessInfo?.taxId || '',
            insurance: userProfile.farmInfo?.businessInfo?.insurance ?? false
          }
        },
        
        // Customer Information
        customerInfo: {
          dietaryRestrictions: userProfile.customerInfo?.dietaryRestrictions || [],
          allergies: userProfile.customerInfo?.allergies || '',
          preferredCategories: userProfile.customerInfo?.preferredCategories || [],
          budgetRange: userProfile.customerInfo?.budgetRange || '',
          orderFrequency: userProfile.customerInfo?.orderFrequency || '',
          deliveryPreferences: {
            preferredDays: userProfile.customerInfo?.deliveryPreferences?.preferredDays || [],
            preferredTimes: userProfile.customerInfo?.deliveryPreferences?.preferredTimes || '',
            specialInstructions: userProfile.customerInfo?.deliveryPreferences?.specialInstructions || ''
          }
        },
        
        // Notification Preferences
        notificationPreferences: {
          email: {
            orderUpdates: userProfile.notificationPreferences?.email?.orderUpdates ?? true,
            newMessages: userProfile.notificationPreferences?.email?.newMessages ?? true,
            lowStock: userProfile.notificationPreferences?.email?.lowStock ?? true,
            reviews: userProfile.notificationPreferences?.email?.reviews ?? true,
            marketing: userProfile.notificationPreferences?.email?.marketing ?? false,
            newsletters: userProfile.notificationPreferences?.email?.newsletters ?? false
          },
          sms: {
            orderUpdates: userProfile.notificationPreferences?.sms?.orderUpdates ?? false,
            newMessages: userProfile.notificationPreferences?.sms?.newMessages ?? false,
            lowStock: userProfile.notificationPreferences?.sms?.lowStock ?? false,
            reviews: userProfile.notificationPreferences?.sms?.reviews ?? false
          },
          inApp: {
            orderUpdates: userProfile.notificationPreferences?.inApp?.orderUpdates ?? true,
            newMessages: userProfile.notificationPreferences?.inApp?.newMessages ?? true,
            lowStock: userProfile.notificationPreferences?.inApp?.lowStock ?? true,
            reviews: userProfile.notificationPreferences?.inApp?.reviews ?? true,
            marketing: userProfile.notificationPreferences?.inApp?.marketing ?? true
          }
        },
        
        // Privacy Settings
        privacy: {
          profilePublic: userProfile.privacy?.profilePublic ?? userProfile.isPublic ?? true,
          showContactInfo: userProfile.privacy?.showContactInfo ?? false,
          allowMessaging: userProfile.privacy?.allowMessaging ?? true,
          shareLocation: userProfile.privacy?.shareLocation ?? false
        },
        
        // Legacy compatibility
        isPublic: userProfile.isPublic ?? true,
        acceptsOrders: userProfile.acceptsOrders ?? true,
        deliveryAvailable: userProfile.deliveryAvailable ?? false,
        deliveryRadius: userProfile.deliveryRadius ?? 10
      });
      setLoading(false);
    }
  }, [userProfile]);

  const handleRefreshProfile = async () => {
    try {
      setLoading(true);
      const refreshedProfile = await refreshUserProfile();
      if (refreshedProfile) {
        toast({
          title: "Success",
          description: "Profile refreshed successfully"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleDeepNestedChange = (parent, child, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: {
          ...prev[parent][child],
          [field]: value
        }
      }
    }));
  };

  const handleArrayToggle = (parent, field, value) => {
    setFormData(prev => {
      const currentArray = parent ? prev[parent][field] || [] : prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      if (parent) {
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: newArray
          }
        };
      } else {
        return {
          ...prev,
          [field]: newArray
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare update data by cleaning up and structuring properly
      const updateData = {
        ...formData,
        updatedAt: new Date(),
        profileComplete: true
      };
      
      console.log('Updating comprehensive profile with data:', updateData);
      
      // Use the AuthContext updateUserProfile method
      await updateUserProfile(updateData);
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      setEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'rolnik':
      case 'farmer':
        return 'Farmer (Rolnik)';
      case 'klient':
      case 'customer':
        return 'Customer (Klient)';
      case 'admin':
        return 'Administrator';
      default:
        return role || 'User';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  const isCustomer = userProfile?.role === 'klient' || userProfile?.role === 'customer';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshProfile}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditing(false);
                  setActiveTab('basic');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving}
              >
                <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Contact
          </TabsTrigger>
          {isFarmer && (
            <TabsTrigger value="farm" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Farm
            </TabsTrigger>
          )}
          {isCustomer && (
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
                {userProfile?.isVerified && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="How you want to be displayed"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Full Name</Label>
                      <p className="font-medium">
                        {userProfile?.firstName} {userProfile?.lastName}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Display Name</Label>
                      <p className="font-medium">{userProfile?.displayName || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Role</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getRoleDisplayName(userProfile?.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {userProfile?.email}
                      </p>
                    </div>
                    
                    {userProfile?.bio && (
                      <div>
                        <Label className="text-sm text-gray-500">Bio</Label>
                        <p className="text-gray-700">{userProfile.bio}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-sm text-gray-500">Member Since</Label>
                      <p className="font-medium">{formatDate(userProfile?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact">
          <div className="space-y-6">
            {/* Phone & Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+48 123 456 789"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {userProfile?.phone || 'Not provided'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                          placeholder="State or Province"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.address.postalCode}
                          onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                          placeholder="Postal Code"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.address.country}
                        onValueChange={(value) => handleNestedChange('address', 'country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Poland">Poland</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userProfile?.address?.street && (
                      <p>{userProfile.address.street}</p>
                    )}
                    <p>
                      {[
                        userProfile?.address?.city,
                        userProfile?.address?.state,
                        userProfile?.address?.postalCode
                      ].filter(Boolean).join(', ')}
                    </p>
                    <p>{userProfile?.address?.country || 'Poland'}</p>
                    
                    {!userProfile?.address?.street && !userProfile?.address?.city && (
                      <p className="text-gray-500 italic">No address provided</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Media & Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.farmInfo.website}
                        onChange={(e) => handleNestedChange('farmInfo', 'website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.farmInfo.socialMedia.facebook}
                          onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'facebook', e.target.value)}
                          placeholder="Facebook username or URL"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.farmInfo.socialMedia.instagram}
                          onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'instagram', e.target.value)}
                          placeholder="Instagram username"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.farmInfo.socialMedia.twitter}
                          onChange={(e) => handleDeepNestedChange('farmInfo', 'socialMedia', 'twitter', e.target.value)}
                          placeholder="Twitter username"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(userProfile?.farmInfo?.website || userProfile?.website) && (
                      <div>
                        <Label className="text-sm text-gray-500">Website</Label>
                        <p>
                          <a
                            href={userProfile?.farmInfo?.website || userProfile?.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            {userProfile?.farmInfo?.website || userProfile?.website}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(userProfile?.farmInfo?.socialMedia?.facebook || userProfile?.socialMedia?.facebook) && (
                        <div>
                          <Label className="text-sm text-gray-500">Facebook</Label>
                          <p className="font-medium flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            {userProfile?.farmInfo?.socialMedia?.facebook || userProfile?.socialMedia?.facebook}
                          </p>
                        </div>
                      )}
                      
                      {(userProfile?.farmInfo?.socialMedia?.instagram || userProfile?.socialMedia?.instagram) && (
                        <div>
                          <Label className="text-sm text-gray-500">Instagram</Label>
                          <p className="font-medium flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            @{userProfile?.farmInfo?.socialMedia?.instagram || userProfile?.socialMedia?.instagram}
                          </p>
                        </div>
                      )}
                      
                      {(userProfile?.farmInfo?.socialMedia?.twitter || userProfile?.socialMedia?.twitter) && (
                        <div>
                          <Label className="text-sm text-gray-500">Twitter</Label>
                          <p className="font-medium flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            @{userProfile?.farmInfo?.socialMedia?.twitter || userProfile?.socialMedia?.twitter}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Farm Details Tab (Farmers only) */}
        {isFarmer && (
          <TabsContent value="farm">
            <div className="space-y-6">
              {/* Farm Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    Farm Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="farmName">Farm Name</Label>
                        <Input
                          id="farmName"
                          value={formData.farmInfo.farmName}
                          onChange={(e) => handleNestedChange('farmInfo', 'farmName', e.target.value)}
                          placeholder="Your farm name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="farmDescription">Farm Description</Label>
                        <Textarea
                          id="farmDescription"
                          value={formData.farmInfo.description}
                          onChange={(e) => handleNestedChange('farmInfo', 'description', e.target.value)}
                          placeholder="Describe your farm, what you grow, your farming practices..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="established">Year Established</Label>
                          <Input
                            id="established"
                            type="number"
                            value={formData.farmInfo.established}
                            onChange={(e) => handleNestedChange('farmInfo', 'established', e.target.value)}
                            placeholder="2020"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="farmSize">Farm Size</Label>
                          <Input
                            id="farmSize"
                            value={formData.farmInfo.farmSize}
                            onChange={(e) => handleNestedChange('farmInfo', 'farmSize', e.target.value)}
                            placeholder="e.g., 5 hectares"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Farming Methods</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {farmingMethods.map((method) => (
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
                        <Label>Product Specialties</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {productCategories.map((category) => (
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
                      </div>
                      
                      <div>
                        <Label>Certifications</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {certifications.map((cert) => (
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Farm Name</Label>
                        <p className="text-xl font-semibold">{userProfile?.farmInfo?.farmName || userProfile?.farmName || 'Not provided'}</p>
                      </div>
                      
                      {(userProfile?.farmInfo?.description || userProfile?.farmDescription) && (
                        <div>
                          <Label className="text-sm text-gray-500">Description</Label>
                          <p className="text-gray-700">{userProfile?.farmInfo?.description || userProfile?.farmDescription}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userProfile?.farmInfo?.established && (
                          <div>
                            <Label className="text-sm text-gray-500">Established</Label>
                            <p className="font-medium">{userProfile.farmInfo.established}</p>
                          </div>
                        )}
                        
                        {userProfile?.farmInfo?.farmSize && (
                          <div>
                            <Label className="text-sm text-gray-500">Farm Size</Label>
                            <p className="font-medium">{userProfile.farmInfo.farmSize}</p>
                          </div>
                        )}
                      </div>
                      
                      {(userProfile?.farmInfo?.farmingMethods?.length > 0 || userProfile?.farmInfo?.practices?.length > 0) && (
                        <div>
                          <Label className="text-sm text-gray-500">Farming Methods</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(userProfile?.farmInfo?.farmingMethods || userProfile?.farmInfo?.practices || []).map((method, index) => (
                              <Badge key={index} variant="secondary">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userProfile?.farmInfo?.specialties?.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-500">Specialties</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.farmInfo.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userProfile?.farmInfo?.certifications?.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-500">Certifications</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.farmInfo.certifications.map((cert, index) => (
                              <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                                <Award className="h-3 w-3 mr-1" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="businessRegistration">Business Registration Number</Label>
                        <Input
                          id="businessRegistration"
                          value={formData.farmInfo.businessInfo.registrationNumber}
                          onChange={(e) => handleDeepNestedChange('farmInfo', 'businessInfo', 'registrationNumber', e.target.value)}
                          placeholder="Your business registration number"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input
                          id="taxId"
                          value={formData.farmInfo.businessInfo.taxId}
                          onChange={(e) => handleDeepNestedChange('farmInfo', 'businessInfo', 'taxId', e.target.value)}
                          placeholder="Tax identification number"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="insurance">Business Insurance</Label>
                          <p className="text-sm text-gray-500">Do you have business insurance?</p>
                        </div>
                        <Switch
                          id="insurance"
                          checked={formData.farmInfo.businessInfo.insurance}
                          onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'businessInfo', 'insurance', checked)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Registration Number</Label>
                        <p className="font-medium">{userProfile?.farmInfo?.businessInfo?.registrationNumber || userProfile?.businessRegistration || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Tax ID</Label>
                        <p className="font-medium">{userProfile?.farmInfo?.businessInfo?.taxId || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Business Insurance</Label>
                        <Badge variant={userProfile?.farmInfo?.businessInfo?.insurance ? "default" : "secondary"}>
                          {userProfile?.farmInfo?.businessInfo?.insurance ? "Insured" : "Not Insured"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery & Pickup Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="acceptsOrders">Accept New Orders</Label>
                          <p className="text-sm text-gray-500">Allow customers to place orders</p>
                        </div>
                        <Switch
                          id="acceptsOrders"
                          checked={formData.acceptsOrders}
                          onCheckedChange={(checked) => handleInputChange('acceptsOrders', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="deliveryAvailable">Delivery Available</Label>
                          <p className="text-sm text-gray-500">Offer delivery service</p>
                        </div>
                        <Switch
                          id="deliveryAvailable"
                          checked={formData.farmInfo.deliveryOptions.deliveryAvailable}
                          onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryAvailable', checked)}
                        />
                      </div>
                      
                      {formData.farmInfo.deliveryOptions.deliveryAvailable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                            <Input
                              id="deliveryRadius"
                              type="number"
                              min="1"
                              max="100"
                              value={formData.farmInfo.deliveryOptions.deliveryRadius}
                              onChange={(e) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryRadius', parseInt(e.target.value) || 10)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="deliveryFee">Delivery Fee (PLN)</Label>
                            <Input
                              id="deliveryFee"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.farmInfo.deliveryOptions.deliveryFee}
                              onChange={(e) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'deliveryFee', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pickupAvailable">Pickup Available</Label>
                          <p className="text-sm text-gray-500">Allow customers to pick up orders</p>
                        </div>
                        <Switch
                          id="pickupAvailable"
                          checked={formData.farmInfo.deliveryOptions.pickupAvailable}
                          onCheckedChange={(checked) => handleDeepNestedChange('farmInfo', 'deliveryOptions', 'pickupAvailable', checked)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Accepts Orders</Label>
                        <Badge variant={userProfile?.acceptsOrders ? "default" : "secondary"}>
                          {userProfile?.acceptsOrders ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Delivery Available</Label>
                        <Badge variant={(userProfile?.farmInfo?.deliveryOptions?.deliveryAvailable || userProfile?.deliveryAvailable) ? "default" : "secondary"}>
                          {(userProfile?.farmInfo?.deliveryOptions?.deliveryAvailable || userProfile?.deliveryAvailable) ? 
                            `Yes (${userProfile?.farmInfo?.deliveryOptions?.deliveryRadius || userProfile?.deliveryRadius || 10}km)` : 'No'}
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Pickup Available</Label>
                        <Badge variant={userProfile?.farmInfo?.deliveryOptions?.pickupAvailable ? "default" : "secondary"}>
                          {userProfile?.farmInfo?.deliveryOptions?.pickupAvailable ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      
                      {(userProfile?.farmInfo?.deliveryOptions?.deliveryAvailable || userProfile?.deliveryAvailable) && (
                        <div>
                          <Label className="text-sm text-gray-500">Delivery Fee</Label>
                          <p className="font-medium">{userProfile?.farmInfo?.deliveryOptions?.deliveryFee || 0} PLN</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Farm Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Farm Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Package className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.farmerStats?.totalProducts || 0}</p>
                      <p className="text-sm text-gray-600">Products</p>
                    </div>
                    
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.farmerStats?.totalOrders || 0}</p>
                      <p className="text-sm text-gray-600">Orders</p>
                    </div>
                    
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.farmerStats?.totalRevenue || 0}</p>
                      <p className="text-sm text-gray-600">Revenue (PLN)</p>
                    </div>
                    
                    <div className="text-center">
                      <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.farmerStats?.averageRating || 0}/5</p>
                      <p className="text-sm text-gray-600">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Customer Preferences Tab (Customers only) */}
        {isCustomer && (
          <TabsContent value="preferences">
            <div className="space-y-6">
              {/* Shopping Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Shopping Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Dietary Restrictions</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {dietaryOptions.map((diet) => (
                            <div key={diet} className="flex items-center space-x-2">
                              <Checkbox
                                id={diet}
                                checked={formData.customerInfo.dietaryRestrictions.includes(diet)}
                                onCheckedChange={() => handleArrayToggle('customerInfo', 'dietaryRestrictions', diet)}
                              />
                              <Label htmlFor={diet} className="text-sm">{diet}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="allergies">Allergies</Label>
                        <Textarea
                          id="allergies"
                          value={formData.customerInfo.allergies}
                          onChange={(e) => handleNestedChange('customerInfo', 'allergies', e.target.value)}
                          placeholder="List any food allergies..."
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label>Preferred Categories</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {productCategories.map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`pref-${category}`}
                                checked={formData.customerInfo.preferredCategories.includes(category)}
                                onCheckedChange={() => handleArrayToggle('customerInfo', 'preferredCategories', category)}
                              />
                              <Label htmlFor={`pref-${category}`} className="text-sm">{category}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="budgetRange">Budget Range</Label>
                          <Select
                            value={formData.customerInfo.budgetRange}
                            onValueChange={(value) => handleNestedChange('customerInfo', 'budgetRange', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-50">0-50 PLN</SelectItem>
                              <SelectItem value="50-100">50-100 PLN</SelectItem>
                              <SelectItem value="100-200">100-200 PLN</SelectItem>
                              <SelectItem value="200-500">200-500 PLN</SelectItem>
                              <SelectItem value="500+">500+ PLN</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="orderFrequency">Order Frequency</Label>
                          <Select
                            value={formData.customerInfo.orderFrequency}
                            onValueChange={(value) => handleNestedChange('customerInfo', 'orderFrequency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="How often do you order?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="occasionally">Occasionally</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userProfile?.customerInfo?.dietaryRestrictions?.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-500">Dietary Restrictions</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.customerInfo.dietaryRestrictions.map((restriction, index) => (
                              <Badge key={index} variant="secondary">
                                {restriction}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userProfile?.customerInfo?.allergies && (
                        <div>
                          <Label className="text-sm text-gray-500">Allergies</Label>
                          <p className="text-gray-700">{userProfile.customerInfo.allergies}</p>
                        </div>
                      )}
                      
                      {userProfile?.customerInfo?.preferredCategories?.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-500">Preferred Categories</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.customerInfo.preferredCategories.map((category, index) => (
                              <Badge key={index} variant="outline">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userProfile?.customerInfo?.budgetRange && (
                          <div>
                            <Label className="text-sm text-gray-500">Budget Range</Label>
                            <p className="font-medium">{userProfile.customerInfo.budgetRange} PLN</p>
                          </div>
                        )}
                        
                        {userProfile?.customerInfo?.orderFrequency && (
                          <div>
                            <Label className="text-sm text-gray-500">Order Frequency</Label>
                            <p className="font-medium">{userProfile.customerInfo.orderFrequency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Delivery Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Preferred Delivery Days</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={formData.customerInfo.deliveryPreferences.preferredDays.includes(day)}
                                onCheckedChange={() => handleArrayToggle('customerInfo', 'deliveryPreferences.preferredDays', day)}
                              />
                              <Label htmlFor={day} className="text-sm">{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="preferredTimes">Preferred Time</Label>
                        <Select
                          value={formData.customerInfo.deliveryPreferences.preferredTimes}
                          onValueChange={(value) => handleDeepNestedChange('customerInfo', 'deliveryPreferences', 'preferredTimes', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning (8-12)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12-17)</SelectItem>
                            <SelectItem value="evening">Evening (17-20)</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="specialInstructions">Special Instructions</Label>
                        <Textarea
                          id="specialInstructions"
                          value={formData.customerInfo.deliveryPreferences.specialInstructions}
                          onChange={(e) => handleDeepNestedChange('customerInfo', 'deliveryPreferences', 'specialInstructions', e.target.value)}
                          placeholder="Any special delivery instructions..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userProfile?.customerInfo?.deliveryPreferences?.preferredDays?.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-500">Preferred Delivery Days</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.customerInfo.deliveryPreferences.preferredDays.map((day, index) => (
                              <Badge key={index} variant="outline">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userProfile?.customerInfo?.deliveryPreferences?.preferredTimes && (
                        <div>
                          <Label className="text-sm text-gray-500">Preferred Time</Label>
                          <p className="font-medium">{userProfile.customerInfo.deliveryPreferences.preferredTimes}</p>
                        </div>
                      )}
                      
                      {userProfile?.customerInfo?.deliveryPreferences?.specialInstructions && (
                        <div>
                          <Label className="text-sm text-gray-500">Special Instructions</Label>
                          <p className="text-gray-700">{userProfile.customerInfo.deliveryPreferences.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Your Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Package className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.customerStats?.totalOrders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.customerStats?.totalSpent || 0}</p>
                      <p className="text-sm text-gray-600">Total Spent (PLN)</p>
                    </div>
                    
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold">{userProfile?.customerStats?.averageOrderValue || 0}</p>
                      <p className="text-sm text-gray-600">Avg Order (PLN)</p>
                    </div>
                    
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                      <p className="text-2xl font-bold">{formatDate(userProfile?.customerStats?.joinedDate || userProfile?.createdAt)}</p>
                      <p className="text-sm text-gray-600">Member Since</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="font-medium mb-3">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Updates</Label>
                          <p className="text-sm text-gray-500">Notifications about order status changes</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.email.orderUpdates}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'orderUpdates', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>New Messages</Label>
                          <p className="text-sm text-gray-500">Chat messages from other users</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.email.newMessages}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'newMessages', checked)}
                        />
                      </div>
                      
                      {isFarmer && (
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Low Stock Alerts</Label>
                            <p className="text-sm text-gray-500">When your products are running low</p>
                          </div>
                          <Switch
                            checked={formData.notificationPreferences.email.lowStock}
                            onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'lowStock', checked)}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Reviews</Label>
                          <p className="text-sm text-gray-500">New reviews and ratings</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.email.reviews}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'reviews', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Marketing</Label>
                          <p className="text-sm text-gray-500">Promotional offers and deals</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.email.marketing}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'marketing', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Newsletters</Label>
                          <p className="text-sm text-gray-500">Weekly newsletters and updates</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.email.newsletters}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'email', 'newsletters', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SMS Notifications */}
                  <div>
                    <h4 className="font-medium mb-3">SMS Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Updates</Label>
                          <p className="text-sm text-gray-500">Critical order status via SMS</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.sms.orderUpdates}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'sms', 'orderUpdates', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>New Messages</Label>
                          <p className="text-sm text-gray-500">Important messages via SMS</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.sms.newMessages}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'sms', 'newMessages', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* In-App Notifications */}
                  <div>
                    <h4 className="font-medium mb-3">In-App Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Updates</Label>
                          <p className="text-sm text-gray-500">Show notifications in the app</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.inApp.orderUpdates}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'inApp', 'orderUpdates', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>New Messages</Label>
                          <p className="text-sm text-gray-500">Chat notifications in the app</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.inApp.newMessages}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'inApp', 'newMessages', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Marketing</Label>
                          <p className="text-sm text-gray-500">Promotional notifications in app</p>
                        </div>
                        <Switch
                          checked={formData.notificationPreferences.inApp.marketing}
                          onCheckedChange={(checked) => handleDeepNestedChange('notificationPreferences', 'inApp', 'marketing', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email Notifications Display */}
                  <div>
                    <h4 className="font-medium mb-3">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Order Updates</span>
                        <Badge variant={userProfile?.notificationPreferences?.email?.orderUpdates ? "default" : "secondary"}>
                          {userProfile?.notificationPreferences?.email?.orderUpdates ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>New Messages</span>
                        <Badge variant={userProfile?.notificationPreferences?.email?.newMessages ? "default" : "secondary"}>
                          {userProfile?.notificationPreferences?.email?.newMessages ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Marketing</span>
                        <Badge variant={userProfile?.notificationPreferences?.email?.marketing ? "default" : "secondary"}>
                          {userProfile?.notificationPreferences?.email?.marketing ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SMS Notifications Display */}
                  <div>
                    <h4 className="font-medium mb-3">SMS Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Order Updates</span>
                        <Badge variant={userProfile?.notificationPreferences?.sms?.orderUpdates ? "default" : "secondary"}>
                          {userProfile?.notificationPreferences?.sms?.orderUpdates ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>New Messages</span>
                        <Badge variant={userProfile?.notificationPreferences?.sms?.newMessages ? "default" : "secondary"}>
                          {userProfile?.notificationPreferences?.sms?.newMessages ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                      </div>
                      <Switch
                        checked={formData.privacy.profilePublic}
                        onCheckedChange={(checked) => handleNestedChange('privacy', 'profilePublic', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Contact Information</Label>
                        <p className="text-sm text-gray-500">Allow others to see your contact details</p>
                      </div>
                      <Switch
                        checked={formData.privacy.showContactInfo}
                        onCheckedChange={(checked) => handleNestedChange('privacy', 'showContactInfo', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Messaging</Label>
                        <p className="text-sm text-gray-500">Let other users send you messages</p>
                      </div>
                      <Switch
                        checked={formData.privacy.allowMessaging}
                        onCheckedChange={(checked) => handleNestedChange('privacy', 'allowMessaging', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Share Location</Label>
                        <p className="text-sm text-gray-500">Share your general location for delivery</p>
                      </div>
                      <Switch
                        checked={formData.privacy.shareLocation}
                        onCheckedChange={(checked) => handleNestedChange('privacy', 'shareLocation', checked)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Profile Visibility</span>
                      <Badge variant={(userProfile?.privacy?.profilePublic ?? userProfile?.isPublic) ? "default" : "secondary"}>
                        {(userProfile?.privacy?.profilePublic ?? userProfile?.isPublic) ? "Public" : "Private"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Contact Information</span>
                      <Badge variant={userProfile?.privacy?.showContactInfo ? "default" : "secondary"}>
                        {userProfile?.privacy?.showContactInfo ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Allow Messaging</span>
                      <Badge variant={userProfile?.privacy?.allowMessaging ? "default" : "secondary"}>
                        {userProfile?.privacy?.allowMessaging ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Share Location</span>
                      <Badge variant={userProfile?.privacy?.shareLocation ? "default" : "secondary"}>
                        {userProfile?.privacy?.shareLocation ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-gray-500">Verify your email address for security</p>
                    </div>
                    <Badge variant={currentUser?.emailVerified ? "default" : "destructive"}>
                      {currentUser?.emailVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Account Created</Label>
                      <p className="text-sm text-gray-500">{formatDate(userProfile?.createdAt)}</p>
                    </div>
                    <Badge variant="outline">
                      v{userProfile?.registrationVersion || '1.0'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Last Login</Label>
                      <p className="text-sm text-gray-500">{formatDate(userProfile?.lastLoginAt)}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full">
                      Download My Data
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isFarmer ? (
              <>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Manage Products</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">View Orders</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">Farm Settings</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Browse Products</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Clock className="h-6 w-6" />
                  <span className="text-sm">Order History</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Heart className="h-6 w-6" />
                  <span className="text-sm">Favorites</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">Preferences</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (Development only) */}
      {import.meta.env.MODE === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-yellow-800 mb-2">
                Raw Profile Data
              </summary>
              <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;