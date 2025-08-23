// src/pages/campaigns/CampaignEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  ImageIcon,
  Loader2,
  FileText,
  Gift
} from 'lucide-react';

// Firebase functions
import { getCampaignById, updateCampaign } from '../../firebase/crowdfunding';

const CampaignEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [originalCampaign, setOriginalCampaign] = useState(null);

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
    { value: 'research', label: 'Research & Development', description: 'Fund agricultural research projects' },
    { value: 'community', label: 'Community Initiative', description: 'Support community farming projects' }
  ];

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Campaign title, goal, and type' },
    { number: 2, title: 'Detailed Story', description: 'Your story and campaign details' },
    { number: 3, title: 'Rewards & Incentives', description: 'Set up reward tiers' },
    { number: 4, title: 'Impact & Timeline', description: 'Environmental impact and project timeline' },
    { number: 5, title: 'Review & Update', description: 'Review your changes' }
  ];

  // Load campaign data on component mount
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        const campaign = await getCampaignById(id);
        
        // Check if user owns this campaign
        if (campaign.farmerId !== userProfile.uid) {
          toast({
            title: "Access Denied",
            description: "You can only edit your own campaigns.",
            variant: "destructive"
          });
          navigate('/campaigns/manage');
          return;
        }

        setOriginalCampaign(campaign);
        
        // Populate form data with existing campaign data
        setFormData({
          title: campaign.title || '',
          description: campaign.description || '',
          category: campaign.category || '',
          type: campaign.type || 'preorder',
          goalAmount: campaign.goalAmount || '',
          duration: campaign.duration || 30,
          story: campaign.story || '',
          rewards: campaign.rewards || [
            { amount: 25, title: '', description: '', estimatedDelivery: '', backerLimit: '' },
            { amount: 50, title: '', description: '', estimatedDelivery: '', backerLimit: '' },
            { amount: 100, title: '', description: '', estimatedDelivery: '', backerLimit: '' }
          ],
          images: campaign.images || [],
          tags: campaign.tags || [],
          location: campaign.location || '',
          environmentalImpact: campaign.environmentalImpact || '',
          socialImpact: campaign.socialImpact || '',
          risksChallenges: campaign.risksChallenges || '',
          timeline: campaign.timeline || [
            { phase: 'Phase 1', description: '', duration: '1 month' },
            { phase: 'Phase 2', description: '', duration: '2 months' },
            { phase: 'Phase 3', description: '', duration: '1 month' }
          ]
        });

        // Set image preview if campaign has images
        if (campaign.images && campaign.images.length > 0) {
          setImagePreview(campaign.images[0]);
        }

      } catch (error) {
        console.error('Error loading campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign data.",
          variant: "destructive"
        });
        navigate('/campaigns/manage');
      } finally {
        setLoading(false);
      }
    };

    if (id && userProfile) {
      loadCampaign();
    }
  }, [id, userProfile, navigate, toast]);

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
        if (!formData.goalAmount || formData.goalAmount <= 0) newErrors.goalAmount = 'Valid goal amount is required';
        break;
      
      case 2:
        if (!formData.story.trim()) newErrors.story = 'Campaign story is required';
        if (formData.story.length < 200) newErrors.story = 'Story must be at least 200 characters';
        break;
        
      case 3:
        formData.rewards.forEach((reward, index) => {
          if (!reward.amount || reward.amount <= 0) {
            newErrors[`reward_${index}_amount`] = 'Reward amount is required';
          }
          if (!reward.title.trim()) {
            newErrors[`reward_${index}_title`] = 'Reward title is required';
          }
          if (!reward.description.trim()) {
            newErrors[`reward_${index}_description`] = 'Reward description is required';
          }
        });
        break;
        
      case 4:
        if (!formData.environmentalImpact.trim()) newErrors.environmentalImpact = 'Environmental impact is required';
        if (!formData.risksChallenges.trim()) newErrors.risksChallenges = 'Risks & challenges section is required';
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

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setSaving(true);

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        goalAmount: parseFloat(formData.goalAmount),
        duration: parseInt(formData.duration),
        story: formData.story,
        rewards: formData.rewards.filter(reward => 
          reward.title.trim() && reward.description.trim() && reward.amount > 0
        ),
        images: formData.images,
        tags: formData.tags,
        location: formData.location,
        environmentalImpact: formData.environmentalImpact,
        socialImpact: formData.socialImpact,
        risksChallenges: formData.risksChallenges,
        timeline: formData.timeline.filter(item => 
          item.phase.trim() && item.description.trim()
        )
      };

      await updateCampaign(id, updateData);

      toast({
        title: "Success",
        description: "Campaign updated successfully!"
      });

      navigate('/campaigns/manage');

    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getChangedFields = () => {
    if (!originalCampaign) return [];
    
    const changes = [];
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalCampaign[key])) {
        changes.push(key);
      }
    });
    return changes;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  const changedFields = getChangedFields();

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
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-gray-600">Update your campaign information</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/campaigns/${id}`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || changedFields.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Changes indicator */}
      {changedFields.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes in: {changedFields.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Edit Progress</h2>
            <span className="text-sm text-gray-500">Step {currentStep} of 5</span>
          </div>
          <Progress value={(currentStep / 5) * 100} className="mb-4" />
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={`text-center cursor-pointer p-2 rounded ${
                  currentStep === step.number 
                    ? 'bg-green-100 text-green-800' 
                    : currentStep > step.number 
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setCurrentStep(step.number)}
              >
                <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs ${
                  currentStep === step.number 
                    ? 'bg-green-600 text-white' 
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step.number ? <CheckCircle className="w-3 h-3" /> : step.number}
                </div>
                <div className="text-xs font-medium">{step.title}</div>
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
                <Label>Campaign Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {campaignTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('type', type.value)}
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          checked={formData.type === type.value}
                          onChange={() => handleInputChange('type', type.value)}
                          className="mr-3"
                        />
                        <h4 className="font-medium">{type.label}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  ))}
                </div>
                {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
              </div>

              <div>
                <Label htmlFor="location">Farm Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Region"
                />
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
                  placeholder="Tell your story. What problem are you solving? Why is this important? How will the funds be used?"
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

              <div className="space-y-4">
                <Label htmlFor="campaignImage">Campaign Image</Label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {!imagePreview ? (
                    <div className="text-center">
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
            </div>
          )}

          {/* Step 3: Rewards & Incentives */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reward Tiers</h3>
                <p className="text-gray-600 mb-4">
                  Offer products, experiences, or recognition.
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
                          {errors[`reward_${index}_amount`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`reward_${index}_amount`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label>Reward Title</Label>
                          <Input
                            value={reward.title}
                            onChange={(e) => handleRewardChange(index, 'title', e.target.value)}
                            placeholder="e.g., Early Bird Special"
                          />
                          {errors[`reward_${index}_title`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`reward_${index}_title`]}</p>
                          )}
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
                        {errors[`reward_${index}_description`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`reward_${index}_description`]}</p>
                        )}
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
                            placeholder="Leave empty for unlimited"
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
                <Label htmlFor="environmentalImpact">Environmental Impact *</Label>
                <Textarea
                  id="environmentalImpact"
                  value={formData.environmentalImpact}
                  onChange={(e) => handleInputChange('environmentalImpact', e.target.value)}
                  placeholder="How will this project benefit the environment? (e.g., reduced carbon footprint, soil health, biodiversity)"
                  rows={3}
                />
                {errors.environmentalImpact && <p className="text-sm text-red-600 mt-1">{errors.environmentalImpact}</p>}
              </div>

              <div>
                <Label htmlFor="socialImpact">Social Impact</Label>
                <Textarea
                  id="socialImpact"
                  value={formData.socialImpact}
                  onChange={(e) => handleInputChange('socialImpact', e.target.value)}
                  placeholder="How will this project impact the local community?"
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

          {/* Step 5: Review & Update */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review your changes before updating. You can continue editing even after saving.
                </AlertDescription>
              </Alert>

              {/* Campaign Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Campaign Title</h4>
                    <p className="text-gray-600">{formData.title}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Funding Goal</h4>
                    <p className="text-gray-600">{formData.goalAmount} PLN</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Category</h4>
                    <p className="text-gray-600">{formData.category}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Campaign Type</h4>
                    <p className="text-gray-600">
                      {campaignTypes.find(t => t.value === formData.type)?.label}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Tags</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Reward Tiers</h4>
                    <p className="text-gray-600">
                      {formData.rewards.filter(r => r.title.trim() && r.description.trim()).length} tiers configured
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Timeline Phases</h4>
                    <p className="text-gray-600">
                      {formData.timeline.filter(t => t.phase.trim() && t.description.trim()).length} phases planned
                    </p>
                  </div>
                </div>
              </div>

              {/* Changed Fields Summary */}
              {changedFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Changes to be saved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {changedFields.map((field) => (
                        <Badge key={field} variant="outline">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Campaign Status Info */}
              {originalCampaign && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Campaign Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="text-base">
                          <Badge variant={
                            originalCampaign.status === 'active' ? 'default' : 
                            originalCampaign.status === 'draft' ? 'secondary' : 
                            originalCampaign.status === 'funded' ? 'success' : 'destructive'
                          }>
                            {originalCampaign.status.charAt(0).toUpperCase() + originalCampaign.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Current Funding</Label>
                        <p className="text-base">
                          {originalCampaign.currentAmount || 0} PLN / {originalCampaign.goalAmount} PLN
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Backers</Label>
                        <p className="text-base">{originalCampaign.backerCount || 0} backers</p>
                      </div>
                      
                      {originalCampaign.endDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">End Date</Label>
                          <p className="text-base">
                            {new Date(originalCampaign.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                  disabled={saving || changedFields.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Campaign...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Campaign
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

export default CampaignEdit;