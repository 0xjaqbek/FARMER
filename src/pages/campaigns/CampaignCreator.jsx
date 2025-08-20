// src/pages/campaigns/CampaignCreator.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft,
  Plus,
  X,
  Upload,
  DollarSign,
  Calendar,
  Target,
  Users,
  FileText,
  Camera,
  MapPin,
  Leaf,
  Truck,
  Award,
  AlertCircle,
  CheckCircle,
  Wallet,
  Link
} from 'lucide-react';

// Import Web3 hook
import { useWeb3 } from '../../hooks/useWeb3';

const CampaignCreator = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Web3 integration
  const { isConnected, connect, account } = useWeb3();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'preorder',
    goalAmount: '',
    duration: 30,
    story: '',
    rewards: [
      { amount: 25, title: '', description: '', estimatedDelivery: '', backerLimit: '' },
      { amount: 50, title: '', description: '', estimatedDelivery: '', backerLimit: '' },
      { amount: 100, title: '', description: '', estimatedDelivery: '', backerLimit: '' }
    ],
    images: [],
    tags: [],
    location: '',
    environmentalImpact: '',
    socialImpact: '',
    risksChallenges: '',
    timeline: [
      { phase: 'Phase 1', description: '', duration: '1 month' },
      { phase: 'Phase 2', description: '', duration: '2 months' },
      { phase: 'Phase 3', description: '', duration: '1 month' }
    ]
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
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

  const campaignTypes = [
    { value: 'preorder', label: 'Pre-Order Campaign', description: 'Pre-sell products before harvest' },
    { value: 'equipment', label: 'Equipment & Infrastructure', description: 'Fund equipment purchases' },
    { value: 'expansion', label: 'Farm Expansion', description: 'Expand farming operations' },
    { value: 'emergency', label: 'Emergency Funding', description: 'Emergency financial support' }
  ];

  // Helper function for campaign type mapping
  const getCampaignTypeIndex = (campaignType) => {
    const typeMapping = {
      'preorder': 0,
      'equipment': 1,
      'expansion': 2,
      'emergency': 3
    };
    return typeMapping[campaignType.toLowerCase()] || 0;
  };

  // Wallet signature function
  const signWalletOwnership = async (campaignId) => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `Farm Direct Campaign Ownership Verification
      
Campaign ID: ${campaignId}
Email: ${userProfile.email}
Timestamp: ${Date.now()}

By signing this message, I confirm that I am the creator of this campaign and the owner of this wallet address.`;

      const signature = await signer.signMessage(message);
      const address = await signer.getAddress();

      return {
        address,
        signature,
        message,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Wallet signing failed:', error);
      throw error;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleRewardChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.map((reward, i) => 
        i === index ? { ...reward, [field]: value } : reward
      )
    }));
  };

  const addReward = () => {
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, {
        amount: '',
        title: '',
        description: '',
        estimatedDelivery: '',
        backerLimit: ''
      }]
    }));
  };

  const removeReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const handleTimelineChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addTimelineItem = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, {
        phase: `Phase ${prev.timeline.length + 1}`,
        description: '',
        duration: '1 month'
      }]
    }));
  };

  const removeTimelineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
        if (!formData.description.trim()) newErrors.description = 'Short description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.type) newErrors.type = 'Campaign type is required';
        if (!formData.goalAmount || formData.goalAmount <= 0) newErrors.goalAmount = 'Valid goal amount is required';
        
        // Only require wallet connection
        if (!isConnected) newErrors.wallet = 'Please connect your wallet to verify campaign ownership';
        break;
      
      case 2:
        if (!formData.story.trim()) newErrors.story = 'Campaign story is required';
        if (formData.story.length < 200) newErrors.story = 'Story should be at least 200 characters';
        break;
      
      case 3:
        { const validRewards = formData.rewards.filter(r => r.amount && r.title && r.description);
        if (validRewards.length === 0) newErrors.rewards = 'At least one complete reward is required';
        break; }
      
      case 4:
        if (!formData.risksChallenges.trim()) newErrors.risksChallenges = 'Risks and challenges section is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      if (!isConnected) {
        toast({
          title: "Wallet Required",
          description: "Please connect your wallet to verify campaign ownership",
          variant: "destructive"
        });
        return;
      }

      // Prepare campaign data
      const campaignData = {
        ...formData,
        farmerId: userProfile.uid,
        farmerName: `${userProfile.firstName} ${userProfile.lastName}`,
        farmName: userProfile.farmInfo?.farmName || userProfile.farmName,
        farmerEmail: userProfile.email,
        status: 'pending_wallet_verification',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentAmount: 0,
        backerCount: 0,
        walletVerified: false,
        blockchainDeployment: {
          status: 'pending',
          contractAddress: null,
          transactionHash: null,
          deployedAt: null,
          deployedBy: null
        },
        web3Data: {
          goalAmountEth: parseFloat(formData.goalAmount) / 4000, // PLN to ETH conversion
          durationDays: formData.duration,
          campaignType: getCampaignTypeIndex(formData.type)
        }
      };

      console.log('Creating campaign with wallet verification...');
      
      // Create campaign in Firebase first
      const { createCampaign } = await import('../../firebase/crowdfunding');
      const campaignId = await createCampaign(campaignData);
      
      // Sign wallet ownership
      const signatureData = await signWalletOwnership(campaignId);
      
      // Update campaign with wallet verification
      const { updateCampaign } = await import('../../firebase/crowdfunding');
      await updateCampaign(campaignId, {
        walletVerification: {
          address: signatureData.address,
          signature: signatureData.signature,
          message: signatureData.message,
          timestamp: signatureData.timestamp,
          verified: true
        },
        status: 'draft',
        walletVerified: true,
        farmerWallet: signatureData.address,
        updatedAt: new Date()
      });
      
      toast({
        title: "Success!",
        description: `Campaign created and wallet verified! Address: ${signatureData.address.slice(0, 10)}...`,
      });
      
      window.location.href = '/campaigns/manage';
      
    } catch (error) {
      console.error('Error creating verified campaign:', error);
      
      if (error.message.includes('user rejected')) {
        toast({
          title: "Signature Required",
          description: "Please sign the message to verify wallet ownership",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create campaign",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
          </div>
          {step < 5 && (
            <div
              className={`w-12 h-1 ${
                step < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Campaign Story';
      case 3: return 'Rewards & Incentives';
      case 4: return 'Impact & Timeline';
      case 5: return 'Review & Launch';
      default: return 'Create Campaign';
    }
  };

  const Web3Status = () => (
    <Card className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-blue-600'}`} />
            <div>
              <p className="font-medium">
                {isConnected ? 'Wallet Connected' : 'Wallet Verification Required'}
              </p>
              <p className="text-sm text-gray-600">
                {isConnected ? (
                  <>
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                    <span className="text-green-600"> • Ready for Campaign Creation</span>
                  </>
                ) : (
                  'Connect wallet to verify campaign ownership and enable blockchain deployment'
                )}
              </p>
            </div>
          </div>
          {!isConnected && (
            <Button onClick={connect} variant="outline" size="sm">
              <Link className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/profile'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Crowdfunding Campaign</h1>
          <p className="text-gray-600">Share your farming project with the community</p>
        </div>
      </div>

      {/* Web3 Status */}
      <Web3Status />

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {getStepTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {errors.wallet && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.wallet}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Help us build a sustainable greenhouse"
                  maxLength={100}
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
              </div>

              <div>
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your campaign (1-2 sentences)"
                  rows={3}
                  maxLength={300}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/300 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Campaign Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalAmount">Funding Goal (PLN) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="goalAmount"
                      type="number"
                      value={formData.goalAmount}
                      onChange={(e) => handleInputChange('goalAmount', parseFloat(e.target.value) || '')}
                      placeholder="10000"
                      className="pl-10"
                      min="100"
                    />
                  </div>
                  {errors.goalAmount && <p className="text-sm text-red-600 mt-1">{errors.goalAmount}</p>}
                  {formData.goalAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {(parseFloat(formData.goalAmount) / 4000).toFixed(3)} ETH
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration">Campaign Duration (days)</Label>
                  <Select 
                    value={formData.duration.toString()} 
                    onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, Region"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Campaign Story */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="story">Tell Your Story *</Label>
                <Textarea
                  id="story"
                  value={formData.story}
                  onChange={(e) => handleInputChange('story', e.target.value)}
                  placeholder="Share the story behind your campaign. What problem are you solving? Why is this important? How will the funds be used?"
                  rows={10}
                  minLength={200}
                />
                {errors.story && <p className="text-sm text-red-600 mt-1">{errors.story}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.story.length} characters (minimum 200)
                </p>
              </div>

              <div>
                <Label>Campaign Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="images">Campaign Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Upload images to showcase your project
                  </p>
                  <Button variant="outline" className="mt-2">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Images
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rewards & Incentives */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Backer Rewards</h3>
                <p className="text-gray-600 mb-6">
                  Create rewards to incentivize backers. Offer products, experiences, or recognition.
                </p>
                
                {formData.rewards.map((reward, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Reward Tier {index + 1}</h4>
                        {formData.rewards.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeReward(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Pledge Amount (PLN)</Label>
                          <Input
                            type="number"
                            value={reward.amount}
                            onChange={(e) => handleRewardChange(index, 'amount', parseFloat(e.target.value) || '')}
                            placeholder="25"
                          />
                        </div>
                        
                        <div>
                          <Label>Reward Title</Label>
                          <Input
                            value={reward.title}
                            onChange={(e) => handleRewardChange(index, 'title', e.target.value)}
                            placeholder="e.g., Early Bird Special"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label>Reward Description</Label>
                        <Textarea
                          value={reward.description}
                          onChange={(e) => handleRewardChange(index, 'description', e.target.value)}
                          placeholder="Describe what backers will receive"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Estimated Delivery</Label>
                          <Input
                            value={reward.estimatedDelivery}
                            onChange={(e) => handleRewardChange(index, 'estimatedDelivery', e.target.value)}
                            placeholder="e.g., December 2024"
                          />
                        </div>
                        
                        <div>
                          <Label>Backer Limit (optional)</Label>
                          <Input
                            type="number"
                            value={reward.backerLimit}
                            onChange={(e) => handleRewardChange(index, 'backerLimit', e.target.value)}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {errors.rewards && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.rewards}</AlertDescription>
                  </Alert>
                )}
                
                <Button variant="outline" onClick={addReward} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Reward
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Impact & Timeline */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="environmentalImpact">Environmental Impact</Label>
                <Textarea
                  id="environmentalImpact"
                  value={formData.environmentalImpact}
                  onChange={(e) => handleInputChange('environmentalImpact', e.target.value)}
                  placeholder="How will your project benefit the environment?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="socialImpact">Social Impact</Label>
                <Textarea
                  id="socialImpact"
                  value={formData.socialImpact}
                  onChange={(e) => handleInputChange('socialImpact', e.target.value)}
                  placeholder="How will your project benefit the community?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="risksChallenges">Risks & Challenges *</Label>
                <Textarea
                  id="risksChallenges"
                  value={formData.risksChallenges}
                  onChange={(e) => handleInputChange('risksChallenges', e.target.value)}
                  placeholder="What challenges might you face? How will you address them?"
                  rows={4}
                />
                {errors.risksChallenges && <p className="text-sm text-red-600 mt-1">{errors.risksChallenges}</p>}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Project Timeline</h3>
                
                {formData.timeline.map((item, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={item.phase}
                          onChange={(e) => handleTimelineChange(index, 'phase', e.target.value)}
                          placeholder="Phase name"
                          className="font-medium"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimelineItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleTimelineChange(index, 'description', e.target.value)}
                        placeholder="Describe what will happen in this phase"
                        rows={2}
                        className="mb-2"
                      />
                      
                      <Input
                        value={item.duration}
                        onChange={(e) => handleTimelineChange(index, 'duration', e.target.value)}
                        placeholder="Duration"
                      />
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addTimelineItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Timeline Phase
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review your campaign details before publishing. You can still edit most information after publishing.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {formData.title}</p>
                      <p><strong>Category:</strong> {formData.category}</p>
                      <p><strong>Type:</strong> {campaignTypes.find(t => t.value === formData.type)?.label}</p>
                      <p><strong>Goal:</strong> {formData.goalAmount} PLN</p>
                      <p><strong>Duration:</strong> {formData.duration} days</p>
                      <p><strong>Location:</strong> {formData.location || 'Not specified'}</p>
                      <p><strong>Rewards:</strong> {formData.rewards.filter(r => r.title).length} tiers</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>✅ Campaign will be saved as draft</p>
                      <p>✅ Wallet ownership will be verified</p>
                      <p>✅ Admin can deploy to blockchain</p>
                      <p>✅ Edit anytime before launch</p>
                      <p>⏳ Review process (1-2 days)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Campaign Preview</h3>
                <Card className="border-green-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">{formData.title}</h2>
                      <p className="text-gray-600">{formData.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Goal: {formData.goalAmount} PLN
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formData.duration} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Leaf className="w-4 h-4" />
                          {formData.category}
                        </span>
                      </div>
                      
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full w-0"></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>0 PLN raised</span>
                        <span>0 backers</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isConnected && (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Your wallet ({account?.slice(0, 6)}...{account?.slice(-4)}) will be verified as the campaign owner.
                    You'll be asked to sign a message to prove ownership.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !isConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Creating & Verifying...' : 
                 isConnected ? 'Create Campaign & Verify Wallet' : 'Connect Wallet First'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignCreator;