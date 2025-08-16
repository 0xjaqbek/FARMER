// src/pages/campaigns/CampaignViewer.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Target,
  Users,
  Heart,
  Share,
  MapPin,
  Leaf,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  User,
  Eye,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  ExternalLink
} from 'lucide-react';

const CampaignViewer = () => {
  const { _userProfile } = useAuth();
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

  // Mock data - replace with Firebase call
  const mockCampaigns = [
    {
      id: '1',
      title: 'Solar-Powered Greenhouse Initiative',
      description: 'Building an eco-friendly greenhouse using renewable energy to grow organic vegetables year-round.',
      category: 'Sustainable Agriculture',
      goalAmount: 15000,
      currentAmount: 8500,
      backerCount: 42,
      daysLeft: 18,
      farmerId: 'farmer1',
      farmerName: 'Jan Kowalski',
      farmName: 'EkoFarm Kowalski',
      location: 'Warszawa, Mazowieckie',
      image: '/api/placeholder/400/250',
      tags: ['solar', 'greenhouse', 'organic', 'sustainable'],
      status: 'active',
      createdAt: new Date('2024-01-15'),
      featured: true,
      environmentalImpact: 'Reduces carbon footprint by 60%',
      rewards: [
        { amount: 25, title: 'Thank You Package', backers: 15 },
        { amount: 50, title: 'Fresh Vegetables Box', backers: 20 },
        { amount: 100, title: 'Farm Visit + Vegetables', backers: 7 }
      ]
    },
    {
      id: '2',
      title: 'Community Bee Sanctuary',
      description: 'Creating a safe haven for local bee populations while producing premium honey.',
      category: 'Research & Innovation',
      goalAmount: 8000,
      currentAmount: 3200,
      backerCount: 28,
      daysLeft: 25,
      farmerId: 'farmer2',
      farmerName: 'Anna Nowak',
      farmName: 'Miodowa Pasiek',
      location: 'Kraków, Małopolskie',
      image: '/api/placeholder/400/250',
      tags: ['bees', 'honey', 'biodiversity', 'community'],
      status: 'active',
      createdAt: new Date('2024-02-01'),
      featured: false,
      environmentalImpact: 'Supports pollinator population',
      rewards: [
        { amount: 30, title: 'Raw Honey Jar', backers: 12 },
        { amount: 75, title: 'Beeswax Products Set', backers: 10 },
        { amount: 150, title: 'Beekeeping Workshop', backers: 6 }
      ]
    },
    {
      id: '3',
      title: 'Heritage Grain Revival Project',
      description: 'Preserving ancient Polish grain varieties for future generations.',
      category: 'Crop Production',
      goalAmount: 12000,
      currentAmount: 11800,
      backerCount: 89,
      daysLeft: 3,
      farmerId: 'farmer3',
      farmerName: 'Piotr Wiśniewski',
      farmName: 'Dziedzictwo Zbóż',
      location: 'Poznań, Wielkopolskie',
      image: '/api/placeholder/400/250',
      tags: ['heritage', 'grains', 'biodiversity', 'tradition'],
      status: 'active',
      createdAt: new Date('2024-01-20'),
      featured: true,
      environmentalImpact: 'Preserves genetic diversity',
      rewards: [
        { amount: 20, title: 'Heritage Flour Package', backers: 35 },
        { amount: 60, title: 'Artisan Bread Workshop', backers: 25 },
        { amount: 120, title: 'Seed Collection + Book', backers: 29 }
      ]
    }
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterAndSortCampaigns();
  }, [campaigns, searchTerm, selectedCategory, sortBy]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual Firebase call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCampaigns(mockCampaigns);
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

  const filterAndSortCampaigns = () => {
    let filtered = [...campaigns];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(campaign => campaign.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'ending_soon':
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      case 'most_funded':
        filtered.sort((a, b) => (b.currentAmount / b.goalAmount) - (a.currentAmount / a.goalAmount));
        break;
      case 'most_backers':
        filtered.sort((a, b) => b.backerCount - a.backerCount);
        break;
      default:
        break;
    }

    setFilteredCampaigns(filtered);
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const toggleSaveCampaign = (campaignId) => {
    setSavedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
        toast({
          title: "Removed from saved",
          description: "Campaign removed from your saved list"
        });
      } else {
        newSet.add(campaignId);
        toast({
          title: "Campaign saved",
          description: "Campaign added to your saved list"
        });
      }
      return newSet;
    });
  };

  const handleBackCampaign = () => {
    // TODO: Implement backing functionality
    toast({
      title: "Feature coming soon",
      description: "Campaign backing will be available soon"
    });
  };

  const CampaignCard = ({ campaign }) => {
    const progressPercentage = getProgressPercentage(campaign.currentAmount, campaign.goalAmount);
    const isSaved = savedCampaigns.has(campaign.id);

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={campaign.image}
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
                <BookmarkCheck className="w-4 h-4 text-green-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              {campaign.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold line-clamp-2">{campaign.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">{campaign.description}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{campaign.farmName}</span>
              <span>•</span>
              <MapPin className="w-4 h-4" />
              <span>{campaign.location}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-600">
                  {campaign.currentAmount.toLocaleString()} PLN
                </span>
                <span className="text-gray-500">
                  of {campaign.goalAmount.toLocaleString()} PLN
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
                  {campaign.backerCount} backers
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {campaign.daysLeft} days left
                </span>
              </div>
            </div>

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
                onClick={() => handleBackCampaign(campaign.id)}
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crowdfunding Campaigns</h1>
          <p className="text-gray-600">Support innovative farming projects in your community</p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/profile'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>
      </div>

      {/* Featured Campaigns */}
      {campaigns.filter(c => c.featured).length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Featured Campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.filter(c => c.featured).map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, farm name, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
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
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                  <SelectItem value="most_funded">Most Funded</SelectItem>
                  <SelectItem value="most_backers">Most Backers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaigns.length}</p>
            <p className="text-sm text-gray-600">Active Campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.currentAmount, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">PLN Raised</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.backerCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Backers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round(
                (campaigns.reduce((sum, c) => sum + c.currentAmount, 0) /
                campaigns.reduce((sum, c) => sum + c.goalAmount, 0)) * 100
              )}%
            </p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* All Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            All Campaigns ({filteredCampaigns.length})
          </h2>
          
          {savedCampaigns.size > 0 && (
            <Button variant="outline" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved ({savedCampaigns.size})
            </Button>
          )}
        </div>

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