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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DollarSign,
  Target,
  Leaf,
  Menu,
  ChevronDown
} from 'lucide-react';

// Import real Firebase admin functions
import {
  getAllUsers,
  verifyFarmer as verifyFarmerFirebase,
  unverifyFarmer as unverifyFarmerFirebase,
  deleteUser as deleteUserFirebase,
  getSystemStats,
  getRecentActivity,
  logAdminActivity
} from '../../firebase/admin';

// Import crowdfunding functions
import {
  getAllCampaignsForAdmin,
  updateCampaign,
  deleteCampaign,
  getCampaignStats
} from '../../firebase/crowdfunding';

// Responsive Tab Navigation Component
const ResponsiveAdminTabs = ({ activeTab, setActiveTab, systemStats = {}, campaignStats = {} }) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard overview'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      description: 'User management',
      badge: systemStats.totalUsers
    },
    {
      id: 'verifications',
      label: 'Verifications',
      icon: Shield,
      description: 'Pending approvals',
      badge: systemStats.pendingVerifications,
      badgeVariant: systemStats.pendingVerifications > 0 ? 'destructive' : 'secondary'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: Target,
      description: 'Crowdfunding campaigns',
      badge: campaignStats.totalCampaigns
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'System analytics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System settings'
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <>
      {/* Desktop Tab Navigation - Hidden on mobile */}
      <div className="hidden lg:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-2 ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Badge 
                      variant={tab.badgeVariant || 'secondary'} 
                      className="ml-2 text-xs"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                {currentTab && (
                  <>
                    <currentTab.icon className="w-5 h-5 text-green-600 mr-3" />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">{currentTab.label}</h2>
                      <p className="text-sm text-gray-500">{currentTab.description}</p>
                    </div>
                    {currentTab.badge !== undefined && currentTab.badge > 0 && (
                      <Badge 
                        variant={currentTab.badgeVariant || 'secondary'} 
                        className="ml-2"
                      >
                        {currentTab.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-3">
                    <Menu className="w-4 h-4 mr-2" />
                    Switch
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`cursor-pointer ${isActive ? 'bg-green-50 text-green-700' : ''}`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{tab.label}</span>
                            {tab.badge !== undefined && tab.badge > 0 && (
                              <Badge 
                                variant={tab.badgeVariant || 'secondary'} 
                                className="ml-2 text-xs"
                              >
                                {tab.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

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
  
  // Campaign management state
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');
  const [campaignFilterStatus, setCampaignFilterStatus] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [campaignStats, setCampaignStats] = useState({});

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    loadDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, campaignSearchTerm, campaignFilterStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔥 Loading admin dashboard data...');
      
      const [usersData, statsData, activityData, campaignsData, campaignStatsData] = await Promise.all([
        getAllUsers(),
        getSystemStats(),
        getRecentActivity(10),
        getAllCampaignsForAdmin(), // Changed from getActiveCampaigns(true)
        getCampaignStats()
      ]);
      
      // Debug the campaign data
      console.log('📊 Campaign data received:', campaignsData);
      console.log('📊 Number of campaigns:', campaignsData?.length || 0);
      
      setUsers(usersData);
      setSystemStats(statsData);
      setRecentActivity(activityData);
      setCampaigns(campaignsData);
      setCampaignStats(campaignStatsData);
      
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

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    // Search filter
    if (campaignSearchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(campaignSearchTerm.toLowerCase()) ||
        campaign.farmerName?.toLowerCase().includes(campaignSearchTerm.toLowerCase()) ||
        campaign.farmName?.toLowerCase().includes(campaignSearchTerm.toLowerCase()) ||
        campaign.category?.toLowerCase().includes(campaignSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (campaignFilterStatus !== 'all') {
      if (campaignFilterStatus === 'pending') {
        filtered = filtered.filter(campaign => !campaign.verified && campaign.status === 'active');
      } else if (campaignFilterStatus === 'verified') {
        filtered = filtered.filter(campaign => campaign.verified);
      } else {
        filtered = filtered.filter(campaign => campaign.status === campaignFilterStatus);
      }
    }

    setFilteredCampaigns(filtered);
  };

  const handleVerifyFarmer = async (uid) => {
    try {
      await verifyFarmerFirebase(uid);
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'verify_farmer', { farmerId: uid });
      
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, isVerified: true } : user
      ));
      toast({
        title: "Success",
        description: "Farmer verified successfully"
      });
    } catch (error) {
      console.error('Error verifying farmer:', error);
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
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'unverify_farmer', { farmerId: uid });
      
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, isVerified: false } : user
      ));
      toast({
        title: "Success",
        description: "Farmer verification removed"
      });
    } catch (error) {
      console.error('Error removing verification:', error);
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
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'delete_user', { deletedUserId: uid });
      
      setUsers(prev => prev.filter(user => user.uid !== uid));
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleVerifyCampaign = async (campaignId) => {
    try {
      await updateCampaign(campaignId, { 
        verified: true, 
        featured: true // Make verified campaigns featured by default
      });
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'verify_campaign', { campaignId });
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, verified: true, featured: true } : campaign
      ));
      
      toast({
        title: "Success",
        description: "Campaign verified successfully"
      });
    } catch (error) {
      console.error('Error verifying campaign:', error);
      toast({
        title: "Error",
        description: "Failed to verify campaign",
        variant: "destructive"
      });
    }
  };

  const handleUnverifyCampaign = async (campaignId) => {
    try {
      await updateCampaign(campaignId, { verified: false, featured: false });
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'unverify_campaign', { campaignId });
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, verified: false, featured: false } : campaign
      ));
      
      toast({
        title: "Success",
        description: "Campaign verification removed"
      });
    } catch (error) {
      console.error('Error removing campaign verification:', error);
      toast({
        title: "Error",
        description: "Failed to remove verification",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCampaign(campaignId, userProfile.uid, true); // true = isAdmin
      
      // Log admin activity
      await logAdminActivity(userProfile.uid, 'delete_campaign', { campaignId });
      
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage users, verifications, campaigns, and system settings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={loadDashboardData} className="w-full sm:w-auto">
            🔄 Refresh Data
          </Button>
          <Button variant="outline" onClick={loadDashboardData} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
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
                <p className="text-sm font-medium text-gray-600">Campaign Funds Raised</p>
                <p className="text-3xl font-bold text-purple-600">{campaignStats.totalRaised?.toLocaleString() || 0} PLN</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Tab Navigation */}
      <ResponsiveAdminTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        systemStats={systemStats}
        campaignStats={campaignStats}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Main Content Tabs */}
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
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Verify Campaigns</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
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

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaign Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{campaignStats.totalCampaigns || 0}</p>
                <p className="text-sm text-gray-600">Total Campaigns</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{campaigns.filter(c => c.verified).length}</p>
                <p className="text-sm text-gray-600">Verified Campaigns</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{campaigns.filter(c => !c.verified && c.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Pending Verification</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{campaignStats.totalRaised?.toLocaleString() || 0} PLN</p>
                <p className="text-sm text-gray-600">Total Raised</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="campaignSearch">Search Campaigns</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="campaignSearch"
                      placeholder="Search by title, farmer, farm name, or category..."
                      value={campaignSearchTerm}
                      onChange={(e) => setCampaignSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Status Filter</Label>
                  <Select value={campaignFilterStatus} onValueChange={setCampaignFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      <SelectItem value="pending">Pending Verification</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="funded">Funded</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management ({filteredCampaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campaign</th>
                      <th className="text-left p-2">Farmer</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Progress</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium line-clamp-1">{campaign.title}</p>
                            <p className="text-sm text-gray-500">{campaign.category}</p>
                            <div className="flex gap-1 mt-1">
                              {campaign.verified && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {campaign.featured && (
                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{campaign.farmerName}</p>
                            <p className="text-sm text-gray-500">{campaign.farmName}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge 
                            className={
                              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              campaign.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{campaign.currentAmount?.toLocaleString() || 0} PLN</span>
                              <span>{Math.round(((campaign.currentAmount || 0) / (campaign.goalAmount || 1)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-green-600 h-1 rounded-full"
                                style={{ 
                                  width: `${Math.min(((campaign.currentAmount || 0) / (campaign.goalAmount || 1)) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Goal: {campaign.goalAmount?.toLocaleString()} PLN • {campaign.backerCount || 0} backers
                            </p>
                          </div>
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {formatDate(campaign.createdAt)}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setShowCampaignDetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {!campaign.verified ? (
                              <Button
                                size="sm"
                                onClick={() => handleVerifyCampaign(campaign.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnverifyCampaign(campaign.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Verification Queue */}
          {campaigns.filter(c => !c.verified && c.status === 'active').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Campaign Verification Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns
                    .filter(c => !c.verified && c.status === 'active')
                    .map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{campaign.title}</h3>
                            <p className="text-gray-600 mt-1">{campaign.description}</p>
                            
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Campaign Details</Label>
                                <div className="space-y-1">
                                  <p className="text-sm">
                                    <strong>Category:</strong> {campaign.category}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Goal:</strong> {campaign.goalAmount?.toLocaleString()} PLN
                                  </p>
                                  <p className="text-sm">
                                    <strong>Duration:</strong> {campaign.duration} days
                                  </p>
                                  <p className="text-sm">
                                    <strong>Location:</strong> {campaign.location}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-500">Farmer Information</Label>
                                <div className="space-y-1">
                                  <p className="text-sm">
                                    <strong>Farmer:</strong> {campaign.farmerName}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Farm:</strong> {campaign.farmName}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Current Progress:</strong> {campaign.currentAmount?.toLocaleString() || 0} PLN ({campaign.backerCount || 0} backers)
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {campaign.environmentalImpact && (
                              <div className="mt-3">
                                <Label className="text-xs text-gray-500">Environmental Impact</Label>
                                <p className="text-sm">{campaign.environmentalImpact}</p>
                              </div>
                            )}
                            
                            {campaign.tags && campaign.tags.length > 0 && (
                              <div className="mt-3">
                                <Label className="text-xs text-gray-500">Tags</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {campaign.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleVerifyCampaign(campaign.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify & Feature
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-bold">{campaignStats.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Raised:</span>
                    <span className="font-bold">{campaignStats.averageRaised?.toLocaleString() || 0} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Backers:</span>
                    <span className="font-bold">{campaignStats.totalBackers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funding Rate:</span>
                    <span className="font-bold">{campaignStats.fundingRate || 0}%</span>
                  </div>
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

      {/* Campaign Details Modal */}
      {showCampaignDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-96 overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Details</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowCampaignDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Campaign Header */}
                <div>
                  <h2 className="text-2xl font-bold">{selectedCampaign.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedCampaign.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{selectedCampaign.category}</Badge>
                    <Badge className={selectedCampaign.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {selectedCampaign.verified ? "Verified" : "Pending"}
                    </Badge>
                    {selectedCampaign.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Campaign Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedCampaign.currentAmount?.toLocaleString() || 0}</p>
                      <p className="text-sm text-gray-600">PLN Raised</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedCampaign.goalAmount?.toLocaleString() || 0}</p>
                      <p className="text-sm text-gray-600">PLN Goal</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedCampaign.backerCount || 0}</p>
                      <p className="text-sm text-gray-600">Backers</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((selectedCampaign.currentAmount || 0) / (selectedCampaign.goalAmount || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ 
                        width: `${Math.min(((selectedCampaign.currentAmount || 0) / (selectedCampaign.goalAmount || 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-4 pt-4 border-t">
                  {!selectedCampaign.verified ? (
                    <Button
                      onClick={() => {
                        handleVerifyCampaign(selectedCampaign.id);
                        setShowCampaignDetails(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Feature Campaign
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleUnverifyCampaign(selectedCampaign.id);
                        setShowCampaignDetails(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Remove Verification
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteCampaign(selectedCampaign.id);
                      setShowCampaignDetails(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Campaign
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