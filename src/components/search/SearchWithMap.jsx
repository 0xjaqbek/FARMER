// src/pages/search/SearchWithMap.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, List, AlertCircle, RefreshCw } from 'lucide-react';

// Import components with correct paths
import GeoLocationSearch from '../../components/search/GeoLocationSearch';
import SearchResults from '../../components/search/SearchResults';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../context/AuthContext';

const SearchWithMap = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  // Location hook
  const { 
    location: userLocation, 
    loading: locationLoading, 
    error: locationError,
    permission,
    requestLocation,
    clearLocation,
    hasLocation
  } = useLocation();

  // Search state
  const [searchResults, setSearchResults] = useState({
    products: [],
    farmers: [],
    hasMore: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  // Initialize search from URL params
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    const categoryFromUrl = searchParams.get('category');
    
    if (queryFromUrl || categoryFromUrl) {
      // Auto-search based on URL params
      performInitialSearch();
    }
  }, [searchParams]);

  // Perform initial search based on URL parameters
  const performInitialSearch = async () => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const distance = parseInt(searchParams.get('distance')) || 25;

    // Mock search implementation - replace with actual service
    try {
      setIsSearching(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = {
        products: [
          {
            id: '1',
            name: 'Fresh Tomatoes',
            description: 'Organic tomatoes grown locally',
            price: 8.50,
            farmerId: 'farmer1',
            farmerName: 'Jan Kowalski',
            image: '/api/placeholder/300/200',
            stock: 15,
            isOrganic: true,
            distance: 2.5,
            deliveryOptions: ['pickup', 'delivery']
          },
          {
            id: '2',
            name: 'Farm Fresh Eggs',
            description: 'Free-range chicken eggs',
            price: 12.00,
            farmerId: 'farmer2',
            farmerName: 'Anna Nowak',
            image: '/api/placeholder/300/200',
            stock: 24,
            distance: 5.1,
            deliveryOptions: ['pickup']
          }
        ],
        farmers: [
          {
            id: 'farmer1',
            farmName: 'EkoFarm Kowalski',
            farmerName: 'Jan Kowalski',
            verified: true,
            distance: 2.5
          },
          {
            id: 'farmer2',
            farmName: 'Organic Valley',
            farmerName: 'Anna Nowak',
            verified: false,
            distance: 5.1
          }
        ],
        hasMore: false,
        totalFound: 2
      };
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search results from search component
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setSelectedFarmer(null);
    
    // If we have results, show map tab for better visualization
    if (results.farmers && results.farmers.length > 0) {
      setActiveTab('map');
    }
  };

  // Handle loading state
  const handleSearchLoading = (loading) => {
    setIsSearching(loading);
  };

  // Handle location request
  const handleLocationRequest = async () => {
    try {
      await requestLocation();
      toast({
        title: "Location Set",
        description: "We'll now show you products near your location!",
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle product click
  const handleProductClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  // Handle farmer selection from map
  const handleFarmerSelect = (farmer) => {
    setSelectedFarmer(farmer);
    // Switch to list view to show farmer's products
    setActiveTab('list');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Find Fresh Local Products</h1>
        <p className="text-gray-600">
          Discover farm-fresh products from verified local farmers near you
        </p>
      </div>

      {/* Location Status */}
      {!hasLocation && permission !== 'denied' && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Enable location access to find products near you and see farmers on the map.
            </span>
            <Button 
              size="sm" 
              onClick={handleLocationRequest}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  Enable Location
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Location Error */}
      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{locationError}</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleLocationRequest}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Location Display */}
      {hasLocation && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Location set - showing products within your selected radius
                </span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {searchResults.farmers?.length || 0} farmers found
                </Badge>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={clearLocation}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Clear Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Component */}
      <GeoLocationSearch
        onResults={handleSearchResults}
        onLoading={handleSearchLoading}
        userLocation={userLocation}
        onLocationRequest={handleLocationRequest}
      />

      {/* Results Section */}
      {(searchResults.products?.length > 0 || searchResults.farmers?.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Search Results
                <Badge variant="outline">
                  {searchResults.products?.length || 0} products
                </Badge>
              </CardTitle>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="map" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="list" className="mt-0">
                <SearchResults
                  results={searchResults}
                  userLocation={userLocation}
                  onProductClick={handleProductClick}
                  loading={isSearching}
                  selectedFarmer={selectedFarmer}
                />
              </TabsContent>
              
              <TabsContent value="map" className="mt-0">
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Interactive Map View</p>
                    <p className="text-sm">
                      {searchResults.farmers?.length || 0} farmers would be displayed here
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isSearching && searchResults.products?.length === 0 && searchResults.farmers?.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">
              No Results Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-4">
              <p>We couldn't find any products matching your search criteria.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Try adjusting your search:</p>
                  <ul className="space-y-1">
                    <li>• Use broader search terms</li>
                    <li>• Increase your distance radius</li>
                    <li>• Remove some filters</li>
                    <li>• Check different categories</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Popular searches:</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'Vegetables', 'Fruits', 'Organic', 
                      'Eggs', 'Honey', 'Herbs'
                    ].map(term => (
                      <Button
                        key={term}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchParams({ q: term });
                        }}
                        className="text-xs"
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchWithMap;