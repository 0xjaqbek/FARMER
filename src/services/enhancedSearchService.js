// Update src/services/enhancedSearchService.js to use Google Maps
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
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
        query: searchQuery,
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
        userLocation = null,
        limit: searchLimit = 20,
        lastDoc = null
      } = searchParams;

      // Start with base query
      let productsQuery = collection(db, 'products');
      const constraints = [];

      // Basic filters
      constraints.push(where('status', '==', 'active'));

      // Category filter
      if (categories.length > 0) {
        constraints.push(where('category', 'in', categories));
      }

      // Price range filter
      constraints.push(where('price', '>=', priceRange[0]));
      constraints.push(where('price', '<=', priceRange[1]));

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

      // Apply sorting (if not distance-based)
      if (sortBy !== 'distance' && sortBy !== 'rating') {
        const sortField = this.getSortField(sortBy);
        const sortOrder = sortBy.includes('_high') ? 'desc' : 'asc';
        constraints.push(orderBy(sortField, sortOrder));
      }

      // Pagination
      constraints.push(limit(searchLimit * 2)); // Get more to account for distance filtering
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // Execute query
      const q = query(productsQuery, ...constraints);
      const snapshot = await getDocs(q);

      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _doc: doc
      }));

      // Apply text search if provided
      if (searchQuery && searchQuery.trim()) {
        products = this.applyTextSearch(products, searchQuery);
      }

      // Apply location-based filtering using Google Maps
      if (userLocation) {
        products = await this.applyGoogleMapsLocationFiltering(products, userLocation, maxDistance);
      }

      // Apply delivery options filter
      if (deliveryOptions.length > 0) {
        products = products.filter(product => 
          deliveryOptions.some(option => 
            product.deliveryOptions?.includes(option)
          )
        );
      }

      // Apply farmer rating filter
      if (farmerRating > 0) {
        products = await this.filterByFarmerRating(products, farmerRating);
      }

      // Apply final sorting
      products = this.applySorting(products, sortBy, userLocation);

      // Limit final results
      const finalProducts = products.slice(0, searchLimit);

      return {
        products: finalProducts,
        farmers: this.extractUniqueFarmers(finalProducts),
        hasMore: products.length > searchLimit,
        lastDoc: snapshot.docs[Math.min(finalProducts.length - 1, snapshot.docs.length - 1)] || null,
        totalFound: products.length,
        searchTime: Date.now()
      };

    } catch (error) {
      console.error('Error in enhanced search:', error);
      throw error;
    }
  }

  // Apply location filtering using Google Maps distance calculation
  static async applyGoogleMapsLocationFiltering(products, userLocation, maxDistance) {
    try {
      // Get unique farmer IDs
      const farmerIds = [...new Set(products.map(p => p.farmerId))];
      
      // Get farmer locations
      const farmerLocations = await this.getFarmerLocations(farmerIds);
      
      // Filter by distance using Google Maps calculation
      const filteredProducts = products
        .map(product => {
          const farmerLocation = farmerLocations[product.farmerId];
          if (!farmerLocation) return null;
          
          const distance = GoogleMapsService.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            farmerLocation.lat,
            farmerLocation.lng
          );
          
          return distance <= maxDistance ? { 
            ...product, 
            distance,
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
      if (product.farmerId && !farmersMap.has(product.farmerId)) {
        farmersMap.set(product.farmerId, {
          id: product.farmerId,
          farmName: product.farmName,
          farmerName: product.farmerName,
          location: product.farmerLocation,
          distance: product.distance,
          verified: product.farmerVerified || false
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
      const farmerIds = [...new Set(products.map(p => p.farmerId))];
      const farmerRatings = await this.getFarmerRatings(farmerIds);
      
      return products.filter(product => {
        const rating = farmerRatings[product.farmerId] || 0;
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
  static async getSearchSuggestions(query, userLocation = null, limit = 10) {
    try {
      if (!query || query.length < 2) return [];

      const suggestions = [];
      const queryLower = query.toLowerCase();

      // Product name suggestions
      const productsQuery = query(
        collection(db, 'products'),
        where('status', '==', 'active'),
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

      // Get place suggestions from Google Maps
      if (userLocation) {
        try {
          const placeSuggestions = await GoogleMapsService.getPlaceSuggestions(query, userLocation);
          placeSuggestions.slice(0, 3).forEach(place => {
            suggestions.push({
              text: place.description,
              type: 'location',
              place_id: place.place_id
            });
          });
        } catch (error) {
          console.error('Error getting place suggestions:', error);
        }
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get available filter options
  static async getFilterOptions() {
    try {
      const [categoriesSnapshot, priceStats] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('status', '==', 'active'))),
        this.getPriceStatistics()
      ]);

      const categories = new Set();
      const deliveryOptions = new Set();
      
      categoriesSnapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.category) categories.add(product.category);
        if (product.deliveryOptions) {
          product.deliveryOptions.forEach(option => deliveryOptions.add(option));
        }
      });

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
      const productsSnapshot = await getDocs(
        query(collection(db, 'products'), where('status', '==', 'active'))
      );

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