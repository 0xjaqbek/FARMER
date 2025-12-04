// src/pages/campaigns/CampaignCreator.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Target,
  FileText,
  Gift,
  Calendar,
  CheckCircle,
  Loader2,
  Save,
  ImageIcon,
  AlertCircle
} from 'lucide-react';


const CampaignCreator = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [newTag, setNewTag] = useState('');

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

  // Check if user is farmer on mount
  useEffect(() => {
    console.log('CampaignCreator mounted, checking user profile...', userProfile);
    
    if (userProfile && userProfile.role !== 'farmer' && userProfile.role !== 'rolnik') {
      toast({
        title: "Access Denied",
        description: "Only farmers can create campaigns.",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
  }, [userProfile, navigate, toast]);

  // Categories and types
  const categories = [
    'Sustainable Agriculture',
    'Organic Farming',
    'Equipment & Infrastructure',
    'Crop Production',
    'Livestock',
    'Processing & Packaging'
  ];

  const campaignTypes = [
    { value: 'preorder', label: 'Pre-Order Campaign', description: 'Pre-sell products before harvest' },
    { value: 'equipment', label: 'Equipment & Infrastructure', description: 'Fund equipment purchases' },
    { value: 'expansion', label: 'Farm Expansion', description: 'Expand farming operations' },
    { value: 'research', label: 'Research & Development', description: 'Fund agricultural research projects' },
    { value: 'community', label: 'Community Initiative', description: 'Support community farming projects' }
  ];

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Campaign title, goal, and type' },
    { number: 2, title: 'Detailed Story', description: 'Your story and campaign details' },
    { number: 3, title: 'Rewards & Incentives', description: 'Set up reward tiers' },
    { number: 4, title: 'Impact & Timeline', description: 'Environmental impact and project timeline' },
    { number: 5, title: 'Review & Create', description: 'Review and create your campaign' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, images: [reader.result] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, images: [] }));
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
    const newAmount = Math.max(...formData.rewards.map(r => r.amount)) + 50;
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, {
        amount: newAmount,
        title: '',
        description: '',
        estimatedDelivery: '',
        backerLimit: ''
      }]
    }));
  };

  const removeReward = (index) => {
    if (formData.rewards.length > 1) {
      setFormData(prev => ({
        ...prev,
        rewards: prev.rewards.filter((_, i) => i !== index)
      }));
    }
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
        if (!formData.goalAmount || formData.goalAmount < 100) {
          newErrors.goalAmount = 'Goal amount must be at least 100 PLN';
        }
        break;
        
      case 2:
        if (!formData.story.trim()) newErrors.story = 'Campaign story is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;
        
      case 4:
        if (!formData.risksChallenges.trim()) {
          newErrors.risksChallenges = 'Risks & challenges section is required';
        }
        break;
    }

    return newErrors;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors({});
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors({});
      
      // Final validation
      const allErrors = {};
      for (let step = 1; step <= 4; step++) {
        const stepErrors = validateStep(step);
        Object.assign(allErrors, stepErrors);
      }
      
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors and try again.",
          variant: "destructive"
        });
        return;
      }

      // Prepare campaign data
      const campaignData = {
        ...formData,
        farmerId: userProfile.uid,
        farmName: userProfile.displayName || userProfile.farmName,
        farmerName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
        status: 'draft',
        createdAt: new Date(),
        currentAmount: 0,
        backerCount: 0,
        verified: false
      };

      console.log('Creating campaign with data:', campaignData);

      toast({
        title: "Success",
        description: "Campaign created successfully! You can edit it anytime before launching.",
      });

      // Navigate to campaign management
      navigate('/campaigns/manage');

    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading if user profile not ready
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is farmer
  if (userProfile.role !== 'farmer' && userProfile.role !== 'rolnik') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only farmers can create campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/campaigns/manage')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Campaigns
          </Button>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-gray-600">Launch a crowdfunding campaign for your farming project</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center cursor-pointer ${
                  currentStep === step.number 
                    ? 'text-green-600' 
                    : currentStep > step.number 
                    ? 'text-green-500' 
                    : 'text-gray-400'
                }`}
                onClick={() => {
                  // Allow navigation to previous steps
                  if (step.number < currentStep) {
                    setCurrentStep(step.number);
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.number 
                    ? 'bg-green-600 text-white' 
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step.number ? <CheckCircle className="w-4 h-4" /> : step.number}
                </div>
                <div className="text-xs font-medium mt-1 text-center max-w-20">
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Target className="w-5 h-5" />}
            {currentStep === 2 && <FileText className="w-5 h-5" />}
            {currentStep === 3 && <Gift className="w-5 h-5" />}
            {currentStep === 4 && <Calendar className="w-5 h-5" />}
            {currentStep === 5 && <CheckCircle className="w-5 h-5" />}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Give your campaign a compelling title"
                  maxLength={80}
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/80 characters</p>
              </div>

              <div>
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Briefly describe your campaign (2-3 sentences)"
                  maxLength={200}
                  rows={3}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="goalAmount">Funding Goal (PLN) *</Label>
                  <Input
                    id="goalAmount"
                    type="number"
                    value={formData.goalAmount}
                    onChange={(e) => handleInputChange('goalAmount', e.target.value)}
                    placeholder="5000"
                    min="100"
                  />
                  {errors.goalAmount && <p className="text-sm text-red-600 mt-1">{errors.goalAmount}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Campaign Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 30)}
                  placeholder="30"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long your campaign will run for funding (1-365 days)
                </p>
              </div>

              <div>
                <Label>Campaign Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {campaignTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleInputChange('type', type.value)}
                    >
                      <h4 className="font-semibold">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  ))}
                </div>
                {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Detailed Story */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="story">Campaign Story *</Label>
                <Textarea
                  id="story"
                  value={formData.story}
                  onChange={(e) => handleInputChange('story', e.target.value)}
                  placeholder="Tell your story. Why are you creating this campaign? What problem does it solve?"
                  rows={8}
                  className="min-h-32"
                />
                {errors.story && <p className="text-sm text-red-600 mt-1">{errors.story}</p>}
                <p className="text-xs text-gray-500 mt-1">{formData.story.length} characters</p>
              </div>

              <div>
                <Label htmlFor="location">Farm Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Warsaw, Poland"
                />
                {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
              </div>

              <div>
                <Label>Campaign Image</Label>
                <div className="mt-2">
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Click to upload campaign image
                          </span>
                          <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="mt-2 text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Campaign preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Tags (Optional)</Label>
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Rewards & Incentives */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reward Tiers</h3>
                <p className="text-gray-600 mb-4">
                  Offer products, experiences, or recognition to your backers.
                </p>
                
                {formData.rewards.map((reward, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Tier {index + 1}</h4>
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
                          <Label>Amount (PLN)</Label>
                          <Input
                            type="number"
                            value={reward.amount}
                            onChange={(e) => handleRewardChange(index, 'amount', e.target.value)}
                            min="1"
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
                        <Label>Description</Label>
                        <Textarea
                          value={reward.description}
                          onChange={(e) => handleRewardChange(index, 'description', e.target.value)}
                          placeholder="Describe what backers get for this amount"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Estimated Delivery</Label>
                          <Input
                            value={reward.estimatedDelivery}
                            onChange={(e) => handleRewardChange(index, 'estimatedDelivery', e.target.value)}
                            placeholder="e.g., June 2025"
                          />
                        </div>
                        
                        <div>
                          <Label>Backer Limit (Optional)</Label>
                          <Input
                            type="number"
                            value={reward.backerLimit}
                            onChange={(e) => handleRewardChange(index, 'backerLimit', e.target.value)}
                            placeholder="Unlimited"
                            min="1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" onClick={addReward} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward Tier
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
                        {formData.timeline.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimelineItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
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

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review your campaign details before creating. You can edit everything later.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {formData.title}</div>
                    <div><strong>Category:</strong> {formData.category}</div>
                    <div><strong>Goal:</strong> {formData.goalAmount} PLN</div>
                    <div><strong>Duration:</strong> {formData.duration} days</div>
                    <div><strong>Type:</strong> {campaignTypes.find(t => t.value === formData.type)?.label}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Rewards</h3>
                  <div className="space-y-1 text-sm">
                    {formData.rewards.filter(r => r.title).map((reward, index) => (
                      <div key={index}>
                        <strong>{reward.amount} PLN:</strong> {reward.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Campaign Story</h3>
                <p className="text-sm text-gray-700 line-clamp-3">{formData.story}</p>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < 5 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignCreator;