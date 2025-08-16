// src/pages/farmers/FarmerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Star, 
  MessageSquare, 
  ShoppingCart,
  Truck,
  Clock,
  Award,
  Users,
  Package,
  ArrowLeft,
  Facebook,
  Instagram,
  Twitter,
  Shield,
  Leaf,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/products/ProductCard';
import FarmersMap from '../../components/maps/FarmersMap';

const FarmerProfile = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    averageRating: 0,
    totalReviews: 0,
    totalOrders: 0,
    responseTime: '2-4 hours'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (farmerId) {
      loadFarmerData();
    }
  }, [farmerId]);

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load farmer profile
      const farmerDoc = await getDoc(doc(db, 'users', farmerId));
      if (!farmerDoc.exists()) {
        throw new Error('Farmer not found');
      }

      const farmerData = { id: farmerDoc.id, ...farmerDoc.data() };
      
      // Check if user is actually a farmer
      if (!['farmer', 'rolnik'].includes(farmerData.role)) {
        throw new Error('User is not a farmer');
      }

      setFarmer(farmerData);

      // Load farmer's products
      await loadFarmerProducts(farmerId);
      
      // Load reviews and stats
      await loadFarmerReviews(farmerId);
      await loadFarmerStats(farmerId);

    } catch (error) {
      console.error('Error loading farmer data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFarmerProducts = async (farmerId) => {
    try {
      // Try both farmerId and rolnikId for compatibility
      let q = query(
        collection(db, 'products'), 
        where('farmerId', '==', farmerId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      let snapshot = await getDocs(q);
      let productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no products found with farmerId, try rolnikId
      if (productList.length === 0) {
        q = query(
          collection(db, 'products'), 
          where('rolnikId', '==', farmerId),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        
        snapshot = await getDocs(q);
        productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      setProducts(productList);
      
    } catch (error) {
      console.error('Error loading farmer products:', error);
    }
  };

  const loadFarmerReviews = async (farmerId) => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('farmerId', '==', farmerId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const reviewList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setReviews(reviewList);
    } catch (error) {
      console.error('Error loading farmer reviews:', error);
    }
  };

  const loadFarmerStats = async (farmerId) => {
    try {
      // Calculate stats from reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('farmerId', '==', farmerId),
        where('status', '==', 'published')
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const allReviews = reviewsSnapshot.docs.map(doc => doc.data());
      
      const averageRating = allReviews.length > 0 
        ? allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length
        : 0;

      // Count orders (simplified - in real app you'd have proper order tracking)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('farmerId', '==', farmerId)
      );
      
      let totalOrders = 0;
      try {
        const ordersSnapshot = await getDocs(ordersQuery);
        totalOrders = ordersSnapshot.size;
      } catch (error) {
        // Orders collection might not exist yet
        console.warn('Could not load order stats:', error);
      }

      setStats({
        totalProducts: products.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: allReviews.length,
        totalOrders,
        responseTime: '2-4 hours' // This would be calculated from message data
      });

    } catch (error) {
      console.error('Error loading farmer stats:', error);
    }
  };

  const handleContactFarmer = () => {
    // Implement messaging functionality
    toast({
      title: "Message Feature",
      description: "Contact farmer functionality will be implemented here.",
    });
  };

  const handleFollowFarmer = () => {
    // Implement follow functionality
    toast({
      title: "Follow Feature",
      description: "Follow farmer functionality will be implemented here.",
    });
  };

  const renderFarmerHeader = () => {
    const farmName = farmer.farmInfo?.farmName || farmer.farmName || farmer.displayName;
    const location = farmer.location?.address || `${farmer.city || ''}, ${farmer.address || ''}`.trim();

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Farmer Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage 
                  src={farmer.profileImage || farmer.farmInfo?.images?.[0]} 
                  alt={farmName}
                />
                <AvatarFallback className="text-2xl">
                  {farmName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'F'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex gap-2 mb-4">
                {farmer.isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
                {farmer.farmInfo?.certifications?.includes('organic') && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Organic
                  </Badge>
                )}
              </div>
            </div>

            {/* Farmer Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{farmName}</h1>
                  {location && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{location}</span>
                    </div>
                  )}
                  
                  {stats.averageRating > 0 && (
                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < Math.floor(stats.averageRating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {stats.averageRating} ({stats.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button onClick={handleContactFarmer} className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact
                  </Button>
                  <Button variant="outline" onClick={handleFollowFarmer}>
                    <Users className="w-4 h-4" />
                    Follow
                  </Button>
                </div>
              </div>

              {/* Farm Description */}
              {farmer.farmInfo?.description && (
                <p className="text-gray-700 mb-4">{farmer.farmInfo.description}</p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                  <div className="text-sm text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.averageRating}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.responseTime}</div>
                  <div className="text-sm text-gray-600">Response</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProducts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.length > 0 ? (
        products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            showFarmerInfo={false}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
          <p className="text-gray-600">This farmer hasn't listed any products yet.</p>
        </div>
      )}
    </div>
  );

  const renderFarmInfo = () => (
    <div className="space-y-6">
      {/* Farm Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Farm Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {farmer.farmInfo?.established && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Established:</span>
              <span className="font-medium">{farmer.farmInfo.established}</span>
            </div>
          )}
          
          {farmer.farmInfo?.farmSize && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Farm Size:</span>
              <span className="font-medium">{farmer.farmInfo.farmSize}</span>
            </div>
          )}

          {farmer.farmInfo?.farmingMethods?.length > 0 && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Farming Methods:</span>
              <div className="flex flex-wrap gap-2">
                {farmer.farmInfo.farmingMethods.map((method, index) => (
                  <Badge key={index} variant="outline">{method}</Badge>
                ))}
              </div>
            </div>
          )}

          {farmer.farmInfo?.specialties?.length > 0 && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Specialties:</span>
              <div className="flex flex-wrap gap-2">
                {farmer.farmInfo.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">{specialty}</Badge>
                ))}
              </div>
            </div>
          )}

          {farmer.farmInfo?.certifications?.length > 0 && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Certifications:</span>
              <div className="flex flex-wrap gap-2">
                {farmer.farmInfo.certifications.map((cert, index) => (
                  <Badge key={index} variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery & Pickup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pickup Available:</span>
            <Badge variant={farmer.farmInfo?.deliveryOptions?.pickupAvailable ? "success" : "secondary"}>
              {farmer.farmInfo?.deliveryOptions?.pickupAvailable ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Delivery Available:</span>
            <Badge variant={farmer.farmInfo?.deliveryOptions?.deliveryAvailable ? "success" : "secondary"}>
              {farmer.farmInfo?.deliveryOptions?.deliveryAvailable ? "Yes" : "No"}
            </Badge>
          </div>

          {farmer.farmInfo?.deliveryOptions?.deliveryRadius && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivery Radius:</span>
              <span className="font-medium">{farmer.farmInfo.deliveryOptions.deliveryRadius}km</span>
            </div>
          )}

          {farmer.farmInfo?.deliveryOptions?.deliveryFee !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivery Fee:</span>
              <span className="font-medium">
                {farmer.farmInfo.deliveryOptions.deliveryFee === 0 
                  ? "Free" 
                  : `$${farmer.farmInfo.deliveryOptions.deliveryFee}`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {farmer.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <a href={`mailto:${farmer.email}`} className="text-blue-600 hover:underline">
                {farmer.email}
              </a>
            </div>
          )}
          
          {farmer.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <a href={`tel:${farmer.phoneNumber}`} className="text-blue-600 hover:underline">
                {farmer.phoneNumber}
              </a>
            </div>
          )}

          {farmer.farmInfo?.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <a 
                href={farmer.farmInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit Website
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Social Media */}
          <div className="pt-2">
            <span className="text-sm text-gray-600 block mb-2">Social Media:</span>
            <div className="flex gap-2">
              {farmer.farmInfo?.socialMedia?.facebook && (
                <a 
                  href={farmer.farmInfo.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {farmer.farmInfo?.socialMedia?.instagram && (
                <a 
                  href={farmer.farmInfo.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {farmer.farmInfo?.socialMedia?.twitter && (
                <a 
                  href={farmer.farmInfo.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-600"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-4">
      {reviews.length > 0 ? (
        reviews.map(review => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="font-medium">{review.title}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{review.comment}</p>
              {review.farmerResponse && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Farmer Response:</p>
                  <p className="text-sm text-gray-700">{review.farmerResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">Be the first to leave a review for this farmer!</p>
        </div>
      )}
    </div>
  );

  const renderLocation = () => {
    if (!farmer.location || (!farmer.location.lat && !farmer.location.coordinates)) {
      return (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Location Not Available</h3>
          <p className="text-gray-600">This farmer hasn't shared their location yet.</p>
        </div>
      );
    }

    return (
      <FarmersMap
        farmers={[farmer]}
        products={products}
        userLocation={userProfile?.location?.coordinates}
        height="500px"
        className="w-full"
      />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading farmer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Farmer Header */}
      {renderFarmerHeader()}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="about">About Farm</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {renderProducts()}
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          {renderFarmInfo()}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {renderReviews()}
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          {renderLocation()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerProfile;