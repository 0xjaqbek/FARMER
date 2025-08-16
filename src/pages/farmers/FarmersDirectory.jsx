// src/pages/farmers/FarmersDirectory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Package, 
  Filter,
  Grid3X3,
  List,
  Map,
  Loader2,
  AlertCircle,
  Shield,
  Leaf,
  Clock,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { FarmerService } from '../../services/farmerService';
import FarmersMap from '../../components/maps/FarmersMap';

const FarmersDirectory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { _toast } = useToast();
  const { _userProfile } = useAuth();
  const { location: userLocation, requestLocation } = useLocation();

  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedCertification, setSelectedCertification] = useState(searchParams.get('certification') || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [maxDistance, setMaxDistance] = useState(parseInt(searchParams.get('distance') || '50'));
  
  // View states
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Filter options
  const specialties = [
    'Vegetables', 'Fruits', 'Herbs', 'Organic', 'Dairy', 'Meat', 
    'Poultry', 'Eggs', 'Honey', 'Grains', 'Flowers', 'Seeds'
  ];

  const certifications = [
    'Organic', 'Bio', 'Fair Trade', 'Sustainable', 'Local', 'Pesticide-Free'
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'newest', label: 'Newest Members' },
    { value: 'products', label: 'Most Products' },
    { value: 'name', label: 'Name A-Z' }
  ];

  useEffect(() => {
    loadFarmers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [farmers, searchQuery, selectedSpecialty, selectedCertification, verifiedOnly, sortBy, maxDistance, userLocation]);

  useEffect(() => {
    updateSearchParams();
  }, [searchQuery, selectedSpecialty, selectedCertification, verifiedOnly, sortBy, maxDistance]);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      setError(null);

      const farmersList = await FarmerService.searchFarmers({
        location: userLocation,
        maxDistance: 1000, // Load all farmers initially
        limit: 100
      });

      // Load additional stats for each farmer
      const farmersWithStats = await Promise.all(
        farmersList.map(async (farmer) => {
          try {
            const products = await FarmerService.getFarmerProducts(farmer.id, { limit: 5 });
            const stats = await FarmerService.getFarmerStats(farmer.id, products);
            
            return {
              ...farmer,
              stats,
              productCount: products.length,
              hasProducts: products.length > 0
            };
          } catch (error) {
            console.error(`Error loading stats for farmer ${farmer.id}:`, error);
            return {
              ...farmer,
              stats: { averageRating: 0, totalReviews: 0, totalProducts: 0 },
              productCount: 0,
              hasProducts: false
            };
          }
        })
      );

      setFarmers(farmersWithStats);
    } catch (error) {
      console.error('Error loading farmers:', error);
      setError('Failed to load farmers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...farmers];

    // Apply text search
    if (searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/);
      filtered = filtered.filter(farmer => {
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
    if (selectedSpecialty && selectedSpecialty !== 'all') {
      filtered = filtered.filter(farmer => {
        const farmerSpecialties = farmer.farmInfo?.specialties || [];
        return farmerSpecialties.some(specialty => 
          specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
        );
      });
    }

    // Apply certification filter
    if (selectedCertification && selectedCertification !== 'all') {
      filtered = filtered.filter(farmer => {
        const farmerCertifications = farmer.farmInfo?.certifications || [];
        return farmerCertifications.some(cert => 
          cert.toLowerCase().includes(selectedCertification.toLowerCase())
        );
      });
    }

    // Apply verified filter
    if (verifiedOnly) {
      filtered = filtered.filter(farmer => farmer.isVerified);
    }

    // Apply distance filter
    if (userLocation && maxDistance < 1000) {
      filtered = filtered.filter(farmer => {
        const farmerCoords = FarmerService.extractFarmerCoordinates(farmer);
        if (!farmerCoords) return false;

        const distance = FarmerService.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          farmerCoords.lat,
          farmerCoords.lng
        );

        farmer.distance = Math.round(distance * 10) / 10;
        return distance <= maxDistance;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
        case 'distance':
          if (!userLocation) return 0;
          return (a.distance || 999) - (b.distance || 999);
        case 'newest':
          { const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate - aDate; }
        case 'products':
          return (b.productCount || 0) - (a.productCount || 0);
        case 'name':
          { const aName = a.farmInfo?.farmName || a.displayName || '';
          const bName = b.farmInfo?.farmName || b.displayName || '';
          return aName.localeCompare(bName); }
        default:
          return 0;
      }
    });

    setFilteredFarmers(filtered);
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedSpecialty && selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
    if (selectedCertification && selectedCertification !== 'all') params.set('certification', selectedCertification);
    if (verifiedOnly) params.set('verified', 'true');
    if (sortBy !== 'rating') params.set('sort', sortBy);
    if (maxDistance !== 50) params.set('distance', maxDistance.toString());

    setSearchParams(params);
  };

  const handleFarmerClick = (farmer) => {
    navigate(`/farmers/${farmer.id}`);
  };

  const renderFarmerCard = (farmer) => {
    const farmName = farmer.farmInfo?.farmName || farmer.displayName;
    const location = farmer.location?.address || `${farmer.city || ''}, ${farmer.address || ''}`.trim();

    return (
      <Card 
        key={farmer.id} 
        className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        onClick={() => handleFarmerClick(farmer)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Farmer Avatar */}
            <Avatar className="w-16 h-16 shrink-0">
              <AvatarImage 
                src={farmer.profileImage || farmer.farmInfo?.images?.[0]} 
                alt={farmName}
              />
              <AvatarFallback>
                {farmName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'F'}
              </AvatarFallback>
            </Avatar>

            {/* Farmer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {farmName}
                  </h3>
                  {location && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{location}</span>
                      {farmer.distance && (
                        <span className="ml-2 text-blue-600">
                          ({farmer.distance}km away)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Verification Badge */}
                <div className="flex flex-col items-end gap-1">
                  {farmer.isVerified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating and Stats */}
              <div className="flex items-center gap-4 mb-3">
                {farmer.stats?.averageRating > 0 && (
                  <div className="flex items-center">
                    <div className="flex items-center mr-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${
                            i < Math.floor(farmer.stats.averageRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {farmer.stats.averageRating} ({farmer.stats.totalReviews})
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-600">
                  <Package className="w-3 h-3 mr-1" />
                  {farmer.productCount} products
                </div>
              </div>

              {/* Description */}
              {farmer.farmInfo?.description && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {farmer.farmInfo.description}
                </p>
              )}

              {/* Specialties and Certifications */}
              <div className="flex flex-wrap gap-1 mb-3">
                {farmer.farmInfo?.specialties?.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {farmer.farmInfo?.certifications?.includes('organic') && (
                  <Badge variant="success" className="text-xs flex items-center gap-1">
                    <Leaf className="w-2 h-2" />
                    Organic
                  </Badge>
                )}
              </div>

              {/* Contact Options */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {farmer.farmInfo?.deliveryOptions?.deliveryAvailable && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Delivery
                  </span>
                )}
                {farmer.farmInfo?.deliveryOptions?.pickupAvailable && (
                  <span>Pickup</span>
                )}
                {farmer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </span>
                )}
                {farmer.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Phone
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFarmerList = (farmer) => {
    const farmName = farmer.farmInfo?.farmName || farmer.displayName;
    const location = farmer.location?.address || `${farmer.city || ''}, ${farmer.address || ''}`.trim();

    return (
      <Card 
        key={farmer.id} 
        className="cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => handleFarmerClick(farmer)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={farmer.profileImage || farmer.farmInfo?.images?.[0]} 
                alt={farmName}
              />
              <AvatarFallback>
                {farmName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'F'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 truncate">{farmName}</h3>
                  {location && (
                    <p className="text-sm text-gray-600 truncate">{location}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {farmer.stats?.averageRating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span>{farmer.stats.averageRating}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Package className="w-4 h-4 mr-1" />
                    <span>{farmer.productCount}</span>
                  </div>

                  {farmer.isVerified && (
                    <Badge variant="success" size="sm">
                      <Shield className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search farmers, specialties, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Specialty Filter */}
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {specialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Certification Filter */}
          <Select value={selectedCertification} onValueChange={setSelectedCertification}>
            <SelectTrigger>
              <SelectValue placeholder="All certifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All certifications</SelectItem>
              {certifications.map(cert => (
                <SelectItem key={cert} value={cert}>
                  {cert}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Verified farmers only</span>
          </label>

          {userLocation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Within:</span>
              <Select value={maxDistance.toString()} onValueChange={(value) => setMaxDistance(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10km</SelectItem>
                  <SelectItem value="25">25km</SelectItem>
                  <SelectItem value="50">50km</SelectItem>
                  <SelectItem value="100">100km</SelectItem>
                  <SelectItem value="1000">All distances</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!userLocation && (
            <Button variant="outline" size="sm" onClick={requestLocation}>
              <MapPin className="w-4 h-4 mr-2" />
              Enable location for distance filter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading farmers...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (filteredFarmers.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setSelectedSpecialty('all');
              setSelectedCertification('all');
              setVerifiedOnly(false);
              setMaxDistance(50);
            }}
          >
            Clear all filters
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''} found
            </h2>
            <p className="text-sm text-gray-600">
              Showing results {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Content */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarmers.map(renderFarmerCard)}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredFarmers.map(renderFarmerList)}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="h-[600px]">
            <FarmersMap
              farmers={filteredFarmers}
              userLocation={userLocation}
              onFarmerSelect={setSelectedFarmer}
              selectedFarmer={selectedFarmer}
              height="600px"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Local Farmers</h1>
        <p className="text-gray-600">
          Discover verified farmers in your area and browse their fresh, local products.
        </p>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Results */}
      {renderResults()}
    </div>
  );
};

export default FarmersDirectory;