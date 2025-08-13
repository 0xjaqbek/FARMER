// src/components/notifications/NotificationCenter.jsx
// Complete notification management interface

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Star, 
  Package, 
  MessageCircle, 
  AlertTriangle,
  Settings,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

export default function NotificationCenter() {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  
  // Notification preferences
  const [preferences, setPreferences] = useState({
    email: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: false
    },
    sms: {
      orderUpdates: false,
      newMessages: false,
      lowStock: true,
      reviews: false
    },
    inApp: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: true
    }
  });

  // Load notifications on mount
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    }
  }, [currentUser, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await NotificationService.getUserNotifications(currentUser.uid, {
        limitCount: 50,
        unreadOnly: filter === 'unread',
        types: filter !== 'all' && filter !== 'unread' ? [filter] : null
      });
      
      setNotifications(result.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await NotificationService.getNotificationCount(currentUser.uid, true);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadPreferences = () => {
    if (userProfile?.notificationPreferences) {
      setPreferences(userProfile.notificationPreferences);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId, currentUser.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const count = await NotificationService.markAllAsRead(currentUser.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: `Marked ${count} notifications as read`
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }

    // Navigate based on action data
    if (notification.actionData?.type) {
      switch (notification.actionData.type) {
        case 'order':
          window.location.href = `/orders/${notification.actionData.orderId}`;
          break;
        case 'product':
          window.location.href = `/products/${notification.actionData.productId}`;
          break;
        case 'chat':
          window.location.href = `/chat/${notification.actionData.conversationId}`;
          break;
        case 'review':
          window.location.href = `/products/${notification.actionData.productId}#reviews`;
          break;
        default:
          break;
      }
    }
  };

  // Update notification preferences
  const updatePreferences = async () => {
    try {
      await NotificationService.updateNotificationPreferences(currentUser.uid, preferences);
      
      toast({
        title: "Success",
        description: "Notification preferences updated"
      });
      
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
        return <Package className="h-4 w-4" />;
      case 'new_message':
        return <MessageCircle className="h-4 w-4" />;
      case 'new_review':
      case 'review_response':
        return <Star className="h-4 w-4" />;
      case 'low_stock':
      case 'out_of_stock':
      case 'batch_expiring':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'high') return 'text-orange-600';
    
    switch (type) {
      case 'new_order':
        return 'text-green-600';
      case 'order_shipped':
        return 'text-blue-600';
      case 'new_review':
        return 'text-yellow-600';
      case 'low_stock':
      case 'out_of_stock':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'new_order', label: 'Orders', count: notifications.filter(n => n.type.includes('order')).length },
    { value: 'new_message', label: 'Messages', count: notifications.filter(n => n.type.includes('message')).length },
    { value: 'low_stock', label: 'Stock', count: notifications.filter(n => n.type.includes('stock')).length }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Notification Preferences</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Email Preferences */}
                <div>
                  <h3 className="font-medium mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(preferences.email).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`email-${key}`} className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`email-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              email: { ...prev.email, [key]: checked }
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* SMS Preferences */}
                <div>
                  <h3 className="font-medium mb-3">SMS Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(preferences.sms).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`sms-${key}`} className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`sms-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              sms: { ...prev.sms, [key]: checked }
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* In-App Preferences */}
                <div>
                  <h3 className="font-medium mb-3">In-App Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(preferences.inApp).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`inApp-${key}`} className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`inApp-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              inApp: { ...prev.inApp, [key]: checked }
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updatePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              filter === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
            {option.count > 0 && (
              <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.readAt ? 'border-l-4 border-l-green-500 bg-green-50/30' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full bg-gray-100 ${
                    getNotificationColor(notification.type, notification.priority)
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.readAt ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                        {notification.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs">
                            High
                          </Badge>
                        )}
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(notification.createdAt?.seconds ? 
                          notification.createdAt.seconds * 1000 : 
                          notification.createdAt
                        )}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {notification.channels?.email?.sent && (
                          <Badge variant="outline" className="text-xs">
                            Email
                          </Badge>
                        )}
                        {notification.channels?.sms?.sent && (
                          <Badge variant="outline" className="text-xs">
                            SMS
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}