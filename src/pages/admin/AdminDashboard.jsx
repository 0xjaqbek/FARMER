// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  MessageSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Globe,
  Calendar,
  BarChart3,
  Settings,
  Mail,
  Phone,
  MapPin,
  Building,
  Star,
  DollarSign
} from 'lucide-react';

// Import real Firebase admin functions
import {
  getAllUsers,
  verifyFarmer as verifyFarmerFirebase,
  unverifyFarmer as unverifyFarmerFirebase,
  deleteUser as deleteUserFirebase,
  getSystemStats,
  getRecentActivity
} from '../../firebase/admin';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    loadDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, activityData] = await Promise.all([
        getAllUsers(),
        getSystemStats(),
        getRecentActivity()
      ]);
      
      setUsers(usersData);
      setSystemStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.farmInfo?.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'verified') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (filterStatus === 'unverified') {
        filtered = filtered.filter(user => !user.isVerified);
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(user => user.role === 'rolnik' && !user.isVerified);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleVerifyFarmer = async (uid) => {
    try {
      await verifyFarmerFirebase(uid);
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, isVerified: true } : user
      ));
      toast({
        title: "Success",
        description: "Farmer verified successfully"
      });
    } catch  {
      toast({
        title: "Error",
        description: "Failed to verify farmer",
        variant: "destructive"
      });
    }
  };

  const handleUnverifyFarmer = async (uid) => {
    try {
      await unverifyFarmerFirebase(uid);
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, isVerified: false } : user
      ));
      toast({
        title: "Success",
        description: "Farmer verification removed"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove verification",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUserFirebase(uid);
      setUsers(prev => prev.filter(user => user.uid !== uid));
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'rolnik':
      case 'farmer':
        return 'bg-green-100 text-green-800';
      case 'klient':
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, verifications, and system settings</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{systemStats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Farmers</p>
                <p className="text-3xl font-bold text-green-600">{systemStats.verifiedFarmers}</p>
                <p className="text-xs text-gray-500">of {systemStats.totalFarmers} farmers</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-3xl font-bold text-yellow-600">{systemStats.pendingVerifications}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">{systemStats.totalRevenue?.toLocaleString()} PLN</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Verify Farmers</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Mail className="h-6 w-6" />
                    <span className="text-sm">Send Notifications</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Export Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or farm name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Role</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="rolnik">Farmers</SelectItem>
                      <SelectItem value="klient">Customers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Joined</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.farmInfo?.farmName && (
                              <p className="text-xs text-green-600">{user.farmInfo.farmName}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role === 'rolnik' ? 'Farmer' : user.role === 'klient' ? 'Customer' : 'Admin'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(user.isVerified)}>
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {user.role === 'rolnik' && (
                              <>
                                {!user.isVerified ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleVerifyFarmer(user.uid)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnverifyFarmer(user.uid)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.uid)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Farmer Verification Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers
                  .filter(user => user.role === 'rolnik' && !user.isVerified)
                  .map((farmer) => (
                    <div key={farmer.uid} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{farmer.farmInfo?.farmName || `${farmer.firstName} ${farmer.lastName}`}</h3>
                          <p className="text-sm text-gray-600">{farmer.email}</p>
                          
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-gray-500">Contact</Label>
                              <div className="space-y-1">
                                {farmer.phone && (
                                  <p className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3" />
                                    {farmer.phone}
                                  </p>
                                )}
                                {farmer.address && (
                                  <p className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-3 w-3" />
                                    {farmer.address.city}, {farmer.address.state}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Business Info</Label>
                              <div className="space-y-1">
                                {farmer.farmInfo?.businessInfo?.registrationNumber && (
                                  <p className="flex items-center gap-2 text-sm">
                                    <Building className="h-3 w-3" />
                                    {farmer.farmInfo.businessInfo.registrationNumber}
                                  </p>
                                )}
                                {farmer.farmInfo?.businessInfo?.taxId && (
                                  <p className="text-sm">Tax ID: {farmer.farmInfo.businessInfo.taxId}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {farmer.farmInfo?.description && (
                            <div className="mt-3">
                              <Label className="text-xs text-gray-500">Description</Label>
                              <p className="text-sm">{farmer.farmInfo.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleVerifyFarmer(farmer.uid)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteUser(farmer.uid)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {filteredUsers.filter(user => user.role === 'rolnik' && !user.isVerified).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No pending farmer verifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Chart component would go here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Revenue chart would go here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Automatic Verification</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Manual verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual verification</SelectItem>
                        <SelectItem value="auto">Automatic verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Registration Approval</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Immediate approval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate approval</SelectItem>
                        <SelectItem value="review">Requires review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Details</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
                
                {selectedUser.farmInfo && (
                  <div>
                    <h4 className="font-medium">Farm Information</h4>
                    <p><strong>Farm Name:</strong> {selectedUser.farmInfo.farmName}</p>
                    <p><strong>Description:</strong> {selectedUser.farmInfo.description}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {selectedUser.role === 'rolnik' && (
                    <>
                      {!selectedUser.isVerified ? (
                        <Button
                          onClick={() => {
                            handleVerifyFarmer(selectedUser.uid);
                            setShowUserDetails(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify Farmer
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleUnverifyFarmer(selectedUser.uid);
                            setShowUserDetails(false);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Remove Verification
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteUser(selectedUser.uid);
                      setShowUserDetails(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;