// src/hooks/useLocation.js
import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const useLocation = () => {
  const { userProfile } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  // Load location from user profile on mount
  useEffect(() => {
    if (userProfile?.location?.coordinates) {
      setLocation({
        lat: userProfile.location.coordinates.lat,
        lng: userProfile.location.coordinates.lng,
        timestamp: userProfile.location.updatedAt?.toMillis() || Date.now()
      });
    } else {
      // Fallback to localStorage for backward compatibility
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
        } catch {
          localStorage.removeItem('userLocation');
        }
      }
    }

    // Check permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
      });
    }
  }, [userProfile]);

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
                setPermission('denied');
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
      
      // Store in localStorage for immediate use
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      // Store in database if user is logged in
      if (userProfile?.uid) {
        await saveLocationToDatabase(userProfile.uid, position);
      }
      
      setPermission('granted');
      
      return locationData;
    } catch (error) {
      setError(error.message);
      if (error.message.includes('denied')) {
        setPermission('denied');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Save location to Firestore user profile
  const saveLocationToDatabase = async (userId, coordinates) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.warn('User document does not exist:', userId);
        return;
      }

      await updateDoc(userRef, {
        'location.coordinates': {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        'location.updatedAt': new Date(),
        'location.accuracy': coordinates.accuracy || null
      });

      console.log('✅ Location saved to database for user:', userId);
    } catch (error) {
      console.error('❌ Error saving location to database:', error);
      // Don't throw error to prevent blocking location functionality
    }
  };

  const clearLocation = async () => {
    setLocation(null);
    localStorage.removeItem('userLocation');
    
    // Clear from database if user is logged in
    if (userProfile?.uid) {
      try {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, {
          'location.coordinates': null,
          'location.updatedAt': new Date()
        });
        console.log('✅ Location cleared from database');
      } catch (error) {
        console.error('❌ Error clearing location from database:', error);
      }
    }
  };

  return {
    location,
    loading,
    error,
    permission,
    requestLocation,
    clearLocation,
    hasLocation: !!(location?.lat && location?.lng)
  };
};