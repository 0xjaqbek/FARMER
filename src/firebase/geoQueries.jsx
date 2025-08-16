// Update src/firebase/geoQueries.js to use Google Maps
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  updateDoc,
  GeoPoint,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import GoogleMapsService from '../services/googleMapsService';

export class GeoQueries {
  
  // Get farmers within radius using Google Maps distance calculation
  static async getFarmersInRadius(centerLat, centerLng, radiusKm, additionalFilters = {}) {
    try {
      // Get all farmers first (we'll filter by distance client-side for accuracy)
      let farmersQuery = collection(db, 'users');
      const constraints = [
        where('role', '==', 'farmer')
      ];
      
      // Add additional filters
      if (additionalFilters.verified) {
        constraints.push(where('verified', '==', true));
      }
      
      const q = query(farmersQuery, ...constraints);
      const snapshot = await getDocs(q);
      
      // Filter by exact distance using Google Maps calculation
      const farmers = [];
      snapshot.docs.forEach(doc => {
        const farmer = { id: doc.id, ...doc.data() };
        const farmerLat = farmer.location?.coordinates?.lat || farmer.location?.coordinates?.latitude;
        const farmerLng = farmer.location?.coordinates?.lng || farmer.location?.coordinates?.longitude;
        
        if (farmerLat && farmerLng) {
          // Calculate exact distance using Google Maps service
          const distance = GoogleMapsService.calculateDistance(centerLat, centerLng, farmerLat, farmerLng);
          if (distance <= radiusKm) {
            farmers.push({
              ...farmer,
              distance
            });
          }
        }
      });
      
      // Sort by distance
      farmers.sort((a, b) => a.distance - b.distance);
      
      return farmers;
    } catch (error) {
      console.error('Error getting farmers in radius:', error);
      throw error;
    }
  }
  
  // Get products from farmers within radius
  static async getProductsInRadius(centerLat, centerLng, radiusKm, filters = {}) {
    try {
      // First get farmers in radius
      const farmers = await this.getFarmersInRadius(centerLat, centerLng, radiusKm, {
        verified: filters.verifiedOnly
      });
      
      if (farmers.length === 0) {
        return { products: [], farmers: [] };
      }
      
      // Get products from these farmers
      const farmerIds = farmers.map(f => f.id);
      const products = [];
      
      // Batch query products by farmer (Firebase 'in' queries limited to 10 items)
      const batchSize = 10;
      for (let i = 0; i < farmerIds.length; i += batchSize) {
        const batchIds = farmerIds.slice(i, i + batchSize);
        
        let productsQuery = collection(db, 'products');
        const constraints = [
          where('farmerId', 'in', batchIds),
          where('status', '==', 'active')
        ];
        
        // Add product filters
        if (filters.categories?.length > 0) {
          constraints.push(where('category', 'in', filters.categories));
        }
        
        if (filters.organic) {
          constraints.push(where('isOrganic', '==', true));
        }
        
        if (filters.priceRange) {
          constraints.push(where('price', '>=', filters.priceRange[0]));
          constraints.push(where('price', '<=', filters.priceRange[1]));
        }
        
        const q = query(productsQuery, ...constraints);
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const product = { id: doc.id, ...doc.data() };
          const farmer = farmers.find(f => f.id === product.farmerId);
          
          if (farmer) {
            products.push({
              ...product,
              distance: farmer.distance,
              farmerLocation: farmer.location,
              farmName: farmer.farmName || farmer.displayName,
              farmerName: farmer.displayName,
              farmerVerified: farmer.verified
            });
          }
        });
      }
      
      return { products, farmers };
    } catch (error) {
      console.error('Error getting products in radius:', error);
      throw error;
    }
  }
  
  // Update farmer location with Google Maps geocoding
  static async updateFarmerLocation(farmerId, lat, lng, address = '') {
    try {
      console.log('🔥 Starting location update for farmer:', farmerId);
      console.log('📍 Location data:', { lat, lng, address });
      
      if (!farmerId) {
        throw new Error('Farmer ID is required');
      }
      
      if (!lat || !lng) {
        throw new Error('Latitude and longitude are required');
      }
      
      const farmerRef = doc(db, 'users', farmerId);
      console.log('📄 Farmer document reference:', farmerRef.path);
      
      // Check if user exists first
      const farmerDoc = await getDoc(farmerRef);
      if (!farmerDoc.exists()) {
        throw new Error(`Farmer document does not exist: ${farmerId}`);
      }
      
      console.log('✅ Farmer document exists');
      
      // Prepare location data
      const locationData = {
        'location.coordinates.lat': lat,
        'location.coordinates.lng': lng,
        'location.address': address,
        'location.updatedAt': serverTimestamp()
      };
      
      console.log('💾 Updating with data:', locationData);
      
      // Update the document
      await updateDoc(farmerRef, locationData);
      
      console.log('✅ Location update successful!');
      
      // Verify the update by reading back
      const updatedDoc = await getDoc(farmerRef);
      const updatedData = updatedDoc.data();
      
      console.log('🔍 Verification - Updated location:', updatedData.location);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating farmer location:', error);
      console.error('📝 Error details:', {
        code: error.code,
        message: error.message,
        farmerId,
        lat,
        lng,
        address
      });
      throw error;
    }
  }

    // Debug function to check current location
  static async getFarmerLocation(farmerId) {
    try {
      console.log('🔍 Getting farmer location for:', farmerId);
      
      const farmerRef = doc(db, 'users', farmerId);
      const farmerDoc = await getDoc(farmerRef);
      
      if (!farmerDoc.exists()) {
        console.log('❌ Farmer document does not exist');
        return null;
      }
      
      const farmerData = farmerDoc.data();
      console.log('📄 Full farmer data:', farmerData);
      console.log('📍 Current location:', farmerData.location);
      
      return farmerData.location;
    } catch (error) {
      console.error('❌ Error getting farmer location:', error);
      throw error;
    }
  }

  // Geocode address using Google Maps and save
  static async geocodeAndSaveFarmerAddress(farmerId, address) {
    try {
      const geocodeResult = await GoogleMapsService.geocodeAddress(address);
      
      await this.updateFarmerLocation(
        farmerId,
        geocodeResult.lat,
        geocodeResult.lng,
        geocodeResult.formatted_address
      );
      
      return geocodeResult;
    } catch (error) {
      console.error('Error geocoding and saving farmer address:', error);
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
}