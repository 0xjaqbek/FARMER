// src/services/reviewService.js
// Complete review and rating system

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
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, createReviewSchema, createRatingSchema } from '../lib/firebaseSchema';
import { NotificationService } from './notificationService';

export class ReviewService {
  
  // Create a new review
  static async createReview(reviewData) {
    try {
      // Validate review data
      const validation = this.validateReviewData(reviewData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Check if user has already reviewed this item
      const existingReview = await this.getUserReviewForTarget(
        reviewData.customerId, 
        reviewData.targetId, 
        reviewData.type
      );
      
      if (existingReview) {
        throw new Error('You have already reviewed this item');
      }
      
      // Verify purchase if it's a product review
      if (reviewData.type === 'product' && reviewData.orderId) {
        const isPurchaseVerified = await this.verifyPurchase(
          reviewData.customerId, 
          reviewData.targetId, 
          reviewData.orderId
        );
        reviewData.isVerifiedPurchase = isPurchaseVerified;
      }
      
      // Create review document
      const review = {
        ...createReviewSchema(),
        ...reviewData,
        createdAt: serverTimestamp()
      };
      
      // Use transaction to create review and update ratings
      const reviewId = await runTransaction(db, async (transaction) => {
        // Add review
        const reviewRef = doc(collection(db, COLLECTIONS.REVIEWS));
        transaction.set(reviewRef, review);
        
        // Update aggregated ratings
        await this.updateAggregatedRatings(
          reviewData.targetId, 
          reviewData.type, 
          reviewData.rating,
          reviewData.detailedRatings,
          'add',
          transaction
        );
        
        return reviewRef.id;
      });
      
      // Send notification to the target (farmer/product owner)
      await this.sendReviewNotification(reviewId, reviewData);
      
      return reviewId;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }
  
  // Update existing review
  static async updateReview(reviewId, userId, updates) {
    try {
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const review = reviewDoc.data();
      
      // Check ownership
      if (review.customerId !== userId) {
        throw new Error('Unauthorized to update this review');
      }
      
      // Check if review is still editable (within 24 hours)
      const reviewDate = new Date(review.createdAt.seconds * 1000);
      const now = new Date();
      const hoursSinceCreation = (now - reviewDate) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 24) {
        throw new Error('Review can only be edited within 24 hours of creation');
      }
      
      const oldRating = review.rating;
      const oldDetailedRatings = review.detailedRatings;
      
      // Update review
      await runTransaction(db, async (transaction) => {
        transaction.update(reviewRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        
        // Update aggregated ratings if rating changed
        if (updates.rating && updates.rating !== oldRating) {
          // Remove old rating
          await this.updateAggregatedRatings(
            review.targetId, 
            review.type, 
            oldRating,
            oldDetailedRatings,
            'remove',
            transaction
          );
          
          // Add new rating
          await this.updateAggregatedRatings(
            review.targetId, 
            review.type, 
            updates.rating,
            updates.detailedRatings || oldDetailedRatings,
            'add',
            transaction
          );
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }
  
  // Delete review
  static async deleteReview(reviewId, userId) {
    try {
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const review = reviewDoc.data();
      
      // Check ownership or admin privileges
      if (review.customerId !== userId) {
        // Check if user is admin
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          throw new Error('Unauthorized to delete this review');
        }
      }
      
      // Use transaction to delete review and update ratings
      await runTransaction(db, async (transaction) => {
        transaction.delete(reviewRef);
        
        // Update aggregated ratings
        await this.updateAggregatedRatings(
          review.targetId, 
          review.type, 
          review.rating,
          review.detailedRatings,
          'remove',
          transaction
        );
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
  
  // Get reviews for a target (product/farmer)
  static async getReviewsForTarget(targetId, targetType, options = {}) {
    try {
      const {
        limitCount = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minRating = null,
        verifiedOnly = false,
        startAfter = null
      } = options;
      
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      let constraints = [
        where('targetId', '==', targetId),
        where('type', '==', targetType),
        where('status', '==', 'approved')
      ];
      
      if (minRating) {
        constraints.push(where('rating', '>=', minRating));
      }
      
      if (verifiedOnly) {
        constraints.push(where('isVerifiedPurchase', '==', true));
      }
      
      constraints.push(orderBy(sortBy, sortOrder));
      
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      if (startAfter) {
        constraints.push(startAfter(startAfter));
      }
      
      const q = query(reviewsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const reviews = [];
      
      for (const doc of snapshot.docs) {
        const review = { id: doc.id, ...doc.data() };
        
        // Get reviewer info
        const customerRef = doc(db, COLLECTIONS.USERS, review.customerId);
        const customerDoc = await getDoc(customerRef);
        
        if (customerDoc.exists()) {
          const customer = customerDoc.data();
          review.customerName = customer.displayName || 'Anonymous';
          review.customerImage = customer.profileImage || '';
        }
        
        reviews.push(review);
      }
      
      return {
        reviews,
        hasMore: reviews.length === limitCount,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting reviews for target:', error);
      throw error;
    }
  }
  
  // Get aggregated ratings for target
  static async getAggregatedRatings(targetId, targetType) {
    try {
      const ratingRef = doc(db, COLLECTIONS.RATINGS, `${targetType}_${targetId}`);
      const ratingDoc = await getDoc(ratingRef);
      
      if (!ratingDoc.exists()) {
        return this.getDefaultRating(targetId, targetType);
      }
      
      return ratingDoc.data();
    } catch (error) {
      console.error('Error getting aggregated ratings:', error);
      return this.getDefaultRating(targetId, targetType);
    }
  }
  
  // Get user's review for a specific target
  static async getUserReviewForTarget(userId, targetId, targetType) {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const q = query(
        reviewsRef,
        where('customerId', '==', userId),
        where('targetId', '==', targetId),
        where('type', '==', targetType)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      console.error('Error getting user review:', error);
      return null;
    }
  }
  
  // Add farmer response to review
  static async addFarmerResponse(reviewId, farmerId, response) {
    try {
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const review = reviewDoc.data();
      
      // Verify farmer can respond to this review
      let canRespond = false;
      
      if (review.type === 'product') {
        // Check if farmer owns the product
        const productRef = doc(db, COLLECTIONS.PRODUCTS, review.targetId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists() && productDoc.data().farmerId === farmerId) {
          canRespond = true;
        }
      } else if (review.type === 'farmer' && review.targetId === farmerId) {
        canRespond = true;
      }
      
      if (!canRespond) {
        throw new Error('Unauthorized to respond to this review');
      }
      
      await updateDoc(reviewRef, {
        'farmerResponse.comment': response,
        'farmerResponse.respondedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Notify customer about farmer response
      await NotificationService.sendNotification(review.customerId, {
        type: 'REVIEW_RESPONSE',
        priority: 'medium',
        title: 'Farmer Responded to Your Review',
        message: 'A farmer has responded to your review',
        actionData: {
          reviewId,
          targetId: review.targetId,
          type: 'review'
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error adding farmer response:', error);
      throw error;
    }
  }
  
  // Vote review as helpful
  static async voteHelpful(reviewId) {
    try {
      // In a real app, track who voted to prevent duplicate votes
      // For simplicity, we'll just increment the count
      
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      await updateDoc(reviewRef, {
        helpfulVotes: (reviewDoc.data().helpfulVotes || 0) + 1
      });
      
      return true;
    } catch (error) {
      console.error('Error voting helpful:', error);
      throw error;
    }
  }
  
  // Report review
  static async reportReview(reviewId, userId, reason) {
    try {
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      await updateDoc(reviewRef, {
        reportCount: (reviewDoc.data().reportCount || 0) + 1,
        lastReportReason: reason,
        lastReportedBy: userId,
        lastReportedAt: serverTimestamp()
      });
      
      // If report count exceeds threshold, mark for moderation
      const reportCount = (reviewDoc.data().reportCount || 0) + 1;
      if (reportCount >= 3) {
        await updateDoc(reviewRef, {
          status: 'pending',
          moderationNotes: `Auto-flagged due to ${reportCount} reports`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }
  
  // Get reviews for moderation
  static async getReviewsForModeration(limit = 20) {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const q = query(
        reviewsRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting reviews for moderation:', error);
      throw error;
    }
  }
  
  // Moderate review (approve/reject)
  static async moderateReview(reviewId, action, moderatorId, notes = '') {
    try {
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const review = reviewDoc.data();
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      await runTransaction(db, async (transaction) => {
        transaction.update(reviewRef, {
          status: newStatus,
          moderationNotes: notes,
          moderatedBy: moderatorId,
          moderatedAt: serverTimestamp()
        });
        
        // If rejecting, remove from aggregated ratings
        if (action === 'reject' && review.status === 'approved') {
          await this.updateAggregatedRatings(
            review.targetId, 
            review.type, 
            review.rating,
            review.detailedRatings,
            'remove',
            transaction
          );
        }
        
        // If approving, add to aggregated ratings
        if (action === 'approve' && review.status === 'pending') {
          await this.updateAggregatedRatings(
            review.targetId, 
            review.type, 
            review.rating,
            review.detailedRatings,
            'add',
            transaction
          );
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error moderating review:', error);
      throw error;
    }
  }
  
  // Helper methods
  
  static validateReviewData(reviewData) {
    const errors = [];
    
    if (!reviewData.targetId) {
      errors.push('Target ID is required');
    }
    
    if (!reviewData.customerId) {
      errors.push('Customer ID is required');
    }
    
    if (!reviewData.type || !['product', 'farmer'].includes(reviewData.type)) {
      errors.push('Valid review type is required (product or farmer)');
    }
    
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    
    if (!reviewData.title || reviewData.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    
    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.push('Comment must be at least 10 characters');
    }
    
    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.push('Comment must be less than 1000 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static async verifyPurchase(customerId, productId, orderId) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        return false;
      }
      
      const order = orderDoc.data();
      
      // Check if order belongs to customer and contains the product
      if (order.customerId !== customerId) {
        return false;
      }
      
      // Check if order contains the product
      const hasProduct = order.items.some(item => item.productId === productId);
      
      // Check if order is completed
      const isCompleted = ['delivered'].includes(order.status);
      
      return hasProduct && isCompleted;
    } catch (error) {
      console.error('Error verifying purchase:', error);
      return false;
    }
  }
  
  static async updateAggregatedRatings(targetId, targetType, rating, detailedRatings, operation, transaction = null) {
    try {
      const ratingId = `${targetType}_${targetId}`;
      const ratingRef = doc(db, COLLECTIONS.RATINGS, ratingId);
      
      const executeUpdate = async (transaction) => {
        const ratingDoc = await transaction.get(ratingRef);
        let currentRating;
        
        if (!ratingDoc.exists()) {
          currentRating = this.getDefaultRating(targetId, targetType);
        } else {
          currentRating = ratingDoc.data();
        }
        
        const newRating = { ...currentRating };
        
        if (operation === 'add') {
          // Update overall rating
          const newCount = newRating.overall.count + 1;
          const newTotal = (newRating.overall.average * newRating.overall.count) + rating;
          newRating.overall.average = newTotal / newCount;
          newRating.overall.count = newCount;
          newRating.overall.distribution[rating] = (newRating.overall.distribution[rating] || 0) + 1;
          
          // Update detailed ratings
          if (detailedRatings) {
            Object.keys(detailedRatings).forEach(key => {
              if (newRating.detailed[key] !== undefined) {
                const currentDetailed = newRating.detailed[key] * (newCount - 1);
                newRating.detailed[key] = (currentDetailed + detailedRatings[key]) / newCount;
              }
            });
          }
        } else if (operation === 'remove') {
          // Update overall rating
          const newCount = Math.max(0, newRating.overall.count - 1);
          
          if (newCount === 0) {
            newRating.overall.average = 0;
            newRating.overall.count = 0;
            newRating.overall.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            newRating.detailed = { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 };
          } else {
            const newTotal = (newRating.overall.average * newRating.overall.count) - rating;
            newRating.overall.average = newTotal / newCount;
            newRating.overall.count = newCount;
            newRating.overall.distribution[rating] = Math.max(0, (newRating.overall.distribution[rating] || 0) - 1);
            
            // Update detailed ratings
            if (detailedRatings) {
              Object.keys(detailedRatings).forEach(key => {
                if (newRating.detailed[key] !== undefined) {
                  const currentDetailed = newRating.detailed[key] * (newCount + 1);
                  newRating.detailed[key] = (currentDetailed - detailedRatings[key]) / newCount;
                }
              });
            }
          }
        }
        
        newRating.lastUpdated = serverTimestamp();
        
        if (ratingDoc.exists()) {
          transaction.update(ratingRef, newRating);
        } else {
          transaction.set(ratingRef, newRating);
        }
      };
      
      if (transaction) {
        await executeUpdate(transaction);
      } else {
        await runTransaction(db, executeUpdate);
      }
    } catch (error) {
      console.error('Error updating aggregated ratings:', error);
      throw error;
    }
  }
  
  static getDefaultRating(targetId, targetType) {
    return {
      ...createRatingSchema(),
      targetId,
      targetType,
      lastUpdated: serverTimestamp()
    };
  }
  
  static async sendReviewNotification(reviewId, reviewData) {
    try {
      let recipientId = null;
      
      if (reviewData.type === 'product') {
        // Get product owner (farmer)
        const productRef = doc(db, COLLECTIONS.PRODUCTS, reviewData.targetId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          recipientId = productDoc.data().farmerId;
        }
      } else if (reviewData.type === 'farmer') {
        recipientId = reviewData.targetId;
      }
      
      if (recipientId) {
        await NotificationService.sendReviewNotification(
          reviewId, 
          reviewData.targetId, 
          recipientId, 
          reviewData.customerId
        );
      }
    } catch (error) {
      console.error('Error sending review notification:', error);
    }
  }
  
  // Get review statistics for a target
  static async getReviewStatistics(targetId, targetType) {
    try {
      const [ratings, recentReviews] = await Promise.all([
        this.getAggregatedRatings(targetId, targetType),
        this.getReviewsForTarget(targetId, targetType, { limitCount: 5 })
      ]);
      
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const q = query(
        reviewsRef,
        where('targetId', '==', targetId),
        where('type', '==', targetType),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());
      
      // Calculate additional statistics
      const verifiedReviews = reviews.filter(r => r.isVerifiedPurchase).length;
      const averageLength = reviews.reduce((sum, r) => sum + r.comment.length, 0) / reviews.length || 0;
      
      // Get most common words in reviews (simple implementation)
      const allComments = reviews.map(r => r.comment.toLowerCase()).join(' ');
      const words = allComments.split(/\s+/).filter(word => word.length > 3);
      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      const topWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      return {
        ...ratings,
        totalReviews: reviews.length,
        verifiedReviews,
        verificationRate: reviews.length > 0 ? (verifiedReviews / reviews.length) * 100 : 0,
        averageCommentLength: Math.round(averageLength),
        recentReviews: recentReviews.reviews,
        topWords,
        monthlyTrend: await this.getMonthlyReviewTrend(targetId, targetType)
      };
    } catch (error) {
      console.error('Error getting review statistics:', error);
      throw error;
    }
  }
  
  // Get monthly review trend
  static async getMonthlyReviewTrend(targetId, targetType) {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const q = query(
        reviewsRef,
        where('targetId', '==', targetId),
        where('type', '==', targetType),
        where('status', '==', 'approved'),
        where('createdAt', '>=', sixMonthsAgo),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());
      
      // Group by month
      const monthlyData = {};
      reviews.forEach(review => {
        const date = new Date(review.createdAt.seconds * 1000);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, totalRating: 0 };
        }
        
        monthlyData[monthKey].count++;
        monthlyData[monthKey].totalRating += review.rating;
      });
      
      // Convert to array and calculate averages
      const trend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.count,
        averageRating: data.totalRating / data.count
      }));
      
      return trend;
    } catch (error) {
      console.error('Error getting monthly review trend:', error);
      return [];
    }
  }
  
  // Get top-rated items by category
  static async getTopRatedByCategory(category, limit = 10) {
    try {
      const ratingsRef = collection(db, COLLECTIONS.RATINGS);
      const q = query(
        ratingsRef,
        where('targetType', '==', 'product'),
        orderBy('overall.average', 'desc'),
        limit(limit * 2) // Get more to filter by category
      );
      
      const snapshot = await getDocs(q);
      const topRated = [];
      
      for (const doc of snapshot.docs) {
        const rating = doc.data();
        
        // Get product details to check category
        const productRef = doc(db, COLLECTIONS.PRODUCTS, rating.targetId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const product = productDoc.data();
          
          if (!category || product.category === category) {
            topRated.push({
              productId: rating.targetId,
              product,
              rating: rating.overall.average,
              reviewCount: rating.overall.count
            });
            
            if (topRated.length >= limit) break;
          }
        }
      }
      
      return topRated;
    } catch (error) {
      console.error('Error getting top-rated by category:', error);
      return [];
    }
  }
  
  // Get review insights for farmer
  static async getFarmerReviewInsights(farmerId) {
    try {
      // Get all products for farmer
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const productsQuery = query(productsRef, where('farmerId', '==', farmerId));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productIds = productsSnapshot.docs.map(doc => doc.id);
      
      // Get reviews for all products and farmer
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const allReviews = [];
      
      // Get product reviews
      for (const productId of productIds) {
        const productReviewsQuery = query(
          reviewsRef,
          where('targetId', '==', productId),
          where('type', '==', 'product'),
          where('status', '==', 'approved')
        );
        const productReviewsSnapshot = await getDocs(productReviewsQuery);
        allReviews.push(...productReviewsSnapshot.docs.map(doc => doc.data()));
      }
      
      // Get farmer reviews
      const farmerReviewsQuery = query(
        reviewsRef,
        where('targetId', '==', farmerId),
        where('type', '==', 'farmer'),
        where('status', '==', 'approved')
      );
      const farmerReviewsSnapshot = await getDocs(farmerReviewsQuery);
      allReviews.push(...farmerReviewsSnapshot.docs.map(doc => doc.data()));
      
      if (allReviews.length === 0) {
        return this.getEmptyInsights();
      }
      
      // Calculate insights
      const totalReviews = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      
      // Response rate
      const responsesGiven = allReviews.filter(r => r.farmerResponse?.comment).length;
      const responseRate = (responsesGiven / totalReviews) * 100;
      
      // Rating distribution
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      allReviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });
      
      // Detailed ratings averages
      const detailedAverages = {
        quality: 0,
        freshness: 0,
        value: 0,
        packaging: 0,
        communication: 0
      };
      
      let detailedCount = 0;
      allReviews.forEach(review => {
        if (review.detailedRatings) {
          Object.keys(detailedAverages).forEach(key => {
            if (review.detailedRatings[key]) {
              detailedAverages[key] += review.detailedRatings[key];
            }
          });
          detailedCount++;
        }
      });
      
      if (detailedCount > 0) {
        Object.keys(detailedAverages).forEach(key => {
          detailedAverages[key] = detailedAverages[key] / detailedCount;
        });
      }
      
      // Common keywords in positive vs negative reviews
      const positiveReviews = allReviews.filter(r => r.rating >= 4);
      const negativeReviews = allReviews.filter(r => r.rating <= 2);
      
      const positiveKeywords = this.extractKeywords(positiveReviews);
      const negativeKeywords = this.extractKeywords(negativeReviews);
      
      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        responseRate: Math.round(responseRate),
        ratingDistribution,
        detailedAverages,
        positiveKeywords: positiveKeywords.slice(0, 10),
        negativeKeywords: negativeKeywords.slice(0, 10),
        recentTrend: await this.getRecentRatingTrend(allReviews),
        topProducts: await this.getTopRatedProducts(productIds),
        improvementSuggestions: this.generateImprovementSuggestions(detailedAverages, negativeKeywords)
      };
    } catch (error) {
      console.error('Error getting farmer review insights:', error);
      return this.getEmptyInsights();
    }
  }
  
  // Helper methods for insights
  static extractKeywords(reviews) {
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
  }
  
  static getRecentRatingTrend(reviews) {
    const last30Days = reviews.filter(r => {
      const reviewDate = new Date(r.createdAt.seconds * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return reviewDate >= thirtyDaysAgo;
    });
    
    if (last30Days.length < 2) return 'stable';
    
    const firstHalf = last30Days.slice(0, Math.floor(last30Days.length / 2));
    const secondHalf = last30Days.slice(Math.floor(last30Days.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r.rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.rating, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }
  
  static async getTopRatedProducts(productIds) {
    const productRatings = [];
    
    for (const productId of productIds) {
      const rating = await this.getAggregatedRatings(productId, 'product');
      if (rating.overall.count > 0) {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          productRatings.push({
            id: productId,
            name: productDoc.data().name,
            rating: rating.overall.average,
            reviewCount: rating.overall.count
          });
        }
      }
    }
    
    return productRatings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }
  
  static generateImprovementSuggestions(detailedAverages, negativeKeywords) {
    const suggestions = [];
    
    // Check detailed ratings for areas of improvement
    Object.entries(detailedAverages).forEach(([aspect, rating]) => {
      if (rating < 4) {
        switch (aspect) {
          case 'quality':
            suggestions.push('Consider improving product quality through better growing practices');
            break;
          case 'freshness':
            suggestions.push('Focus on harvest timing and faster delivery to improve freshness');
            break;
          case 'value':
            suggestions.push('Review pricing strategy or add more value to justify current prices');
            break;
          case 'packaging':
            suggestions.push('Invest in better packaging materials and presentation');
            break;
          case 'communication':
            suggestions.push('Improve communication by responding faster to customer messages');
            break;
        }
      }
    });
    
    // Check negative keywords for specific issues
    const commonNegativeWords = negativeKeywords.slice(0, 5);
    commonNegativeWords.forEach(({ word }) => {
      if (word.includes('late') || word.includes('delay')) {
        suggestions.push('Focus on improving delivery timeliness');
      }
      if (word.includes('damage') || word.includes('bruise')) {
        suggestions.push('Improve packaging and handling to prevent damage');
      }
      if (word.includes('expensive') || word.includes('price')) {
        suggestions.push('Consider price adjustments or better value communication');
      }
    });
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
  
  static getEmptyInsights() {
    return {
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      detailedAverages: { quality: 0, freshness: 0, value: 0, packaging: 0, communication: 0 },
      positiveKeywords: [],
      negativeKeywords: [],
      recentTrend: 'stable',
      topProducts: [],
      improvementSuggestions: ['Start getting reviews by encouraging customers to share their experiences']
    };
  }
}