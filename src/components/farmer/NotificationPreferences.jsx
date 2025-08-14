// src/components/farmer/NotificationPreferences.jsx
// Notification preferences and automation settings for farmers

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Clock, 
  Users, 
  Package, 
  Mail, 
  Smartphone,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { updateUserProfile } from '../../firebase/users';
import { useAuth } from '../../context/AuthContext';

export default function NotificationPreferences() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  
  // Default preferences
  const defaultPreferences = {
    autoNotifications: {
      lowStock: {
        enabled: true,
        threshold: 10,
        message: 'Your product "{productName}" is running low on stock. Only {stockQuantity} {unit} remaining.',
        priority: 'high'
      },
      outOfStock: {
        enabled: true,
        message: 'Your product "{productName}" is now out of stock. Consider restocking soon.',
        priority: 'urgent'
      },
      newOrder: {
        enabled: true,
        message: 'You have received a new order from {customerName} for {productName}.',
        priority: 'high'
      },
      seasonStart: {
        enabled: true,
        daysBeforeStart: 7,
        message: 'The growing season for {productName} is starting in {daysRemaining} days.',
        priority: 'medium'
      },
      seasonEnd: {
        enabled: true,
        daysBeforeEnd: 14,
        message: 'The season for {productName} is ending in {daysRemaining} days. Limited availability remaining.',
        priority: 'medium'
      },
      batchExpiring: {
        enabled: true,
        daysBeforeExpiry: 3,
        message: 'Batch #{batchId} of {productName} expires in {daysRemaining} days.',
        priority: 'high'
      }
    },
    channels: {
      inApp: true,
      email: false,
      sms: false
    },
    timing: {
      businessHoursOnly: true,
      startTime: '08:00',
      endTime: '18:00',
      timezone: 'Europe/Warsaw',
      weekendsEnabled: false
    },
    targeting: {
      allCustomers: true,
      recentCustomersOnly: false,
      recentCustomersDays: 30,
      minOrderValue: 0,
      loyalCustomersOnly: false
    }
  };

  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    if (userProfile?.notificationPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...userProfile.notificationPreferences
      }));
    }
  }, [userProfile]);

  const updatePreferences = (section, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateAutoNotification = (type, field, value) => {
    setPreferences(prev => ({
      ...prev,
      autoNotifications: {
        ...prev.autoNotifications,
        [type]: {
          ...prev.autoNotifications[type],
          [field]: value
        }
      }
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await updateUserProfile(currentUser.uid, { notificationPreferences: preferences });
      await refreshUserProfile();
      toast({ title: "Success", description: "Notification preferences saved successfully" });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({ title: "Error", description: "Failed to save preferences. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600">Configure automatic notifications and delivery settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset to Defaults
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="automatic" className="w-full">
        <TabsList>
          <TabsTrigger value="automatic">Automatic Notifications</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Settings</TabsTrigger>
          <TabsTrigger value="targeting">Customer Targeting</TabsTrigger>
          <TabsTrigger value="timing">Timing & Schedule</TabsTrigger>
        </TabsList>

        {/* AUTOMATIC NOTIFICATIONS */}
        <TabsContent value="automatic" className="space-y-4">
          {Object.entries(preferences.autoNotifications).map(([key, config]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</CardTitle>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateAutoNotification(key, 'enabled', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.threshold !== undefined && (
                  <div>
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      value={config.threshold}
                      onChange={(e) => updateAutoNotification(key, 'threshold', parseInt(e.target.value))}
                      className="w-24 mt-1"
                      disabled={!config.enabled}
                    />
                  </div>
                )}
                {config.daysBeforeStart !== undefined && (
                  <div>
                    <Label>Days Before Start</Label>
                    <Input
                      type="number"
                      value={config.daysBeforeStart}
                      onChange={(e) => updateAutoNotification(key, 'daysBeforeStart', parseInt(e.target.value))}
                      className="w-24 mt-1"
                      disabled={!config.enabled}
                    />
                  </div>
                )}
                {config.daysBeforeEnd !== undefined && (
                  <div>
                    <Label>Days Before End</Label>
                    <Input
                      type="number"
                      value={config.daysBeforeEnd}
                      onChange={(e) => updateAutoNotification(key, 'daysBeforeEnd', parseInt(e.target.value))}
                      className="w-24 mt-1"
                      disabled={!config.enabled}
                    />
                  </div>
                )}
                {config.daysBeforeExpiry !== undefined && (
                  <div>
                    <Label>Days Before Expiry</Label>
                    <Input
                      type="number"
                      value={config.daysBeforeExpiry}
                      onChange={(e) => updateAutoNotification(key, 'daysBeforeExpiry', parseInt(e.target.value))}
                      className="w-24 mt-1"
                      disabled={!config.enabled}
                    />
                  </div>
                )}
                <div>
                  <Label>Message Template</Label>
                  <Textarea
                    value={config.message}
                    onChange={(e) => updateAutoNotification(key, 'message', e.target.value)}
                    rows={2}
                    disabled={!config.enabled}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={config.priority}
                    onValueChange={(value) => updateAutoNotification(key, 'priority', value)}
                    disabled={!config.enabled}
                  >
                    <SelectTrigger className="w-32 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* DELIVERY SETTINGS */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Delivery Channels</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['inApp', 'email', 'sms'].map((channel) => (
                <div key={channel} className="flex items-center justify-between">
                  <p className="capitalize">{channel} Notifications</p>
                  <Switch
                    checked={preferences.channels[channel]}
                    onCheckedChange={(checked) => updatePreferences('channels', channel, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMER TARGETING */}
        <TabsContent value="targeting" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Customer Targeting</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p>All Customers</p>
                <Switch
                  checked={preferences.targeting.allCustomers}
                  onCheckedChange={(checked) => updatePreferences('targeting', 'allCustomers', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <p>Recent Customers Only</p>
                <Switch
                  checked={preferences.targeting.recentCustomersOnly}
                  onCheckedChange={(checked) => updatePreferences('targeting', 'recentCustomersOnly', checked)}
                  disabled={preferences.targeting.allCustomers}
                />
              </div>
              {preferences.targeting.recentCustomersOnly && !preferences.targeting.allCustomers && (
                <div>
                  <Label>Days</Label>
                  <Input
                    type="number"
                    value={preferences.targeting.recentCustomersDays}
                    onChange={(e) => updatePreferences('targeting', 'recentCustomersDays', parseInt(e.target.value))}
                    className="w-24 mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Minimum Order Value</Label>
                <Input
                  type="number"
                  value={preferences.targeting.minOrderValue}
                  onChange={(e) => updatePreferences('targeting', 'minOrderValue', parseFloat(e.target.value) || 0)}
                  className="w-32 mt-1"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-between">
                <p>Loyal Customers Only</p>
                <Switch
                  checked={preferences.targeting.loyalCustomersOnly}
                  onCheckedChange={(checked) => updatePreferences('targeting', 'loyalCustomersOnly', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMING & SCHEDULE */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Timing & Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p>Business Hours Only</p>
                <Switch
                  checked={preferences.timing.businessHoursOnly}
                  onCheckedChange={(checked) => updatePreferences('timing', 'businessHoursOnly', checked)}
                />
              </div>
              {preferences.timing.businessHoursOnly && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.timing.startTime}
                      onChange={(e) => updatePreferences('timing', 'startTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={preferences.timing.endTime}
                      onChange={(e) => updatePreferences('timing', 'endTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Timezone</Label>
                <Select
                  value={preferences.timing.timezone}
                  onValueChange={(value) => updatePreferences('timing', 'timezone', value)}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Warsaw">Europe/Warsaw (CET)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <p>Enable Weekend Notifications</p>
                <Switch
                  checked={preferences.timing.weekendsEnabled}
                  onCheckedChange={(checked) => updatePreferences('timing', 'weekendsEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
