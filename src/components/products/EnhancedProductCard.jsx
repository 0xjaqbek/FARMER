// src/components/products/EnhancedProductCard.jsx
// Product card with inventory, location, and rating information

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Truck, 
  Leaf, 
  Clock, 
  Package, 
  Badge as BadgeIcon,
  Heart,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { ReviewService } from '../../services/reviewService';
import { LocationService } from '../../services/locationService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function EnhancedProductCard({ product, showFarmerInfo = true, onFavorite }) {
  const { userProfile } = useAuth();
  const { addToCart } = useCart();
  const [rating, setRating] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load additional product data
  useEffect(() => {
    loadProductData();
  }, [product.id]);

  const loadProductData = async () => {
    try {
      // Load rating data
      const ratingData = await ReviewService.getAggregatedRatings(product.id, 'product');
      setRating(ratingData);

      // Load farmer data if needed
      if (showFarmerInfo && product.farmerId) {
        // In a real app, you'd fetch this from Firestore
        // For now, we'll use the farmerId to get basic info
        setFarmer({
          id: product.farmerId,
          name: product.farmerName || 'Local Farmer',
          isVerified: true, // This would come from the farmer's profile
          avatar: product.farmerAvatar || ''
        });
      }

      // Calculate delivery info if user location is available
      if (userProfile?.location?.coordinates && product.location?.coordinates) {
        const distance = LocationService.calculateDistance(
          userProfile.location.coordinates.lat,
          userProfile.location.coordinates.lng,
          product.location.coordinates.lat,
          product.location.coordinates.lng
        );

        setDeliveryInfo({
          distance: Math.round(distance * 10) / 10,
          estimatedTime: LocationService.estimateDeliveryTime(distance),
          delivers: distance <= 50 // Assume 50km delivery radius
        });
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    try {
      addToCart({
        productId: product.id,
        quantity: 1,
        product: product
      });
      
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive"
      });
    }
  };

  // Handle favorite toggle
  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(product.id);
    }
  };

  // Get stock status
  const getStockStatus = () => {
    const available = product.inventory?.availableStock || 0;
    const threshold = product.inventory?.lowStockThreshold || 10;
    
    if (available === 0) return { status: 'out', color: 'destructive', label: 'Out of Stock' };
    if (available <= threshold) return { status: 'low', color: 'warning', label: 'Low Stock' };
    return { status: 'good', color: 'success', label: 'In Stock' };
  };

  // Get freshness indicator
  const getFreshnessInfo = () => {
    const freshness = product.quality?.freshness;
    switch (freshness) {
      case 'daily':
        return { label: 'Harvested Today', color: 'text-green-600', icon: Clock };
      case 'weekly':
        return { label: 'This Week', color: 'text-blue-600', icon: Clock };
      case 'preserved':
        return { label: 'Preserved', color: 'text-purple-600', icon: Package };
      default:
        return null;
    }
  };

  const stockStatus = getStockStatus();
  const freshnessInfo = getFreshnessInfo();
  const isOutOfStock = stockStatus.status === 'out';

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.quality?.organic && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Leaf className="h-3 w-3 mr-1" />
              Organic
            </Badge>
          )}
          
          {freshnessInfo && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <freshnessInfo.icon className="h-3 w-3 mr-1" />
              {freshnessInfo.label}
            </Badge>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute top-2 right-2">
          <Badge variant={stockStatus.color} className="text-xs">
            {stockStatus.label}
          </Badge>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
        </button>

        {/* Distance Info */}
        {deliveryInfo && (
          <div className="absolute bottom-2 left-2 bg-white/90 rounded-md px-2 py-1">
            <div className="flex items-center space-x-1 text-xs">
              <MapPin className="h-3 w-3 text-gray-600" />
              <span>{deliveryInfo.distance}km away</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Product Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-green-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>
          <div className="text-right ml-2">
            <p className="text-xl font-bold text-green-600">
              €{product.price?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              per {product.inventory?.unit || 'unit'}
            </p>
          </div>
        </div>

        {/* Rating */}
        {rating && rating.overall.count > 0 && (
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(rating.overall.average)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {rating.overall.average.toFixed(1)} ({rating.overall.count})
            </span>
          </div>
        )}

        {/* Farmer Info */}
        {showFarmerInfo && farmer && (
          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={farmer.avatar} />
              <AvatarFallback className="text-xs">
                {farmer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">{farmer.name}</span>
              {farmer.isVerified && (
                <BadgeIcon className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>
        )}

        {/* Stock Information */}
        <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{product.inventory?.availableStock || 0} available</span>
            </div>
            
            {deliveryInfo && deliveryInfo.delivers && (
              <div className="flex items-center space-x-1">
                <Truck className="h-3 w-3" />
                <span>{deliveryInfo.estimatedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.location.href = `/products/${product.id}`}
          >
            View Details
          </Button>
          
          <Button
            size="sm"
            disabled={isOutOfStock || loading}
            onClick={handleAddToCart}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {product.tags?.slice(0, 2).map((tag, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          
          {deliveryInfo && (
            <span>{deliveryInfo.distance}km away</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}