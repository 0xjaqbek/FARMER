// src/pages/campaigns/CampaignManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Settings,
  Share,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Heart,
  ArrowLeft,
  Copy,
  ExternalLink,
  Rocket
} from 'lucide-react';

// Import Firebase functions
import {
  getCampaignsByFarmer,
  deleteCampaign,
  launchCampaign,
  getCampaignBackings
} from '../../firebase/crowdfunding';

const CampaignManager = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [campaignBackings, setCampaignBackings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is farmer
  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';

  useEffect(() => {
    if (isFarmer && userProfile?.uid) {
      loadCampaigns();
    }
  }, [isFarmer, userProfile]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const farmerCampaigns = await getCampaignsByFarmer(userProfile.uid);
      setCampaigns(farmerCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async (campaignId) => {
    try {
      await launchCampaign(campaignId, 30); // 30 days duration
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'active', startDate: new Date() }
          : campaign
      ));
      toast({
        title: "Success",
        description: "Campaign launched successfully!"
      });
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast({
        title: "Error",
        description: "Failed to launch campaign",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCampaign(campaignId, userProfile.uid);
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      toast({
        title: "Success",
        description: "Campaign deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const loadCampaignDetails = async (campaign) => {
    try {
      setSelectedCampaign(campaign);
      
      // Load campaign backings
      if (campaign.status !== 'draft') {
        const backings = await getCampaignBackings(campaign.id);
        setCampaignBackings(backings);
      }
      
      setShowCampaignDetails(true);
    } catch (error) {
      console.error('Error loading campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'funded':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
    const fundedCampaigns = campaigns.filter(c => c.status === 'funded').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0);
    const totalBackers = campaigns.reduce((sum, c) => sum + (c.backerCount || 0), 0);
    
    return {
      totalCampaigns,
      activeCampaigns,
      draftCampaigns,
      fundedCampaigns,
      totalRaised,
      totalBackers
    };
  };

  const CampaignCard = ({ campaign }) => {
    const progressPercentage = getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount || 1);

    const getVerificationBadge = (campaign) => {
      if (campaign.status !== 'draft') return null;
      
      return campaign.verified ? (
        <Badge className="bg-green-100 text-green-800 mb-2">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified - Ready to Launch
        </Badge>
      ) : (
        <Badge variant="secondary" className="mb-2">
          <Clock className="w-3 h-3 mr-1" />
          Awaiting Admin Verification
        </Badge>
      );
    };
        
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {getVerificationBadge(campaign)}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold line-clamp-2">{campaign.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">{campaign.description}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
                {campaign.verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {campaign.featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-600">
                  {(campaign.currentAmount || 0).toLocaleString()} PLN
                </span>
                <span className="text-gray-500">
                  of {(campaign.goalAmount || 0).toLocaleString()} PLN
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {campaign.backerCount || 0} backers
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(campaign.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadCampaignDetails(campaign)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              
              {campaign.status === 'draft' && (
                <>
                  {campaign.verified ? (
                    // Launch button - only active when verified by admin
                    <Button
                      size="sm"
                      onClick={() => handleLaunchCampaign(campaign.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Launch
                    </Button>
                  ) : (
                    // Disabled button with verification status
                    <Button
                      size="sm"
                      disabled
                      className="bg-gray-400 cursor-not-allowed"
                      title="Campaign must be verified by admin before launch"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending Verification
                    </Button>
                  )}
                </>
              )}

              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/campaigns/edit/${campaign.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              {campaign.status === 'draft' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isFarmer) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only farmers can access campaign management.
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
          <p className="text-gray-600">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-gray-600">Manage your crowdfunding campaigns</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/profile'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <Button
            onClick={() => window.location.href = '/campaigns/create'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.totalCampaigns}</p>
            <p className="text-sm text-gray-600">Total Campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
            <p className="text-sm text-gray-600">Active Campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.totalRaised.toLocaleString()}</p>
            <p className="text-sm text-gray-600">PLN Raised</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.totalBackers}</p>
            <p className="text-sm text-gray-600">Total Backers</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.activeCampaigns})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({stats.draftCampaigns})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first crowdfunding campaign to start raising funds for your farming project.
                </p>
                <Button
                  onClick={() => window.location.href = '/campaigns/create'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns
              .filter(campaign => campaign.status === 'active')
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </div>
          
          {campaigns.filter(c => c.status === 'active').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active campaigns</h3>
                <p className="text-gray-600">Launch a draft campaign to start raising funds.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns
              .filter(campaign => campaign.status === 'draft')
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
          </div>
          
          {campaigns.filter(c => c.status === 'draft').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No draft campaigns</h3>
                <p className="text-gray-600">All your campaigns are already published.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Performance chart would go here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{campaign.title}</span>
                        <span>{Math.round(getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount || 1))}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount || 1)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Campaign Details Modal */}
      {showCampaignDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-96 overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedCampaign.title}</CardTitle>
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
                {/* Campaign Status */}
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedCampaign.status)}>
                    {selectedCampaign.status}
                  </Badge>
                  {selectedCampaign.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {selectedCampaign.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-xl font-bold">{(selectedCampaign.currentAmount || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">PLN Raised</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-xl font-bold">{(selectedCampaign.goalAmount || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">PLN Goal</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-xl font-bold">{selectedCampaign.backerCount || 0}</p>
                      <p className="text-sm text-gray-600">Backers</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Backers */}
                {campaignBackings.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Backers</h3>
                    <div className="space-y-2">
                      {campaignBackings.slice(0, 5).map((backing) => (
                        <div key={backing.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">Anonymous Backer</p>
                            <p className="text-sm text-gray-500">{formatDate(backing.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{backing.amount} PLN</p>
                            {backing.rewardTier && (
                              <p className="text-xs text-gray-500">{backing.rewardTier.title}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/campaigns/edit/${selectedCampaign.id}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Campaign
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/campaigns/${selectedCampaign.id}`);
                      toast({
                        title: "Link copied",
                        description: "Campaign link copied to clipboard"
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/campaigns/${selectedCampaign.id}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Public Page
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

export default CampaignManager;