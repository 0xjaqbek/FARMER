// src/services/farmerService.js
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export class FarmerService {
  // Get farmer profile with enhanced data
  static async getFarmerProfile(farmerId) {
    try {
      const farmerDoc = await getDoc(doc(db, 'users', farmerId));
      
      if (!farmerDoc.exists()) {
        throw new Error('Farmer not found');
      }

      const farmerData = { id: farmerDoc.id, ...farmerDoc.data() };
      
      // Verify it's actually a farmer
      if (!['farmer', 'rolnik'].includes(farmerData.role)) {
        throw new Error('User is not a farmer');
      }

      return farmerData;
    } catch (error) {
      console.error('Error getting farmer profile:', error);
      throw error;
    }
  }

  // Get farmer's products
  static async getFarmerProducts(farmerId, options = {}) {
    try {
      const { 
        activeOnly = true, 
        limit: limitCount = null,
        orderByField = 'createdAt',
        orderDirection = 'desc'
      } = options;

      // Try farmerId first
      let q = query(collection(db, 'products'), where('farmerId', '==', farmerId));
      
      if (activeOnly) {
        q = query(q, where('status', '==', 'active'));
      }
      
      q = query(q, orderBy(orderByField, orderDirection));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      let snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no products found with farmerId, try rolnikId
      if (products.length === 0) {
        q = query(collection(db, 'products'), where('rolnikId', '==', farmerId));
        
        if (activeOnly) {
          q = query(q, where('status', '==', 'active'));
        }
        
        q = query(q, orderBy(orderByField, orderDirection));
        
        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        snapshot = await getDocs(q);
        products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      return products;
    } catch (error) {
      console.error('Error getting farmer products:', error);
      throw error;
    }
  }

  // Get farmer reviews and ratings
  static async getFarmerReviews(farmerId, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('farmerId', '==', farmerId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return reviews;
    } catch (error) {
      console.error('Error getting farmer reviews:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Calculate farmer statistics
  static async getFarmerStats(farmerId, products = []) {
    try {
      // Get all reviews for rating calculation
      const allReviewsQuery = query(
        collection(db, 'reviews'),
        where('farmerId', '==', farmerId),
        where('status', '==', 'published')
      );
      
      const reviewsSnapshot = await getDocs(allReviewsQuery);
      const allReviews = reviewsSnapshot.docs.map(doc => doc.data());
      
      const averageRating = allReviews.length > 0 
        ? allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length
        : 0;

      // Count orders
      let totalOrders = 0;
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('farmerId', '==', farmerId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        totalOrders = ordersSnapshot.size;
      } catch (error) {
        // Orders collection might not exist
        console.warn('Could not load order stats:', error);
      }

      // Calculate total revenue (from completed orders)
      let totalRevenue = 0;
      try {
        const completedOrdersQuery = query(
          collection(db, 'orders'),
          where('farmerId', '==', farmerId),
          where('status', '==', 'delivered')
        );
        const completedOrdersSnapshot = await getDocs(completedOrdersQuery);
        
        completedOrdersSnapshot.docs.forEach(doc => {
          const order = doc.data();
          totalRevenue += order.totalPrice || 0;
        });
      } catch (error) {
        console.warn('Could not calculate revenue:', error);
      }

      return {
        totalProducts: products.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: allReviews.length,
        totalOrders,
        totalRevenue,
        responseTime: '2-4 hours', // This would be calculated from message response times
        joinDate: null // This would come from farmer registration date
      };

    } catch (error) {
      console.error('Error calculating farmer stats:', error);
      return {
        totalProducts: products.length,
        averageRating: 0,
        totalReviews: 0,
        totalOrders: 0,
        totalRevenue: 0,
        responseTime: 'N/A',
        joinDate: null
      };
    }
  }

  // Follow/unfollow farmer
  static async followFarmer(customerId, farmerId) {
    try {
      const customerRef = doc(db, 'users', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }

      const customerData = customerDoc.data();
      const followedFarmers = customerData.followedFarmers || [];
      
      if (followedFarmers.includes(farmerId)) {
        throw new Error('Already following this farmer');
      }

      await updateDoc(customerRef, {
        followedFarmers: [...followedFarmers, farmerId],
        updatedAt: serverTimestamp()
      });

      // Optionally update farmer's follower count
      try {
        const farmerRef = doc(db, 'users', farmerId);
        const farmerDoc = await getDoc(farmerRef);
        
        if (farmerDoc.exists()) {
          const farmerData = farmerDoc.data();
          const currentFollowers = farmerData.farmerStats?.followers || 0;
          
          await updateDoc(farmerRef, {
            'farmerStats.followers': currentFollowers + 1,
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.warn('Could not update farmer follower count:', error);
      }

      return true;
    } catch (error) {
      console.error('Error following farmer:', error);
      throw error;
    }
  }

  // Unfollow farmer
  static async unfollowFarmer(customerId, farmerId) {
    try {
      const customerRef = doc(db, 'users', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }

      const customerData = customerDoc.data();
      const followedFarmers = customerData.followedFarmers || [];
      
      if (!followedFarmers.includes(farmerId)) {
        throw new Error('Not following this farmer');
      }

      const updatedFollowedFarmers = followedFarmers.filter(id => id !== farmerId);

      await updateDoc(customerRef, {
        followedFarmers: updatedFollowedFarmers,
        updatedAt: serverTimestamp()
      });

      // Update farmer's follower count
      try {
        const farmerRef = doc(db, 'users', farmerId);
        const farmerDoc = await getDoc(farmerRef);
        
        if (farmerDoc.exists()) {
          const farmerData = farmerDoc.data();
          const currentFollowers = farmerData.farmerStats?.followers || 0;
          
          await updateDoc(farmerRef, {
            'farmerStats.followers': Math.max(0, currentFollowers - 1),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.warn('Could not update farmer follower count:', error);
      }

      return true;
    } catch (error) {
      console.error('Error unfollowing farmer:', error);
      throw error;
    }
  }

  // Check if customer is following farmer
  static async isFollowingFarmer(customerId, farmerId) {
    try {
      const customerDoc = await getDoc(doc(db, 'users', customerId));
      
      if (!customerDoc.exists()) {
        return false;
      }

      const customerData = customerDoc.data();
      const followedFarmers = customerData.followedFarmers || [];
      
      return followedFarmers.includes(farmerId);
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get farmer's location for map display
  static extractFarmerCoordinates(farmer) {
    if (!farmer.location) return null;
    
    // Handle nested coordinates (schema format)
    if (farmer.location.coordinates?.lat && farmer.location.coordinates?.lng) {
      return {
        lat: farmer.location.coordinates.lat,
        lng: farmer.location.coordinates.lng
      };
    }
    
    // Handle direct lat/lng (current data format)
    if (farmer.location.lat && farmer.location.lng) {
      return {
        lat: farmer.location.lat,
        lng: farmer.location.lng
      };
    }
    
    return null;
  }

  // Search farmers
  static async searchFarmers(options = {}) {
    try {
      const {
        searchQuery = '',
        location = null,
        maxDistance = 50,
        verified = null,
        specialties = [],
        certifications = [],
        limit: limitCount = 20
      } = options;

      // Base query for farmers
      let q = query(
        collection(db, 'users'),
        where('role', 'in', ['farmer', 'rolnik'])
      );

      if (verified !== null) {
        q = query(q, where('isVerified', '==', verified));
      }

      const snapshot = await getDocs(q);
      let farmers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply text search filter
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().split(/\s+/);
        farmers = farmers.filter(farmer => {
          const searchableText = [
            farmer.farmInfo?.farmName || '',
            farmer.displayName || '',
            farmer.farmInfo?.description || '',
            farmer.location?.address || '',
            ...(farmer.farmInfo?.specialties || []),
            ...(farmer.farmInfo?.certifications || [])
          ].join(' ').toLowerCase();

          return searchTerms.every(term => searchableText.includes(term));
        });
      }

      // Apply specialty filter
      if (specialties.length > 0) {
        farmers = farmers.filter(farmer => {
          const farmerSpecialties = farmer.farmInfo?.specialties || [];
          return specialties.some(specialty => 
            farmerSpecialties.some(fs => 
              fs.toLowerCase().includes(specialty.toLowerCase())
            )
          );
        });
      }

      // Apply certification filter
      if (certifications.length > 0) {
        farmers = farmers.filter(farmer => {
          const farmerCertifications = farmer.farmInfo?.certifications || [];
          return certifications.some(cert => 
            farmerCertifications.some(fc => 
              fc.toLowerCase().includes(cert.toLowerCase())
            )
          );
        });
      }

      // Apply location filter if provided
      if (location) {
        farmers = farmers.filter(farmer => {
          const farmerCoords = this.extractFarmerCoordinates(farmer);
          if (!farmerCoords) return false;

          const distance = this.calculateDistance(
            location.lat,
            location.lng,
            farmerCoords.lat,
            farmerCoords.lng
          );

          farmer.distance = Math.round(distance * 10) / 10;
          return distance <= maxDistance;
        }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      // Apply limit
      if (limitCount && farmers.length > limitCount) {
        farmers = farmers.slice(0, limitCount);
      }

      return farmers;
    } catch (error) {
      console.error('Error searching farmers:', error);
      throw error;
    }
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

  // Get recent farmer activity (products added, reviews received, etc.)
  static async getFarmerActivity(farmerId, limitCount = 10) {
    try {
      const activities = [];

      // Get recent products
      const recentProducts = await this.getFarmerProducts(farmerId, {
        activeOnly: false,
        limit: 5,
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });

      recentProducts.forEach(product => {
        activities.push({
          type: 'product_added',
          timestamp: product.createdAt,
          data: {
            productName: product.name,
            productId: product.id
          }
        });
      });

      // Get recent reviews
      const recentReviews = await this.getFarmerReviews(farmerId, 5);
      
      recentReviews.forEach(review => {
        activities.push({
          type: 'review_received',
          timestamp: review.createdAt,
          data: {
            rating: review.rating,
            reviewId: review.id,
            title: review.title
          }
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => {
        const aDate = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const bDate = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return bDate - aDate;
      });

      return activities.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting farmer activity:', error);
      return [];
    }
  }
}