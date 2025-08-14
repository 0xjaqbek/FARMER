// src/components/notifications/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Package, 
  MessageCircle, 
  AlertTriangle,
  Star,
  Calendar,
  Save,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService } from '../../services/notificationService';

const NotificationSettings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      types: {
        new_order: true,
        order_confirmed: true,
        order_shipped: true,
        order_delivered: true,
        new_message: true,
        low_stock: true,
        new_review: true,
        season_starting: false,
        season_ending: false,
        batch_expiring: true
      }
    },
    sms: {
      enabled: false,
      types: {
        new_order: false,
        order_confirmed: false,
        order_shipped: false,
        order_delivered: false,
        new_message: false,
        low_stock: true,
        new_review: false,
        season_starting: false,
        season_ending: false,
        batch_expiring: true
      }
    },
    inApp: {
      enabled: true,
      types: {
        new_order: true,
        order_confirmed: true,
        order_shipped: true,
        order_delivered: true,
        new_message: true,
        low_stock: true,
        new_review: true,
        season_starting: true,
        season_ending: true,
        batch_expiring: true
      }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPreferences = await NotificationService.getNotificationPreferences(currentUser.uid);
      if (userPreferences) {
        setPreferences(userPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await NotificationService.updateNotificationPreferences(currentUser.uid, preferences);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Notification preferences saved successfully"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      email: {
        enabled: true,
        types: {
          new_order: true,
          order_confirmed: true,
          order_shipped: true,
          order_delivered: true,
          new_message: true,
          low_stock: true,
          new_review: true,
          season_starting: false,
          season_ending: false,
          batch_expiring: true
        }
      },
      sms: {
        enabled: false,
        types: {
          new_order: false,
          order_confirmed: false,
          order_shipped: false,
          order_delivered: false,
          new_message: false,
          low_stock: true,
          new_review: false,
          season_starting: false,
          season_ending: false,
          batch_expiring: true
        }
      },
      inApp: {
        enabled: true,
        types: {
          new_order: true,
          order_confirmed: true,
          order_shipped: true,
          order_delivered: true,
          new_message: true,
          low_stock: true,
          new_review: true,
          season_starting: true,
          season_ending: true,
          batch_expiring: true
        }
      }
    });
    setHasChanges(true);
  };

  const updateChannelEnabled = (channel, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled
      }
    }));
    setHasChanges(true);
  };

  const updateTypePreference = (channel, type, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        types: {
          ...prev[channel].types,
          [type]: enabled
        }
      }
    }));
    setHasChanges(true);
  };

  const notificationTypes = [
    {
      key: 'new_order',
      label: 'New Orders',
      description: 'When you receive a new order',
      icon: <Package className="h-4 w-4" />,
      category: 'Orders'
    },
    {
      key: 'order_confirmed',
      label: 'Order Confirmed',
      description: 'When an order is confirmed',
      icon: <Package className="h-4 w-4" />,
      category: 'Orders'
    },
    {
      key: 'order_shipped',
      label: 'Order Shipped',
      description: 'When an order is shipped',
      icon: <Package className="h-4 w-4" />,
      category: 'Orders'
    },
    {
      key: 'order_delivered',
      label: 'Order Delivered',
      description: 'When an order is delivered',
      icon: <Package className="h-4 w-4" />,
      category: 'Orders'
    },
    {
      key: 'new_message',
      label: 'New Messages',
      description: 'When you receive a new message',
      icon: <MessageCircle className="h-4 w-4" />,
      category: 'Communication'
    },
    {
      key: 'new_review',
      label: 'New Reviews',
      description: 'When you receive a new review',
      icon: <Star className="h-4 w-4" />,
      category: 'Reviews'
    },
    {
      key: 'low_stock',
      label: 'Low Stock Alerts',
      description: 'When product stock is running low',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'Inventory'
    },
    {
      key: 'batch_expiring',
      label: 'Batch Expiring',
      description: 'When product batches are about to expire',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'Inventory'
    },
    {
      key: 'season_starting',
      label: 'Season Starting',
      description: 'When a product season is about to start',
      icon: <Calendar className="h-4 w-4" />,
      category: 'Seasonal'
    },
    {
      key: 'season_ending',
      label: 'Season Ending',
      description: 'When a product season is about to end',
      icon: <Calendar className="h-4 w-4" />,
      category: 'Seasonal'
    }
  ];

  const channels = [
    {
      key: 'inApp',
      label: 'In-App Notifications',
      description: 'Notifications shown within the application',
      icon: <Bell className="h-5 w-5" />
    },
    {
      key: 'email',
      label: 'Email Notifications',
      description: 'Notifications sent to your email address',
      icon: <Mail className="h-5 w-5" />
    },
    {
      key: 'sms',
      label: 'SMS Notifications',
      description: 'Text messages sent to your phone',
      icon: <Smartphone className="h-5 w-5" />
    }
  ];

  const categories = [...new Set(notificationTypes.map(type => type.category))];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading notification settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              {hasChanges && (
                <Button onClick={savePreferences} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click "Save Changes" to apply your preferences.
              </AlertDescription>
            </Alert>
          )}

          {/* Channel Settings */}
          <div className="space-y-4">
            <h3 className="text-base font-medium">Notification Channels</h3>
            <div className="grid gap-4">
              {channels.map((channel) => (
                <div key={channel.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {channel.icon}
                    <div>
                      <Label className="text-sm font-medium">{channel.label}</Label>
                      <p className="text-xs text-gray-500">{channel.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[channel.key]?.enabled || false}
                    onCheckedChange={(checked) => updateChannelEnabled(channel.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notification Types by Category */}
          <div className="space-y-6">
            <h3 className="text-base font-medium">Notification Types</h3>
            
            {categories.map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                <div className="space-y-2">
                  {notificationTypes
                    .filter(type => type.category === category)
                    .map((type) => (
                      <div key={type.key} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {type.icon}
                            <Label className="text-sm font-medium">{type.label}</Label>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{type.description}</p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {channels.map((channel) => (
                            <div key={channel.key} className="flex items-center space-x-2">
                              <Switch
                                checked={
                                  preferences[channel.key]?.enabled && 
                                  (preferences[channel.key]?.types?.[type.key] || false)
                                }
                                onCheckedChange={(checked) => updateTypePreference(channel.key, type.key, checked)}
                                disabled={!preferences[channel.key]?.enabled}
                                size="sm"
                              />
                              <Label className="text-xs text-gray-600">
                                {channel.key === 'inApp' ? 'App' : channel.key === 'email' ? 'Email' : 'SMS'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;