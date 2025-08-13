// src/hooks/useLocation.js
// Custom hook for location management

import { useState, useEffect } from 'react';
import { LocationService } from '../services/locationService';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Request location permission and get current location
  const requestLocation = async () => {
    if (!isSupported) {
      setError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await LocationService.getCurrentLocation();
      setLocation({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy
      });
      setPermission('granted');
    } catch (error) {
      setError(error);
      if (error.message.includes('denied')) {
        setPermission('denied');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get location from stored user profile
  const getStoredLocation = () => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setLocation(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing stored location:', error);
      }
    }
    return null;
  };

  // Store location for future use
  const storeLocation = (locationData) => {
    try {
      localStorage.setItem('userLocation', JSON.stringify(locationData));
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  // Update location with new coordinates
  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    storeLocation(newLocation);
  };

  // Calculate distance to another location
  const calculateDistanceTo = (targetLocation) => {
    if (!location || !targetLocation) return null;
    
    return LocationService.calculateDistance(
      location.lat,
      location.lng,
      targetLocation.lat,
      targetLocation.lng
    );
  };

  // Get nearby farmers
  const getNearbyFarmers = async (maxDistance = 50) => {
    if (!location) return [];
    
    try {
      return await LocationService.findNearbyFarmers(location, maxDistance);
    } catch (error) {
      console.error('Error getting nearby farmers:', error);
      return [];
    }
  };

  // Check permission status on mount
  useEffect(() => {
    if (isSupported && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state);
          
          // If permission is granted, try to get stored location
          if (result.state === 'granted') {
            getStoredLocation();
          }
        })
        .catch((error) => {
          console.error('Error checking geolocation permission:', error);
        });
    } else {
      // Fallback: try to get stored location
      getStoredLocation();
    }
  }, [isSupported]);

  return {
    location,
    loading,
    error,
    permission,
    isSupported,
    requestLocation,
    updateLocation,
    calculateDistanceTo,
    getNearbyFarmers,
    getStoredLocation,
    storeLocation
  };
}