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
  Shield,
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

const CampaignCard = ({ campaign }) => {
  const progressPercentage = getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount || 1);
  const isSaved = savedCampaigns.has(campaign.id);
  
  // Calculate days left from endDate
  const daysLeft = campaign.endDate ? 
    Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  const hasImage = campaign.imageUrl || campaign.images?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {hasImage ? (
          <img
            src={campaign.imageUrl || campaign.images?.[0]}
            alt={campaign.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Replace with placeholder on error
              e.target.style.display = 'none';
              const placeholder = e.target.parentNode.querySelector('.image-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* No image placeholder */}
        <div 
          className={`w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 ${hasImage ? 'hidden' : 'flex'} image-placeholder`}
          style={hasImage ? { display: 'none' } : { display: 'flex' }}
        >
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-sm font-medium">No image</p>
          </div>
        </div>

        {/* Badges overlay */}
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
            {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Badge variant="secondary">{campaign.category}</Badge>
              {campaign.verified && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">{campaign.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-3 mt-1">{campaign.description}</p>
          </div>

          {/* Farmer Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{campaign.farmerName}</span>
            {campaign.location && (
              <>
                <MapPin className="w-4 h-4 ml-2" />
                <span>{campaign.location}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{progressPercentage.toFixed(0)}% funded</span>
              <span className="text-gray-600">{daysLeft} days left</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold">{(campaign.currentAmount || 0).toLocaleString()} PLN</span>
              <span className="text-gray-600">of {campaign.goalAmount.toLocaleString()} PLN</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{campaign.backerCount || 0} backers</span>
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="flex gap-1">
                  {campaign.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                  {campaign.tags.length > 2 && <span>+{campaign.tags.length - 2}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Single button - only View Details */}
          <Button
            className="w-full"
            onClick={() => window.location.href = `/campaigns/${campaign.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
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
      
    </div>
  );
};

export default CampaignViewer;