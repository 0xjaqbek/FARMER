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

        const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
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
  
  // Get user notifications with options
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limitCount = 20,
        unreadOnly = false,
        types = null,
        startDate = null,
        endDate = null
      } = options;
      
      console.log('Getting notifications for user:', userId, 'options:', options);
      
      let queryConstraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      // Add unread filter if requested
      if (unreadOnly) {
        queryConstraints.push(where('readAt', '==', null));
      }

      // Add type filter if requested
      if (types && Array.isArray(types) && types.length > 0) {
        queryConstraints.push(where('type', 'in', types));
      }

      // Add date range filter if provided
      if (startDate) {
        queryConstraints.push(where('createdAt', '>=', startDate));
      }
      if (endDate) {
        queryConstraints.push(where('createdAt', '<=', endDate));
      }

      // Add limit
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const notifications = [];
      querySnapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          readAt: doc.data().readAt?.toDate?.() || doc.data().readAt,
          scheduledFor: doc.data().scheduledFor?.toDate?.() || doc.data().scheduledFor,
          expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt
        });
      });
      
      console.log('Found notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
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

  // Mark multiple notifications as read
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
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
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
      
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, {
          readAt: serverTimestamp(),
          'channels.inApp.read': true,
          'channels.inApp.readAt': serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Marked all notifications as read for user: ${userId}`);
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
  static async deleteMultipleNotifications(notificationIds) {
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

  // Get notification by ID
  static async getNotificationById(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        return {
          id: notificationDoc.id,
          ...notificationDoc.data(),
          createdAt: notificationDoc.data().createdAt?.toDate?.() || notificationDoc.data().createdAt,
          readAt: notificationDoc.data().readAt?.toDate?.() || notificationDoc.data().readAt,
          scheduledFor: notificationDoc.data().scheduledFor?.toDate?.() || notificationDoc.data().scheduledFor,
          expiresAt: notificationDoc.data().expiresAt?.toDate?.() || notificationDoc.data().expiresAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications for a user
  static subscribeToUserNotifications(userId, callback, options = {}) {
    try {
      const {
        limitCount = 20,
        unreadOnly = false
      } = options;

      let queryConstraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      if (unreadOnly) {
        queryConstraints.push(where('readAt', '==', null));
      }

      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach(doc => {
          notifications.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            readAt: doc.data().readAt?.toDate?.() || doc.data().readAt,
            scheduledFor: doc.data().scheduledFor?.toDate?.() || doc.data().scheduledFor,
            expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt
          });
        });
        
        callback(notifications);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  // Get notifications by type
  static async getNotificationsByType(userId, type, limitCount = 10) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          readAt: doc.data().readAt?.toDate?.() || doc.data().readAt,
          scheduledFor: doc.data().scheduledFor?.toDate?.() || doc.data().scheduledFor,
          expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw error;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${querySnapshot.size} expired notifications`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Get notification statistics for a user
  static async getNotificationStats(userId) {
    try {
      const allNotificationsQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );
      
      const unreadNotificationsQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );

      const [allSnapshot, unreadSnapshot] = await Promise.all([
        getDocs(allNotificationsQuery),
        getDocs(unreadNotificationsQuery)
      ]);

      // Count by type
      const typeStats = {};
      allSnapshot.forEach(doc => {
        const type = doc.data().type;
        typeStats[type] = (typeStats[type] || 0) + 1;
      });

      // Count by priority
      const priorityStats = {};
      allSnapshot.forEach(doc => {
        const priority = doc.data().priority || 'medium';
        priorityStats[priority] = (priorityStats[priority] || 0) + 1;
      });

      return {
        total: allSnapshot.size,
        unread: unreadSnapshot.size,
        read: allSnapshot.size - unreadSnapshot.size,
        byType: typeStats,
        byPriority: priorityStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Create notification templates for farmers
  static getNotificationTemplates() {
    return {
      [NOTIFICATION_TYPES.LOW_STOCK]: {
        title: 'Low Stock Alert: {productName}',
        message: 'Your product "{productName}" is running low on stock. Only {stockQuantity} {unit} remaining.',
        priority: 'high',
        type: NOTIFICATION_TYPES.LOW_STOCK
      },
      [NOTIFICATION_TYPES.OUT_OF_STOCK]: {
        title: 'Out of Stock: {productName}',
        message: 'Your product "{productName}" is now out of stock. Consider restocking soon.',
        priority: 'urgent',
        type: NOTIFICATION_TYPES.OUT_OF_STOCK
      },
      [NOTIFICATION_TYPES.NEW_ORDER]: {
        title: 'New Order Received!',
        message: 'You have received a new order from {customerName} for {productName}.',
        priority: 'high',
        type: NOTIFICATION_TYPES.NEW_ORDER
      },
      [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        message: 'Your order #{orderNumber} has been confirmed by {farmerName}.',
        priority: 'medium',
        type: NOTIFICATION_TYPES.ORDER_CONFIRMED
      },
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
        title: 'Order Shipped',
        message: 'Your order #{orderNumber} has been shipped and is on its way!',
        priority: 'medium',
        type: NOTIFICATION_TYPES.ORDER_SHIPPED
      },
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        message: 'Your order #{orderNumber} has been delivered. Enjoy your fresh products!',
        priority: 'low',
        type: NOTIFICATION_TYPES.ORDER_DELIVERED
      },
      [NOTIFICATION_TYPES.NEW_REVIEW]: {
        title: 'New Review Received',
        message: 'You received a {rating}-star review for "{productName}".',
        priority: 'low',
        type: NOTIFICATION_TYPES.NEW_REVIEW
      },
      [NOTIFICATION_TYPES.SEASON_STARTING]: {
        title: 'Season Starting: {productName}',
        message: 'The growing season for {productName} is beginning. Get ready for fresh harvest!',
        priority: 'medium',
        type: NOTIFICATION_TYPES.SEASON_STARTING
      },
      [NOTIFICATION_TYPES.SEASON_ENDING]: {
        title: 'Season Ending: {productName}',
        message: 'The season for {productName} is coming to an end. Limited availability remaining.',
        priority: 'medium',
        type: NOTIFICATION_TYPES.SEASON_ENDING
      },
      [NOTIFICATION_TYPES.BATCH_EXPIRING]: {
        title: 'Product Batch Expiring',
        message: 'Batch #{batchId} of {productName} is expiring on {expiryDate}.',
        priority: 'high',
        type: NOTIFICATION_TYPES.BATCH_EXPIRING
      }
    };
  }

  // Send template-based notification
  static async sendTemplateNotification(userId, templateType, variables = {}) {
    try {
      const templates = this.getNotificationTemplates();
      const template = templates[templateType];
      
      if (!template) {
        throw new Error(`Template not found: ${templateType}`);
      }

      // Replace variables in title and message
      let title = template.title;
      let message = template.message;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        message = message.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      const notificationData = {
        title,
        message,
        type: template.type,
        priority: template.priority,
        actionData: variables
      };

      return await this.sendNotification(userId, notificationData);
    } catch (error) {
      console.error('Error sending template notification:', error);
      throw error;
    }
  }

  // Utility method to format notification for display
  static formatNotificationForDisplay(notification) {
    const timeAgo = this.getTimeAgo(notification.createdAt);
    const priorityColor = this.getPriorityColor(notification.priority);
    const typeIcon = this.getTypeIcon(notification.type);

    return {
      ...notification,
      timeAgo,
      priorityColor,
      typeIcon,
      isExpired: notification.expiresAt && new Date() > new Date(notification.expiresAt)
    };
  }

  // Get time ago string
  static getTimeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return notificationDate.toLocaleDateString();
  }

  // Get priority color class
  static getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }

  // Get type icon
  static getTypeIcon(type) {
    const iconMap = {
      [NOTIFICATION_TYPES.NEW_ORDER]: '🛒',
      [NOTIFICATION_TYPES.ORDER_CONFIRMED]: '✅',
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: '🚚',
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: '📦',
      [NOTIFICATION_TYPES.LOW_STOCK]: '⚠️',
      [NOTIFICATION_TYPES.OUT_OF_STOCK]: '❌',
      [NOTIFICATION_TYPES.NEW_REVIEW]: '⭐',
      [NOTIFICATION_TYPES.SEASON_STARTING]: '🌱',
      [NOTIFICATION_TYPES.SEASON_ENDING]: '🍂',
      [NOTIFICATION_TYPES.BATCH_EXPIRING]: '⏰',
      [NOTIFICATION_TYPES.NEW_MESSAGE]: '💬',
      [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: '💰'
    };
    
    return iconMap[type] || '📢';
  }
}