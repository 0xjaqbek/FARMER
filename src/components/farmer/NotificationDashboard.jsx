// src/components/farmer/NotificationDashboard.jsx
// Dashboard for farmers to view sent notifications and analytics

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Eye, 
  Users, 
  TrendingUp,
  Calendar,
  Filter,
  Download,
  BarChart3,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationService } from '../../services/notificationService';
import { getOrdersByRolnik } from '../../firebase/orders';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDashboard() {
  const { currentUser, _userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalCustomers: 0,
    recentActivity: []
  });
  
  // Filters
  const [filters, setFilters] = useState({
    dateRange: null,
    type: 'all',
    priority: 'all',
    status: 'all',
    search: ''
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [currentUser, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.uid) return;

      // Get all orders to find customers who received notifications
      const orders = await getOrdersByRolnik(currentUser.uid);
      const customerIds = [...new Set(orders.map(order => order.customerId))];
      
      // Get notification analytics (this would need to be implemented in the backend)
      // For now, we'll simulate this data
      const mockNotifications = generateMockNotifications(customerIds);
      const mockStats = calculateMockStats(mockNotifications, customerIds);
      
      setNotifications(mockNotifications);
      setStats(mockStats);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock notification data for demonstration
  const generateMockNotifications = (customerIds) => {
    const types = ['low_stock', 'season_starting', 'new_product', 'announcement'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['sent', 'delivered', 'read'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `notif_${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      title: `Notification ${i + 1}`,
      message: `This is a sample notification message ${i + 1}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      sentTo: Math.floor(Math.random() * customerIds.length) + 1,
      delivered: Math.floor(Math.random() * customerIds.length) + 1,
      read: Math.floor(Math.random() * customerIds.length) + 1,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      readRate: Math.floor(Math.random() * 100)
    }));
  };

  const calculateMockStats = (notifications, customerIds) => {
    return {
      totalSent: notifications.length,
      totalDelivered: notifications.reduce((sum, n) => sum + n.delivered, 0),
      totalRead: notifications.reduce((sum, n) => sum + n.read, 0),
      totalCustomers: customerIds.length,
      recentActivity: notifications.slice(0, 5).map(n => ({
        type: 'notification_sent',
        title: n.title,
        time: n.createdAt,
        recipients: n.sentTo
      }))
    };
  };

  const getTypeIcon = (type) => {
    const icons = {
      low_stock: '⚠️',
      season_starting: '🌱',
      new_product: '🆕',
      announcement: '📢',
      order_update: '📦',
      review: '⭐'
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
    if (filters.status !== 'all' && notification.status !== filters.status) return false;
    if (filters.search && !notification.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Analytics</h2>
          <p className="text-gray-600">Track your communication with customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDelivered}</p>
                <p className="text-xs text-green-600">98% delivery rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRead}</p>
                <p className="text-xs text-green-600">
                  {Math.round((stats.totalRead / stats.totalDelivered) * 100)}% read rate
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-xs text-blue-600">Total reached</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notifications">All Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-600">{formatDate(activity.time)}</p>
                      </div>
                      <Badge variant="secondary">{activity.recipients} recipients</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Delivery Rate</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Read Rate</span>
                    <span>{Math.round((stats.totalRead / stats.totalDelivered) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((stats.totalRead / stats.totalDelivered) * 100)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Engagement</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Search notifications..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="season_starting">Season Starting</SelectItem>
                    <SelectItem value="new_product">New Product</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="order_update">Order Update</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setFilters({
                  dateRange: null,
                  type: 'all',
                  priority: 'all',
                  status: 'all',
                  search: ''
                })}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Read Rate</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <span className="capitalize text-sm">{notification.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-600 truncate max-w-xs">{notification.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{notification.sentTo}</p>
                          <p className="text-xs text-gray-600">customers</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <Progress value={notification.readRate} className="h-1" />
                          </div>
                          <span className="text-sm">{notification.readRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(notification.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No notifications found matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    notifications.reduce((acc, notif) => {
                      acc[notif.type] = (acc[notif.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(type)}</span>
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / notifications.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    notifications.reduce((acc, notif) => {
                      acc[notif.priority] = (acc[notif.priority] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([priority, count]) => {
                    const percentage = (count / notifications.length) * 100;
                    const colors = {
                      urgent: 'bg-red-500',
                      high: 'bg-orange-500',
                      medium: 'bg-blue-500',
                      low: 'bg-gray-500'
                    };
                    
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors[priority]}`}></div>
                          <span className="capitalize">{priority}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${colors[priority]}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((stats.totalRead / stats.totalDelivered) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Average Read Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{stats.totalCustomers}</p>
                    <p className="text-sm text-gray-600">Active Customers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {(stats.totalSent / 30).toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Avg. Daily Notifications</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tip:</strong> Your highest read rates come from order updates and low stock alerts. 
                      Consider timing seasonal announcements for maximum engagement.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}