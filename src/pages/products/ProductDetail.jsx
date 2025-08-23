// src/pages/products/ProductDetail.jsx - Updated with Enhanced Reviews
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProductById } from '../../firebase/products';
import AddToCart from '@/components/cart/AddToCart';
import StarRating from '@/components/reviews/StarRating';
// Import the new enhanced review components
import EnhancedReviewList from '@/components/reviews/ReviewList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Leaf, ArrowLeft, Star } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const productData = await getProductById(id);
        
        if (!productData) {
          setError('Product not found');
          return;
        }
        
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Product not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is the farmer who owns this product
  const isFarmerOwner = userProfile?.role === 'rolnik' && userProfile?.uid === product.farmerId;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link to="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Product Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Leaf className="h-16 w-16 mx-auto mb-2" />
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional images thumbnail gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity">
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.isOrganic && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  <Leaf className="mr-1 h-3 w-3" />
                  Organic
                </Badge>
              )}
              {product.stockQuantity > 0 ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Product Name & Rating */}
            <div>
              <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
              
              {/* Rating Display */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={product.averageRating || 0} size="medium" />
                  <span className="text-lg font-medium">
                    {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            
            {/* Price & Stock */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-green-600">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-gray-500">per {product.unit}</span>
              </div>
              <p className="text-sm text-gray-600">
                {product.stockQuantity > 0 ? (
                  <>
                    <span className="text-green-600 font-medium">{product.stockQuantity} {product.unit} available</span>
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Currently out of stock</span>
                )}
              </p>
            </div>
            
            {/* Farmer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Farmer Information</h3>
              <div className="space-y-2">
                <p className="font-medium flex items-center">
                  <span>{product.rolnikName || 'Local Farmer'}</span>
                </p>
                <p className="text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {product.postalCode || 'Local Area'}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/farmers/${product.farmerId}`}>
                    View Farmer Profile
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/chat/${product.farmerId}`}>
                    Contact Farmer
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Purchase Actions */}
            {!isFarmerOwner && (
              <div className="space-y-3 pt-4">
                {userProfile?.role === 'klient' || userProfile?.role === 'customer' ? (
                  <>
                    <AddToCart product={product} disabled={product.stockQuantity === 0} />
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={product.stockQuantity === 0}
                      asChild
                    >
                      <Link to={`/orders/create/${product.id}`}>
                        Buy Now
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Card className="p-4 text-center">
                    <p className="text-gray-600 mb-3">
                      You need a customer account to purchase products.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/register">Create Customer Account</Link>
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {isFarmerOwner && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Product Management</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/products/${product.id}/edit`}>
                      Edit Product
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/products/${product.id}/images`}>
                      Manage Images
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t">
          <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab} className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="details" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Reviews ({product.reviewCount || 0})
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Product Information</h3>
                  <div className="space-y-4">
                    <div>
                      <dt className="font-medium text-gray-900">Description</dt>
                      <dd className="text-gray-600 mt-1">{product.description}</dd>
                    </div>
                    
                    <div>
                      <dt className="font-medium text-gray-900">Category</dt>
                      <dd className="text-gray-600 mt-1">{product.category}</dd>
                    </div>
                    
                    <div>
                      <dt className="font-medium text-gray-900">Unit</dt>
                      <dd className="text-gray-600 mt-1">{product.unit}</dd>
                    </div>
                    
                    {product.origin && (
                      <div>
                        <dt className="font-medium text-gray-900">Origin</dt>
                        <dd className="text-gray-600 mt-1">{product.origin}</dd>
                      </div>
                    )}
                    
                    {product.isOrganic && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <dt className="font-medium text-green-900 flex items-center">
                          <Leaf className="h-4 w-4 mr-2" />
                          Certified Organic
                        </dt>
                        <dd className="text-green-700 mt-1 text-sm">
                          This product is certified organic, grown without synthetic pesticides, fertilizers, or GMOs.
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Farmer Information</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <dt className="font-medium text-gray-900">Farm</dt>
                        <dd className="text-gray-600 mt-1">{product.rolnikName || 'Local Farm'}</dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-gray-900">Location</dt>
                        <dd className="text-gray-600 mt-1 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {product.postalCode || 'Local Area'}
                        </dd>
                      </div>
                      
                      {product.farmInfo?.description && (
                        <div>
                          <dt className="font-medium text-gray-900">About the Farm</dt>
                          <dd className="text-gray-600 mt-1">{product.farmInfo.description}</dd>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/farmers/${product.farmerId}`}>
                          View Full Farmer Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="p-8">
              {/* Enhanced Review System */}
              <EnhancedReviewList 
                productId={product.id} 
                productName={product.name}
                farmerId={product.farmerId}
                showFarmerControls={isFarmerOwner}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;