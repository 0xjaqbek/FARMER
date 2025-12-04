// src/components/notifications/NotificationCenter.jsx
import React, { useState } from 'react';
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
  RefreshCw,
  Search,
  ChevronDown,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle
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
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
// Import the new hook
import { useNotifications } from '../../hooks/useNotifications';

const NotificationCenter = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use the new hook instead of manual state management
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
    getNotificationsByType,
    hasUnread
  } = useNotifications();
  
  // Local UI state
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        return <Package className="h-5 w-5 text-green-600" />;
      case 'order_confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'order_shipped':
      case 'in_transit':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'order_delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'order_cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'out_of_stock':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'batch_expiring':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'season_starting':
        return <Calendar className="h-5 w-5 text-green-600" />;
      case 'season_ending':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'payment_received':
      case 'payment_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'payment_failed':
      case 'payment_expired':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = (priority, read) => {
    if (read) return 'border-gray-200';
    
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50/50';
      case 'high':
        return 'border-orange-200 bg-orange-50/50';
      case 'medium':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return 'border-gray-200';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on action data
    if (notification.actionData?.type) {
      switch (notification.actionData.type) {
        case 'order':
          navigate(`/orders/${notification.actionData.orderId}`);
          break;
        case 'product':
          navigate(`/products/${notification.actionData.productId}`);
          break;
        case 'conversation':
          navigate(`/chat/${notification.actionData.conversationId}`);
          break;
        case 'review':
          navigate(`/reviews/${notification.actionData.reviewId}`);
          break;
        case 'inventory':
          navigate(`/farmer/inventory`);
          break;
        default:
          break;
      }
    }
  };

  const handleSelectNotification = (notificationId, checked) => {
    const newSelected = new Set(selectedNotifications);
    if (checked) {
      newSelected.add(notificationId);
    } else {
      newSelected.delete(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      const allIds = new Set(filteredNotifications.map(n => n.id));
      setSelectedNotifications(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const idsToDelete = Array.from(selectedNotifications);
      
      for (const id of idsToDelete) {
        await deleteNotification(id);
      }
      
      setSelectedNotifications(new Set());
      setShowDeleteDialog(false);
      
      toast({
        title: "Success",
        description: `Deleted ${idsToDelete.length} notification(s)`,
      });
      
    } catch  {
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The hook automatically handles real-time updates, so just simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
    
    toast({
      title: "Refreshed",
      description: "Notifications updated",
    });
  };

  // Filter notifications based on current filter and search
  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter !== 'all') {
      const typeCategories = getNotificationsByType();
      const categoryNotifications = typeCategories[filter] || [];
      if (!categoryNotifications.some(n => n.id === notification.id)) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 animate-pulse text-gray-400" />
              <p className="text-gray-600">Loading notifications...</p>
              <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto mt-2 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading notifications: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? (
              <span className="text-orange-600 font-medium">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </span>
            ) : (
              "All caught up! No unread notifications"
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="text-green-600 hover:text-green-700"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              <p className="text-sm text-gray-600">Unread</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.readAt).length}
              </p>
              <p className="text-sm text-gray-600">Read</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(getNotificationsByType()).filter(key => getNotificationsByType()[key].length > 0).length}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filter === 'all' ? 'All Types' : 
                   filter === 'orders' ? 'Orders' :
                   filter === 'payments' ? 'Payments' :
                   filter === 'inventory' ? 'Inventory' :
                   filter === 'social' ? 'Social' :
                   filter === 'system' ? 'System' : filter}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  <Bell className="h-4 w-4 mr-2" />
                  All Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('orders')}>
                  <Package className="h-4 w-4 mr-2" />
                  Orders ({getNotificationsByType().orders?.length || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('payments')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Payments ({getNotificationsByType().payments?.length || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('inventory')}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Inventory ({getNotificationsByType().inventory?.length || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('social')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages & Reviews ({getNotificationsByType().social?.length || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('system')}>
                  <Settings className="h-4 w-4 mr-2" />
                  System ({getNotificationsByType().system?.length || 0})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {filteredNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedNotifications.size === filteredNotifications.length ? (
                  <>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
            )}
            
            {selectedNotifications.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotifications.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-lg text-gray-500 mb-2">No notifications match your search</p>
                    <p className="text-sm text-gray-400">Try a different search term or clear filters</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-lg text-gray-500 mb-2">No notifications yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      You'll receive notifications for orders, messages, inventory alerts, and more
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendTestNotification}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                getBorderColor(notification.priority, !!notification.readAt)
              } ${
                selectedNotifications.has(notification.id) ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-5">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectNotification(notification.id, e.target.checked);
                    }}
                    className="mt-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  
                  <div className={`p-3 rounded-full ${
                    notification.priority === 'urgent' ? 'bg-red-100' :
                    notification.priority === 'high' ? 'bg-orange-100' :
                    notification.priority === 'medium' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-base font-semibold mb-1 ${
                          !notification.readAt ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-2 ml-4">
                        {notification.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            🔥 Urgent
                          </Badge>
                        )}
                        {notification.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                            ⚠️ High
                          </Badge>
                        )}
                        {!notification.readAt && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4">
                        <p className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        
                        {notification.type && (
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {notification.actionData?.orderId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${notification.actionData.orderId}`);
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Order
                          </Button>
                        )}
                        
                        {notification.actionData?.productId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${notification.actionData.productId}`);
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Product
                          </Button>
                        )}
                        
                        {notification.actionData?.conversationId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chat/${notification.actionData.conversationId}`);
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Open Chat
                          </Button>
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
            <DialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Delete Notifications
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedNotifications.size} notification(s)? 
              This action cannot be undone and will permanently remove these notifications from your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedNotifications.size > 1 ? 'Notifications' : 'Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State with Actions */}
      {notifications.length === 0 && !loading && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-30 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                When you receive orders, messages, or inventory alerts, they'll appear here. 
                You can also test the notification system now.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={sendTestNotification}
                  className="text-green-600 hover:text-green-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/farmer/products')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;