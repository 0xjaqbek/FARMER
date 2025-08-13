// src/components/products/EnhancedProductSearch.jsx
// Advanced product search and filtering interface

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Star, Truck, Leaf, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchService } from '../../services/searchService';
import { LocationService } from '../../services/locationService';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';

export default function EnhancedProductSearch({ onResults, onLoading }) {
  const { userProfile } = useAuth();
  const { location: userLocation, requestLocation } = useLocation();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: [],
    priceRange: { min: 0, max: 100 },
    availability: 'all',
    organic: false,
    freshness: '',
    verifiedFarmers: false,
    farmerRating: 0,
    sortBy: 'distance',
    sortOrder: 'asc',
    location: {
      customerLocation: null,
      maxDistance: 50
    }
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await SearchService.getFilterOptions();
        setFilterOptions(options);
        
        // Set initial price range from available products
        if (options.priceRange) {
          setFilters(prev => ({
            ...prev,
            priceRange: options.priceRange
          }));
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);
  
  // Set user location for distance-based search
  useEffect(() => {
    if (userLocation) {
      setFilters(prev => ({
        ...prev,
        location: {
          ...prev.location,
          customerLocation: userLocation
        }
      }));
    }
  }, [userLocation]);
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query, currentFilters) => {
      if (onLoading) onLoading(true);
      setIsLoading(true);
      
      try {
        const results = await SearchService.searchProducts(
          {
            ...currentFilters,
            searchQuery: query
          },
          { limit: 20 }
        );
        
        if (onResults) onResults(results);
      } catch (error) {
        console.error('Search error:', error);
        if (onResults) onResults({ products: [], hasMore: false });
      } finally {
        setIsLoading(false);
        if (onLoading) onLoading(false);
      }
    }, 300),
    [onResults, onLoading]
  );
  
  // Get search suggestions
  const getSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length >= 2) {
        try {
          const suggestions = await SearchService.getSearchSuggestions(query);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error getting suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    getSuggestions(value);
    debouncedSearch(value, filters);
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(searchQuery, newFilters);
  };
  
  // Handle nested filter change
  const handleNestedFilterChange = (parentKey, childKey, value) => {
    const newFilters = {
      ...filters,
      [parentKey]: {
        ...filters[parentKey],
        [childKey]: value
      }
    };
    setFilters(newFilters);
    debouncedSearch(searchQuery, newFilters);
  };
  
  // Request location access
  const handleRequestLocation = async () => {
    try {
      await requestLocation();
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      category: [],
      priceRange: filterOptions.priceRange || { min: 0, max: 100 },
      availability: 'all',
      organic: false,
      freshness: '',
      verifiedFarmers: false,
      farmerRating: 0,
      sortBy: 'distance',
      sortOrder: 'asc',
      location: {
        customerLocation: userLocation,
        maxDistance: 50
      }
    };
    setFilters(clearedFilters);
    debouncedSearch(searchQuery, clearedFilters);
  };
  
  // Remove specific filter
  const removeFilter = (key, value = null) => {
    let newFilters = { ...filters };
    
    switch (key) {
      case 'category':
        newFilters.category = filters.category.filter(c => c !== value);
        break;
      case 'organic':
        newFilters.organic = false;
        break;
      case 'availability':
        newFilters.availability = 'all';
        break;
      case 'verifiedFarmers':
        newFilters.verifiedFarmers = false;
        break;
      case 'freshness':
        newFilters.freshness = '';
        break;
      case 'farmerRating':
        newFilters.farmerRating = 0;
        break;
      case 'maxDistance':
        newFilters.location.maxDistance = 50;
        break;
      default:
        break;
    }
    
    setFilters(newFilters);
    debouncedSearch(searchQuery, newFilters);
  };
  
  // Quick filter buttons
  const quickFilters = [
    { label: 'Organic', key: 'organic', value: true, icon: Leaf },
    { label: 'In Stock', key: 'availability', value: 'in_stock', icon: Clock },
    { label: 'Verified Farmers', key: 'verifiedFarmers', value: true, icon: Star },
    { label: 'Fresh Today', key: 'freshness', value: 'daily', icon: Clock }
  ];
  
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for fresh products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-20"
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {!userLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestLocation}
                className="text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Location
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-green-100' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                    debouncedSearch(suggestion, filters);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = filters[filter.key] === filter.value;
          
          return (
            <Button
              key={filter.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(filter.key, isActive ? (filter.key === 'availability' ? 'all' : false) : filter.value)}
              className="text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          );
        })}
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(filterOptions.categories || []).map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.category.includes(category)}
                        onCheckedChange={(checked) => {
                          const newCategories = checked
                            ? [...filters.category, category]
                            : filters.category.filter(c => c !== category);
                          handleFilterChange('category', newCategories);
                        }}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range (€)</label>
                <div className="px-2">
                  <Slider
                    value={[filters.priceRange.min, filters.priceRange.max]}
                    onValueChange={([min, max]) => 
                      handleFilterChange('priceRange', { min, max })
                    }
                    max={filterOptions.priceRange?.max || 100}
                    min={filterOptions.priceRange?.min || 0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>€{filters.priceRange.min}</span>
                    <span>€{filters.priceRange.max}</span>
                  </div>
                </div>
              </div>
              
              {/* Distance */}
              {userLocation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Distance (km)</label>
                  <div className="px-2">
                    <Slider
                      value={[filters.location.maxDistance]}
                      onValueChange={([value]) => 
                        handleNestedFilterChange('location', 'maxDistance', value)
                      }
                      max={100}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-center text-xs text-gray-500 mt-1">
                      {filters.location.maxDistance} km
                    </div>
                  </div>
                </div>
              )}
              
              {/* Availability */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Availability</label>
                <Select
                  value={filters.availability}
                  onValueChange={(value) => handleFilterChange('availability', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions.availability || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Freshness */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Freshness</label>
                <Select
                  value={filters.freshness}
                  onValueChange={(value) => handleFilterChange('freshness', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any freshness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any freshness</SelectItem>
                    {(filterOptions.freshness || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'daily' ? 'Harvested today' : 
                         option === 'weekly' ? 'This week' : 
                         option === 'preserved' ? 'Preserved' : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Farmer Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Farmer Rating</label>
                <div className="px-2">
                  <Slider
                    value={[filters.farmerRating]}
                    onValueChange={([value]) => handleFilterChange('farmerRating', value)}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Any rating</span>
                    <span className="flex items-center">
                      {filters.farmerRating > 0 && (
                        <>
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          {filters.farmerRating}+
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Sort Options */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(filterOptions.sortOptions || []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">Order</label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        {filters.sortBy === 'price' ? 'Low to High' : 
                         filters.sortBy === 'distance' ? 'Nearest First' : 'Ascending'}
                      </SelectItem>
                      <SelectItem value="desc">
                        {filters.sortBy === 'price' ? 'High to Low' : 
                         filters.sortBy === 'distance' ? 'Farthest First' : 'Descending'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2">
        {filters.category.length > 0 && (
          filters.category.map(category => (
            <Badge key={category} variant="secondary" className="flex items-center space-x-1">
              <span>{category}</span>
              <button
                onClick={() => removeFilter('category', category)}
                className="ml-1 text-xs hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
        
        {filters.organic && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Leaf className="h-3 w-3" />
            <span>Organic</span>
            <button
              onClick={() => removeFilter('organic')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {filters.availability === 'in_stock' && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>In Stock</span>
            <button
              onClick={() => removeFilter('availability')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {filters.verifiedFarmers && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>Verified Farmers</span>
            <button
              onClick={() => removeFilter('verifiedFarmers')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {filters.freshness && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span>Fresh {filters.freshness}</span>
            <button
              onClick={() => removeFilter('freshness')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {filters.farmerRating > 0 && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>{filters.farmerRating}+ Rating</span>
            <button
              onClick={() => removeFilter('farmerRating')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {userLocation && filters.location.maxDistance < 50 && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>Within {filters.location.maxDistance}km</span>
            <button
              onClick={() => removeFilter('maxDistance')}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {(filters.priceRange.min > (filterOptions.priceRange?.min || 0) || 
          filters.priceRange.max < (filterOptions.priceRange?.max || 100)) && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span>€{filters.priceRange.min} - €{filters.priceRange.max}</span>
            <button
              onClick={() => handleFilterChange('priceRange', filterOptions.priceRange || { min: 0, max: 100 })}
              className="ml-1 text-xs hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      )}
      
      {/* Search Results Summary */}
      {!isLoading && (
        <div className="text-sm text-gray-600">
          {searchQuery && (
            <span>Search results for "{searchQuery}"</span>
          )}
          {userLocation && filters.location.maxDistance < 50 && (
            <span className="ml-2">• Within {filters.location.maxDistance}km of your location</span>
          )}
        </div>
      )}
    </div>
  );
}

// Debounce utility function
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