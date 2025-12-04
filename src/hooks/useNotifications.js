// src/hooks/useNotifications.js
// Enhanced notification hook that works with your deployed functions

import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time subscription to notifications
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let unsubscribeNotifications;
    let unsubscribeUnreadCount;

    const setupSubscriptions = async () => {
      try {
        setLoading(true);
        
        // Subscribe to all notifications
        unsubscribeNotifications = NotificationService.subscribeToNotifications(
          currentUser.uid,
          (updatedNotifications) => {
            setNotifications(updatedNotifications);
            setError(null);
          },
          (subscriptionError) => {
            console.error('Notification subscription error:', subscriptionError);
            setError(subscriptionError.message);
          }
        );

        // Subscribe to unread count
        unsubscribeUnreadCount = NotificationService.subscribeToUnreadCount(
          currentUser.uid,
          (count) => {
            setUnreadCount(count);
          }
        );

      } catch (err) {
        console.error('Error setting up notification subscriptions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeUnreadCount) unsubscribeUnreadCount();
    };
  }, [currentUser?.uid]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, readAt: new Date() }
            : notification
        )
      );
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      await NotificationService.markAllAsRead(currentUser.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          readAt: notification.readAt || new Date() 
        }))
      );
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  }, [currentUser?.uid]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    }
  }, []);

  // Send test notification (for development)
  const sendTestNotification = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      await NotificationService.sendNotification(currentUser.uid, {
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification to verify your system is working!',
        priority: 'low'
      });
      
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError(err.message);
    }
  }, [currentUser?.uid]);

  // Get formatted notification categories
  const getNotificationsByType = useCallback(() => {
    const categorized = {
      orders: notifications.filter(n => n.type.includes('order')),
      payments: notifications.filter(n => n.type.includes('payment')),
      inventory: notifications.filter(n => ['low_stock', 'out_of_stock', 'batch_expiring'].includes(n.type)),
      social: notifications.filter(n => ['new_message', 'new_review'].includes(n.type)),
      system: notifications.filter(n => ['profile_updated', 'verification_approved'].includes(n.type))
    };
    
    return categorized;
  }, [notifications]);

  return {
    // Data
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead, 
    deleteNotification,
    sendTestNotification,
    
    // Computed
    getNotificationsByType,
    hasUnread: unreadCount > 0
  };
};