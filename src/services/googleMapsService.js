// src/services/googleMapsService.js - Improved version with better loading
class GoogleMapsService {
  static isLoaded = false;
  static loadPromise = null;
  static scriptElement = null;
  static retryCount = 0;
  static maxRetries = 3;

  static async loadGoogleMaps() {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Return immediately if already loaded and available
    if (this.isLoaded && this.isFullyAvailable()) {
      return Promise.resolve(window.google);
    }

    console.log('📍 Starting Google Maps API load...');

    this.loadPromise = new Promise((resolve, reject) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
        reject(new Error('Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.'));
        return;
      }

      // Check if script already exists
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        console.log('📍 Google Maps script already exists, waiting for load...');
        this.waitForGoogleMaps(resolve, reject);
        return;
      }

      console.log('📍 Loading Google Maps API...');

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';

      // Create global callback
      window.initGoogleMaps = () => {
        console.log('✅ Google Maps API loaded via callback');
        this.isLoaded = true;
        this.scriptElement = script;
        
        // Wait a bit more to ensure everything is ready
        setTimeout(() => {
          if (this.isFullyAvailable()) {
            resolve(window.google);
          } else {
            console.warn('⚠️ Google Maps loaded but not fully available, retrying...');
            this.waitForGoogleMaps(resolve, reject);
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps API:', error);
        this.cleanup();
        
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Retrying Google Maps load (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => {
            this.loadPromise = null;
            this.loadGoogleMaps().then(resolve).catch(reject);
          }, 1000 * this.retryCount);
        } else {
          reject(new Error('Failed to load Google Maps API after multiple attempts. Please check your API key and internet connection.'));
        }
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Enhanced availability check
  static isFullyAvailable() {
    return !!(
      window.google && 
      window.google.maps && 
      window.google.maps.Map && 
      window.google.maps.Marker && 
      window.google.maps.InfoWindow &&
      window.google.maps.LatLngBounds
    );
  }

  // Wait for Google Maps to be fully available
  static waitForGoogleMaps(resolve, reject, attempts = 0) {
    const maxAttempts = 50; // 5 seconds total
    
    if (this.isFullyAvailable()) {
      console.log('✅ Google Maps fully available');
      this.isLoaded = true;
      resolve(window.google);
      return;
    }

    if (attempts >= maxAttempts) {
      console.error('❌ Timeout waiting for Google Maps to be available');
      reject(new Error('Timeout waiting for Google Maps API to be fully available'));
      return;
    }

    setTimeout(() => {
      this.waitForGoogleMaps(resolve, reject, attempts + 1);
    }, 100);
  }

  // Check if Google Maps is available
  static isAvailable() {
    return this.isLoaded && this.isFullyAvailable();
  }

  // Get loading status
  static getLoadingStatus() {
    if (this.isAvailable()) return 'loaded';
    if (this.loadPromise) return 'loading';
    return 'not_loaded';
  }

  // Cleanup function
  static cleanup() {
    this.loadPromise = null;
    this.isLoaded = false;
    this.retryCount = 0;
    
    // Clean up callback
    if (window.initGoogleMaps) {
      delete window.initGoogleMaps;
    }
    
    // Remove script if it exists
    const script = document.getElementById('google-maps-script');
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  // Geocode address to coordinates
  static async geocodeAddress(address) {
    try {
      await this.loadGoogleMaps();
      
      if (!this.isFullyAvailable()) {
        throw new Error('Google Maps not fully loaded');
      }
      
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const formattedAddress = results[0].formatted_address;
            
            // Extract address components
            const addressComponents = this.parseAddressComponents(results[0].address_components);
            
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: formattedAddress,
              ...addressComponents,
              place_id: results[0].place_id
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  // Reverse geocode coordinates to address
  static async reverseGeocode(lat, lng) {
    try {
      await this.loadGoogleMaps();
      
      if (!this.isFullyAvailable()) {
        throw new Error('Google Maps not fully loaded');
      }
      
      const geocoder = new window.google.maps.Geocoder();
      const latlng = new window.google.maps.LatLng(lat, lng);
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const formattedAddress = results[0].formatted_address;
            const addressComponents = this.parseAddressComponents(results[0].address_components);
            
            resolve({
              formatted_address: formattedAddress,
              ...addressComponents,
              place_id: results[0].place_id
            });
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  // Parse address components
  static parseAddressComponents(components) {
    const result = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        result.street_number = component.long_name;
      } else if (types.includes('route')) {
        result.route = component.long_name;
      } else if (types.includes('locality')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.long_name;
        result.country_code = component.short_name;
      } else if (types.includes('postal_code')) {
        result.postal_code = component.long_name;
      }
    });
    
    return result;
  }

  // Calculate distance between two points
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  // Get directions between two points
  static async getDirections(origin, destination, travelMode = 'DRIVING') {
    try {
      await this.loadGoogleMaps();
      
      if (!this.isFullyAvailable()) {
        throw new Error('Google Maps not fully loaded');
      }
      
      const directionsService = new window.google.maps.DirectionsService();
      
      return new Promise((resolve, reject) => {
        directionsService.route({
          origin,
          destination,
          travelMode: window.google.maps.TravelMode[travelMode]
        }, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }
}

export default GoogleMapsService;