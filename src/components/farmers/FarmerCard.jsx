// src/components/farmers/FarmerCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Star, 
  Package, 
  Shield,
  Leaf,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

const FarmerCard = ({ 
  farmer, 
  variant = 'default', // default, compact, detailed
  showActions = false,
  onContact,
  className = ""
}) => {
  const navigate = useNavigate();

  const farmName = farmer.farmInfo?.farmName || farmer.displayName;
  const location = farmer.location?.address || `${farmer.city || ''}, ${farmer.address || ''}`.trim();

  const handleClick = () => {
    navigate(`/farmers/${farmer.id}`);
  };

  const handleContactClick = (e) => {
    e.stopPropagation();
    if (onContact) {
      onContact(farmer);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    if (action === 'profile') {
      navigate(`/farmers/${farmer.id}`);
    } else if (action === 'contact') {
      onContact?.(farmer);
    }
  };

  if (variant === 'compact') {
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${className}`}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 shrink-0">
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
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{farmName}</h3>
                  {location && (
                    <p className="text-sm text-gray-600 truncate">{location}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm shrink-0">
                  {farmer.stats?.averageRating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span>{farmer.stats.averageRating}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Package className="w-4 h-4 mr-1" />
                    <span>{farmer.productCount || 0}</span>
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
  }

  if (variant === 'detailed') {
    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}>
        <CardContent className="p-0">
          {/* Header Image */}
          {farmer.farmInfo?.images?.[0] && (
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img 
                src={farmer.farmInfo.images[0]} 
                alt={farmName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                {farmer.isVerified && (
                  <Badge variant="success" className="bg-white/90 text-green-700">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {farmer.farmInfo?.certifications?.includes('organic') && (
                  <Badge variant="success" className="bg-white/90 text-green-700">
                    <Leaf className="w-3 h-3 mr-1" />
                    Organic
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="p-6" onClick={handleClick}>
            {/* Farmer Header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage 
                  src={farmer.profileImage} 
                  alt={farmName}
                />
                <AvatarFallback>
                  {farmName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'F'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{farmName}</h3>
                {location && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{location}</span>
                    {farmer.distance && (
                      <span className="ml-2 text-blue-600 text-sm">
                        ({farmer.distance}km away)
                      </span>
                    )}
                  </div>
                )}

                {/* Rating and Reviews */}
                {farmer.stats?.averageRating > 0 && (
                  <div className="flex items-center mb-2">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(farmer.stats.averageRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {farmer.stats.averageRating} ({farmer.stats.totalReviews} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {farmer.farmInfo?.description && (
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {farmer.farmInfo.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{farmer.productCount || 0}</div>
                <div className="text-xs text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{farmer.stats?.totalOrders || 0}</div>
                <div className="text-xs text-gray-600">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{farmer.stats?.averageRating || 0}</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>

            {/* Specialties */}
            {farmer.farmInfo?.specialties?.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {farmer.farmInfo.specialties.slice(0, 4).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {farmer.farmInfo.specialties.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{farmer.farmInfo.specialties.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              {farmer.farmInfo?.deliveryOptions?.deliveryAvailable && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delivery
                </span>
              )}
              {farmer.farmInfo?.deliveryOptions?.pickupAvailable && (
                <span>Pickup Available</span>
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

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => handleActionClick(e, 'profile')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => handleActionClick(e, 'contact')}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={handleClick}
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
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {farmName}
                </h3>
                {location && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{location}</span>
                    {farmer.distance && (
                      <span className="ml-2 text-blue-600 shrink-0">
                        ({farmer.distance}km away)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Verification Badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
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
                {farmer.productCount || 0} products
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
            <div className="flex items-center justify-between">
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

              {/* Contact Button */}
              {showActions && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleContactClick}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmerCard;