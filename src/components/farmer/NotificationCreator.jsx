// src/components/notifications/NotificationCreator.jsx
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
  X,
  Eye,
  Upload,
  Link,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService } from '../../services/notificationService';
import { getProductsByFarmer } from '../../firebase/products';
import { getOrdersByRolnik } from '../../firebase/orders';
import { NOTIFICATION_TYPES } from '../../lib/firebaseSchema';
import { useAuth } from '../../context/AuthContext';

const NotificationCreator = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  // Removed unused previewMode state
  
  // Form state
  const [notificationForm, setNotificationForm] = useState({
    type: 'announcement',
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
    actionData: {
      actionType: '',
      actionUrl: '',
      buttonText: ''
    },
    estimatedReach: 0
  });

  // Notification templates
  const notificationTemplates = {
    announcement: {
      title: 'Farm Announcement',
      message: 'We have exciting news to share with you!',
      icon: MessageSquare,
      color: 'bg-blue-500',
      description: 'General announcements and updates'
    },
    new_product: {
      title: 'New Product Available',
      message: 'Check out our fresh {productName} now available!',
      icon: Package,
      color: 'bg-green-500',
      description: 'Announce new products or seasonal items'
    },
    price_update: {
      title: 'Price Update',
      message: 'Updated pricing for {productName} - still great value!',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      description: 'Notify about price changes'
    },
    stock_available: {
      title: 'Back in Stock',
      message: '{productName} is back in stock! Order now while supplies last.',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      description: 'Notify when items are restocked'
    },
    seasonal_update: {
      title: 'Seasonal Update',
      message: 'Our {season} harvest is ready! Fresh {productName} available now.',
      icon: Calendar,
      color: 'bg-purple-500',
      description: 'Seasonal announcements and harvest updates'
    },
    special_offer: {
      title: 'Special Offer',
      message: 'Limited time offer on {productName} - {discount}% off!',
      icon: Star,
      color: 'bg-yellow-500',
      description: 'Promotions and special deals'
    },
    order_reminder: {
      title: 'Order Reminder',
      message: 'Don\'t forget to place your order for this week\'s fresh produce!',
      icon: ShoppingCart,
      color: 'bg-indigo-500',
      description: 'Remind customers to place orders'
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: 'bg-gray-100 text-gray-800', icon: '○' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-blue-100 text-blue-800', icon: '●' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800', icon: '⬤' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', icon: '🔴' }
  ];

  const audienceOptions = [
    { 
      value: 'all_customers', 
      label: 'All Customers', 
      description: 'Send to all customers who have ordered from you',
      icon: Users 
    },
    { 
      value: 'recent_customers', 
      label: 'Recent Customers', 
      description: 'Customers who ordered in the last 30 days',
      icon: Clock 
    },
    { 
      value: 'product_customers', 
      label: 'Product Customers', 
      description: 'Customers who bought a specific product',
      icon: Package 
    },
    { 
      value: 'specific_customers', 
      label: 'Specific Customers', 
      description: 'Manually select customers',
      icon: Target 
    }
  ];

  useEffect(() => {
    if (currentUser) {
      loadFarmerData();
    }
  }, [currentUser]);

  useEffect(() => {
    calculateEstimatedReach();
  }, [notificationForm.targetAudience, notificationForm.relatedProduct, notificationForm.specificCustomers, recentOrders]);

  const loadFarmerData = async () => {
    try {
      const [farmerProducts, orders] = await Promise.all([
        getProductsByFarmer(currentUser.uid),
        getOrdersByRolnik(currentUser.uid)
      ]);

      console.log('Raw farmer data loaded:');
      console.log('Products:', farmerProducts);
      console.log('Orders:', orders);

      setProducts(farmerProducts || []);
      setRecentOrders(orders || []);
      
      // Extract unique customers - FIXED: Use clientId instead of customerId
      const uniqueCustomers = {};
      const validOrders = (orders || []).filter(order => {
        console.log('Processing order:', {
          id: order.id,
          clientId: order.clientId,        // ← Your orders use clientId
          customerId: order.customerId,    // ← This doesn't exist
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          hasClientId: !!order.clientId
        });
        return order.clientId; // ← FIXED: Check for clientId instead of customerId
      });
      
      console.log('Valid orders with client IDs:', validOrders);
      
      validOrders.forEach(order => {
        const customerId = order.clientId; // ← FIXED: Use clientId as customerId
        if (customerId && !uniqueCustomers[customerId]) {
          const customerData = {
            id: customerId,
            name: order.customerName || order.customerEmail?.split('@')[0] || 'Unknown Customer',
            email: order.customerEmail || '',
            lastOrderDate: order.createdAt,
            orderCount: 1
          };
          uniqueCustomers[customerId] = customerData;
          console.log('Added customer:', customerData);
        } else if (customerId && uniqueCustomers[customerId]) {
          // Update order count
          uniqueCustomers[customerId].orderCount += 1;
          // Update last order date if this is more recent
          const currentDate = new Date(uniqueCustomers[customerId].lastOrderDate?.toDate?.() || uniqueCustomers[customerId].lastOrderDate || 0);
          const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt || 0);
          if (orderDate > currentDate) {
            uniqueCustomers[customerId].lastOrderDate = order.createdAt;
          }
          console.log('Updated customer:', customerId, 'order count:', uniqueCustomers[customerId].orderCount);
        }
      });
      
      const customerList = Object.values(uniqueCustomers);
      console.log('Final customer list:', customerList);
      setCustomers(customerList);
      
      if (customerList.length === 0 && orders && orders.length > 0) {
        console.error('❌ ISSUE: Found orders but no customers!');
        console.error('Checking if orders have clientId field...');
        const hasClientIds = orders.some(order => order.clientId);
        if (hasClientIds) {
          console.log('✅ Orders have clientId field - extraction should work');
        } else {
          console.error('❌ Orders missing clientId field');
        }
      }
      
    } catch (error) {
      console.error('Error loading farmer data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    }
  };

  const calculateEstimatedReach = () => {
    let reach = 0;
    
    switch (notificationForm.targetAudience) {
      case 'all_customers': {
        reach = customers.filter(c => c.id).length; // Only count customers with valid IDs
        break;
      }
      case 'recent_customers': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCustomerIds = new Set();
        recentOrders.forEach(order => {
          if (order.clientId) { // ← FIXED: Use clientId
            const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt);
            if (orderDate > thirtyDaysAgo) {
              recentCustomerIds.add(order.clientId); // ← FIXED: Use clientId
            }
          }
        });
        reach = recentCustomerIds.size;
        break;
      }
      case 'product_customers': {
        if (notificationForm.relatedProduct && notificationForm.relatedProduct !== 'none') {
          const productCustomerIds = new Set();
          recentOrders.forEach(order => {
            if (order.clientId && order.items?.some(item => item.productId === notificationForm.relatedProduct)) { // ← FIXED: Use clientId
              productCustomerIds.add(order.clientId); // ← FIXED: Use clientId
            }
          });
          reach = productCustomerIds.size;
        }
        break;
      }
      case 'specific_customers': {
        reach = notificationForm.specificCustomers.filter(id => id).length; // Only count valid IDs
        break;
      }
    }
    
    console.log('Estimated reach calculation:', {
      audience: notificationForm.targetAudience,
      reach,
      totalCustomers: customers.length,
      totalOrders: recentOrders.length
    }); // Debug log
    
    setNotificationForm(prev => ({ ...prev, estimatedReach: reach }));
  };

  const updateForm = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateActionData = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      actionData: {
        ...prev.actionData,
        [field]: value
      }
    }));
  };

  const selectTemplate = (templateType) => {
    const template = notificationTemplates[templateType];
    if (!template) return;

    setNotificationForm(prev => ({
      ...prev,
      type: templateType,
      title: template.title,
      message: template.message
    }));
  };

  const replaceVariables = (text) => {
    let result = text;
    
    // Replace product name if selected
    if (notificationForm.relatedProduct && notificationForm.relatedProduct !== 'none') {
      const product = products.find(p => p.id === notificationForm.relatedProduct);
      if (product) {
        result = result.replace(/{productName}/g, product.name);
      }
    }
    
    // Replace other common variables
    result = result.replace(/{farmerName}/g, userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || 'Farm');
    result = result.replace(/{season}/g, getCurrentSeason());
    
    return result;
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

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

      if (notificationForm.estimatedReach === 0) {
        toast({
          title: "Warning",
          description: "No customers will receive this notification",
          variant: "destructive"
        });
        return;
      }

      // Get target customers with proper error handling
      let targetCustomers = [];
      
      switch (notificationForm.targetAudience) {
        case 'all_customers': {
          targetCustomers = customers.map(c => c.id).filter(id => id); // Filter out undefined IDs
          break;
        }
        case 'recent_customers': {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          targetCustomers = [...new Set(
            recentOrders
              .filter(order => {
                const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt);
                return orderDate > thirtyDaysAgo && order.clientId; // ← FIXED: Use clientId
              })
              .map(order => order.clientId) // ← FIXED: Use clientId
              .filter(id => id) // Filter out undefined IDs
          )];
          break;
        }
        case 'product_customers': {
          if (notificationForm.relatedProduct && notificationForm.relatedProduct !== 'none') {
            targetCustomers = [...new Set(
              recentOrders
                .filter(order => {
                  const hasProduct = order.items?.some(item => item.productId === notificationForm.relatedProduct);
                  return hasProduct && order.clientId; // ← FIXED: Use clientId
                })
                .map(order => order.clientId) // ← FIXED: Use clientId
                .filter(id => id) // Filter out undefined IDs
            )];
          }
          break;
        }
        case 'specific_customers': {
          targetCustomers = notificationForm.specificCustomers.filter(id => id); // Filter out undefined IDs
          break;
        }
      }

      // Final validation of target customers
      if (targetCustomers.length === 0) {
        toast({
          title: "Error",
          description: "No valid customers found to send notifications to",
          variant: "destructive"
        });
        return;
      }

      console.log('Target customers:', targetCustomers); // Debug log

      // Prepare notification data
      const notificationData = {
        type: notificationForm.type,
        title: replaceVariables(notificationForm.title),
        message: replaceVariables(notificationForm.message),
        priority: notificationForm.priority,
        actionData: {
          farmerId: currentUser.uid,
          farmerName: userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}`,
          productId: (notificationForm.relatedProduct && notificationForm.relatedProduct !== 'none') ? notificationForm.relatedProduct : null,
          ...notificationForm.actionData
        },
        scheduledFor: notificationForm.scheduledFor ? new Date(notificationForm.scheduledFor) : null,
        expiresAt: notificationForm.expiresAt ? new Date(notificationForm.expiresAt) : null
      };

      console.log('Notification data:', notificationData); // Debug log

      // Send notification to all target customers with error handling
      const results = await Promise.allSettled(
        targetCustomers.map(async (customerId) => {
          if (!customerId) {
            throw new Error('Invalid customer ID');
          }
          return await NotificationService.sendNotification(customerId, notificationData);
        })
      );

      // Count successful sends
      const successfulSends = results.filter(result => result.status === 'fulfilled').length;
      const failedSends = results.filter(result => result.status === 'rejected').length;

      if (successfulSends > 0) {
        toast({
          title: "Success",
          description: `Notification sent to ${successfulSends} customer${successfulSends > 1 ? 's' : ''}${
            failedSends > 0 ? `. ${failedSends} failed to send.` : ''
          }`,
        });

        resetForm();
        setShowCreateModal(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to send notifications to any customers",
          variant: "destructive"
        });
      }

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
      type: 'announcement',
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
      actionData: {
        actionType: '',
        actionUrl: '',
        buttonText: ''
      },
      estimatedReach: 0
    });
    // Removed setPreviewMode(false) since previewMode is no longer used
  };

  const getPriorityOption = (priority) => {
    return priorityOptions.find(option => option.value === priority);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Notifications</h2>
          <p className="text-gray-600">Send updates and announcements to your customers</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Create New Notification
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                {/* Templates */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Quick Templates</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(notificationTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Card 
                          key={key}
                          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                            notificationForm.type === key 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectTemplate(key)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${template.color} text-white`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{template.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                    <Input
                      id="title"
                      value={notificationForm.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="Enter notification title"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
                    <Textarea
                      id="message"
                      value={notificationForm.message}
                      onChange={(e) => updateForm('message', e.target.value)}
                      placeholder="Enter your message to customers"
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{productName}'} for product names, {'{farmerName}'} for your name
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Select 
                        value={notificationForm.priority} 
                        onValueChange={(value) => updateForm('priority', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Related Product (Optional)</Label>
                      <Select 
                        value={notificationForm.relatedProduct} 
                        onValueChange={(value) => updateForm('relatedProduct', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific product</SelectItem>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Audience Tab */}
              <TabsContent value="audience" className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Target Audience</Label>
                  <div className="space-y-3">
                    {audienceOptions.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <Card 
                          key={option.value}
                          className={`cursor-pointer transition-all border-2 ${
                            notificationForm.targetAudience === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => updateForm('targetAudience', option.value)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                              <div className="flex-1">
                                <h4 className="font-medium">{option.label}</h4>
                                <p className="text-sm text-gray-500">{option.description}</p>
                              </div>
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  notificationForm.targetAudience === option.value
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {notificationForm.targetAudience === option.value && (
                                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Customer Selection */}
                {notificationForm.targetAudience === 'specific_customers' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Customers</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {customers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No customers found</p>
                      ) : (
                        <div className="space-y-2">
                          {customers.map(customer => (
                            <div key={customer.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={customer.id}
                                checked={notificationForm.specificCustomers.includes(customer.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateForm('specificCustomers', [...notificationForm.specificCustomers, customer.id]);
                                  } else {
                                    updateForm('specificCustomers', notificationForm.specificCustomers.filter(id => id !== customer.id));
                                  }
                                }}
                              />
                              <Label htmlFor={customer.id} className="text-sm cursor-pointer">
                                {customer.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimated Reach */}
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Estimated Reach:</strong> {notificationForm.estimatedReach} customer{notificationForm.estimatedReach !== 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                {/* Delivery Channels */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Delivery Channels</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <div>
                          <p className="font-medium text-sm">In-App Notifications</p>
                          <p className="text-xs text-gray-500">Show in notification center</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationForm.channels.inApp}
                        onCheckedChange={(checked) => updateForm('channels', {...notificationForm.channels, inApp: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <div>
                          <p className="font-medium text-sm">Email Notifications</p>
                          <p className="text-xs text-gray-500">Send via email (coming soon)</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationForm.channels.email}
                        onCheckedChange={(checked) => updateForm('channels', {...notificationForm.channels, email: checked})}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Scheduling (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Send At</Label>
                      <Input
                        type="datetime-local"
                        value={notificationForm.scheduledFor}
                        onChange={(e) => updateForm('scheduledFor', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Expires At</Label>
                      <Input
                        type="datetime-local"
                        value={notificationForm.expiresAt}
                        onChange={(e) => updateForm('expiresAt', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Action Button (Optional)</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Button Text</Label>
                      <Input
                        value={notificationForm.actionData.buttonText}
                        onChange={(e) => updateActionData('buttonText', e.target.value)}
                        placeholder="e.g., View Product, Place Order"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Action URL</Label>
                      <Input
                        value={notificationForm.actionData.actionUrl}
                        onChange={(e) => updateActionData('actionUrl', e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Notification Preview</Label>
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">
                              {replaceVariables(notificationForm.title) || 'Notification Title'}
                            </h4>
                            <div className="flex items-center gap-2">
                              {notificationForm.priority && (
                                <Badge className={getPriorityOption(notificationForm.priority)?.color}>
                                  {getPriorityOption(notificationForm.priority)?.label}
                                </Badge>
                              )}
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {replaceVariables(notificationForm.message) || 'Your message will appear here'}
                          </p>
                          {notificationForm.actionData.buttonText && (
                            <Button size="sm" className="mt-2">
                              {notificationForm.actionData.buttonText}
                            </Button>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Just now
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Summary</Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estimated Reach:</span>
                      <span className="text-sm font-medium">{notificationForm.estimatedReach} customers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Priority:</span>
                      <span className="text-sm font-medium">
                        {getPriorityOption(notificationForm.priority)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery:</span>
                      <span className="text-sm font-medium">
                        {notificationForm.scheduledFor ? 'Scheduled' : 'Immediate'}
                      </span>
                    </div>
                    {notificationForm.relatedProduct && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Related Product:</span>
                        <span className="text-sm font-medium">
                          {products.find(p => p.id === notificationForm.relatedProduct)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <DialogFooter className="border-t pt-4">
              <div className="flex flex-col w-full gap-3">
                {/* Debug Panel - Always Visible for Troubleshooting */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Troubleshooting Info:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1 ${notificationForm.title ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationForm.title ? '✅' : '❌'} Title: "{notificationForm.title || 'empty'}"
                      </div>
                      <div className={`flex items-center gap-1 ${notificationForm.message ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationForm.message ? '✅' : '❌'} Message: "{notificationForm.message ? 'filled' : 'empty'}"
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1 ${notificationForm.estimatedReach > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationForm.estimatedReach > 0 ? '✅' : '❌'} Reach: {notificationForm.estimatedReach} customers
                      </div>
                      <div className={`flex items-center gap-1 ${!loading ? 'text-green-600' : 'text-red-600'}`}>
                        {!loading ? '✅' : '❌'} Ready: {loading ? 'Loading...' : 'Ready'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-yellow-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        📊 {customers.length} total customers<br/>
                        📦 {recentOrders.length} total orders<br/>
                        ✅ {customers.filter(c => c.id).length} valid customer IDs
                      </div>
                      <div>
                        🔍 {recentOrders.filter(o => o.customerId).length} orders with customer IDs<br/>
                        {recentOrders.length > 0 && customers.length === 0 && (
                          <span className="text-red-600 font-medium">
                            ⚠️ Data mismatch detected!
                          </span>
                        )}
                      </div>
                    </div>
                    {recentOrders.length > 0 && customers.length === 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                        <strong>Issue Found:</strong> You have {recentOrders.length} order(s) but 0 customers. 
                        This means your orders are missing the <code>clientId</code> field. 
                        Check browser console for detailed order structure.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  {notificationForm.estimatedReach > 0 && (
                    <Alert className="flex-1 mr-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        This notification will be sent to {notificationForm.estimatedReach} customer{notificationForm.estimatedReach !== 1 ? 's' : ''}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
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
                      disabled={loading || !notificationForm.title || !notificationForm.message || notificationForm.estimatedReach === 0}
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
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Orders</p>
                <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Notification Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(notificationTemplates).slice(0, 6).map(([key, template]) => {
              const IconComponent = template.icon;
              return (
                <Card 
                  key={key}
                  className="cursor-pointer transition-all hover:shadow-md border hover:border-gray-300"
                  onClick={() => {
                    selectTemplate(key);
                    setShowCreateModal(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${template.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Customers */}
      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customers.slice(0, 5).map(customer => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Last order: {customer.lastOrderDate ? new Date(customer.lastOrderDate.toDate?.() || customer.lastOrderDate).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
              
              {customers.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All {customers.length} Customers
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sm mb-2">Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep titles under 50 characters</li>
                <li>• Use clear, actionable language</li>
                <li>• Include relevant product information</li>
                <li>• Set appropriate priority levels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Available Variables</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>{'{productName}'}</code> - Selected product name</li>
                <li>• <code>{'{farmerName}'}</code> - Your farm name</li>
                <li>• <code>{'{season}'}</code> - Current season</li>
                <li>• <code>{'{discount}'}</code> - For promotions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCreator;