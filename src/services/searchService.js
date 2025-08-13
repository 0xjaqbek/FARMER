// src/services/searchService.js
// Advanced search and filtering system

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
import { COLLECTIONS, calculateDistance } from '../lib/firebaseSchema';

export class SearchService {
  
  // Main product search function
  static async searchProducts(filters = {}, pagination = {}) {
    try {
      let q = collection(db, COLLECTIONS.PRODUCTS);
      const constraints = [];
      
      // Base constraints
      constraints.push(where('status', '==', 'active'));
      
      // Category filter
      if (filters.category && filters.category.length > 0) {
        constraints.push(where('category', 'in', filters.category));
      }
      
      // Price range filter
      if (filters.priceRange?.min !== undefined) {
        constraints.push(where('price', '>=', filters.priceRange.min));
      }
      if (filters.priceRange?.max !== undefined) {
        constraints.push(where('price', '<=', filters.priceRange.max));
      }
      
      // Availability filter
      if (filters.availability === 'in_stock') {
        constraints.push(where('inventory.availableStock', '>', 0));
      }
      
      // Organic filter
      if (filters.organic === true) {
        constraints.push(where('quality.organic', '==', true));
      }
      
      // Freshness filter
      if (filters.freshness) {
        constraints.push(where('quality.freshness', '==', filters.freshness));
      }
      
      // Verified farmers filter
      if (filters.verifiedFarmers === true) {
        // This would require a join or denormalized data
        // For now, we'll handle this in post-processing
      }
      
      // Sorting
      if (filters.sortBy && filters.sortBy !== 'distance') {
        const sortField = this.getSortField(filters.sortBy);
        const sortOrder = filters.sortOrder === 'desc' ? 'desc' : 'asc';
        constraints.push(orderBy(sortField, sortOrder));
      }
      
      // Pagination
      if (pagination.limit) {
        constraints.push(limit(pagination.limit));
      }
      
      if (pagination.startAfter) {
        constraints.push(startAfter(pagination.startAfter));
      }
      
      // Execute query
      q = query(q, ...constraints);
      const snapshot = await getDocs(q);
      
      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Post-processing filters
      products = await this.applyPostProcessingFilters(products, filters);
      
      // Apply location-based filtering and sorting
      if (filters.location?.customerLocation) {
        products = await this.applyLocationFilters(products, filters.location);
      }
      
      // Apply text search
      if (filters.searchQuery) {
        products = this.applyTextSearch(products, filters.searchQuery);
      }
      
      return {
        products,
        hasMore: snapshot.docs.length === (pagination.limit || 20),
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  
  // Apply filters that require post-processing
  static async applyPostProcessingFilters(products, filters) {
    try {
      let filteredProducts = [...products];
      
      // Verified farmers filter
      if (filters.verifiedFarmers === true) {
        const farmerIds = [...new Set(products.map(p => p.farmerId))];
        const verifiedFarmers = await this.getVerifiedFarmers(farmerIds);
        
        filteredProducts = filteredProducts.filter(product => 
          verifiedFarmers.includes(product.farmerId)
        );
      }
      
      // Farmer rating filter
      if (filters.farmerRating) {
        const farmerIds = [...new Set(products.map(p => p.farmerId))];
        const farmerRatings = await this.getFarmerRatings(farmerIds);
        
        filteredProducts = filteredProducts.filter(product => {
          const rating = farmerRatings[product.farmerId];
          return rating >= filters.farmerRating;
        });
      }
      
      return filteredProducts;
    } catch (error) {
      console.error('Error applying post-processing filters:', error);
      return products;
    }
  }
  
  // Apply location-based filtering
  static async applyLocationFilters(products, locationFilters) {
    try {
      const { customerLocation, maxDistance = 50 } = locationFilters;
      const farmerIds = [...new Set(products.map(p => p.farmerId))];
      
      // Get farmer locations
      const farmerLocations = await this.getFarmerLocations(farmerIds);
      
      // Filter by distance and add distance property
      const filteredProducts = products
        .map(product => {
          const farmerLocation = farmerLocations[product.farmerId];
          if (!farmerLocation) return null;
          
          const distance = calculateDistance(
            customerLocation.lat,
            customerLocation.lng,
            farmerLocation.lat,
            farmerLocation.lng
          );
          
          return distance <= maxDistance ? { ...product, distance } : null;
        })
        .filter(Boolean);
      
      // Sort by distance if requested
      if (locationFilters.sortBy === 'distance') {
        filteredProducts.sort((a, b) => a.distance - b.distance);
      }
      
      return filteredProducts;
    } catch (error) {
      console.error('Error applying location filters:', error);
      return products;
    }
  }
  
  // Apply text search
  static applyTextSearch(products, searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') return products;
    
    const query = searchQuery.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);
    
    return products.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        ...(product.tags || []),
        ...(product.searchKeywords || [])
      ].join(' ').toLowerCase();
      
      // Check if all search terms are found
      return searchTerms.every(term => searchableText.includes(term));
    }).sort((a, b) => {
      // Prioritize products where search terms appear in the name
      const aNameMatch = searchTerms.some(term => a.name.toLowerCase().includes(term));
      const bNameMatch = searchTerms.some(term => b.name.toLowerCase().includes(term));
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
  }
  
  // Get search suggestions
  static async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.length < 2) return [];
      
      const suggestions = new Set();
      
      // Get product names and categories that match
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        const searchableItems = [
          product.name,
          product.category,
          ...(product.tags || [])
        ];
        
        searchableItems.forEach(item => {
          if (item && item.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(item);
          }
        });
      });
      
      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
  
  // Get popular search terms
  static async getPopularSearches(limit = 10) {
    try {
      // In a real app, you'd track search queries and return popular ones
      // For now, return some common categories and products
      return [
        'tomatoes',
        'organic',
        'vegetables',
        'fruits',
        'lettuce',
        'carrots',
        'herbs',
        'potatoes',
        'onions',
        'peppers'
      ].slice(0, limit);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }
  
  // Get available filter options
  static async getFilterOptions() {
    try {
      const [categories, priceRange, units] = await Promise.all([
        this.getAvailableCategories(),
        this.getPriceRange(),
        this.getAvailableUnits()
      ]);
      
      return {
        categories,
        priceRange,
        units,
        freshness: ['daily', 'weekly', 'preserved'],
        availability: [
          { value: 'all', label: 'All Products' },
          { value: 'in_stock', label: 'In Stock' },
          { value: 'pre_order', label: 'Pre-order' }
        ],
        sortOptions: [
          { value: 'distance', label: 'Distance' },
          { value: 'price', label: 'Price' },
          { value: 'rating', label: 'Rating' },
          { value: 'freshness', label: 'Freshness' },
          { value: 'name', label: 'Name' }
        ]
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {};
    }
  }
  
  // Helper functions
  static getSortField(sortBy) {
    const sortFieldMap = {
      'price': 'price',
      'name': 'name',
      'rating': 'averageRating',
      'createdAt': 'createdAt'
    };
    return sortFieldMap[sortBy] || 'createdAt';
  }
  
  static async getAvailableCategories() {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(productsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      const categories = new Set();
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.category) {
          categories.add(product.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  static async getPriceRange() {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(productsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      let min = Infinity;
      let max = 0;
      
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.price) {
          min = Math.min(min, product.price);
          max = Math.max(max, product.price);
        }
      });
      
      return {
        min: min === Infinity ? 0 : min,
        max: max || 100
      };
    } catch (error) {
      console.error('Error getting price range:', error);
      return { min: 0, max: 100 };
    }
  }
  
  static async getAvailableUnits() {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(productsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      const units = new Set();
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.inventory?.unit) {
          units.add(product.inventory.unit);
        }
      });
      
      return Array.from(units).sort();
    } catch (error) {
      console.error('Error getting units:', error);
      return ['kg', 'pieces', 'bunches', 'liters'];
    }
  }
  
  static async getVerifiedFarmers(farmerIds) {
    try {
      const verifiedFarmers = [];
      
      for (const farmerId of farmerIds) {
        const userRef = doc(db, COLLECTIONS.USERS, farmerId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().isVerified) {
          verifiedFarmers.push(farmerId);
        }
      }
      
      return verifiedFarmers;
    } catch (error) {
      console.error('Error getting verified farmers:', error);
      return [];
    }
  }
  
  static async getFarmerRatings(farmerIds) {
    try {
      const ratings = {};
      
      for (const farmerId of farmerIds) {
        const ratingsRef = doc(db, COLLECTIONS.RATINGS, farmerId);
        const ratingsDoc = await getDoc(ratingsRef);
        
        if (ratingsDoc.exists()) {
          ratings[farmerId] = ratingsDoc.data().overall?.average || 0;
        } else {
          ratings[farmerId] = 0;
        }
      }
      
      return ratings;
    } catch (error) {
      console.error('Error getting farmer ratings:', error);
      return {};
    }
  }
  
  static async getFarmerLocations(farmerIds) {
    try {
      const locations = {};
      
      for (const farmerId of farmerIds) {
        const userRef = doc(db, COLLECTIONS.USERS, farmerId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().location?.coordinates) {
          locations[farmerId] = userDoc.data().location.coordinates;
        }
      }
      
      return locations;
    } catch (error) {
      console.error('Error getting farmer locations:', error);
      return {};
    }
  }
  
  // Advanced search with full-text search simulation
  static async advancedSearch(searchQuery, filters = {}) {
    try {
      // This is a simplified version. In production, you'd use:
      // - Algolia for full-text search
      // - Elasticsearch
      // - Firebase Extensions for search
      
      const products = await this.searchProducts(filters);
      
      if (!searchQuery) return products;
      
      // Score-based search ranking
      const scoredProducts = products.products.map(product => {
        let score = 0;
        const query = searchQuery.toLowerCase();
        
        // Name match (highest priority)
        if (product.name.toLowerCase().includes(query)) {
          score += product.name.toLowerCase() === query ? 100 : 50;
        }
        
        // Category match
        if (product.category?.toLowerCase().includes(query)) {
          score += 30;
        }
        
        // Description match
        if (product.description?.toLowerCase().includes(query)) {
          score += 20;
        }
        
        // Tags match
        if (product.tags?.some(tag => tag.toLowerCase().includes(query))) {
          score += 25;
        }
        
        // Farmer name match (requires additional data)
        // This would need farmer name denormalized in product
        
        return { ...product, searchScore: score };
      }).filter(product => product.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);
      
      return {
        ...products,
        products: scoredProducts
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw error;
    }
  }
  
  // Save search query for analytics
  static async saveSearchQuery(query, userId, filters, resultsCount) {
    try {
      // In a real app, save search analytics
      const searchLog = {
        query,
        userId,
        filters,
        resultsCount,
        timestamp: new Date()
      };
      
      // Save to analytics collection
      // await addDoc(collection(db, 'search_analytics'), searchLog);
      
      console.log('Search logged:', searchLog);
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  }
}