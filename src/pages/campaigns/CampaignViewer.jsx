// src/pages/campaigns/CampaignViewer.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft,
  Search,
  DollarSign,
  Target,
  Users,
  Heart,
  Share,
  MapPin,
  Leaf,
  Clock,
  CheckCircle,
  Star,
  User,
  Eye,
  Bookmark,
  BookmarkCheck,
  XCircle
} from 'lucide-react';

const CampaignViewer = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [savedCampaigns, setSavedCampaigns] = useState(new Set());
  const [showBackingModal, setShowBackingModal] = useState(false);
  const [selectedCampaignForBacking, setSelectedCampaignForBacking] = useState(null);
  const [backingAmount, setBackingAmount] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);

  const categories = [
    'All Categories',
    'Sustainable Agriculture',
    'Organic Farming',
    'Equipment & Infrastructure',
    'Crop Production',
    'Livestock',
    'Processing & Packaging',
    'Community Gardens',
    'Research & Innovation',
    'Educational Programs',
    'Market Access'
  ];

  useEffect(() => {
    loadCampaigns();
    // Load user's saved campaigns if logged in
    if (userProfile?.uid) {
      loadUserSavedCampaigns();
    }
  }, [userProfile]);

  useEffect(() => {
    filterAndSortCampaigns();
  }, [campaigns, searchTerm, selectedCategory, sortBy]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // Import and use real Firebase function
      const { getActiveCampaigns } = await import('../../firebase/crowdfunding');
      
      // Load actual campaigns from Firebase
      const campaignsData = await getActiveCampaigns();
      setCampaigns(campaignsData);
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

  const loadUserSavedCampaigns = async () => {
    try {
      // TODO: Load user's saved campaigns from Firebase
      // const saved = await getUserSavedCampaigns(userProfile.uid);
      // setSavedCampaigns(new Set(saved));
    } catch (error) {
      console.error('Error loading saved campaigns:', error);
    }
  };

const filterAndSortCampaigns = () => {
  let filtered = campaigns.filter(campaign => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           campaign.category === selectedCategory;
    
    // Only show campaigns that are active AND verified
    return matchesSearch && matchesCategory && 
           campaign.status === 'active' && 
           campaign.verified === true;
  });

  // Sort campaigns
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'ending_soon': {
        // Calculate days left from endDate
        const aDaysLeft = a.endDate ? Math.ceil((new Date(a.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
        const bDaysLeft = b.endDate ? Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
        return aDaysLeft - bDaysLeft;
      }
      case 'most_backed':
        return (b.backerCount || 0) - (a.backerCount || 0);
      case 'most_funded': {
        const aProgress = (a.currentAmount || 0) / (a.goalAmount || 1);
        const bProgress = (b.currentAmount || 0) / (b.goalAmount || 1);
        return bProgress - aProgress;
      }
      default:
        return 0;
    }
  });

  // Featured campaigns first
  filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  setFilteredCampaigns(filtered);
};

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const toggleSaveCampaign = (campaignId) => {
    // Check if user is logged in
    if (!userProfile) {
      toast({
        title: "Login Required",
        description: "Please log in to save campaigns",
        variant: "destructive"
      });
      return;
    }

    const newSavedCampaigns = new Set(savedCampaigns);
    if (newSavedCampaigns.has(campaignId)) {
      newSavedCampaigns.delete(campaignId);
      toast({
        title: "Campaign removed",
        description: "Campaign removed from your saved list",
      });
    } else {
      newSavedCampaigns.add(campaignId);
      toast({
        title: "Campaign saved",
        description: "Campaign added to your saved list",
      });
    }
    setSavedCampaigns(newSavedCampaigns);
    
    // TODO: Save to Firebase with userProfile.uid
    // await saveCampaignToUser(userProfile.uid, campaignId, isSaved);
  };

  const handleBackCampaign = (campaign) => {
    // Check if user is logged in before showing backing modal
    if (!userProfile) {
      toast({
        title: "Login Required",
        description: "Please log in to back campaigns",
        variant: "destructive"
      });
      return;
    }

    setSelectedCampaignForBacking(campaign);
    setShowBackingModal(true);
    setBackingAmount('');
    setSelectedReward(null);
  };

  const submitBacking = async () => {
    try {
      if (!userProfile) {
        toast({
          title: "Login Required",
          description: "Please log in to back campaigns",
          variant: "destructive"
        });
        return;
      }

      if (!backingAmount || parseFloat(backingAmount) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid backing amount",
          variant: "destructive"
        });
        return;
      }

      // Import and call the actual backing function
      const { backCampaign } = await import('../../firebase/crowdfunding');
      
      await backCampaign(
        selectedCampaignForBacking.id, 
        userProfile.uid, 
        parseFloat(backingAmount),
        selectedReward
      );

      toast({
        title: "Backing Successful!",
        description: `You've backed ${selectedCampaignForBacking.title} with ${backingAmount} PLN`,
      });

      setShowBackingModal(false);
      setSelectedCampaignForBacking(null);
      setBackingAmount('');
      setSelectedReward(null);

      // Refresh campaigns to show updated data
      loadCampaigns();

    } catch (error) {
      console.error('Error backing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to back campaign",
        variant: "destructive"
      });
    }
  };

  const CampaignCard = ({ campaign }) => {
    const progressPercentage = getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount || 1);
    const isSaved = savedCampaigns.has(campaign.id);
    
    // Calculate days left from endDate
    const daysLeft = campaign.endDate ? 
      Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={campaign.imageUrl || '/api/placeholder/400/250'}
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {campaign.featured && (
              <Badge className="bg-yellow-500 text-yellow-900">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSaveCampaign(campaign.id)}
              className="bg-white/90 hover:bg-white"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2">
                {campaign.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {campaign.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{campaign.farmerName || 'Unknown Farmer'}</span>
              {campaign.location && (
                <>
                  <span>•</span>
                  <MapPin className="w-4 h-4" />
                  <span>{campaign.location}</span>
                </>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  {(campaign.currentAmount || 0).toLocaleString()} PLN raised
                </span>
                <span className="text-sm text-gray-500">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Goal: {(campaign.goalAmount || 0).toLocaleString()} PLN
                </span>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {campaign.backerCount || 0} backers
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {daysLeft} days left
              </span>
            </div>

            {campaign.tags && campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {campaign.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {campaign.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{campaign.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => window.location.href = `/campaigns/${campaign.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBackCampaign(campaign)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Back Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) { 
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Explorer</h1>
          <p className="text-gray-600 mt-1">
            Discover and support innovative farming projects
            {userProfile && (
              <span className="ml-2 text-green-600">
                • Welcome back, {userProfile.displayName || userProfile.email}!
              </span>
            )}
          </p>
        </div>
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <div className="text-sm text-gray-600">Active Campaigns</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">PLN Raised</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.backerCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Backers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {campaigns.length > 0 ? 
                Math.round(campaigns.reduce((sum, c) => sum + ((c.currentAmount || 0) / (c.goalAmount || 1) * 100), 0) / campaigns.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                  <SelectItem value="most_backed">Most Backers</SelectItem>
                  <SelectItem value="most_funded">Highest Funded %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSortBy('newest');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Grid */}
      <div>
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters to find more campaigns.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-8 text-center">
          <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Support Sustainable Farming</h3>
          <p className="text-gray-600 mb-4">
            Every contribution helps farmers innovate and create a more sustainable future for agriculture.
          </p>
          <div className="flex gap-4 justify-center">
            <Button>Browse More Campaigns</Button>
            <Button variant="outline">
              <Share className="w-4 h-4 mr-2" />
              Share with Friends
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Backing Modal */}
      {showBackingModal && selectedCampaignForBacking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Back This Project</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowBackingModal(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Info */}
              <div>
                <h3 className="font-semibold text-lg">{selectedCampaignForBacking.title}</h3>
                <p className="text-gray-600">{selectedCampaignForBacking.description}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Current Progress</Label>
                    <p className="font-semibold">
                      {selectedCampaignForBacking.currentAmount.toLocaleString()} PLN / {selectedCampaignForBacking.goalAmount.toLocaleString()} PLN
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Days Left</Label>
                    <p className="font-semibold">{selectedCampaignForBacking.daysLeft} days</p>
                  </div>
                </div>
              </div>

              {/* Backing Amount */}
              <div>
                <Label htmlFor="backing-amount">Your Contribution (PLN)</Label>
                <Input
                  id="backing-amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={backingAmount}
                  onChange={(e) => setBackingAmount(e.target.value)}
                  min="1"
                />
              </div>

              {/* Rewards */}
              {selectedCampaignForBacking.rewards && selectedCampaignForBacking.rewards.length > 0 && (
                <div>
                  <Label>Choose a reward (optional)</Label>
                  <div className="space-y-2 mt-2">
                    {selectedCampaignForBacking.rewards.map((reward, index) => {
                      const isSelected = selectedReward?.amount === reward.amount;
                      const canAfford = backingAmount && parseFloat(backingAmount) >= reward.amount;
                      
                      return (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected ? 'border-green-600 bg-green-50' : 
                            canAfford ? 'border-gray-300 hover:border-green-300' : 
                            'border-gray-200 opacity-50'
                          }`}
                          onClick={() => {
                            if (canAfford) {
                              setSelectedReward(isSelected ? null : reward);
                              if (!isSelected && (!backingAmount || parseFloat(backingAmount) < reward.amount)) {
                                setBackingAmount(reward.amount.toString());
                              }
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{reward.title}</p>
                                {isSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Minimum pledge: {reward.amount} PLN
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {reward.backers} backers
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{reward.amount} PLN</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Your contribution:</span>
                  <span className="text-xl font-bold text-green-600">{backingAmount || '0'} PLN</span>
                </div>
                {selectedReward && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Reward:</span>
                    <span className="text-sm font-medium">{selectedReward.title}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBackingModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitBacking}
                  disabled={!backingAmount || parseFloat(backingAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Back This Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CampaignViewer;