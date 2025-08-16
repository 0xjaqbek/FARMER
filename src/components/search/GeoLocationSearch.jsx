// src/components/search/GeoLocationSearch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, X, Loader2, Star, Truck, Leaf, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Enhanced Search Component with Geolocation
const GeoLocationSearch = ({ onResults, onLoading, userLocation, onLocationRequest }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 100],
    maxDistance: 25, // kilometers
    availability: 'all',
    organic: false,
    freshness: '',
    deliveryOptions: [],
    farmerRating: 0,
    sortBy: 'distance',
    verifiedOnly: false,
    harvestDate: '',
    inSeason: false
  });

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Filter options
  const categories = [
    'Vegetables', 'Fruits', 'Herbs', 'Grains', 'Dairy', 
    'Meat', 'Eggs', 'Honey', 'Preserved Foods', 'Plants & Seeds'
  ];

  const deliveryOptions = [
    { value: 'pickup', label: 'Farm Pickup' },
    { value: 'delivery', label: 'Home Delivery' },
    { value: 'market', label: 'Farmers Market' }
  ];

  const freshnessOptions = [
    { value: 'today', label: 'Harvested Today' },
    { value: 'week', label: 'This Week' },
    { value: 'fresh', label: 'Always Fresh' }
  ];

  const sortOptions = [
    { value: 'distance', label: 'Nearest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'availability', label: 'Most Available' }
  ];

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
    if (filters.maxDistance < 50) count++;
    if (filters.availability !== 'all') count++;
    if (filters.organic) count++;
    if (filters.freshness) count++;
    if (filters.deliveryOptions.length > 0) count++;
    if (filters.farmerRating > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.inSeason) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, currentFilters) => {
      if (onLoading) onLoading(true);
      setIsSearching(true);

      try {
        // Simulate API call - replace with your actual search service
        const searchParams = {
          query,
          ...currentFilters,
          userLocation,
          limit: 20
        };

        // Call your search service here
        const results = await performGeoSearch(searchParams);
        
        if (onResults) onResults(results);
      } catch (error) {
        console.error('Search error:', error);
        if (onResults) onResults({ products: [], farmers: [], hasMore: false });
      } finally {
        setIsSearching(false);
        if (onLoading) onLoading(false);
      }
    }, 400),
    [onResults, onLoading, userLocation]
  );

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    debouncedSearch(value, filters);
    
    // Get suggestions
    if (value.length >= 2) {
      getSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(searchQuery, newFilters);
  };

  // Handle category toggle
  const toggleCategory = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    handleFilterChange('categories', newCategories);
  };

  // Handle delivery option toggle
  const toggleDeliveryOption = (option) => {
    const newOptions = filters.deliveryOptions.includes(option)
      ? filters.deliveryOptions.filter(o => o !== option)
      : [...filters.deliveryOptions, option];
    
    handleFilterChange('deliveryOptions', newOptions);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      categories: [],
      priceRange: [0, 100],
      maxDistance: 25,
      availability: 'all',
      organic: false,
      freshness: '',
      deliveryOptions: [],
      farmerRating: 0,
      sortBy: 'distance',
      verifiedOnly: false,
      harvestDate: '',
      inSeason: false
    };
    
    setFilters(clearedFilters);
    debouncedSearch(searchQuery, clearedFilters);
  };

  // Get suggestions function
  const getSuggestions = async (query) => {
    // Mock suggestions - replace with actual implementation
    const mockSuggestions = [
      { text: `${query} - Products`, type: 'product' },
      { text: `${query} - Farmers`, type: 'farmer' },
      { text: `${query} - Categories`, type: 'category' }
    ];
    setSuggestions(mockSuggestions);
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for fresh products, farmers, or categories..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 h-12"
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => {
                        setSearchQuery(suggestion.text);
                        setShowSuggestions(false);
                        debouncedSearch(suggestion.text, filters);
                      }}
                    >
                      <Search className="h-3 w-3 text-gray-400" />
                      <span>{suggestion.text}</span>
                      {suggestion.type && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Location Button */}
                <Button
                  variant={userLocation ? "default" : "outline"}
                  size="sm"
                  onClick={onLocationRequest}
                  className="flex items-center space-x-1"
                >
                  <MapPin className="h-4 w-4" />
                  <span>
                    {userLocation ? 'Location Set' : 'Set Location'}
                  </span>
                </Button>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-1"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Loading indicator */}
                {isSearching && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.organic ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange('organic', !filters.organic)}
          className="flex items-center space-x-1"
        >
          <Leaf className="h-3 w-3" />
          <span>Organic</span>
        </Button>

        <Button
          variant={filters.verifiedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange('verifiedOnly', !filters.verifiedOnly)}
          className="flex items-center space-x-1"
        >
          <Star className="h-3 w-3" />
          <span>Verified Farmers</span>
        </Button>

        <Button
          variant={filters.inSeason ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange('inSeason', !filters.inSeason)}
          className="flex items-center space-x-1"
        >
          <Clock className="h-3 w-3" />
          <span>In Season</span>
        </Button>

        <Button
          variant={filters.availability === 'in_stock' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange('availability', filters.availability === 'in_stock' ? 'all' : 'in_stock')}
          className="flex items-center space-x-1"
        >
          <Target className="h-3 w-3" />
          <span>Available Now</span>
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center space-x-1">
              <span>{category}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleCategory(category)}
              />
            </Badge>
          ))}

          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Price: {filters.priceRange[0]} - {filters.priceRange[1]} PLN</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('priceRange', [0, 100])}
              />
            </Badge>
          )}

          {filters.maxDistance < 50 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Within {filters.maxDistance}km</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('maxDistance', 50)}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Advanced Filters</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Distance Filter */}
            {userLocation && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Distance: {filters.maxDistance}km from your location
                </Label>
                <Slider
                  value={[filters.maxDistance]}
                  onValueChange={(value) => handleFilterChange('maxDistance', value[0])}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1km</span>
                  <span>100km</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Price Range: {filters.priceRange[0]} - {filters.priceRange[1]} PLN
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 PLN</span>
                <span>100+ PLN</span>
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Product Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label className="text-sm">{category}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Delivery Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Delivery Options</Label>
              <div className="space-y-2">
                {deliveryOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.deliveryOptions.includes(option.value)}
                      onCheckedChange={() => toggleDeliveryOption(option.value)}
                    />
                    <Label className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Freshness */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Freshness</Label>
              <Select
                value={filters.freshness}
                onValueChange={(value) => handleFilterChange('freshness', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select freshness requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {freshnessOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Farmer Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Minimum Farmer Rating: {filters.farmerRating > 0 ? `${filters.farmerRating}+ stars` : 'Any'}
              </Label>
              <Slider
                value={[filters.farmerRating]}
                onValueChange={(value) => handleFilterChange('farmerRating', value[0])}
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Any rating</span>
                <span>5 stars</span>
              </div>
            </div>

            <Separator />

            {/* Availability */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Availability</Label>
              <Select
                value={filters.availability}
                onValueChange={(value) => handleFilterChange('availability', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="in_stock">In Stock Only</SelectItem>
                  <SelectItem value="pre_order">Available for Pre-order</SelectItem>
                  <SelectItem value="seasonal">Seasonal Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Mock search function - replace with your actual implementation
async function performGeoSearch() {
  // This would connect to your Firebase search service
  // For now, returning mock data structure
  return {
    products: [],
    farmers: [],
    hasMore: false,
    searchTime: Date.now(),
    totalResults: 0
  };
}

export default GeoLocationSearch;

