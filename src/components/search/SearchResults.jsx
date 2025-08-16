// src/components/search/SearchResults.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Clock, Truck, Leaf } from 'lucide-react';

const SearchResults = ({ results, userLocation, onProductClick, loading, selectedFarmer }) => {
  const formatDistance = (kilometers) => {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    } else if (kilometers < 10) {
      return `${kilometers.toFixed(1)}km`;
    } else {
      return `${Math.round(kilometers)}km`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results?.products?.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search filters or location radius.</p>
      </div>
    );
  }

  // Filter products by selected farmer if any
  const displayProducts = selectedFarmer 
    ? results.products.filter(p => p.farmerId === selectedFarmer.id)
    : results.products;

  return (
    <div className="space-y-4">
      {/* Results header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Found {results.totalFound || displayProducts.length} products
          {userLocation && (
            <span className="ml-2">near your location</span>
          )}
          {selectedFarmer && (
            <span className="ml-2">from {selectedFarmer.farmName || selectedFarmer.farmerName}</span>
          )}
        </p>
        {results.searchTime && (
          <Badge variant="outline" className="text-xs">
            Search time: {Date.now() - results.searchTime}ms
          </Badge>
        )}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div onClick={() => onProductClick?.(product)}>
              {/* Product image */}
              <div className="relative h-48 bg-gray-200">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isOrganic && (
                    <Badge className="bg-green-600 text-white">
                      <Leaf className="w-3 h-3 mr-1" />
                      Organic
                    </Badge>
                  )}
                  {product.freshness === 'today' && (
                    <Badge className="bg-blue-600 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      Fresh Today
                    </Badge>
                  )}
                </div>

                {/* Distance badge */}
                {product.distance && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/90">
                      <MapPin className="w-3 h-3 mr-1" />
                      {formatDistance(product.distance)}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Product name and price */}
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    <span className="font-bold text-green-600">{product.price} PLN</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                  {/* Farmer info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {product.farmerName}
                    </span>
                    {product.farmerLocation?.city && (
                      <span>{product.farmerLocation.city}</span>
                    )}
                  </div>

                  {/* Delivery options */}
                  {product.deliveryOptions && (
                    <div className="flex gap-1 flex-wrap">
                      {product.deliveryOptions.map((option) => (
                        <Badge key={option} variant="outline" className="text-xs">
                          <Truck className="w-3 h-3 mr-1" />
                          {option === 'pickup' ? 'Pickup' : option === 'delivery' ? 'Delivery' : 'Market'}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stock status */}
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                    
                    <Button 
                      size="sm" 
                      disabled={product.stock === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle add to cart
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Load more */}
      {results.hasMore && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={() => {/* Handle load more */}}>
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;