// src/services/notificationService.js
// Enhanced notification service with complete CRUD operations

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, NOTIFICATION_TYPES } from '../lib/firebaseSchema';

export class NotificationService {

  // Subscribe to real-time unread count updates
  static subscribeToUnreadCount(userId, callback) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const unreadCount = querySnapshot.size;
        callback(unreadCount);
      }, (error) => {
        console.error('Error in unread count subscription:', error);
        callback(0); // Default to 0 on error
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up unread count subscription:', error);
      return () => {}; // Return empty function as fallback
    }
  }

  // Subscribe to real-time notifications for a user
  static subscribeToNotifications(userId, onUpdate, onError) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate() || null,
          scheduledFor: doc.data().scheduledFor?.toDate() || null,
          expiresAt: doc.data().expiresAt?.toDate() || null
        }));
        
        onUpdate(notifications);
      }, (error) => {
        console.error('Error in notifications subscription:', error);
        if (onError) onError(error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      if (onError) onError(error);
      return () => {}; // Return empty function as fallback
    }
  }

  // Get notifications for a specific user
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limitCount = 20,
        unreadOnly = false,
        types = null,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = options;

      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );

      // Add filters
      if (unreadOnly) {
        q = query(q, where('readAt', '==', null));
      }

      if (types && Array.isArray(types)) {
        q = query(q, where('type', 'in', types));
      }

      // Add sorting
      q = query(q, orderBy(sortBy, sortDirection));

      // Add limit
      if (limitCount > 0) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate() || null,
        scheduledFor: doc.data().scheduledFor?.toDate() || null,
        expiresAt: doc.data().expiresAt?.toDate() || null
      }));

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        readAt: serverTimestamp(),
        'channels.inApp.read': true,
        'channels.inApp.readAt': serverTimestamp()
      });
      
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          readAt: serverTimestamp(),
          'channels.inApp.read': true,
          'channels.inApp.readAt': serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Marked ${querySnapshot.size} notifications as read for user: ${userId}`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await deleteDoc(notificationRef);
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete multiple notifications
  static async deleteMultiple(notificationIds) {
    try {
      const batch = writeBatch(db);
      
      notificationIds.forEach(notificationId => {
        const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
        batch.delete(notificationRef);
      });

      await batch.commit();
      console.log(`Deleted ${notificationIds.length} notifications`);
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      throw error;
    }
  }

  // Archive notification (mark as archived instead of deleting)
  static async archiveNotification(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        archived: true,
        archivedAt: serverTimestamp()
      });
      
      console.log('Notification archived:', notificationId);
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Clear all notifications for a user
  static async clearAllNotifications(userId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleared all notifications for user: ${userId}`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp()
      });
      
      console.log('Notification preferences updated for user:', userId);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().notificationPreferences || {
          email: { enabled: true, types: [] },
          sms: { enabled: false, types: [] },
          inApp: { enabled: true, types: [] }
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }
  
  // Send notification to user
  static async sendNotification(userId, notificationData) {
    try {
      // Validate required fields
      if (!userId) throw new Error('User ID is required');
      if (!notificationData.title) throw new Error('Notification title is required');
      if (!notificationData.message) throw new Error('Notification message is required');

      // Create notification document
      const notification = {
        userId,
        type: notificationData.type || 'general',
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || 'medium',
        actionData: notificationData.actionData || {},
        readAt: null,
        createdAt: serverTimestamp(),
        
        // Scheduling
        scheduledFor: notificationData.scheduledFor || null,
        expiresAt: notificationData.expiresAt || null,
        
        // Delivery channels
        channels: {
          inApp: { sent: true, read: false, readAt: null },
          email: { sent: false, delivered: false, sentAt: null },
          sms: { sent: false, delivered: false, sentAt: null }
        }
      };
      
      // Save notification to database
      const notificationRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
      console.log('Notification sent with ID:', notificationRef.id);
      
      return notificationRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send bulk notifications to multiple users
  static async sendBulkNotifications(userIds, notificationData) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('User IDs array is required and must not be empty');
      }

      const batch = writeBatch(db);
      const notificationIds = [];

      userIds.forEach(userId => {
        const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
        const notification = {
          userId,
          type: notificationData.type || 'general',
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || 'medium',
          actionData: notificationData.actionData || {},
          readAt: null,
          createdAt: serverTimestamp(),
          
          // Scheduling
          scheduledFor: notificationData.scheduledFor || null,
          expiresAt: notificationData.expiresAt || null,
          
          // Delivery channels
          channels: {
            inApp: { sent: true, read: false, readAt: null },
            email: { sent: false, delivered: false, sentAt: null },
            sms: { sent: false, delivered: false, sentAt: null }
          }
        };

        batch.set(notificationRef, notification);
        notificationIds.push(notificationRef.id);
      });

      await batch.commit();
      console.log(`Bulk notifications sent to ${userIds.length} users`);
      return notificationIds;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Get notification by ID
  static async getNotificationById(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        return {
          id: notificationDoc.id,
          ...notificationDoc.data(),
          createdAt: notificationDoc.data().createdAt?.toDate() || new Date(),
          readAt: notificationDoc.data().readAt?.toDate() || null,
          scheduledFor: notificationDoc.data().scheduledFor?.toDate() || null,
          expiresAt: notificationDoc.data().expiresAt?.toDate() || null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  }

  // Get notification statistics for analytics
  static async getNotificationStats(userId, dateRange = null) {
    try {
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );

      if (dateRange && dateRange.start && dateRange.end) {
        q = query(q, 
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.readAt).length,
        read: notifications.filter(n => n.readAt).length,
        byType: {},
        byPriority: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        recent: notifications.filter(n => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(n.createdAt) > dayAgo;
        }).length
      };

      // Calculate stats by type
      Object.values(NOTIFICATION_TYPES).forEach(type => {
        stats.byType[type] = notifications.filter(n => n.type === type).length;
      });

      // Calculate stats by priority
      notifications.forEach(notification => {
        if (Object.prototype.hasOwnProperty.call(stats.byPriority, notification.priority)) {
          stats.byPriority[notification.priority]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: {},
        byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
        recent: 0
      };
    }
  }

  // Send notification with delivery tracking
  static async sendNotificationWithTracking(userId, notificationData, deliveryOptions = {}) {
    try {
      const {
        sendEmail = false,
        sendSMS = false,
        emailTemplate = null,
        smsTemplate = null
      } = deliveryOptions;

      // Create base notification
      const notificationId = await this.sendNotification(userId, notificationData);

      // Handle email delivery
      if (sendEmail && emailTemplate) {
        try {
          // In a real implementation, integrate with email service (SendGrid, etc.)
          console.log(`Email notification sent to user ${userId}:`, emailTemplate);
          
          // Update delivery status
          await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
            'channels.email.sent': true,
            'channels.email.sentAt': serverTimestamp(),
            'channels.email.template': emailTemplate
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      // Handle SMS delivery
      if (sendSMS && smsTemplate) {
        try {
          // In a real implementation, integrate with SMS service (Twilio, etc.)
          console.log(`SMS notification sent to user ${userId}:`, smsTemplate);
          
          // Update delivery status
          await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
            'channels.sms.sent': true,
            'channels.sms.sentAt': serverTimestamp(),
            'channels.sms.template': smsTemplate
          });
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
        }
      }

      return notificationId;
    } catch (error) {
      console.error('Error sending notification with tracking:', error);
      throw error;
    }
  }

  // Schedule notification for future delivery
  static async scheduleNotification(userId, notificationData, scheduleDate) {
    try {
      const notification = {
        ...notificationData,
        scheduledFor: scheduleDate,
        status: 'scheduled'
      };
      
      return await this.sendNotification(userId, notification);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  static async cancelScheduledNotification(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notification = await getDoc(notificationRef);
      
      if (!notification.exists()) {
        throw new Error('Notification not found');
      }
      
      const data = notification.data();
      if (data.channels?.inApp?.sent) {
        throw new Error('Cannot cancel notification that has already been sent');
      }
      
      await updateDoc(notificationRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      
      console.log('Scheduled notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      throw error;
    }
  }

  // Get notification delivery status
  static async getNotificationDeliveryStatus(notificationId) {
    try {
      const notificationDoc = await getDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId));
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const data = notificationDoc.data();
      return {
        id: notificationId,
        status: data.status || 'delivered',
        channels: data.channels || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate() || null,
        scheduledFor: data.scheduledFor?.toDate() || null
      };
    } catch (error) {
      console.error('Error getting notification delivery status:', error);
      throw error;
    }
  }

  // Test notification function for development
  static async sendTestNotification(userId) {
    try {
      const testMessages = [
        {
          type: 'system',
          title: '🎉 Test Notification',
          message: 'Your notification system is working perfectly! This is a test message.',
          priority: 'low'
        },
        {
          type: 'new_order',
          title: '🛒 New Order Received',
          message: 'You have a new order for Fresh Tomatoes (Test Order)',
          priority: 'medium',
          actionData: { orderId: 'test-order-123', type: 'order' }
        },
        {
          type: 'low_stock',
          title: '⚠️ Low Stock Alert',
          message: 'Your Fresh Carrots inventory is running low (Test Alert)',
          priority: 'medium',
          actionData: { productId: 'test-product-456', type: 'product' }
        }
      ];

      const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
      
      return await this.sendNotification(userId, {
        ...randomMessage,
        actionData: {
          ...randomMessage.actionData,
          timestamp: new Date().toISOString(),
          isTest: true
        }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Send notification for specific events (helper methods)
  static async sendOrderNotification(orderId, orderData, type) {
    try {
      const messages = {
        new_order: {
          title: '🛒 New Order Received',
          message: `You have a new order from ${orderData.customerName}`,
          recipient: orderData.farmerId
        },
        order_confirmed: {
          title: '✅ Order Confirmed',
          message: `Your order has been confirmed by ${orderData.farmerName}`,
          recipient: orderData.customerId
        },
        order_shipped: {
          title: '🚚 Order Shipped',
          message: 'Your order is on its way!',
          recipient: orderData.customerId
        },
        order_delivered: {
          title: '📦 Order Delivered',
          message: 'Your order has been delivered. Please confirm receipt.',
          recipient: orderData.customerId
        },
        order_cancelled: {
          title: '❌ Order Cancelled',
          message: 'Your order has been cancelled',
          recipient: orderData.customerId
        }
      };

      const notification = messages[type];
      if (!notification) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      return await this.sendNotification(notification.recipient, {
        type: type,
        title: notification.title,
        message: notification.message,
        priority: type === 'order_cancelled' ? 'high' : 'medium',
        actionData: { orderId, type: 'order' }
      });
    } catch (error) {
      console.error('Error sending order notification:', error);
      throw error;
    }
  }

  // Send inventory notification
  static async sendInventoryNotification(productId, farmerId, type, data = {}) {
    try {
      const messages = {
        low_stock: {
          title: '⚠️ Low Stock Alert',
          message: `${data.productName} is running low (${data.currentStock} remaining)`,
          priority: 'medium'
        },
        out_of_stock: {
          title: '❌ Out of Stock',
          message: `${data.productName} is out of stock`,
          priority: 'high'
        },
        batch_expiring: {
          title: '⏰ Batch Expiring Soon',
          message: `Batch of ${data.productName} expires on ${data.expiryDate}`,
          priority: 'high'
        }
      };

      const notification = messages[type];
      if (!notification) {
        throw new Error(`Invalid inventory notification type: ${type}`);
      }

      return await this.sendNotification(farmerId, {
        type: type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionData: { productId, type: 'product', ...data }
      });
    } catch (error) {
      console.error('Error sending inventory notification:', error);
      throw error;
    }
  }

  // Send message notification
  static async sendMessageNotification(conversationId, senderId, senderName, recipientId, messagePreview) {
    try {
      return await this.sendNotification(recipientId, {
        type: 'new_message',
        title: '💬 New Message',
        message: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
        priority: 'medium',
        actionData: { 
          conversationId, 
          senderId, 
          type: 'conversation' 
        }
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
      throw error;
    }
  }

  // Send review notification
  static async sendReviewNotification(reviewId, targetId, recipientId, reviewData) {
    try {
      return await this.sendNotification(recipientId, {
        type: 'new_review',
        title: '⭐ New Review',
        message: `You received a ${reviewData.rating}-star review${reviewData.productName ? ` for ${reviewData.productName}` : ''}`,
        priority: 'medium',
        actionData: { 
          reviewId, 
          targetId, 
          type: 'review' 
        }
      });
    } catch (error) {
      console.error('Error sending review notification:', error);
      throw error;
    }
  }

  // Send seasonal notification
  static async sendSeasonalNotification(productId, farmerId, type, data = {}) {
    try {
      const messages = {
        season_starting: {
          title: '🌱 Season Starting Soon',
          message: `${data.productName} season starts in 3 days. Prepare your inventory!`,
          priority: 'medium'
        },
        season_ending: {
          title: '🍂 Season Ending Soon',
          message: `${data.productName} season ends in 3 days. Last chance to sell!`,
          priority: 'high'
        }
      };

      const notification = messages[type];
      if (!notification) {
        throw new Error(`Invalid seasonal notification type: ${type}`);
      }

      return await this.sendNotification(farmerId, {
        type: type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionData: { productId, type: 'product', ...data }
      });
    } catch (error) {
      console.error('Error sending seasonal notification:', error);
      throw error;
    }
  }

  // Send payment notification
  static async sendPaymentNotification(orderId, userId, type, data = {}) {
    try {
      const messages = {
        payment_received: {
          title: '💰 Payment Received',
          message: `Payment of ${data.amount} has been received for your order`,
          priority: 'medium'
        },
        payment_confirmed: {
          title: '✅ Payment Confirmed',
          message: 'Your payment has been confirmed and processed',
          priority: 'medium'
        },
        payment_failed: {
          title: '❌ Payment Failed',
          message: 'Your payment could not be processed. Please update your payment method.',
          priority: 'high'
        },
        payment_deadline_approaching: {
          title: '⏰ Payment Due Soon',
          message: `Payment for order ${orderId} is due in ${data.daysRemaining} days`,
          priority: 'medium'
        },
        payment_expired: {
          title: '⏰ Payment Deadline Passed',
          message: 'Payment deadline has passed. Your order may be cancelled.',
          priority: 'high'
        }
      };

      const notification = messages[type];
      if (!notification) {
        throw new Error(`Invalid payment notification type: ${type}`);
      }

      return await this.sendNotification(userId, {
        type: type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionData: { orderId, type: 'order', ...data }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  static async markMultipleAsRead(notificationIds) {
    try {
      const batch = writeBatch(db);
      
      notificationIds.forEach(notificationId => {
        const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
        batch.update(notificationRef, {
          readAt: serverTimestamp(),
          'channels.inApp.read': true,
          'channels.inApp.readAt': serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Marked ${notificationIds.length} notifications as read`);
      return notificationIds.length;
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  }

  // Archive multiple notifications
  static async archiveMultiple(notificationIds) {
    try {
      const batch = writeBatch(db);
      
      notificationIds.forEach(notificationId => {
        const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
        batch.update(notificationRef, {
          archived: true,
          archivedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Archived ${notificationIds.length} notifications`);
    } catch (error) {
      console.error('Error archiving multiple notifications:', error);
      throw error;
    }
  }

  // Get notifications with advanced filtering
  static async getNotificationsWithFilter(userId, filters = {}) {
    try {
      const {
        types = null,
        priorities = null,
        readStatus = 'all', // 'all', 'read', 'unread'
        dateRange = null,
        limitCount = 50,
        archived = false
      } = filters;

      let constraints = [
        where('userId', '==', userId)
      ];

      // Add type filter
      if (types && Array.isArray(types) && types.length > 0) {
        constraints.push(where('type', 'in', types));
      }

      // Add read status filter
      if (readStatus === 'read') {
        constraints.push(where('readAt', '!=', null));
      } else if (readStatus === 'unread') {
        constraints.push(where('readAt', '==', null));
      }

      // Add archived filter
      if (!archived) {
        constraints.push(where('archived', '!=', true));
      }

      // Add date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        constraints.push(
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }

      // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'));
      if (limitCount > 0) {
        constraints.push(limit(limitCount));
      }

      const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate() || null,
        scheduledFor: doc.data().scheduledFor?.toDate() || null,
        expiresAt: doc.data().expiresAt?.toDate() || null,
        archivedAt: doc.data().archivedAt?.toDate() || null
      }));

      // Filter by priority (client-side since Firestore doesn't support 'in' on arrays)
      if (priorities && Array.isArray(priorities) && priorities.length > 0) {
        notifications = notifications.filter(n => priorities.includes(n.priority));
      }

      return notifications;
    } catch (error) {
      console.error('Error getting filtered notifications:', error);
      throw error;
    }
  }

  // Get notification summary for dashboard
  static async getNotificationSummary(userId, days = 7) {
    try {
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const notifications = await this.getNotificationsWithFilter(userId, {
        dateRange: { start: dateFrom, end: new Date() },
        limitCount: 1000
      });

      const summary = {
        totalInPeriod: notifications.length,
        unreadInPeriod: notifications.filter(n => !n.readAt).length,
        readInPeriod: notifications.filter(n => n.readAt).length,
        byDay: {},
        topTypes: {},
        averageReadTime: 0,
        engagementRate: 0
      };

      // Group by day
      notifications.forEach(notification => {
        const day = notification.createdAt.toISOString().split('T')[0];
        summary.byDay[day] = (summary.byDay[day] || 0) + 1;
        summary.topTypes[notification.type] = (summary.topTypes[notification.type] || 0) + 1;
      });

      // Calculate average read time (time between created and read)
      const readNotifications = notifications.filter(n => n.readAt);
      if (readNotifications.length > 0) {
        const totalReadTime = readNotifications.reduce((sum, n) => {
          return sum + (n.readAt.getTime() - n.createdAt.getTime());
        }, 0);
        summary.averageReadTime = totalReadTime / readNotifications.length / (1000 * 60); // in minutes
      }

      // Calculate engagement rate (read notifications / total notifications)
      summary.engagementRate = notifications.length > 0 ? 
        (readNotifications.length / notifications.length * 100) : 0;

      // Sort top types
      summary.topTypes = Object.entries(summary.topTypes)
        .sort(([,a], [,b]) => b - a)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

      return summary;
    } catch (error) {
      console.error('Error getting notification summary:', error);
      throw error;
    }
  }

  // Cleanup old notifications (utility function)
  static async cleanupOldNotifications(userId, daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('createdAt', '<', cutoffDate),
        where('archived', '!=', true) // Don't delete archived notifications
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${querySnapshot.size} old notifications for user: ${userId}`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Export notifications (for backup or analytics)
  static async exportNotifications(userId, format = 'json') {
    try {
      const notifications = await this.getUserNotifications(userId, { limitCount: 1000 });
      
      if (format === 'json') {
        return JSON.stringify(notifications, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Type', 'Title', 'Message', 'Priority', 'Created At', 'Read At', 'Status'];
        const rows = notifications.map(n => [
          n.id,
          n.type,
          n.title,
          n.message,
          n.priority,
          n.createdAt.toISOString(),
          n.readAt ? n.readAt.toISOString() : 'Unread',
          n.archived ? 'Archived' : 'Active'
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      }
      
      return notifications;
    } catch (error) {
      console.error('Error exporting notifications:', error);
      throw error;
    }
  }

  // Validate notification data
  static validateNotificationData(notificationData) {
    const errors = [];
    
    if (!notificationData.title || notificationData.title.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!notificationData.message || notificationData.message.trim() === '') {
      errors.push('Message is required');
    }
    
    if (notificationData.title && notificationData.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }
    
    if (notificationData.message && notificationData.message.length > 500) {
      errors.push('Message must be 500 characters or less');
    }
    
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (notificationData.priority && !validPriorities.includes(notificationData.priority)) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }
    
    const validTypes = Object.values(NOTIFICATION_TYPES);
    if (notificationData.type && !validTypes.includes(notificationData.type)) {
      errors.push('Invalid notification type');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get notification templates for common scenarios
  static getNotificationTemplates() {
    return {
      order: {
        new_order: {
          title: 'New Order Received',
          message: 'You have a new order from {customerName}',
          priority: 'medium',
          type: 'new_order'
        },
        order_confirmed: {
          title: 'Order Confirmed',
          message: 'Your order has been confirmed by the farmer',
          priority: 'medium',
          type: 'order_confirmed'
        },
        order_shipped: {
          title: 'Order Shipped',
          message: 'Your order is on its way!',
          priority: 'high',
          type: 'order_shipped'
        }
      },
      inventory: {
        low_stock: {
          title: 'Low Stock Alert',
          message: '{productName} is running low ({currentStock} remaining)',
          priority: 'medium',
          type: 'low_stock'
        },
        out_of_stock: {
          title: 'Out of Stock',
          message: '{productName} is out of stock',
          priority: 'high',
          type: 'out_of_stock'
        }
      },
      seasonal: {
        season_starting: {
          title: 'Season Starting Soon',
          message: '{productName} season starts in {days} days. Prepare your inventory!',
          priority: 'medium',
          type: 'season_starting'
        },
        season_ending: {
          title: 'Season Ending Soon',
          message: '{productName} season ends in {days} days. Last chance to sell!',
          priority: 'high',
          type: 'season_ending'
        }
      }
    };
  }

  // Create notification from template
  static async sendFromTemplate(userId, templateCategory, templateType, variables = {}) {
    try {
      const templates = this.getNotificationTemplates();
      const template = templates[templateCategory]?.[templateType];
      
      if (!template) {
        throw new Error(`Template not found: ${templateCategory}.${templateType}`);
      }

      // Replace variables in title and message
      let title = template.title;
      let message = template.message;
      
      Object.entries(variables).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value);
        message = message.replace(`{${key}}`, value);
      });

      return await this.sendNotification(userId, {
        type: template.type,
        title,
        message,
        priority: template.priority,
        actionData: variables.actionData || {}
      });
    } catch (error) {
      console.error('Error sending notification from template:', error);
      throw error;
    }
  }
}