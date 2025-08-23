// src/components/reviews/EnhancedReviewList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StarRating from './StarRating';
import EnhancedReviewForm from './ReviewForm';
import FarmerResponseForm from './FarmerResponseForm';
import { 
  getProductReviews, 
  deleteReview, 
  voteReviewHelpful 
} from '../../firebase/reviews';
import { formatDistanceToNow } from 'date-fns';
import { 
  Pencil, 
  Trash2, 
  AlertCircle, 
  ThumbsUp, 
  MessageSquare, 
  Filter,
  Camera,
  VerifiedIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const EnhancedReviewList = ({ 
  productId, 
  productName, 
  showFarmerControls = false 
}) => {
  const { currentUser, userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [respondingToReview, setRespondingToReview] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [showPhotosOnly, setShowPhotosOnly] = useState(false);
  
  // Review statistics
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    detailedAverages: {
      quality: 0,
      freshness: 0,
      value: 0,
      packaging: 0,
      communication: 0
    }
  });
  
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get reviews with current filter and sort options
      const options = {
        sortBy,
        filterRating: filterRating !== 'all' ? filterRating : null,
        filterVerified: filterVerified !== 'all' ? filterVerified : null,
        onlyWithPhotos: showPhotosOnly,
        limitCount: 100
      };
      
      const data = await getProductReviews(productId, options);
      setReviews(data);
      
      // Calculate statistics
      calculateReviewStats(data);
      
    } catch (err) {
      console.error('Error loading reviews:', err);
      if (err.code === 'permission-denied') {
        setError('Reviews are temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to load reviews. Please try again.');
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateReviewStats = (reviewsData) => {
    if (!reviewsData.length) {
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        detailedAverages: { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 }
      });
      return;
    }
    
    const totalReviews = reviewsData.length;
    const averageRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      ratingDistribution[review.rating]++;
    });
    
    // Detailed ratings averages
    const detailedAverages = { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 };
    const reviewsWithDetailed = reviewsData.filter(r => r.detailedRatings);
    
    if (reviewsWithDetailed.length > 0) {
      Object.keys(detailedAverages).forEach(key => {
        const ratings = reviewsWithDetailed
          .map(r => r.detailedRatings[key])
          .filter(rating => rating > 0);
        
        if (ratings.length > 0) {
          detailedAverages[key] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
      });
    }
    
    setReviewStats({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      detailedAverages
    });
  };
  
  useEffect(() => {
    loadReviews();
  }, [productId, sortBy, filterRating, filterVerified, showPhotosOnly]);
  
  // Filter and sort reviews (client-side for complex filters)
  const filteredAndSortedReviews = useMemo(() => {
    return reviews; // Server-side filtering is already applied
  }, [reviews]);
  
  const handleEdit = (review) => {
    setEditingReview(review);
    setRespondingToReview(null);
  };
  
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review. Please try again.');
    }
  };
  
  const handleHelpfulVote = async (reviewId) => {
    try {
      await voteReviewHelpful(reviewId, currentUser.uid);
      loadReviews();
    } catch (err) {
      console.error('Error voting review helpful:', err);
      setError(err.message || 'Failed to vote. Please try again.');
    }
  };
  
  const handleFarmerResponse = (review) => {
    setRespondingToReview(review);
    setEditingReview(null);
  };
  
  const handleReviewSuccess = () => {
    loadReviews();
    setEditingReview(null);
    setRespondingToReview(null);
  };
  
  const toggleExpandReview = (reviewId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };
  
  // Check if current user has already reviewed
  const userReview = currentUser ? reviews.find(review => review.userId === currentUser.uid) : null;
  const canAddReview = currentUser && !userReview && !editingReview;
  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  
  const renderReviewStats = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Reviews</span>
          <Badge variant="secondary">{reviewStats.totalReviews} reviews</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            <StarRating rating={Math.round(reviewStats.averageRating)} size="large" />
            <span className="ml-2 text-2xl font-bold">{reviewStats.averageRating}</span>
            <span className="ml-1 text-gray-500">out of 5</span>
          </div>
        </div>
        
        {/* Rating Distribution */}
        <div className="space-y-2 mb-4">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = reviewStats.ratingDistribution[rating];
            const percentage = reviewStats.totalReviews > 0 
              ? (count / reviewStats.totalReviews) * 100 
              : 0;
            
            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-8">{rating} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
        
        {/* Detailed Averages */}
        {Object.values(reviewStats.detailedAverages).some(avg => avg > 0) && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Detailed Ratings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(reviewStats.detailedAverages).map(([key, average]) => {
                if (average === 0) return null;
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(average)} size="small" />
                      <span className="text-sm font-medium">{average.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  const renderFiltersAndSort = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter & Sort:</span>
          </div>
          
          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Rating Filter */}
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Verified Filter */}
          <Select value={filterVerified} onValueChange={setFilterVerified}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Photos Filter */}
          <Button
            variant={showPhotosOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPhotosOnly(!showPhotosOnly)}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            With Photos
          </Button>
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderReviewItem = (review) => {
    const isUserReview = currentUser && currentUser.uid === review.userId;
    const isExpanded = expandedReviews.has(review.id);
    const shouldTruncate = review.comment.length > 300;
    
    return (
      <Card key={review.id} className={`mb-4 ${isUserReview ? 'border-green-200 bg-green-50' : ''}`}>
        <CardContent className="p-6">
          {/* Review Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={review.rating} />
                <span className="font-medium">{review.userName}</span>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="text-xs">
                    <VerifiedIcon className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
                {isUserReview && (
                  <Badge className="text-xs bg-green-100 text-green-800">
                    Your Review
                  </Badge>
                )}
              </div>
              
              {review.title && (
                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              )}
              
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                {review.updatedAt && review.updatedAt !== review.createdAt && (
                  <span className="ml-2">(edited)</span>
                )}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {isUserReview && !editingReview && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(review)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {isFarmer && showFarmerControls && !review.farmerResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFarmerResponse(review)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Respond
                </Button>
              )}
            </div>
          </div>
          
          {/* Detailed Ratings */}
          {review.detailedRatings && Object.values(review.detailedRatings).some(r => r > 0) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Detailed Ratings:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(review.detailedRatings).map(([key, rating]) => {
                  if (rating === 0) return null;
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs">{label}</span>
                      <StarRating rating={rating} size="small" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Review Text */}
          <div className="mb-4">
            <p className="text-gray-700">
              {shouldTruncate && !isExpanded 
                ? `${review.comment.substring(0, 300)}...`
                : review.comment
              }
            </p>
            
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpandReview(review.id)}
                className="mt-2 p-0 h-auto text-blue-600"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Read more
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Review Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {review.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                    onClick={() => window.open(photo, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Farmer Response */}
          {review.farmerResponse && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex items-center mb-2">
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Farmer Response
                </Badge>
                <span className="ml-2 text-sm text-blue-600">
                  {formatDistanceToNow(new Date(review.farmerResponse.respondedAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-blue-800">{review.farmerResponse.comment}</p>
            </div>
          )}
          
          {/* Farmer Response Form */}
          {respondingToReview?.id === review.id && (
            <div className="mt-4">
              <FarmerResponseForm
                reviewId={review.id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setRespondingToReview(null)}
              />
            </div>
          )}
          
          {/* Review Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulVote(review.id)}
              className="flex items-center gap-2"
              disabled={!currentUser || isUserReview}
            >
              <ThumbsUp className="h-4 w-4" />
              Helpful ({review.helpfulVotes || 0})
            </Button>
            
            <div className="text-sm text-gray-500">
              Was this review helpful to you?
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (loading && reviews.length === 0) {
    return <div className="text-center py-6">Loading reviews...</div>;
  }
  
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Review Statistics */}
      {reviews.length > 0 && renderReviewStats()}
      
      {/* Add Review Form */}
      {canAddReview && (
        <div className="mb-6">
          <EnhancedReviewForm 
            productId={productId} 
            productName={productName}
            onSuccess={handleReviewSuccess}
            allowDetailedRatings={true}
            allowPhotos={true}
          />
        </div>
      )}
      
      {/* Edit Review Form */}
      {editingReview && (
        <div className="mb-6">
          <EnhancedReviewForm 
            productId={productId}
            productName={productName}
            existingReview={editingReview}
            onSuccess={handleReviewSuccess}
            allowDetailedRatings={true}
            allowPhotos={true}
          />
          <div className="mt-2 text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setEditingReview(null)}
            >
              Cancel Editing
            </Button>
          </div>
        </div>
      )}
      
      {/* Filters and Sort */}
      {reviews.length > 0 && renderFiltersAndSort()}
      
      {/* Reviews List */}
      {filteredAndSortedReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedReviews.map(renderReviewItem)}
        </div>
      ) : reviews.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Filter className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              No reviews match your current filters. Try adjusting your filter settings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-600">
              No reviews yet for this product. Be the first to leave a review!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedReviewList;