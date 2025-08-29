// src/components/notifications/NotificationBell.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
// Import the new hook
import { useNotifications } from '../../hooks/useNotifications';

const NotificationBell = () => {
  // Replace all the manual state management with the new hook
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead 
  } = useNotifications();

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationDate.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'order_confirmed':
        return '✅';
      case 'order_shipped':
        return '🚚';
      case 'order_delivered':
        return '📦';
      case 'new_message':
        return '💬';
      case 'low_stock':
        return '⚠️';
      case 'out_of_stock':
        return '❌';
      case 'batch_expiring':
        return '⏰';
      case 'new_review':
        return '⭐';
      case 'season_starting':
        return '🌱';
      case 'season_ending':
        return '🍂';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read when clicked
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
  };

  // Get recent notifications for dropdown preview (limit to 5)
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-6 w-6 mx-auto mb-2 animate-pulse" />
            Loading notifications...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You'll receive notifications for orders, messages, and inventory alerts
            </p>
          </div>
        ) : (
          <>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-2 px-2">Recent Notifications</h3>
              {recentNotifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-0">
                  <div 
                    className="w-full p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          !notification.readAt ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.readAt && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to="/notifications" 
                className="p-3 text-center text-sm font-medium text-blue-600 hover:text-blue-700 w-full block"
              >
                View all notifications ({notifications.length})
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;