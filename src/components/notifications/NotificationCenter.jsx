// src/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Star, 
  Package, 
  MessageCircle, 
  AlertTriangle,
  Settings,
  Filter,
  X,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Calendar,
  ChevronDown,
  Archive,
  BookmarkPlus,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const { currentUser, _userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load notifications on mount and when dependencies change
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadUnreadCount();
      
      // Set up real-time listener for unread count
      const unsubscribe = NotificationService.subscribeToUnreadCount(
        currentUser.uid,
        setUnreadCount
      );
      
      return () => unsubscribe && unsubscribe();
    } else {
      resetState();
    }
  }, [currentUser, filter, sortBy]);

  const resetState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
    setSelectedNotifications(new Set());
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const options = {
        limitCount: 50,
        unreadOnly: filter === 'unread',
        types: getFilterTypes(filter),
        sortBy: sortBy === 'newest' ? 'createdAt' : 'priority'
      };
      
      const result = await NotificationService.getUserNotifications(currentUser.uid, options);
      
      // Apply search filter if needed
      let filteredNotifications = result;
      if (searchTerm) {
        filteredNotifications = result.filter(notification =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setNotifications(filteredNotifications);
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
      const count = await NotificationService.getUnreadCount(currentUser.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    await loadUnreadCount();
    setIsRefreshing(false);
    toast({
      title: "Success",
      description: "Notifications refreshed"
    });
  }, [loadNotifications, loadUnreadCount]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const count = await NotificationService.markAllAsRead(currentUser.uid);
      
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

  // Delete selected notifications
  const deleteSelectedNotifications = async () => {
    try {
      const notificationIds = Array.from(selectedNotifications);
      await NotificationService.deleteMultiple(notificationIds);
      
      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.has(notif.id))
      );
      
      setSelectedNotifications(new Set());
      setShowDeleteDialog(false);
      
      toast({
        title: "Success",
        description: `Deleted ${notificationIds.length} notifications`
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive"
      });
    }
  };

  // Handle notification click (navigate to related content)
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const actionData = notification.actionData || {};
    
    switch (notification.type) {
      case 'new_order':
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        if (actionData.orderId) {
          navigate(`/orders/${actionData.orderId}`);
        } else {
          navigate('/orders');
        }
        break;
      case 'new_message':
        if (actionData.chatId) {
          navigate(`/chat/${actionData.chatId}`);
        } else {
          navigate('/chat');
        }
        break;
      case 'low_stock':
      case 'out_of_stock':
      case 'batch_expiring':
        if (actionData.productId) {
          navigate(`/products/${actionData.productId}/edit`);
        } else {
          navigate('/products/manage');
        }
        break;
      case 'new_review':
        if (actionData.productId) {
          navigate(`/products/${actionData.productId}`);
        }
        break;
      default:
        // No specific action, just mark as read
        break;
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Select all visible notifications
  const selectAllVisible = () => {
    const visibleIds = notifications.map(n => n.id);
    setSelectedNotifications(new Set(visibleIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  // Helper functions
  const getFilterTypes = (filter) => {
    switch (filter) {
      case 'orders':
        return ['new_order', 'order_confirmed', 'order_shipped', 'order_delivered'];
      case 'messages':
        return ['new_message'];
      case 'stock':
        return ['low_stock', 'out_of_stock', 'batch_expiring'];
      case 'reviews':
        return ['new_review'];
      case 'seasonal':
        return ['season_starting', 'season_ending'];
      default:
        return undefined;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'low_stock':
      case 'out_of_stock':
      case 'batch_expiring':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-600" />;
      case 'season_starting':
      case 'season_ending':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'low':
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
      default:
        return 'border-l-gray-300 bg-white hover:bg-gray-50';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'orders', label: 'Orders', count: notifications.filter(n => n.type?.includes('order')).length },
    { value: 'messages', label: 'Messages', count: notifications.filter(n => n.type?.includes('message')).length },
    { value: 'stock', label: 'Stock', count: notifications.filter(n => ['low_stock', 'out_of_stock', 'batch_expiring'].includes(n.type)).length },
    { value: 'reviews', label: 'Reviews', count: notifications.filter(n => n.type?.includes('review')).length },
    { value: 'seasonal', label: 'Seasonal', count: notifications.filter(n => ['season_starting', 'season_ending'].includes(n.type)).length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshNotifications}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'newest' ? 'Newest' : 'Priority'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>
                Priority
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedNotifications.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
            className="text-xs"
          >
            {option.label}
            {option.count > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Bulk Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedNotifications.size === notifications.length}
              onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()}
              className="rounded"
            />
            <span className="text-sm text-gray-600">
              Select all visible ({notifications.length})
            </span>
          </div>
          
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                selectedNotifications.forEach(id => {
                  const notification = notifications.find(n => n.id === id);
                  if (notification && !notification.readAt) {
                    markAsRead(id);
                  }
                });
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Mark read
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : searchTerm 
                  ? `No notifications found for "${searchTerm}"`
                  : "You don't have any notifications yet."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`cursor-pointer transition-all border-l-4 ${
                !notification.readAt ? 'shadow-md' : 'shadow-sm'
              } ${getPriorityColor(notification.priority)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded"
                  />
                  
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.readAt ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          {notification.actionData?.productId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/products/${notification.actionData.productId}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                        {notification.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            High
                          </Badge>
                        )}
                        {!notification.readAt && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notifications</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedNotifications.size} notification(s)? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSelectedNotifications}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;