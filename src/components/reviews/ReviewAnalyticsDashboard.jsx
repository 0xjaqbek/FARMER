// src/components/reviews/ReviewAnalyticsDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import StarRating from './StarRating';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageSquare, 
  Users, 
  AlertCircle,
  Target,
  Award,
  BarChart3,
  Calendar
} from 'lucide-react';

const ReviewAnalyticsDashboard = ({ farmerId }) => {
  const { _userProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days
  
  useEffect(() => {
    loadAnalytics();
  }, [farmerId, timeRange]);
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch analytics data from your service
      const data = await getFarmerReviewAnalytics(farmerId, timeRange);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading review analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review analytics...</p>
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
  
  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No analytics data available.</AlertDescription>
      </Alert>
    );
  }
  
  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Overall Rating */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{analytics.averageRating}</span>
                <StarRating rating={Math.round(analytics.averageRating)} size="small" />
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex items-center mt-2">
            {analytics.ratingTrend === 'improving' && (
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Improving</span>
              </div>
            )}
            {analytics.ratingTrend === 'declining' && (
              <div className="flex items-center text-red-600">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm">Declining</span>
              </div>
            )}
            {analytics.ratingTrend === 'stable' && (
              <span className="text-sm text-gray-500">Stable</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Total Reviews */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold">{analytics.totalReviews}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.newReviewsThisMonth} new this month
          </p>
        </CardContent>
      </Card>
      
      {/* Response Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Response Rate</p>
              <p className="text-3xl font-bold">{analytics.responseRate}%</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <Progress value={analytics.responseRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      {/* Customer Satisfaction */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Satisfaction</p>
              <p className="text-3xl font-bold">
                {Math.round((analytics.satisfiedCustomers / analytics.totalReviews) * 100)}%
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            4+ star reviews
          </p>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderRatingDistribution = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = analytics.ratingDistribution[rating] || 0;
            const percentage = analytics.totalReviews > 0 
              ? (count / analytics.totalReviews) * 100 
              : 0;
            
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <Progress value={percentage} className="flex-1 h-3" />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderDetailedRatings = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Detailed Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analytics.detailedAverages).map(([category, average]) => {
            const label = category.charAt(0).toUpperCase() + category.slice(1);
            const percentage = (average / 5) * 100;
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(average)} size="small" />
                    <span className="text-sm text-gray-600">{average.toFixed(1)}</span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderTopProducts = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Top Rated Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-8 h-6 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.reviewCount} reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(product.rating)} size="small" />
                <span className="font-medium">{product.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderKeywords = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Positive Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">What Customers Love</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.positiveKeywords.map((keyword, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{keyword.word}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {keyword.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Negative Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.negativeKeywords.length > 0 ? (
              analytics.negativeKeywords.map((keyword, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{keyword.word}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {keyword.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No common negative feedback patterns found. Great job!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderImprovementSuggestions = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Improvement Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.improvementSuggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">{suggestion.title}</h4>
                <p className="text-sm text-blue-800">{suggestion.description}</p>
                {suggestion.impact && (
                  <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700">
                    Impact: {suggestion.impact}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderRecentReviews = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.recentReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="small" />
                  <span className="text-sm font-medium">{review.productName}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
              {!review.farmerResponse && (
                <Badge variant="outline" className="mt-2 text-xs text-orange-600 border-orange-300">
                  Needs Response
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Review Analytics</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recent">Recent Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverviewCards()}
          {renderRatingDistribution()}
          {renderTopProducts()}
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
          {renderDetailedRatings()}
          {renderImprovementSuggestions()}
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          {renderKeywords()}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          {renderRecentReviews()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Placeholder function - implement based on your Firebase structure
const getFarmerReviewAnalytics = async () => {
  // This would fetch comprehensive analytics from your review service
  return {
    averageRating: 4.3,
    totalReviews: 127,
    responseRate: 85,
    newReviewsThisMonth: 12,
    satisfiedCustomers: 98,
    ratingTrend: 'improving', // 'improving', 'declining', 'stable'
    ratingDistribution: {
      5: 45,
      4: 38,
      3: 25,
      2: 12,
      1: 7
    },
    detailedAverages: {
      quality: 4.4,
      freshness: 4.6,
      value: 4.1,
      packaging: 4.2,
      communication: 4.5
    },
    topProducts: [
      { id: '1', name: 'Organic Tomatoes', rating: 4.8, reviewCount: 23 },
      { id: '2', name: 'Fresh Lettuce', rating: 4.6, reviewCount: 18 },
      { id: '3', name: 'Heritage Carrots', rating: 4.5, reviewCount: 15 }
    ],
    positiveKeywords: [
      { word: 'fresh', count: 45 },
      { word: 'delicious', count: 32 },
      { word: 'quality', count: 28 },
      { word: 'organic', count: 24 },
      { word: 'excellent', count: 19 }
    ],
    negativeKeywords: [
      { word: 'expensive', count: 8 },
      { word: 'packaging', count: 5 },
      { word: 'delivery', count: 4 }
    ],
    improvementSuggestions: [
      {
        title: 'Improve Packaging Quality',
        description: 'Several reviews mention packaging issues. Consider upgrading packaging materials.',
        impact: 'Medium'
      },
      {
        title: 'Enhance Communication',
        description: 'Respond to more reviews to increase engagement and show customer care.',
        impact: 'High'
      }
    ],
    recentReviews: [
      {
        id: '1',
        rating: 5,
        productName: 'Organic Tomatoes',
        comment: 'Amazing quality! The tomatoes were so fresh and flavorful.',
        createdAt: new Date().toISOString(),
        farmerResponse: null
      },
      {
        id: '2',
        rating: 4,
        productName: 'Fresh Lettuce',
        comment: 'Good quality lettuce, though packaging could be better.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        farmerResponse: { comment: 'Thank you for the feedback!' }
      }
    ]
  };
};

export default ReviewAnalyticsDashboard;