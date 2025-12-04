// src/firebase/reviews.js - Complete Firebase Review Service Implementation
import { 
  collection, 
  doc,  
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './config';

// Collection names
const COLLECTIONS = {
  REVIEWS: 'reviews',
  PRODUCTS: 'products',
  USERS: 'users',
  RATINGS: 'ratings',
  ORDERS: 'orders'
};

// =============================================================================
// REVIEW CRUD OPERATIONS
// =============================================================================

/**
 * Create a new review with photos and detailed ratings
 */
export const addReview = async (reviewData) => {
  try {
    console.log('Adding review:', reviewData);
    
    // Check if user has already reviewed this product (outside transaction)
    const existingReview = await getUserReviewForProduct(reviewData.userId, reviewData.productId);
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }
    
    // Upload photos if any (outside transaction)
    let photoUrls = [];
    if (reviewData.photos && reviewData.photos.length > 0) {
      photoUrls = await uploadReviewPhotos(reviewData.photos, reviewData.userId, reviewData.productId);
    }
    
    // Prepare review document
    const reviewDocument = {
      productId: reviewData.productId,
      productName: reviewData.productName,
      userId: reviewData.userId,
      userName: reviewData.userName,
      userRole: reviewData.userRole,
      
      // Ratings
      rating: reviewData.rating,
      detailedRatings: reviewData.detailedRatings || null,
      
      // Content
      title: reviewData.title || '',
      comment: reviewData.comment,
      photos: photoUrls,
      
      // Metadata
      isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
      helpfulVotes: 0,
      reportedCount: 0,
      
      // Farmer response
      farmerResponse: null,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Use transaction to add review and update product ratings
    const reviewId = await runTransaction(db, async (transaction) => {
      // First, do all reads
      const productRef = doc(db, COLLECTIONS.PRODUCTS, reviewData.productId);
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }
      
      // Then do all writes
      const reviewRef = doc(collection(db, COLLECTIONS.REVIEWS));
      transaction.set(reviewRef, reviewDocument);
      
      // Update product ratings using the transaction
      await updateProductRatingsInTransaction(
        productRef,
        productDoc.data(),
        reviewData.rating, 
        reviewData.detailedRatings, 
        'add', 
        transaction
      );
      
      return reviewRef.id;
    });
    
    console.log('Review added successfully:', reviewId);
    return reviewId;
    
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

/**
 * Update an existing review
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    console.log('Updating review:', reviewId, updateData);
    
    // Get current review data (outside transaction)
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const currentReview = reviewDoc.data();
    const oldRating = currentReview.rating;
    const oldDetailedRatings = currentReview.detailedRatings;
    
    // Handle photo updates (outside transaction)
    let photoUrls = currentReview.photos || [];
    if (updateData.photos) {
      // Delete old photos that are not in the new list
      const photosToDelete = currentReview.photos?.filter(url => !updateData.existingPhotos?.includes(url)) || [];
      await deleteReviewPhotos(photosToDelete);
      
      // Upload new photos
      if (updateData.newPhotos && updateData.newPhotos.length > 0) {
        const newPhotoUrls = await uploadReviewPhotos(updateData.newPhotos, currentReview.userId, currentReview.productId);
        photoUrls = [...(updateData.existingPhotos || []), ...newPhotoUrls];
      } else {
        photoUrls = updateData.existingPhotos || [];
      }
    }
    
    // Prepare update document
    const updateDocument = {
      rating: updateData.rating || oldRating,
      detailedRatings: updateData.detailedRatings || oldDetailedRatings,
      title: updateData.title,
      comment: updateData.comment,
      photos: photoUrls,
      updatedAt: serverTimestamp()
    };
    
    // Use transaction to update review and product ratings
    await runTransaction(db, async (transaction) => {
      // First, do all reads
      const productRef = doc(db, COLLECTIONS.PRODUCTS, currentReview.productId);
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }
      
      // Then do all writes
      transaction.update(reviewRef, updateDocument);
      
      // Update product ratings if rating changed
      if (updateData.rating && updateData.rating !== oldRating) {
        // Remove old rating first
        await updateProductRatingsInTransaction(
          productRef,
          productDoc.data(),
          oldRating, 
          oldDetailedRatings, 
          'remove', 
          transaction
        );
        
        // Then add new rating
        const updatedProductData = calculateNewRatingData(
          productDoc.data(),
          oldRating,
          oldDetailedRatings,
          'remove'
        );
        
        await updateProductRatingsInTransaction(
          productRef,
          updatedProductData,
          updateData.rating,
          updateData.detailedRatings,
          'add',
          transaction
        );
      }
    });
    
    console.log('Review updated successfully');
    return true;
    
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId) => {
  try {
    console.log('Deleting review:', reviewId);
    
    // Get review data first (outside transaction)
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const reviewData = reviewDoc.data();
    
    // Use transaction to delete review and update product ratings
    await runTransaction(db, async (transaction) => {
      // First, do all reads
      const productRef = doc(db, COLLECTIONS.PRODUCTS, reviewData.productId);
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }
      
      // Then do all writes
      transaction.delete(reviewRef);
      
      // Update product ratings
      await updateProductRatingsInTransaction(
        productRef,
        productDoc.data(),
        reviewData.rating, 
        reviewData.detailedRatings, 
        'remove', 
        transaction
      );
    });
    
    // Delete associated photos (outside transaction)
    if (reviewData.photos && reviewData.photos.length > 0) {
      await deleteReviewPhotos(reviewData.photos);
    }
    
    console.log('Review deleted successfully');
    return true;
    
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// =============================================================================
// REVIEW QUERIES
// =============================================================================

/**
 * Get all reviews for a product with filtering and sorting
 */
export const getProductReviews = async (productId, options = {}) => {
  try {
    const {
      sortBy = 'newest',
      filterRating = null,
      filterVerified = null,
      onlyWithPhotos = false,
      limitCount = 50
    } = options;
    
    console.log('Getting product reviews:', productId, options);
    
    let q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('productId', '==', productId)
    );
    
    // Apply filters
    if (filterRating) {
      q = query(q, where('rating', '==', parseInt(filterRating)));
    }
    
    if (filterVerified === 'verified') {
      q = query(q, where('isVerifiedPurchase', '==', true));
    } else if (filterVerified === 'unverified') {
      q = query(q, where('isVerifiedPurchase', '==', false));
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'highest':
        q = query(q, orderBy('rating', 'desc'));
        break;
      case 'lowest':
        q = query(q, orderBy('rating', 'asc'));
        break;
      case 'helpful':
        q = query(q, orderBy('helpfulVotes', 'desc'));
        break;
      default:
        q = query(q, orderBy('createdAt', 'desc'));
    }
    
    q = query(q, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    let reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    }));
    
    // Apply client-side filters that can't be done in Firestore
    if (onlyWithPhotos) {
      reviews = reviews.filter(review => review.photos && review.photos.length > 0);
    }
    
    console.log(`Retrieved ${reviews.length} reviews for product ${productId}`);
    return reviews;
    
  } catch (error) {
    console.error('Error getting product reviews:', error);
    throw error;
  }
};

/**
 * Get reviews by a specific user
 */
export const getUserReviews = async (userId) => {
  try {
    console.log('Getting user reviews:', userId);
    
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    }));
    
    console.log(`Retrieved ${reviews.length} reviews for user ${userId}`);
    return reviews;
    
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
};

/**
 * Check if user has reviewed a specific product
 */
export const getUserReviewForProduct = async (userId, productId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    };
    
  } catch (error) {
    console.error('Error checking user review:', error);
    return null;
  }
};

// =============================================================================
// FARMER RESPONSES
// =============================================================================

/**
 * Add farmer response to a review
 */
export const addFarmerResponse = async (reviewId, responseData) => {
  try {
    console.log('Adding farmer response:', reviewId, responseData);
    
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const review = reviewDoc.data();
    
    // Verify farmer owns the product being reviewed
    const productRef = doc(db, COLLECTIONS.PRODUCTS, review.productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const product = productDoc.data();
    if (product.farmerId !== responseData.farmerId) {
      throw new Error('Unauthorized: You can only respond to reviews of your own products');
    }
    
    // Update review with farmer response
    await updateDoc(reviewRef, {
      farmerResponse: {
        comment: responseData.comment,
        farmerId: responseData.farmerId,
        farmerName: responseData.farmerName,
        respondedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    console.log('Farmer response added successfully');
    return true;
    
  } catch (error) {
    console.error('Error adding farmer response:', error);
    throw error;
  }
};

/**
 * Update farmer response
 */
export const updateFarmerResponse = async (reviewId, responseData) => {
  try {
    console.log('Updating farmer response:', reviewId, responseData);
    
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    
    await updateDoc(reviewRef, {
      'farmerResponse.comment': responseData.comment,
      'farmerResponse.updatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Farmer response updated successfully');
    return true;
    
  } catch (error) {
    console.error('Error updating farmer response:', error);
    throw error;
  }
};

// =============================================================================
// HELPFUL VOTES
// =============================================================================

/**
 * Vote a review as helpful
 */
export const voteReviewHelpful = async (reviewId, userId) => {
  try {
    console.log('Voting review helpful:', reviewId, userId);
    
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    
    // In a production app, you'd track who voted to prevent duplicate votes
    // For now, we'll just increment the counter
    await updateDoc(reviewRef, {
      helpfulVotes: increment(1),
      updatedAt: serverTimestamp()
    });
    
    console.log('Helpful vote recorded successfully');
    return true;
    
  } catch (error) {
    console.error('Error voting review helpful:', error);
    throw error;
  }
};

// =============================================================================
// PHOTO MANAGEMENT
// =============================================================================

/**
 * Upload review photos to Firebase Storage
 */
export const uploadReviewPhotos = async (photos, userId, productId) => {
  try {
    console.log(`Uploading ${photos.length} review photos`);
    
    const uploadPromises = photos.map(async (photo, index) => {
      const timestamp = Date.now();
      const filename = `review_${userId}_${productId}_${timestamp}_${index}.jpg`;
      const photoRef = ref(storage, `reviews/${filename}`);
      
      // Convert file to blob if needed
      const photoBlob = photo.file || photo;
      
      await uploadBytes(photoRef, photoBlob);
      const downloadURL = await getDownloadURL(photoRef);
      
      return downloadURL;
    });
    
    const photoUrls = await Promise.all(uploadPromises);
    console.log('Review photos uploaded successfully:', photoUrls);
    
    return photoUrls;
    
  } catch (error) {
    console.error('Error uploading review photos:', error);
    throw error;
  }
};

/**
 * Delete review photos from Firebase Storage
 */
export const deleteReviewPhotos = async (photoUrls) => {
  try {
    if (!photoUrls || photoUrls.length === 0) return;
    
    console.log(`Deleting ${photoUrls.length} review photos`);
    
    const deletePromises = photoUrls.map(async (photoUrl) => {
      try {
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
      } catch (error) {
        console.warn('Failed to delete photo:', photoUrl, error);
      }
    });
    
    await Promise.all(deletePromises);
    console.log('Review photos deleted successfully');
    
  } catch (error) {
    console.error('Error deleting review photos:', error);
  }
};

// =============================================================================
// RATING AGGREGATION
// =============================================================================

/**
 * Update product rating aggregations (transaction-safe version)
 */
const updateProductRatingsInTransaction = async (productRef, currentProductData, rating, detailedRatings = null, operation = 'add', transaction) => {
  const product = currentProductData;
  let newAverageRating = product.averageRating || 0;
  let newReviewCount = product.reviewCount || 0;
  let newRatingDistribution = product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let newDetailedAverages = product.detailedAverages || {
    quality: 0,
    freshness: 0,
    value: 0,
    packaging: 0,
    communication: 0
  };
  
  if (operation === 'add') {
    // Add new rating
    const newTotal = (newAverageRating * newReviewCount) + rating;
    newReviewCount += 1;
    newAverageRating = newTotal / newReviewCount;
    newRatingDistribution[rating] = (newRatingDistribution[rating] || 0) + 1;
    
    // Update detailed averages
    if (detailedRatings) {
      Object.keys(detailedRatings).forEach(key => {
        if (detailedRatings[key] > 0 && Object.prototype.hasOwnProperty.call(newDetailedAverages, key)) {
          const currentTotal = newDetailedAverages[key] * (newReviewCount - 1);
          newDetailedAverages[key] = (currentTotal + detailedRatings[key]) / newReviewCount;
        }
      });
    }
    
  } else if (operation === 'remove') {
    // Remove rating
    if (newReviewCount > 1) {
      const newTotal = (newAverageRating * newReviewCount) - rating;
      newReviewCount -= 1;
      newAverageRating = newTotal / newReviewCount;
      newRatingDistribution[rating] = Math.max(0, (newRatingDistribution[rating] || 0) - 1);
      
      // Update detailed averages
      if (detailedRatings && newReviewCount > 0) {
        Object.keys(detailedRatings).forEach(key => {
          if (detailedRatings[key] > 0 && Object.prototype.hasOwnProperty.call(newDetailedAverages, key)) {
            const currentTotal = newDetailedAverages[key] * (newReviewCount + 1);
            newDetailedAverages[key] = (currentTotal - detailedRatings[key]) / newReviewCount;
          }
        });
      }
    } else {
      // Last review being removed
      newReviewCount = 0;
      newAverageRating = 0;
      newRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      newDetailedAverages = { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 };
    }
  }
  
  // Update product document using transaction
  transaction.update(productRef, {
    averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
    reviewCount: newReviewCount,
    ratingDistribution: newRatingDistribution,
    detailedAverages: newDetailedAverages,
    updatedAt: serverTimestamp()
  });
};

/**
 * Calculate new rating data (helper for complex updates)
 */
const calculateNewRatingData = (currentProductData, rating, detailedRatings, operation) => {
  const product = { ...currentProductData };
  
  if (operation === 'remove') {
    if (product.reviewCount > 1) {
      const newTotal = (product.averageRating * product.reviewCount) - rating;
      product.reviewCount -= 1;
      product.averageRating = newTotal / product.reviewCount;
      product.ratingDistribution[rating] = Math.max(0, (product.ratingDistribution[rating] || 0) - 1);
    } else {
      product.reviewCount = 0;
      product.averageRating = 0;
      product.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      product.detailedAverages = { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 };
    }
  }
  
  return product;
};

// =============================================================================
// ANALYTICS AND INSIGHTS
// =============================================================================

/**
 * Get comprehensive review analytics for a farmer
 */
export const getFarmerReviewAnalytics = async (farmerId, timeRange = '30') => {
  try {
    console.log('Getting farmer review analytics:', farmerId, timeRange);
    
    // Get all products by this farmer
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('farmerId', '==', farmerId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productIds = productsSnapshot.docs.map(doc => doc.id);
    
    if (productIds.length === 0) {
      return getEmptyAnalytics();
    }
    
    // Get all reviews for farmer's products
    const reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('productId', 'in', productIds.slice(0, 10)), // Firestore limit
      orderBy('createdAt', 'desc')
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    const allReviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));
    
    // Filter by time range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    const filteredReviews = allReviews.filter(review => review.createdAt >= cutoffDate);
    
    return calculateAnalytics(allReviews, filteredReviews, productIds, productsSnapshot.docs);
    
  } catch (error) {
    console.error('Error getting farmer review analytics:', error);
    throw error;
  }
};

/**
 * Calculate review analytics from data
 */
const calculateAnalytics = (allReviews, filteredReviews, productIds, productDocs) => {
  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
  
  // Response rate
  const responsesGiven = allReviews.filter(r => r.farmerResponse?.comment).length;
  const responseRate = totalReviews > 0 ? Math.round((responsesGiven / totalReviews) * 100) : 0;
  
  // Rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach(review => {
    ratingDistribution[review.rating]++;
  });
  
  // Detailed averages
  const detailedAverages = { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 };
  const reviewsWithDetailed = allReviews.filter(r => r.detailedRatings);
  
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
  
  // Keywords analysis
  const positiveReviews = allReviews.filter(r => r.rating >= 4);
  const negativeReviews = allReviews.filter(r => r.rating <= 2);
  
  // Top products
  const productRatings = productDocs.map(doc => {
    const product = doc.data();
    return {
      id: doc.id,
      name: product.name,
      rating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0
    };
  }).filter(p => p.reviewCount > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    responseRate,
    newReviewsThisMonth: filteredReviews.length,
    satisfiedCustomers: allReviews.filter(r => r.rating >= 4).length,
    ratingTrend: calculateTrend(allReviews),
    ratingDistribution,
    detailedAverages,
    topProducts: productRatings,
    positiveKeywords: extractKeywords(positiveReviews).slice(0, 10),
    negativeKeywords: extractKeywords(negativeReviews).slice(0, 10),
    improvementSuggestions: generateImprovementSuggestions(detailedAverages, negativeReviews),
    recentReviews: allReviews.slice(0, 5)
  };
};

/**
 * Helper functions
 */
const getEmptyAnalytics = () => ({
  averageRating: 0,
  totalReviews: 0,
  responseRate: 0,
  newReviewsThisMonth: 0,
  satisfiedCustomers: 0,
  ratingTrend: 'stable',
  ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  detailedAverages: { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 },
  topProducts: [],
  positiveKeywords: [],
  negativeKeywords: [],
  improvementSuggestions: [],
  recentReviews: []
});

const calculateTrend = (reviews) => {
  if (reviews.length < 10) return 'stable';
  
  const recent = reviews.slice(0, Math.floor(reviews.length / 2));
  const older = reviews.slice(Math.floor(reviews.length / 2));
  
  const recentAvg = recent.reduce((sum, r) => sum + r.rating, 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + r.rating, 0) / older.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 0.3) return 'improving';
  if (difference < -0.3) return 'declining';
  return 'stable';
};

const extractKeywords = (reviews) => {
  const allText = reviews.map(r => r.comment.toLowerCase()).join(' ');
  const words = allText.match(/\b\w{4,}\b/g) || [];
  
  const stopWords = ['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'been', 'were'];
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  const wordCount = {};
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .map(([word, count]) => ({ word, count }));
};

const generateImprovementSuggestions = (detailedAverages, negativeReviews) => {
  const suggestions = [];
  
  // Check detailed ratings for improvement areas
  Object.entries(detailedAverages).forEach(([category, rating]) => {
    if (rating > 0 && rating < 4) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      suggestions.push({
        title: `Improve ${categoryName}`,
        description: `Your ${category} rating is ${rating.toFixed(1)}/5. Consider focusing on this area.`,
        impact: rating < 3 ? 'High' : 'Medium'
      });
    }
  });
  
  // Add response rate suggestion if low
  if (suggestions.length === 0 && negativeReviews.length > 0) {
    suggestions.push({
      title: 'Respond to Customer Feedback',
      description: 'Responding to reviews shows customers you care and can help improve satisfaction.',
      impact: 'High'
    });
  }
  
  return suggestions;
};

export default {
  // Review CRUD
  addReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  getUserReviewForProduct,
  
  // Farmer responses
  addFarmerResponse,
  updateFarmerResponse,
  
  // Interactions
  voteReviewHelpful,
  
  // Photos
  uploadReviewPhotos,
  deleteReviewPhotos,
  
  // Analytics
  getFarmerReviewAnalytics
};