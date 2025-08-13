// src/services/notificationService.js
// Complete notification system with multi-channel delivery

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, createNotificationSchema, NOTIFICATION_TYPES } from '../lib/firebaseSchema';

export class NotificationService {
  
  // Send notification to user
  static async sendNotification(userId, notificationData) {
    try {
      // Get user preferences
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const user = userDoc.data();
      const preferences = user.notificationPreferences || {};
      
      // Create notification document
      const notification = {
        ...createNotificationSchema(),
        ...notificationData,
        userId,
        createdAt: serverTimestamp()
      };
      
      // Determine which channels to use based on preferences
      const channels = this.determineChannels(notificationData.type, preferences);
      notification.channels = channels;
      
      // Save notification to database
      const notificationRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
      
      // Send to appropriate channels
      await this.deliverNotification(notificationRef.id, notification, user);
      
      return notificationRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
  
  // Determine which channels to use
  static determineChannels(notificationType, preferences) {
    const channels = {
      inApp: { sent: false, read: false, readAt: null },
      email: { sent: false, delivered: false, sentAt: null },
      sms: { sent: false, delivered: false, sentAt: null }
    };
    
    // Map notification types to preference categories
    const typeToPreference = {
      [NOTIFICATION_TYPES.NEW_ORDER]: 'orderUpdates',
      [NOTIFICATION_TYPES.ORDER_CONFIRMED]: 'orderUpdates',
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: 'orderUpdates',
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: 'orderUpdates',
      [NOTIFICATION_TYPES.ORDER_CANCELLED]: 'orderUpdates',
      [NOTIFICATION_TYPES.NEW_MESSAGE]: 'newMessages',
      [NOTIFICATION_TYPES.NEW_REVIEW]: 'reviews',
      [NOTIFICATION_TYPES.REVIEW_RESPONSE]: 'reviews',
      [NOTIFICATION_TYPES.LOW_STOCK]: 'lowStock',
      [NOTIFICATION_TYPES.OUT_OF_STOCK]: 'lowStock',
      [NOTIFICATION_TYPES.BATCH_EXPIRING]: 'lowStock'
    };
    
    const preferenceKey = typeToPreference[notificationType] || 'orderUpdates';
    
    // Always send in-app notifications
    channels.inApp.sent = true;
    
    // Check email preferences
    if (preferences.email?.[preferenceKey]) {
      channels.email.sent = true;
    }
    
    // Check SMS preferences
    if (preferences.sms?.[preferenceKey]) {
      channels.sms.sent = true;
    }
    
    return channels;
  }
  
  // Deliver notification through all enabled channels
  static async deliverNotification(notificationId, notification, user) {
    try {
      const deliveryPromises = [];
      
      // Email delivery
      if (notification.channels.email.sent) {
        deliveryPromises.push(this.sendEmail(notificationId, notification, user));
      }
      
      // SMS delivery
      if (notification.channels.sms.sent) {
        deliveryPromises.push(this.sendSMS(notificationId, notification, user));
      }
      
      // Real-time in-app notification (WebSocket/Server-Sent Events)
      if (notification.channels.inApp.sent) {
        deliveryPromises.push(this.sendInAppNotification(notificationId, notification, user));
      }
      
      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      console.error('Error delivering notification:', error);
    }
  }
  
  // Send email notification
  static async sendEmail(notificationId, notification, user) {
    try {
      // In a real app, use Firebase Functions with SendGrid, Mailgun, etc.
      // For demo, we'll just log and update the database
      
      const emailContent = this.generateEmailContent(notification);
      
      console.log('Sending email:', {
        to: user.email,
        subject: emailContent.subject,
        body: emailContent.body
      });
      
      // Update notification status
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        'channels.email.sent': true,
        'channels.email.delivered': true,
        'channels.email.sentAt': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update notification with error
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        'channels.email.error': error.message
      });
      
      return false;
    }
  }
  
  // Send SMS notification
  static async sendSMS(notificationId, notification, user) {
    try {
      // In a real app, use Twilio, AWS SNS, etc.
      // For demo, we'll just log and update the database
      
      if (!user.phoneNumber) {
        throw new Error('User phone number not available');
      }
      
      const smsContent = this.generateSMSContent(notification);
      
      console.log('Sending SMS:', {
        to: user.phoneNumber,
        message: smsContent
      });
      
      // Update notification status
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        'channels.sms.sent': true,
        'channels.sms.delivered': true,
        'channels.sms.sentAt': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      
      // Update notification with error
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        'channels.sms.error': error.message
      });
      
      return false;
    }
  }
  
  // Send in-app notification
  static async sendInAppNotification(notificationId, notification, user) {
    try {
      // In a real app, use WebSocket or Server-Sent Events to push to connected clients
      // For demo, just mark as sent
      
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        'channels.inApp.sent': true
      });
      
      // If you have a WebSocket connection, send real-time notification
      // this.websocketManager.sendToUser(user.id, notification);
      
      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }
  
  // Generate email content
  static generateEmailContent(notification) {
    const templates = {
      [NOTIFICATION_TYPES.NEW_ORDER]: {
        subject: 'New Order Received',
        body: `You have received a new order. ${notification.message}`
      },
      [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
        subject: 'Order Confirmed',
        body: `Your order has been confirmed. ${notification.message}`
      },
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
        subject: 'Order Shipped',
        body: `Your order is on its way! ${notification.message}`
      },
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: {
        subject: 'Order Delivered',
        body: `Your order has been delivered. ${notification.message}`
      },
      [NOTIFICATION_TYPES.LOW_STOCK]: {
        subject: 'Low Stock Alert',
        body: `Stock is running low for one of your products. ${notification.message}`
      },
      [NOTIFICATION_TYPES.NEW_REVIEW]: {
        subject: 'New Review Received',
        body: `You have received a new review. ${notification.message}`
      },
      [NOTIFICATION_TYPES.NEW_MESSAGE]: {
        subject: 'New Message',
        body: `You have a new message. ${notification.message}`
      }
    };
    
    return templates[notification.type] || {
      subject: notification.title,
      body: notification.message
    };
  }
  
  // Generate SMS content
  static generateSMSContent(notification) {
    // SMS should be short and concise
    const smsTemplates = {
      [NOTIFICATION_TYPES.NEW_ORDER]: `New order received! Check your Farm Direct app for details.`,
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: `Your order is on its way! Track in the app.`,
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: `Order delivered! Please confirm receipt in the app.`,
      [NOTIFICATION_TYPES.LOW_STOCK]: `Low stock alert: ${notification.actionData?.productName || 'Product'}`,
      [NOTIFICATION_TYPES.NEW_MESSAGE]: `New message from ${notification.actionData?.senderName || 'a user'}`
    };
    
    return smsTemplates[notification.type] || 
           `${notification.title}: ${notification.message.substring(0, 100)}`;
  }
  
  // Get user notifications
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limitCount = 20,
        unreadOnly = false,
        types = null,
        startAfter = null
      } = options;
      
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      let constraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];
      
      if (unreadOnly) {
        constraints.push(where('readAt', '==', null));
      }
      
      if (types && types.length > 0) {
        constraints.push(where('type', 'in', types));
      }
      
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      if (startAfter) {
        constraints.push(startAfter(startAfter));
      }
      
      const q = query(notificationsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        notifications,
        hasMore: notifications.length === limitCount,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
  
  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notification = notificationDoc.data();
      
      if (notification.userId !== userId) {
        throw new Error('Unauthorized');
      }
      
      await updateDoc(notificationRef, {
        readAt: serverTimestamp(),
        'channels.inApp.read': true,
        'channels.inApp.readAt': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          readAt: serverTimestamp(),
          'channels.inApp.read': true,
          'channels.inApp.readAt': serverTimestamp()
        });
      });
      
      await batch.commit();
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  // Get notification count
  static async getNotificationCount(userId, unreadOnly = true) {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      let q = query(notificationsRef, where('userId', '==', userId));
      
      if (unreadOnly) {
        q = query(q, where('readAt', '==', null));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }
  
  // Update notification preferences
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
  
  // Send bulk notifications
  static async sendBulkNotifications(userIds, notificationData) {
    try {
      const results = [];
      const batchSize = 10; // Process in batches to avoid overwhelming the system
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(userId => 
          this.sendNotification(userId, notificationData)
            .then(id => ({ userId, notificationId: id, success: true }))
            .catch(error => ({ userId, error: error.message, success: false }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
  
  // Schedule notification for later delivery
  static async scheduleNotification(userId, notificationData, scheduledFor) {
    try {
      const notification = {
        ...createNotificationSchema(),
        ...notificationData,
        userId,
        scheduledFor,
        createdAt: serverTimestamp()
      };
      
      // Save scheduled notification
      const notificationRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
      
      // In a real app, you'd use a job queue system like Bull, Agenda, or Cloud Tasks
      // For demo, we'll just save it and process scheduled notifications periodically
      
      return notificationRef.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }
  
  // Process scheduled notifications
  static async processScheduledNotifications() {
    try {
      const now = new Date();
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where('scheduledFor', '<=', now),
        where('channels.inApp.sent', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      for (const doc of snapshot.docs) {
        const notification = doc.data();
        
        // Get user data for delivery
        const userRef = doc(db, COLLECTIONS.USERS, notification.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const user = userDoc.data();
          
          // Deliver the notification
          await this.deliverNotification(doc.id, notification, user);
          
          // Mark as sent
          batch.update(doc.ref, {
            'channels.inApp.sent': true,
            sentAt: serverTimestamp()
          });
        }
      }
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }
  
  // Delete old notifications
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where('createdAt', '<', cutoffDate),
        limit(500) // Process in batches
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
  
  // Get notification analytics
  static async getNotificationAnalytics(userId, dateRange = null) {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      let q = query(notificationsRef, where('userId', '==', userId));
      
      if (dateRange) {
        q = query(q, 
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }
      
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => doc.data());
      
      // Calculate analytics
      const analytics = {
        total: notifications.length,
        read: notifications.filter(n => n.readAt).length,
        unread: notifications.filter(n => !n.readAt).length,
        
        byType: {},
        byChannel: {
          inApp: { sent: 0, delivered: 0 },
          email: { sent: 0, delivered: 0 },
          sms: { sent: 0, delivered: 0 }
        },
        
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        
        avgTimeToRead: 0 // in minutes
      };
      
      let totalReadTime = 0;
      let readCount = 0;
      
      notifications.forEach(notification => {
        // Count by type
        analytics.byType[notification.type] = (analytics.byType[notification.type] || 0) + 1;
        
        // Count by priority
        analytics.byPriority[notification.priority || 'medium']++;
        
        // Count by channel
        Object.keys(analytics.byChannel).forEach(channel => {
          if (notification.channels?.[channel]?.sent) {
            analytics.byChannel[channel].sent++;
          }
          if (notification.channels?.[channel]?.delivered) {
            analytics.byChannel[channel].delivered++;
          }
        });
        
        // Calculate time to read
        if (notification.readAt && notification.createdAt) {
          const readTime = new Date(notification.readAt.seconds * 1000) - 
                          new Date(notification.createdAt.seconds * 1000);
          totalReadTime += readTime;
          readCount++;
        }
      });
      
      if (readCount > 0) {
        analytics.avgTimeToRead = Math.round((totalReadTime / readCount) / (1000 * 60)); // minutes
      }
      
      analytics.readRate = analytics.total > 0 ? 
        Math.round((analytics.read / analytics.total) * 100) : 0;
      
      return analytics;
    } catch (error) {
      console.error('Error getting notification analytics:', error);
      throw error;
    }
  }
  
  // Send notification based on order status change
  static async sendOrderStatusNotification(orderId, newStatus, farmerId, customerId) {
    try {
      const notifications = [];
      
      switch (newStatus) {
        case 'confirmed':
          notifications.push({
            userId: customerId,
            type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
            priority: 'medium',
            title: 'Order Confirmed',
            message: 'Your order has been confirmed by the farmer',
            actionData: { orderId, type: 'order' }
          });
          break;
          
        case 'shipped':
          notifications.push({
            userId: customerId,
            type: NOTIFICATION_TYPES.ORDER_SHIPPED,
            priority: 'high',
            title: 'Order Shipped',
            message: 'Your order is on its way!',
            actionData: { orderId, type: 'order' }
          });
          break;
          
        case 'delivered':
          notifications.push({
            userId: customerId,
            type: NOTIFICATION_TYPES.ORDER_DELIVERED,
            priority: 'medium',
            title: 'Order Delivered',
            message: 'Your order has been delivered. Please confirm receipt.',
            actionData: { orderId, type: 'order' }
          });
          break;
          
        case 'cancelled':
          notifications.push({
            userId: customerId,
            type: NOTIFICATION_TYPES.ORDER_CANCELLED,
            priority: 'high',
            title: 'Order Cancelled',
            message: 'Your order has been cancelled',
            actionData: { orderId, type: 'order' }
          });
          break;
      }
      
      // Send all notifications
      const results = await Promise.all(
        notifications.map(notification => this.sendNotification(notification.userId, notification))
      );
      
      return results;
    } catch (error) {
      console.error('Error sending order status notification:', error);
      throw error;
    }
  }
  
  // Send review notification
  static async sendReviewNotification(reviewId, productId, farmerId, customerId) {
    try {
      // Notify farmer about new review
      await this.sendNotification(farmerId, {
        type: NOTIFICATION_TYPES.NEW_REVIEW,
        priority: 'medium',
        title: 'New Review Received',
        message: 'A customer has left a review for your product',
        actionData: { 
          reviewId, 
          productId, 
          customerId,
          type: 'review' 
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending review notification:', error);
      throw error;
    }
  }
  
  // Send chat message notification
  static async sendChatNotification(conversationId, senderId, recipientId, messagePreview) {
    try {
      // Get sender name
      const senderRef = doc(db, COLLECTIONS.USERS, senderId);
      const senderDoc = await getDoc(senderRef);
      const senderName = senderDoc.exists() ? 
        senderDoc.data().displayName || 'Someone' : 'Someone';
      
      await this.sendNotification(recipientId, {
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        priority: 'medium',
        title: 'New Message',
        message: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
        actionData: { 
          conversationId, 
          senderId,
          senderName,
          type: 'chat' 
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending chat notification:', error);
      throw error;
    }
  }
  
  // Send seasonal notifications
  static async sendSeasonalNotifications() {
    try {
      // This would be called by a scheduled job (daily)
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      // Find products entering/leaving season soon
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      const notifications = [];
      
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        const seasonality = product.seasonality;
        
        if (!seasonality || !seasonality.startSeason || !seasonality.endSeason) return;
        
        const startDate = new Date(seasonality.startSeason);
        const endDate = new Date(seasonality.endSeason);
        
        // Season starting in 3 days
        if (Math.abs(startDate - threeDaysFromNow) < 24 * 60 * 60 * 1000) {
          notifications.push({
            userId: product.farmerId,
            type: NOTIFICATION_TYPES.SEASON_STARTING,
            priority: 'medium',
            title: 'Season Starting Soon',
            message: `${product.name} season starts in 3 days. Prepare your inventory!`,
            actionData: { 
              productId: doc.id, 
              startDate: seasonality.startSeason,
              type: 'product' 
            }
          });
        }
        
        // Season ending in 3 days
        if (Math.abs(endDate - threeDaysFromNow) < 24 * 60 * 60 * 1000) {
          notifications.push({
            userId: product.farmerId,
            type: NOTIFICATION_TYPES.SEASON_ENDING,
            priority: 'high',
            title: 'Season Ending Soon',
            message: `${product.name} season ends in 3 days. Last chance to sell!`,
            actionData: { 
              productId: doc.id, 
              endDate: seasonality.endSeason,
              type: 'product' 
            }
          });
        }
      });
      
      // Send all seasonal notifications
      const results = await Promise.all(
        notifications.map(notification => 
          this.sendNotification(notification.userId, notification)
        )
      );
      
      return results.length;
    } catch (error) {
      console.error('Error sending seasonal notifications:', error);
      throw error;
    }
  }
}