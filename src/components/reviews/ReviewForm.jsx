// src/components/reviews/EnhancedReviewForm.jsx
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StarRating from './StarRating';
import { addReview, updateReview } from '../../firebase/reviews';
import { Loader2, Upload, X, Camera, Star } from 'lucide-react';

const EnhancedReviewForm = ({ 
  productId, 
  productName, 
  existingReview = null, 
  onSuccess,
  allowDetailedRatings = true,
  allowPhotos = true 
}) => {
  const { currentUser, userProfile } = useAuth();
  const fileInputRef = useRef();
  
  // Basic review data
  const [overallRating, setOverallRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [reviewTitle, setReviewTitle] = useState(existingReview?.title || '');
  
  // Detailed ratings
  const [detailedRatings, setDetailedRatings] = useState(
    existingReview?.detailedRatings || {
      quality: 0,
      freshness: 0,
      value: 0,
      packaging: 0,
      communication: 0
    }
  );
  
  // Photos
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState(existingReview?.photos || []);
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  
  const isEditing = !!existingReview;
  
  // Detailed rating categories with descriptions
  const ratingCategories = [
    {
      key: 'quality',
      label: 'Product Quality',
      description: 'How would you rate the overall quality of the product?'
    },
    {
      key: 'freshness',
      label: 'Freshness',
      description: 'How fresh was the product when you received it?'
    },
    {
      key: 'value',
      label: 'Value for Money',
      description: 'Do you feel the product was worth the price paid?'
    },
    {
      key: 'packaging',
      label: 'Packaging',
      description: 'How well was the product packaged and presented?'
    },
    {
      key: 'communication',
      label: 'Farmer Communication',
      description: 'How responsive and helpful was the farmer?'
    }
  ];
  
  const handleDetailedRatingChange = (category, rating) => {
    setDetailedRatings(prev => ({
      ...prev,
      [category]: rating
    }));
    
    // Auto-calculate overall rating based on detailed ratings
    if (allowDetailedRatings) {
      const ratings = Object.values({ ...detailedRatings, [category]: rating });
      const nonZeroRatings = ratings.filter(r => r > 0);
      if (nonZeroRatings.length > 0) {
        const average = nonZeroRatings.reduce((sum, r) => sum + r, 0) / nonZeroRatings.length;
        setOverallRating(Math.round(average));
      }
    }
  };
  
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxPhotos = 5;
    
    if (photos.length + files.length > maxPhotos) {
      setError(`You can upload maximum ${maxPhotos} photos`);
      return;
    }
    
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setError('Please upload only image files');
        return false;
      }
      if (!isValidSize) {
        setError('Image size should be less than 5MB');
        return false;
      }
      return true;
    });
    
    // Create preview URLs for new photos
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    setError('');
  };
  
  const removePhoto = (index, isExisting = false) => {
    if (isExisting) {
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const validateForm = () => {
    if (overallRating === 0) {
      return 'Please provide an overall rating';
    }
    
    if (!comment.trim()) {
      return 'Please write a review comment';
    }
    
    if (comment.trim().length < 10) {
      return 'Review comment should be at least 10 characters long';
    }
    
    if (allowDetailedRatings) {
      const hasDetailedRatings = Object.values(detailedRatings).some(r => r > 0);
      if (!hasDetailedRatings) {
        return 'Please provide at least one detailed rating';
      }
    }
    
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Prepare review data
      const reviewData = {
        productId,
        productName,
        rating: overallRating,
        comment: comment.trim(),
        title: reviewTitle.trim(),
        detailedRatings: allowDetailedRatings ? detailedRatings : undefined,
        userId: currentUser.uid,
        userName: `${userProfile.firstName} ${userProfile.lastName}`,
        userRole: userProfile.role,
        isVerifiedPurchase: true, // You should verify this based on actual purchase
        photos: photos.map(p => p.file || p) // Extract file objects
      };
      
      // Submit review using Firebase functions
      if (isEditing) {
        await updateReview(existingReview.id, {
          ...reviewData,
          existingPhotos,
          newPhotos: photos.map(p => p.file).filter(Boolean)
        });
        setSuccess('Your review has been updated successfully');
      } else {
        await addReview(reviewData);
        setSuccess('Your review has been submitted successfully');
        // Reset form
        setOverallRating(0);
        setComment('');
        setReviewTitle('');
        setDetailedRatings({
          quality: 0,
          freshness: 0,
          value: 0,
          packaging: 0,
          communication: 0
        });
        setPhotos([]);
      }
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Rating</TabsTrigger>
              {allowDetailedRatings && <TabsTrigger value="detailed">Detailed Ratings</TabsTrigger>}
              {allowPhotos && <TabsTrigger value="photos">Photos</TabsTrigger>}
            </TabsList>
            
            {/* Basic Rating Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Rating *
                </label>
                <StarRating 
                  rating={overallRating} 
                  onChange={setOverallRating} 
                  interactive={true}
                  size="large" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  {overallRating === 0 && 'Click on stars to rate'}
                  {overallRating === 1 && 'Poor'}
                  {overallRating === 2 && 'Fair'}
                  {overallRating === 3 && 'Good'}
                  {overallRating === 4 && 'Very Good'}
                  {overallRating === 5 && 'Excellent'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Give your review a title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review *
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product. What did you like or dislike? How was the quality, freshness, and value?"
                  rows={6}
                  className="w-full"
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 10 characters</span>
                  <span>{comment.length}/1000</span>
                </div>
              </div>
            </TabsContent>
            
            {/* Detailed Ratings Tab */}
            {allowDetailedRatings && (
              <TabsContent value="detailed" className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Rate Different Aspects</h4>
                  <div className="space-y-4">
                    {ratingCategories.map(category => (
                      <div key={category.key} className="border-b border-gray-100 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{category.label}</h5>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                          <Badge variant={detailedRatings[category.key] > 0 ? "default" : "secondary"}>
                            {detailedRatings[category.key] > 0 ? detailedRatings[category.key] : 'Not rated'}
                          </Badge>
                        </div>
                        <StarRating
                          rating={detailedRatings[category.key]}
                          onChange={(rating) => handleDetailedRatingChange(category.key, rating)}
                          interactive={true}
                          size="medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
            
            {/* Photos Tab */}
            {allowPhotos && (
              <TabsContent value="photos" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Add Photos (Optional)</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Help other customers by sharing photos of the product you received.
                  </p>
                  
                  {/* Photo Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload photos of your product</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photos.length + existingPhotos.length >= 5}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photos
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum 5 photos, 5MB each. Supported: JPG, PNG, GIF
                    </p>
                  </div>
                  
                  {/* Photo Previews */}
                  {(existingPhotos.length > 0 || photos.length > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {/* Existing Photos */}
                      {existingPhotos.map((photo, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <img
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removePhoto(index, true)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* New Photos */}
                      {photos.map((photo, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={photo.preview}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removePhoto(index, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Badge className="absolute bottom-1 left-1 text-xs">
                            New
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          {/* Submit Button */}
          <div className="mt-6 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={loading || overallRating === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating Review...' : 'Submitting Review...'}
                </>
              ) : (
                isEditing ? 'Update Review' : 'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedReviewForm;