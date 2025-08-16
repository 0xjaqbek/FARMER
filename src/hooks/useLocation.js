

// src/hooks/useLocation.js
import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  // Check if location is already stored
  useEffect(() => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        // Check if location is less than 1 hour old
        if (Date.now() - parsed.timestamp < 3600000) {
          setLocation(parsed);
        } else {
          localStorage.removeItem('userLocation');
        }
      } catch  {
        localStorage.removeItem('userLocation');
      }
    }

    // Check permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
      });
    }
  }, []);

  const requestLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }),
          (error) => {
            let message = 'Failed to get location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'Location access denied by user';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable';
                break;
              case error.TIMEOUT:
                message = 'Location request timed out';
                break;
            }
            reject(new Error(message));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
      
      // Store location with timestamp
      const locationData = {
        ...position,
        timestamp: Date.now()
      };
      
      setLocation(locationData);
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      setPermission('granted');
      
      return locationData;
    } catch (error) {
      setError(error.message);
      setPermission('denied');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem('userLocation');
  };

  return {
    location,
    loading,
    error,
    permission,
    requestLocation,
    clearLocation,
    hasLocation: !!location
  };
};

