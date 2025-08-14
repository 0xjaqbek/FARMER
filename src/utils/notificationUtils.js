// src/utils/notificationUtils.js
// Utility functions for notifications

export const NOTIFICATION_SOUNDS = {
  default: '/sounds/notification.mp3',
  order: '/sounds/order.mp3',
  message: '/sounds/message.mp3',
  warning: '/sounds/warning.mp3'
};

// Play notification sound
export const playNotificationSound = (type = 'default') => {
  try {
    const audio = new Audio(NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.default);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Could not play notification sound:', e));
  } catch (error) {
    console.warn('Notification sound not available:', error);
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
};

// Format notification for display
export const formatNotificationForDisplay = (notification) => {
  const timeAgo = formatTimeAgo(notification.createdAt);
  const priority = notification.priority || 'medium';
  const isUrgent = priority === 'urgent';
  const isUnread = !notification.readAt;

  return {
    ...notification,
    timeAgo,
    isUrgent,
    isUnread,
    displayClass: getNotificationDisplayClass(notification)
  };
};

// Get CSS classes for notification display
export const getNotificationDisplayClass = (notification) => {
  let classes = 'notification-item';
  
  if (!notification.readAt) {
    classes += ' notification-unread';
  }
  
  switch (notification.priority) {
    case 'urgent':
      classes += ' notification-urgent';
      break;
    case 'high':
      classes += ' notification-high';
      break;
    case 'low':
      classes += ' notification-low';
      break;
    default:
      classes += ' notification-medium';
  }
  
  return classes;
};

// Time formatting utility
export const formatTimeAgo = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now - notificationDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return notificationDate.toLocaleDateString();
};

// Notification grouping utility
export const groupNotificationsByDate = (notifications) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.createdAt);
    const notificationDay = new Date(
      notificationDate.getFullYear(),
      notificationDate.getMonth(),
      notificationDate.getDate()
    );

    if (notificationDay.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notificationDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notificationDate >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};
