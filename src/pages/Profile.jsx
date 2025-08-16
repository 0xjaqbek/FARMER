// src/pages/Profile.jsx - Enhanced with full edit capabilities
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  EyeOff
} from 'lucide-react';

const Profile = () => {
  const { _currentUser, userProfile, updateUserProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [_showPassword, _setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    
    // Role and Business Info
    role: '',
    farmName: '',
    farmDescription: '',
    businessRegistration: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Poland'
    },
    
    // Farm Location (for farmers)
    farmLocation: {
      coordinates: { lat: 0, lng: 0 },
      address: '',
      region: ''
    },
    
    // Settings and Preferences
    isPublic: true,
    isVerified: false,
    acceptsOrders: true,
    deliveryAvailable: false,
    deliveryRadius: 10,
    
    // Notification Preferences
    notificationPreferences: {
      email: {
        orderUpdates: true,
        newMessages: true,
        lowStock: true,
        reviews: true,
        marketing: false
      },
      sms: {
        orderUpdates: false,
        newMessages: false,
        lowStock: true,
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
    
    // Additional Information
    bio: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  useEffect(() => {
    if (userProfile) {
      console.log('Loading profile data:', userProfile);
      setFormData({
        // Basic Information
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        
        // Role and Business Info
        role: userProfile.role || 'klient',
        farmName: userProfile.farmName || '',
        farmDescription: userProfile.farmDescription || '',
        businessRegistration: userProfile.businessRegistration || '',
        
        // Address Information
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          postalCode: userProfile.address?.postalCode || userProfile.postalCode || '',
          country: userProfile.address?.country || 'Poland'
        },
        
        // Farm Location
        farmLocation: {
          coordinates: userProfile.farmLocation?.coordinates || { lat: 0, lng: 0 },
          address: userProfile.farmLocation?.address || '',
          region: userProfile.farmLocation?.region || ''
        },
        
        // Settings and Preferences
        isPublic: userProfile.isPublic ?? true,
        isVerified: userProfile.isVerified || false,
        acceptsOrders: userProfile.acceptsOrders ?? true,
        deliveryAvailable: userProfile.deliveryAvailable || false,
        deliveryRadius: userProfile.deliveryRadius || 10,
        
        // Notification Preferences
        notificationPreferences: {
          email: {
            orderUpdates: userProfile.notificationPreferences?.email?.orderUpdates ?? true,
            newMessages: userProfile.notificationPreferences?.email?.newMessages ?? true,
            lowStock: userProfile.notificationPreferences?.email?.lowStock ?? true,
            reviews: userProfile.notificationPreferences?.email?.reviews ?? true,
            marketing: userProfile.notificationPreferences?.email?.marketing ?? false
          },
          sms: {
            orderUpdates: userProfile.notificationPreferences?.sms?.orderUpdates ?? false,
            newMessages: userProfile.notificationPreferences?.sms?.newMessages ?? false,
            lowStock: userProfile.notificationPreferences?.sms?.lowStock ?? true,
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
        
        // Additional Information
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        socialMedia: {
          facebook: userProfile.socialMedia?.facebook || '',
          instagram: userProfile.socialMedia?.instagram || '',
          twitter: userProfile.socialMedia?.twitter || ''
        }
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
    } catch  {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare update data by removing empty objects and cleaning up
      const updateData = {
        ...formData,
        updatedAt: new Date(),
        profileComplete: true
      };
      
      // Clean up empty nested objects
      if (Object.values(updateData.address).every(val => !val)) {
        updateData.address = { country: 'Poland' };
      }
      
      console.log('Updating profile with data:', updateData);
      
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

  const isFarmer = formData.role === 'rolnik' || formData.role === 'farmer';

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
                  // Reset form data to current profile
                  if (userProfile) {
                    setFormData(prev => ({ ...prev, ...userProfile }));
                  }
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

      {editing ? (
        /* EDIT MODE */
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required 
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    disabled // Email usually can't be changed
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
                
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
            </CardContent>
          </Card>

          {/* Role and Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Role & Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Account Type</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="klient">Customer (Klient)</SelectItem>
                    <SelectItem value="rolnik">Farmer (Rolnik)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isFarmer && (
                <>
                  <div>
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input 
                      id="farmName"
                      value={formData.farmName}
                      onChange={(e) => handleInputChange('farmName', e.target.value)}
                      placeholder="Your farm name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="farmDescription">Farm Description</Label>
                    <Textarea 
                      id="farmDescription"
                      value={formData.farmDescription}
                      onChange={(e) => handleInputChange('farmDescription', e.target.value)}
                      placeholder="Describe your farm, what you grow, your farming practices..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="businessRegistration">Business Registration Number</Label>
                    <Input 
                      id="businessRegistration"
                      value={formData.businessRegistration}
                      onChange={(e) => handleInputChange('businessRegistration', e.target.value)}
                      placeholder="Your business registration number (if applicable)"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Farmer Settings */}
          {isFarmer && (
            <Card>
              <CardHeader>
                <CardTitle>Farm Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    checked={formData.deliveryAvailable}
                    onCheckedChange={(checked) => handleInputChange('deliveryAvailable', checked)}
                  />
                </div>
                
                {formData.deliveryAvailable && (
                  <div>
                    <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                    <Input 
                      id="deliveryRadius"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.deliveryRadius}
                      onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value) || 10)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact & Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input 
                    id="facebook"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                    placeholder="Facebook username or URL"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input 
                    id="instagram"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                    placeholder="Instagram username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input 
                    id="twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                    placeholder="Twitter username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </form>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          
          {/* Basic Information Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      {userProfile?.isVerified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
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
                  
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {userProfile?.phone || 'Not provided'}
                    </p>
                  </div>
                  
                  {userProfile?.bio && (
                    <div>
                      <Label className="text-sm text-gray-500">Bio</Label>
                      <p className="text-gray-700">{userProfile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farm Information (for farmers) */}
          {isFarmer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Farm Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Farm Name</Label>
                      <p className="font-medium">{userProfile?.farmName || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Business Registration</Label>
                      <p className="font-medium">{userProfile?.businessRegistration || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Accepts Orders</Label>
                      <Badge variant={userProfile?.acceptsOrders ? "default" : "secondary"}>
                        {userProfile?.acceptsOrders ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Delivery Available</Label>
                      <Badge variant={userProfile?.deliveryAvailable ? "default" : "secondary"}>
                        {userProfile?.deliveryAvailable ? `Yes (${userProfile?.deliveryRadius}km)` : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {userProfile?.farmDescription && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-500">Farm Description</Label>
                    <p className="text-gray-700 mt-1">{userProfile.farmDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Contact & Social Media */}
          {(userProfile?.website || userProfile?.socialMedia?.facebook || userProfile?.socialMedia?.instagram || userProfile?.socialMedia?.twitter) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact & Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile?.website && (
                  <div>
                    <Label className="text-sm text-gray-500">Website</Label>
                    <p>
                      <a 
                        href={userProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {userProfile.website}
                      </a>
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userProfile?.socialMedia?.facebook && (
                    <div>
                      <Label className="text-sm text-gray-500">Facebook</Label>
                      <p className="font-medium">{userProfile.socialMedia.facebook}</p>
                    </div>
                  )}
                  
                  {userProfile?.socialMedia?.instagram && (
                    <div>
                      <Label className="text-sm text-gray-500">Instagram</Label>
                      <p className="font-medium">@{userProfile.socialMedia.instagram}</p>
                    </div>
                  )}
                  
                  {userProfile?.socialMedia?.twitter && (
                    <div>
                      <Label className="text-sm text-gray-500">Twitter</Label>
                      <p className="font-medium">@{userProfile.socialMedia.twitter}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-gray-500">Member Since</Label>
                  <p className="font-medium">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-500">Last Updated</Label>
                  <p className="font-medium">
                    {userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Profile Visibility</Label>
                    <p className="text-sm text-gray-500">Control who can see your profile</p>
                  </div>
                  <Badge variant={userProfile?.isPublic ? "default" : "secondary"}>
                    {userProfile?.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Account Status</Label>
                    <p className="text-sm text-gray-500">Your account verification status</p>
                  </div>
                  <Badge variant={userProfile?.isVerified ? "default" : "secondary"}>
                    {userProfile?.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Profile Complete</Label>
                    <p className="text-sm text-gray-500">Profile completion status</p>
                  </div>
                  <Badge variant={userProfile?.profileComplete ? "default" : "secondary"}>
                    {userProfile?.profileComplete ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};

export default Profile;