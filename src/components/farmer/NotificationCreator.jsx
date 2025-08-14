// src/components/farmer/NotificationCreator.jsx
// Complete notification creation interface for farmers

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Info,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  Package,
  ShoppingCart,
  Star,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { NotificationService } from '../../services/notificationService';
import { getProductsByFarmer } from '../../firebase/products';
import { getOrdersByRolnik } from '../../firebase/orders';
import { NOTIFICATION_TYPES } from '../../lib/firebaseSchema';
import { useAuth } from '../../context/AuthContext';

export default function NotificationCreator() {
  const { currentUser, userProfile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  
  // Form state
  const [notificationForm, setNotificationForm] = useState({
    type: '',
    title: '',
    message: '',
    priority: 'medium',
    targetAudience: 'all_customers',
    specificCustomers: [],
    relatedProduct: '',
    scheduledFor: '',
    expiresAt: '',
    channels: {
      inApp: true,
      email: false,
      sms: false
    },
    actionData: {}
  });

  // Notification templates
  const notificationTemplates = {
    [NOTIFICATION_TYPES.NEW_ORDER]: {
      title: 'New Order Received',
      message: 'You have received a new order from {customerName}',
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    [NOTIFICATION_TYPES.LOW_STOCK]: {
      title: 'Low Stock Alert',
      message: '{productName} is running low on stock',
      icon: Package,
      color: 'bg-orange-500'
    },
    [NOTIFICATION_TYPES.SEASON_STARTING]: {
      title: 'Season Starting',
      message: 'The growing season for {productName} is beginning',
      icon: Calendar,
      color: 'bg-green-500'
    },
    [NOTIFICATION_TYPES.NEW_REVIEW]: {
      title: 'New Product Review',
      message: 'You received a new review for {productName}',
      icon: Star,
      color: 'bg-yellow-500'
    },
    custom: {
      title: 'Custom Announcement',
      message: 'Share updates with your customers',
      icon: MessageSquare,
      color: 'bg-purple-500'
    }
  };

  // Load farmer data on component mount
  useEffect(() => {
    loadFarmerData();
  }, [currentUser]);

  const loadFarmerData = async () => {
    try {
      if (!currentUser?.uid) return;

      const [farmerProducts, orders] = await Promise.all([
        getProductsByFarmer(currentUser.uid),
        getOrdersByRolnik(currentUser.uid)
      ]);

      setProducts(farmerProducts || []);
      setRecentOrders(orders?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading farmer data:', error);
    }
  };

  // Handle form changes
  const updateForm = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle template selection
  const selectTemplate = (templateType) => {
    const template = notificationTemplates[templateType];
    if (!template) return;

    setNotificationForm(prev => ({
      ...prev,
      type: templateType === 'custom' ? 'announcement' : templateType,
      title: template.title,
      message: template.message
    }));
  };

  // Handle creating notification
  const handleCreateNotification = async () => {
    try {
      setLoading(true);

      // Validation
      if (!notificationForm.title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a notification title",
          variant: "destructive"
        });
        return;
      }

      if (!notificationForm.message.trim()) {
        toast({
          title: "Error",
          description: "Please enter a notification message",
          variant: "destructive"
        });
        return;
      }

      // Determine target customers
      let targetCustomers = [];
      
      if (notificationForm.targetAudience === 'all_customers') {
        // Get all customers who have ordered from this farmer
        const customerIds = [...new Set(recentOrders.map(order => order.customerId))];
        targetCustomers = customerIds;
      } else if (notificationForm.targetAudience === 'recent_customers') {
        // Get customers from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCustomerIds = [...new Set(
          recentOrders
            .filter(order => new Date(order.createdAt?.toDate?.() || order.createdAt) > thirtyDaysAgo)
            .map(order => order.customerId)
        )];
        targetCustomers = recentCustomerIds;
      } else if (notificationForm.targetAudience === 'specific') {
        targetCustomers = notificationForm.specificCustomers;
      }

      if (targetCustomers.length === 0) {
        toast({
          title: "Warning",
          description: "No target customers found for this notification",
          variant: "destructive"
        });
        return;
      }

      // Prepare notification data
      const notificationData = {
        type: notificationForm.type || 'announcement',
        title: notificationForm.title,
        message: notificationForm.message,
        priority: notificationForm.priority,
        actionData: {
          farmerId: currentUser.uid,
          farmerName: userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}`,
          productId: notificationForm.relatedProduct || null,
          ...notificationForm.actionData
        },
        scheduledFor: notificationForm.scheduledFor ? new Date(notificationForm.scheduledFor) : null,
        expiresAt: notificationForm.expiresAt ? new Date(notificationForm.expiresAt) : null
      };

      // Send notification to all target customers
      const promises = targetCustomers.map(customerId => 
        NotificationService.sendNotification(customerId, notificationData)
      );

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Notification sent to ${targetCustomers.length} customer${targetCustomers.length > 1 ? 's' : ''}`,
      });

      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);

    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNotificationForm({
      type: '',
      title: '',
      message: '',
      priority: 'medium',
      targetAudience: 'all_customers',
      specificCustomers: [],
      relatedProduct: '',
      scheduledFor: '',
      expiresAt: '',
      channels: {
        inApp: true,
        email: false,
        sms: false
      },
      actionData: {}
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">Communicate with your customers</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Create New Notification
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Quick Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom Message</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(notificationTemplates).map(([key, template]) => {
                    const IconComponent = template.icon;
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          notificationForm.type === (key === 'custom' ? 'announcement' : key) 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        }`}
                        onClick={() => selectTemplate(key)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${template.color} text-white`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{template.title}</h4>
                              <p className="text-xs text-gray-600 truncate">{template.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Create a custom message to share updates, announcements, or special offers with your customers.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Notification Form */}
            <div className="space-y-4 border-t pt-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={notificationForm.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Enter notification title"
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={notificationForm.message}
                  onChange={(e) => updateForm('message', e.target.value)}
                  placeholder="Enter your message to customers"
                  rows={3}
                />
              </div>

              {/* Priority and Target Audience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={notificationForm.priority} 
                    onValueChange={(value) => updateForm('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          Urgent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select 
                    value={notificationForm.targetAudience} 
                    onValueChange={(value) => updateForm('targetAudience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_customers">All Customers</SelectItem>
                      <SelectItem value="recent_customers">Recent Customers (30 days)</SelectItem>
                      <SelectItem value="specific">Specific Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Related Product */}
              {products.length > 0 && (
                <div>
                  <Label htmlFor="product">Related Product (Optional)</Label>
                  <Select 
                    value={notificationForm.relatedProduct} 
                    onValueChange={(value) => updateForm('relatedProduct', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={notificationForm.scheduledFor}
                    onChange={(e) => updateForm('scheduledFor', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={notificationForm.expiresAt}
                    onChange={(e) => updateForm('expiresAt', e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              {(notificationForm.title || notificationForm.message) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                  <div className="bg-white border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{notificationForm.title || 'Notification Title'}</h4>
                      <Badge className={getPriorityColor(notificationForm.priority)}>
                        {notificationForm.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm">{notificationForm.message || 'Your message will appear here'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Now
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNotification}
                disabled={loading || !notificationForm.title || !notificationForm.message}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => {
                selectTemplate(NOTIFICATION_TYPES.LOW_STOCK);
                setShowCreateModal(true);
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500 text-white">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Low Stock Alert</h3>
                <p className="text-sm text-gray-600">Notify customers about low inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                selectTemplate(NOTIFICATION_TYPES.SEASON_STARTING);
                setShowCreateModal(true);
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500 text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Season Update</h3>
                <p className="text-sm text-gray-600">Share seasonal availability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                selectTemplate('custom');
                setShowCreateModal(true);
              }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Custom Message</h3>
                <p className="text-sm text-gray-600">Send custom announcements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(recentOrders.map(order => order.customerId))].length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Orders</p>
                <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}