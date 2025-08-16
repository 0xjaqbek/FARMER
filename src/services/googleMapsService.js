// src/services/googleMapsService.js
class GoogleMapsService {
  static isLoaded = false;
  static loadPromise = null;

  // Load Google Maps API
  static async loadGoogleMaps() {
    if (this.isLoaded) {
      return window.google;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        resolve(window.google);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve(window.google);
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Geocode address to coordinates
  static async geocodeAddress(address) {
    try {
      await this.loadGoogleMaps();
      
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
    const result = {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      country: '',
      postal_code: ''
    };

    components.forEach(component => {
      const type = component.types[0];
      if (Object.prototype.hasOwnProperty.call(result, type)) {
        result[type] = component.long_name;
      }
    });

    return {
      street_address: `${result.street_number} ${result.route}`.trim(),
      city: result.locality,
      state: result.administrative_area_level_1,
      country: result.country,
      postal_code: result.postal_code
    };
  }

  // Get place suggestions
  static async getPlaceSuggestions(input, location = null) {
    try {
      await this.loadGoogleMaps();
      
      const service = new window.google.maps.places.AutocompleteService();
      
      const request = {
        input,
        types: ['address'],
        componentRestrictions: { country: 'pl' } // Restrict to Poland
      };

      if (location) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng);
        request.radius = 50000; // 50km radius
      }

      return new Promise((resolve) => {
        service.getPlacePredictions(request, (predictions, status) => {
          if (status === 'OK' && predictions) {
            resolve(predictions.map(prediction => ({
              description: prediction.description,
              place_id: prediction.place_id,
              types: prediction.types
            })));
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error getting place suggestions:', error);
      return [];
    }
  }

  // Get place details by place_id
  static async getPlaceDetails(placeId) {
    try {
      await this.loadGoogleMaps();
      
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      return new Promise((resolve, reject) => {
        service.getDetails({
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'name']
        }, (place, status) => {
          if (status === 'OK' && place) {
            const location = place.geometry.location;
            const addressComponents = this.parseAddressComponents(place.address_components);
            
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: place.formatted_address,
              name: place.name,
              ...addressComponents,
              place_id: placeId
            });
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  // Calculate distance between two points
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Format distance for display
  static formatDistance(kilometers) {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    } else if (kilometers < 10) {
      return `${kilometers.toFixed(1)}km`;
    } else {
      return `${Math.round(kilometers)}km`;
    }
  }
}

export default GoogleMapsService;

