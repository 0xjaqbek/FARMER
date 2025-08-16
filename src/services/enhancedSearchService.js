// src/services/enhancedSearchService.js
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import GoogleMapsService from './googleMapsService';

export class EnhancedSearchService {
  
  // Main search function with Google Maps integration
  static async searchProductsWithLocation(searchParams = {}) {
    try {
      const {
        query: searchQuery = '',
        category = '',
        categories = [],
        priceRange = [0, 1000],
        maxDistance = 50,
        availability = 'all',
        organic = false,
        freshness = '',
        deliveryOptions = [],
        farmerRating = 0,
        sortBy = 'distance',
        verifiedOnly = false,
        inSeason = false,
        location = null,      // Changed from userLocation to location
        limit: searchLimit = 20,
      } = searchParams;

      console.log('🔍 Starting enhanced search with params:', searchParams);

      if (!location || !location.lat || !location.lng) {
        throw new Error('Valid location coordinates are required for search');
      }

      // Step 1: Get all active products
      console.log('📦 Fetching products...');
      const products = await this.getActiveProducts({
        category,
        categories,
        searchQuery,
        organic,
        availability,
        freshness,
        verifiedOnly,
        inSeason,
        priceRange,
        limit: searchLimit * 2 // Get more to account for distance filtering
      });

      console.log(`📦 Found ${products.length} products`);

      if (products.length === 0) {
        return { products: [], farmers: [], hasMore: false, totalFound: 0 };
      }

      // Step 2: Apply text search if provided
      let filteredProducts = products;
      if (searchQuery && searchQuery.trim()) {
        filteredProducts = this.applyTextSearch(filteredProducts, searchQuery);
      }

      // Step 3: Apply location-based filtering using Google Maps
      console.log('🗺️ Applying location filtering...');
      const productsWithDistance = await this.applyGoogleMapsLocationFiltering(
        filteredProducts, 
        location, 
        maxDistance
      );

      console.log(`🎯 ${productsWithDistance.length} products within ${maxDistance}km`);

      // Step 4: Apply delivery options filter
      let finalProducts = productsWithDistance;
      if (deliveryOptions.length > 0) {
        finalProducts = finalProducts.filter(product => 
          deliveryOptions.some(option => 
            product.deliveryOptions?.includes(option)
          )
        );
      }

      // Step 5: Apply farmer rating filter
      if (farmerRating > 0) {
        finalProducts = await this.filterByFarmerRating(finalProducts, farmerRating);
      }

      // Step 6: Apply final sorting
      const sortedProducts = this.applySorting(finalProducts, sortBy, location);

      // Step 7: Limit final results
      const limitedProducts = sortedProducts.slice(0, searchLimit);

      // Step 8: Extract unique farmers
      const farmers = this.extractUniqueFarmers(limitedProducts);

      const results = {
        products: limitedProducts,
        farmers,
        hasMore: sortedProducts.length > searchLimit,
        totalFound: sortedProducts.length,
        searchParams,
        searchTime: Date.now()
      };

      console.log('✅ Search completed:', {
        products: results.products.length,
        farmers: results.farmers.length
      });

      return results;

    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  // Get active products from Firestore with all filters
  static async getActiveProducts(params) {
    try {
      const {
        category,
        categories = [],
        organic = false,
        availability = 'all',
        freshness = '',
        verifiedOnly = false,
        inSeason = false,
        priceRange = [0, 1000],
        limit: resultLimit = 50
      } = params;

      let productsQuery = collection(db, 'products');
      const constraints = [];

      // Try both status field variations
      try {
        constraints.push(where('status', '==', 'active'));
      } catch {
        try {
          constraints.push(where('isActive', '==', true));
        } catch {
          // If neither field exists, continue without status filter
          console.warn('No status or isActive field found in products');
        }
      }

      // Category filter - handle both single category and array
      if (category) {
        constraints.push(where('category', '==', category));
      } else if (categories.length > 0) {
        constraints.push(where('category', 'in', categories));
      }

      // Price range filter
      if (priceRange[0] > 0) {
        constraints.push(where('price', '>=', priceRange[0]));
      }
      if (priceRange[1] < 1000) {
        constraints.push(where('price', '<=', priceRange[1]));
      }

      // Availability filter
      if (availability === 'in_stock') {
        constraints.push(where('stock', '>', 0));
      } else if (availability === 'pre_order') {
        constraints.push(where('preOrderAvailable', '==', true));
      }

      // Organic filter
      if (organic) {
        constraints.push(where('isOrganic', '==', true));
      }

      // Verified farmers only
      if (verifiedOnly) {
        constraints.push(where('farmerVerified', '==', true));
      }

      // In season filter
      if (inSeason) {
        const currentMonth = new Date().getMonth() + 1;
        constraints.push(where('seasonalMonths', 'array-contains', currentMonth));
      }

      // Freshness filter
      if (freshness) {
        constraints.push(where('freshness', '==', freshness));
      }

      // Add limit
      constraints.push(limit(resultLimit));

      // Build and execute query
      if (constraints.length > 0) {
        productsQuery = query(productsQuery, ...constraints);
      }

      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return products;

    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Apply location filtering using Google Maps distance calculation
  static async applyGoogleMapsLocationFiltering(products, userLocation, maxDistance) {
    try {
      // Get unique farmer IDs
      const farmerIds = [...new Set(products.map(p => p.farmerId || p.rolnikId).filter(Boolean))];
      
      if (farmerIds.length === 0) {
        console.warn('No farmer IDs found in products');
        return [];
      }

      console.log(`🧑‍🌾 Getting locations for ${farmerIds.length} farmers`);
      
      // Get farmer locations
      const farmerLocations = await this.getFarmerLocations(farmerIds);
      
      console.log(`📍 Found locations for ${Object.keys(farmerLocations).length} farmers`);

      // Filter by distance using Google Maps calculation
      const filteredProducts = products
        .map(product => {
          const farmerId = product.farmerId || product.rolnikId;
          const farmerLocation = farmerLocations[farmerId];
          
          if (!farmerLocation) {
            console.log(`⚠️ No location found for farmer: ${farmerId}`);
            return null;
          }
          
          const distance = this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            farmerLocation.lat,
            farmerLocation.lng
          );
          
          return distance <= maxDistance ? { 
            ...product, 
            distance: Math.round(distance * 10) / 10,
            farmerLocation,
            farmName: farmerLocation.farmName,
            farmerName: farmerLocation.farmerName,
            farmerVerified: farmerLocation.verified
          } : null;
        })
        .filter(Boolean);
      
      return filteredProducts;
    } catch (error) {
      console.error('Error applying Google Maps location filtering:', error);
      return products;
    }
  }

  // Calculate distance between two points using Haversine formula
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

  // Get farmer locations from database
  static async getFarmerLocations(farmerIds) {
    try {
      const locations = {};
      
      const farmerPromises = farmerIds.map(async farmerId => {
        try {
          const farmerDoc = await getDoc(doc(db, 'users', farmerId));
          if (farmerDoc.exists()) {
            const farmerData = farmerDoc.data();
            if (farmerData.location?.coordinates) {
              locations[farmerId] = {
                lat: farmerData.location.coordinates.lat || farmerData.location.coordinates.latitude,
                lng: farmerData.location.coordinates.lng || farmerData.location.coordinates.longitude,
                address: farmerData.location.address || '',
                city: farmerData.location.city || '',
                farmName: farmerData.farmName || farmerData.displayName,
                farmerName: farmerData.displayName,
                verified: farmerData.verified || false
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching farmer ${farmerId}:`, error);
        }
      });
      
      await Promise.all(farmerPromises);
      return locations;
    } catch (error) {
      console.error('Error getting farmer locations:', error);
      return {};
    }
  }

  // Extract unique farmers from products
  static extractUniqueFarmers(products) {
    const farmersMap = new Map();
    
    products.forEach(product => {
      const farmerId = product.farmerId || product.rolnikId;
      if (farmerId && !farmersMap.has(farmerId)) {
        farmersMap.set(farmerId, {
          id: farmerId,
          farmName: product.farmName,
          farmerName: product.farmerName,
          location: product.farmerLocation,
          distance: product.distance,
          verified: product.farmerVerified || false,
          productCount: products.filter(p => 
            (p.farmerId || p.rolnikId) === farmerId
          ).length
        });
      }
    });

    return Array.from(farmersMap.values());
  }

  // Apply text search to products
  static applyTextSearch(products, searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);

    return products.filter(product => {
      const searchableText = [
        product.name || '',
        product.description || '',
        product.category || '',
        product.farmerName || '',
        product.farmName || '',
        ...(product.tags || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    }).sort((a, b) => {
      // Prioritize products where search terms appear in the name
      const aNameMatch = searchTerms.some(term => a.name?.toLowerCase().includes(term));
      const bNameMatch = searchTerms.some(term => b.name?.toLowerCase().includes(term));
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
  }

  // Filter products by farmer rating
  static async filterByFarmerRating(products, minRating) {
    try {
      const farmerIds = [...new Set(products.map(p => p.farmerId || p.rolnikId))];
      const farmerRatings = await this.getFarmerRatings(farmerIds);
      
      return products.filter(product => {
        const farmerId = product.farmerId || product.rolnikId;
        const rating = farmerRatings[farmerId] || 0;
        return rating >= minRating;
      });
    } catch (error) {
      console.error('Error filtering by farmer rating:', error);
      return products;
    }
  }

  // Get farmer ratings
  static async getFarmerRatings(farmerIds) {
    try {
      const ratings = {};
      
      for (const farmerId of farmerIds) {
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('farmerId', '==', farmerId)
          );
          
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          if (!reviewsSnapshot.empty) {
            const reviews = reviewsSnapshot.docs.map(doc => doc.data());
            const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
            ratings[farmerId] = Math.round(avgRating * 10) / 10;
          }
        } catch (error) {
          console.error(`Error getting rating for farmer ${farmerId}:`, error);
        }
      }
      
      return ratings;
    } catch (error) {
      console.error('Error getting farmer ratings:', error);
      return {};
    }
  }

  // Apply sorting to search results
  static applySorting(products, sortBy, userLocation) {
    switch (sortBy) {
      case 'distance':
        return userLocation ? 
          products.sort((a, b) => (a.distance || 999) - (b.distance || 999)) :
          products;
          
      case 'price_low':
      case 'price':
        return products.sort((a, b) => (a.price || 0) - (b.price || 0));
        
      case 'price_high':
        return products.sort((a, b) => (b.price || 0) - (a.price || 0));
        
      case 'rating':
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
      case 'newest':
        return products.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate - aDate;
        });
        
      case 'availability':
        return products.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        
      default:
        return products;
    }
  }

  // Get sort field for Firebase orderBy
  static getSortField(sortBy) {
    const sortFields = {
      'price_low': 'price',
      'price_high': 'price',
      'newest': 'createdAt',
      'availability': 'stock'
    };
    
    return sortFields[sortBy] || 'createdAt';
  }

  // Search suggestions with Google Maps context
  static async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.length < 2) return [];

      const suggestions = [];
      const queryLower = query.toLowerCase();

      // Product name suggestions
      const productsQuery = query(
        collection(db, 'products'),
        limit(5)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      productsSnapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.name?.toLowerCase().includes(queryLower)) {
          suggestions.push({
            text: product.name,
            type: 'product',
            category: product.category,
            price: product.price
          });
        }
      });

      // Category suggestions
      const categories = [
        'Vegetables', 'Fruits', 'Herbs', 'Grains', 'Dairy', 
        'Meat', 'Eggs', 'Honey', 'Preserved Foods'
      ];
      
      categories.forEach(category => {
        if (category.toLowerCase().includes(queryLower)) {
          suggestions.push({
            text: category,
            type: 'category'
          });
        }
      });

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get available filter options
  static async getFilterOptions() {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));

      const categories = new Set();
      const deliveryOptions = new Set();
      
      productsSnapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.category) categories.add(product.category);
        if (product.deliveryOptions) {
          product.deliveryOptions.forEach(option => deliveryOptions.add(option));
        }
      });

      const priceStats = await this.getPriceStatistics();

      return {
        categories: Array.from(categories).sort(),
        deliveryOptions: Array.from(deliveryOptions).sort(),
        priceRange: {
          min: priceStats.min || 0,
          max: priceStats.max || 100
        }
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        categories: [],
        deliveryOptions: [],
        priceRange: { min: 0, max: 100 }
      };
    }
  }

  // Get price statistics
  static async getPriceStatistics() {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));

      const prices = productsSnapshot.docs
        .map(doc => doc.data().price)
        .filter(price => typeof price === 'number' && price > 0);

      if (prices.length === 0) {
        return { min: 0, max: 100 };
      }

      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
      };
    } catch (error) {
      console.error('Error getting price statistics:', error);
      return { min: 0, max: 100 };
    }
  }
}

export default EnhancedSearchService;