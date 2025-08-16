// src/components/search/GeoLocationSearch.jsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, MapPin, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EnhancedSearchService } from '../../services/enhancedSearchService';

const GeoLocationSearch = ({ 
  onResults, 
  onLoading, 
  userLocation, 
  onLocationRequest 
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState([25]); // Default 25km
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [isSearching, setIsSearching] = useState(false);

  // Available categories
  const categories = [
    'Vegetables', 'Fruits', 'Herbs', 'Dairy', 'Meat', 
    'Eggs', 'Honey', 'Grains', 'Other'
  ];

  // Perform search when parameters change
  useEffect(() => {
    if (hasValidLocation()) {
      performSearch();
    }
  }, [searchQuery, maxDistance, categoryFilter, sortBy, userLocation]);

  // Check if we have a valid location
  const hasValidLocation = () => {
    // Check hook location first
    if (userLocation?.lat && userLocation?.lng) {
      return true;
    }
    
    // Check user profile location
    if (userProfile?.location?.coordinates?.lat && userProfile?.location?.coordinates?.lng) {
      return true;
    }
    
    return false;
  };

  // Get current location coordinates
  const getCurrentLocation = () => {
    // Prefer hook location (more recent)
    if (userLocation?.lat && userLocation?.lng) {
      return {
        lat: userLocation.lat,
        lng: userLocation.lng
      };
    }
    
    // Fallback to profile location
    if (userProfile?.location?.coordinates) {
      return {
        lat: userProfile.location.coordinates.lat,
        lng: userProfile.location.coordinates.lng
      };
    }
    
    return null;
  };

  // Perform the actual search
  const performSearch = async () => {
    try {
      setIsSearching(true);
      if (onLoading) onLoading(true);

      const currentLocation = getCurrentLocation();
      if (!currentLocation) {
        console.log('No location available for search');
        return;
      }

      console.log('🔍 Performing search with location:', currentLocation);
      console.log('📊 Search parameters:', {
        query: searchQuery,
        distance: maxDistance[0],
        category: categoryFilter,
        sortBy
      });

      // Build search parameters
      const searchParams = {
        query: searchQuery.trim(),
        category: categoryFilter,
        maxDistance: maxDistance[0],
        sortBy,
        location: currentLocation,
        userId: userProfile?.uid
      };

      // Use enhanced search service
      const results = await EnhancedSearchService.searchProductsWithLocation(searchParams);
      
      console.log('🎯 Search results:', results);

      if (onResults) {
        onResults(results);
      }

      // Show success toast if we have results
      if (results.products && results.products.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${results.products.length} products from ${results.farmers?.length || 0} farmers`
        });
      } else {
        toast({
          title: "No Results",
          description: "No products found matching your criteria. Try expanding your search area.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('❌ Search error:', error);
      
      toast({
        title: "Search Error",
        description: error.message || "Failed to perform search. Please try again.",
        variant: "destructive"
      });

      // Return empty results on error
      if (onResults) {
        onResults({ products: [], farmers: [], hasMore: false });
      }
    } finally {
      setIsSearching(false);
      if (onLoading) onLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (hasValidLocation()) {
      performSearch();
    } else {
      toast({
        title: "Location Required",
        description: "Please enable location access to search for nearby products.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Search Products</h2>
          {!hasValidLocation() && (
            <Button 
              size="sm" 
              onClick={onLocationRequest}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Enable Location
            </Button>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for products, farmers, or categories..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Distance: {maxDistance[0]}km
              </label>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                max={100}
                min={5}
                step={5}
                className="w-full"
                disabled={!hasValidLocation()}
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="distance">Distance</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSearching || !hasValidLocation()}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Products
              </>
            )}
          </Button>
        </form>

        {/* Location Status */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {hasValidLocation() ? (
              <span className="text-green-600">
                Location enabled - searching within {maxDistance[0]}km
              </span>
            ) : (
              <span className="text-amber-600">
                Location required for distance-based search
              </span>
            )}
          </div>
          
          {hasValidLocation() && (
            <Badge variant="outline">
              {getCurrentLocation()?.lat.toFixed(4)}, {getCurrentLocation()?.lng.toFixed(4)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeoLocationSearch;