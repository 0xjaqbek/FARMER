import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Loader2, Navigation, AlertCircle } from 'lucide-react';
import AddressPicker from './AddressPicker';
import { GeoQueries } from '../../firebase/geoQueries';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const EnhancedLocationPicker = ({ onLocationSet, showMap = false }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [debugging, setDebugging] = useState(false);

  // Load existing farmer location
  useEffect(() => {
    loadExistingLocation();
  }, [userProfile]);

  // Load existing location from Firebase
  const loadExistingLocation = async () => {
    try {
      if (!userProfile?.uid) return;
      
      console.log('🔍 Loading existing location for user:', userProfile.uid);
      
      // Check current user profile first
      if (userProfile.location?.coordinates) {
        const coords = userProfile.location.coordinates;
        console.log('📍 Found location in userProfile:', coords);
        
        setSelectedLocation({
          address: userProfile.location.address || 'Saved location',
          coordinates: {
            lat: coords.latitude || coords.lat,
            lng: coords.longitude || coords.lng
          }
        });
      } else {
        // Try to fetch from Firebase directly
        const location = await GeoQueries.getFarmerLocation(userProfile.uid);
        if (location?.coordinates) {
          console.log('📍 Found location in Firebase:', location);
          setSelectedLocation({
            address: location.address || 'Saved location',
            coordinates: {
              lat: location.coordinates.lat,
              lng: location.coordinates.lng
            }
          });
        } else {
          console.log('❌ No location found for user');
        }
      }
    } catch (error) {
      console.error('Error loading existing location:', error);
    }
  };

  // Get user's current location for better suggestions
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000
          });
        });

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        // Silent fail - location suggestions will just be less accurate
        console.log('Could not get user location for suggestions:', error.message);
      }
    };

    getCurrentLocation();
  }, []);

  // Handle address selection
  const handleAddressSelect = (locationData) => {
    console.log('📍 Address selected:', locationData);
    
    if (locationData) {
      setSelectedLocation(locationData);
      setLocationError(null);
    } else {
      setSelectedLocation(null);
    }
  };

  // Debug current location
  const handleDebugLocation = async () => {
    try {
      setDebugging(true);
      
      if (!userProfile?.uid) {
        toast({
          title: "Error",
          description: "No user ID found",
          variant: "destructive"
        });
        return;
      }
      
      const location = await GeoQueries.getFarmerLocation(userProfile.uid);
      
      toast({
        title: "Debug Info",
        description: `Location: ${location ? 'Found' : 'Not found'}. Check console for details.`,
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDebugging(false);
    }
  };

  // Save location to Firebase
  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      setLocationError('Please select a location first');
      return;
    }

    if (!userProfile?.uid) {
      setLocationError('User not authenticated');
      return;
    }

    try {
      setSaving(true);
      setLocationError(null);

      console.log('💾 Saving location for user:', userProfile.uid);
      console.log('📍 Location to save:', selectedLocation);

      await GeoQueries.updateFarmerLocation(
        userProfile.uid,
        selectedLocation.coordinates.lat,
        selectedLocation.coordinates.lng,
        selectedLocation.address
      );

      toast({
        title: "Location Saved",
        description: "Your farm location has been updated successfully",
      });

      if (onLocationSet) {
        onLocationSet(selectedLocation);
      }

      // Reload the location to verify it was saved
      setTimeout(() => {
        loadExistingLocation();
      }, 1000);

    } catch (error) {
      console.error('Error saving location:', error);
      setLocationError(`Failed to save location: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to save location: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to set your farm location.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Your Farm Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Section */}
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Debug Info</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugLocation}
                disabled={debugging}
              >
                {debugging ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Current Location'
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-600">
              <p>User ID: {userProfile.uid}</p>
              <p>User Role: {userProfile.role}</p>
              <p>Current Location: {selectedLocation ? 'Set' : 'Not set'}</p>
            </div>
          </div>

          {/* Address Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Farm Address</label>
            <AddressPicker
              value={selectedLocation?.address || ''}
              onChange={handleAddressSelect}
              placeholder="Enter your farm address..."
              userLocation={userLocation}
              showCurrentLocationButton={true}
            />
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Selected Location:</strong></p>
                  <p className="text-sm">{selectedLocation.address}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Lat: {selectedLocation.coordinates.lat.toFixed(6)}
                    </Badge>
                    <Badge variant="outline">
                      Lng: {selectedLocation.coordinates.lng.toFixed(6)}
                    </Badge>
                  </div>
                  {selectedLocation.details && (
                    <div className="text-xs text-gray-600">
                      <p>City: {selectedLocation.details.city || 'N/A'}</p>
                      <p>State: {selectedLocation.details.state || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <Button 
            onClick={handleSaveLocation}
            disabled={!selectedLocation || saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Location...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Save Farm Location
              </>
            )}
          </Button>

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Why set your location?</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Customers can find you in location-based searches</li>
              <li>Accurate delivery distance calculations</li>
              <li>Better visibility in local search results</li>
              <li>Show up on the farmers map</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Mini Map Preview */}
      {showMap && selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Map preview would appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedLocationPicker;