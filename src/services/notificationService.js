// src/services/notificationService.js - Fixed version with proper methods
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
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, NOTIFICATION_TYPES } from '../lib/firebaseSchema';

export class NotificationService {
  
  // Send notification to user
  static async sendNotification(userId, notificationData) {
    try {
      // Create notification document
      const notification = {
        userId,
        type: notificationData.type || 'general',
        title: notificationData.title || 'Notification',
        message: notificationData.message || '',
        priority: notificationData.priority || 'medium',
        actionData: notificationData.actionData || {},
        readAt: null,
        createdAt: serverTimestamp(),
        
        // Simplified channels - just mark as sent for in-app
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
  
  // Get user notifications with options
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limitCount = 20,
        unreadOnly = false,
        types = null
      } = options;
      
      console.log('Getting notifications for user:', userId, 'options:', options);
      
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      // Add unread filter if requested
      if (unreadOnly) {
        q = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('userId', '==', userId),
          where('readAt', '==', null),
          orderBy('createdAt', 'desc')
        );
      }
      
      // Add type filter if specified
      if (types && types.length > 0) {
        q = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('userId', '==', userId),
          where('type', 'in', types),
          orderBy('createdAt', 'desc')
        );
      }
      
      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        };
      });
      
      console.log(`Retrieved ${notifications.length} notifications for user:`, userId);
      return notifications;
      
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  // Get unread count for user - FIXED METHOD
  static async getUnreadCount(userId) {
    try {
      if (!userId) {
        console.warn('No userId provided to getUnreadCount');
        return 0;
      }
      
      console.log('Getting unread count for user:', userId);
      
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const snapshot = await getDocs(q);
      const count = snapshot.docs.length;
      
      console.log(`Unread count for user ${userId}:`, count);
      return count;
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0; // Return 0 instead of throwing
    }
  }
  
  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }
      
      console.log('Marking notification as read:', notificationId);
      
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        readAt: serverTimestamp(),
        'channels.inApp.read': true,
        'channels.inApp.readAt': serverTimestamp()
      });
      
      console.log('Notification marked as read:', notificationId);
      return true;
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      console.log('Marking all notifications as read for user:', userId);
      
      // Get all unread notifications for user
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const snapshot = await getDocs(q);
      
      // Update each notification using batch
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(docSnapshot => {
        batch.update(docSnapshot.ref, {
          readAt: serverTimestamp(),
          'channels.inApp.read': true,
          'channels.inApp.readAt': serverTimestamp()
        });
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
      
      const count = snapshot.docs.length;
      console.log(`Marked ${count} notifications as read for user:`, userId);
      
      return count;
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  // Subscribe to unread count changes (real-time) - FIXED METHOD
  static subscribeToUnreadCount(userId, callback) {
    try {
      if (!userId) {
        console.warn('No userId provided to subscribeToUnreadCount');
        return () => {}; // Return empty unsubscribe function
      }
      
      console.log('Setting up unread count subscription for user:', userId);
      
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('readAt', '==', null)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const count = snapshot.docs.length;
        console.log('Real-time unread count update:', count);
        callback(count);
      }, (error) => {
        console.error('Error in unread count subscription:', error);
        callback(0); // Fallback to 0 on error
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up unread count subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }
  
  // Subscribe to notifications changes (real-time)
  static subscribeToNotifications(userId, callback, options = {}) {
    try {
      if (!userId) {
        console.warn('No userId provided to subscribeToNotifications');
        return () => {};
      }
      
      const {
        limitCount = 20,
        unreadOnly = false
      } = options;
      
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      if (unreadOnly) {
        q = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('userId', '==', userId),
          where('readAt', '==', null),
          orderBy('createdAt', 'desc')
        );
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString()
          };
        });
        
        console.log('Real-time notifications update:', notifications.length);
        callback(notifications);
      }, (error) => {
        console.error('Error in notifications subscription:', error);
        callback([]); // Fallback to empty array
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      return () => {};
    }
  }
  
  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }
      
      await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId));
      console.log('Notification deleted:', notificationId);
      
      return true;
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  
  // Helper method to create test notifications - ADDED THIS METHOD
  static async createTestNotifications(userId) {
    try {
      console.log('Creating test notifications for user:', userId);
      
      const testNotifications = [
        {
          type: NOTIFICATION_TYPES.NEW_ORDER,
          title: '🛒 New Order Received',
          message: 'You have a new order from John Doe',
          priority: 'high',
          actionData: { type: 'order', orderId: 'test-order-1' }
        },
        {
          type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
          title: '✅ Order Confirmed',
          message: 'Your order has been confirmed by the farmer',
          priority: 'medium',
          actionData: { type: 'order', orderId: 'test-order-2' }
        },
        {
          type: NOTIFICATION_TYPES.LOW_STOCK,
          title: '⚠️ Low Stock Alert',
          message: 'Tomatoes are running low (5 kg remaining)',
          priority: 'high',
          actionData: { type: 'product', productId: 'test-product-1' }
        },
        {
          type: NOTIFICATION_TYPES.NEW_MESSAGE,
          title: '💬 New Message',
          message: 'You have a new message from Sarah',
          priority: 'medium',
          actionData: { type: 'chat', conversationId: 'test-chat-1' }
        }
      ];
      
      const promises = testNotifications.map(notification => 
        this.sendNotification(userId, notification)
      );
      
      const results = await Promise.all(promises);
      console.log('Created test notifications:', results);
      
      return results;
      
    } catch (error) {
      console.error('Error creating test notifications:', error);
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
}