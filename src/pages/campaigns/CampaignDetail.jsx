// src/pages/campaigns/CampaignDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Wallet,
  Share,
  Shield,
  AlertCircle,
  CheckCircle,
  Users,
  MapPin,
  ExternalLink,
  Bug,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';

// Import services
import { getCampaignById } from '../../firebase/crowdfunding';

// Import NEW ZetaChain components and services
import ZetaChainPaymentButton from '../../components/payment/ZetaChainPaymentButton';
import integratedPaymentService from '../../services/integratedPaymentService';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [backingAmount, setBackingAmount] = useState('');
  const [showBackingForm, setShowBackingForm] = useState(false);
  const [web3Account, setWeb3Account] = useState(null);
  const [web3Connected, setWeb3Connected] = useState(false);
  
  // NEW: Payment method tracking
  const [activePaymentMethod, setActivePaymentMethod] = useState('traditional');

  useEffect(() => {
    loadCampaign();
    checkWeb3Connection();
  }, [id]);

  // Debug campaign data
  useEffect(() => {
    if (campaign) {
      console.log('Raw campaign object:', campaign);
      console.log('Campaign keys:', Object.keys(campaign));
      console.log('Campaign web3CampaignId specifically:', campaign.web3CampaignId);
      console.log('Blockchain deployment web3CampaignId:', campaign.blockchainDeployment?.web3CampaignId);
      console.log('Campaign loaded for crypto backing:', {
        id: campaign.id,
        status: campaign.status,
        web3Enabled: campaign.web3Enabled,
        web3CampaignId: campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId,
        deploymentStatus: campaign.blockchainDeployment?.status,
        goalAmount: campaign.goalAmount,
        currentAmount: campaign.currentAmount
      });
    }
  }, [campaign]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaignById(id);
      console.log('Raw campaign data from Firebase:', campaignData);
      
      // Check if web3CampaignId is missing but deployment shows success
      if (!campaignData.web3CampaignId && 
          campaignData.blockchainDeployment?.status === 'deployed' && 
          campaignData.blockchainDeployment?.web3CampaignId) {
        
        console.log('Found web3CampaignId in blockchainDeployment, updating campaign...');
        
        // Update the campaign with the missing web3CampaignId
        const { updateCampaign } = await import('../../firebase/crowdfunding');
        await updateCampaign(id, {
          web3CampaignId: campaignData.blockchainDeployment.web3CampaignId
        });
        
        // Update local state
        campaignData.web3CampaignId = campaignData.blockchainDeployment.web3CampaignId;
      }
      
      setCampaign(campaignData);
      
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Error",
        description: "Campaign not found",
        variant: "destructive"
      });
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const checkWeb3Connection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWeb3Account(accounts[0]);
          setWeb3Connected(true);
        }
      } catch (error) {
        console.error('Error checking Web3 connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to back this campaign",
        variant: "destructive"
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setWeb3Account(accounts[0]);
      setWeb3Connected(true);
      toast({
        title: "Wallet Connected",
        description: `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  // NEW: Unified payment success handler (works for both traditional and ZetaChain)
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      console.log('Payment successful:', paymentResult);

      toast({
        title: "Contribution Successful!",
        description: `Thank you for contributing ${backingAmount} ETH to this campaign.`,
        variant: "default"
      });

      // Process through integrated service (maintains all your existing database logic)
      await integratedPaymentService.processContribution({
        campaignId: campaign.id,
        amount: parseFloat(backingAmount),
        paymentMethod: paymentResult.paymentMethod || 'traditional',
        sourceChain: paymentResult.sourceChain || null,
        user: userProfile,
        campaignData: campaign
      });

      // Update local campaign state if we have blockchain data
      if (paymentResult.transactionHash) {
        setCampaign(prev => ({
          ...prev,
          backerCount: (prev.backerCount || 0) + 1,
          lastContributionAt: new Date(),
          lastTransactionHash: paymentResult.transactionHash,
          blockchainSynced: true
        }));
      }

      // Reset form and reload campaign
      setBackingAmount('');
      setShowBackingForm(false);
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // NEW: Unified payment error handler
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error.message?.includes('user rejected')) {
      errorMessage = 'Transaction was cancelled.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient balance to complete this transaction.';
    } else if (error.message?.includes('Campaign not active')) {
      errorMessage = 'Campaign is not currently accepting contributions.';
    } else if (error.message?.includes('Campaign deadline passed')) {
      errorMessage = 'Campaign has expired.';
    } else if (error.message?.includes('Farmers cannot back their own campaigns')) {
      errorMessage = 'You cannot back your own campaign.';
    }

    toast({
      title: "Payment Failed",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const debugCampaignBlockchain = async () => {
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const contractABI = [
        "function getCampaignBasic(uint256 campaignId) external view returns (uint256, string, address, uint256, uint256, uint256)",
        "function getCampaignStatus(uint256 campaignId) external view returns (uint256, uint8, uint8, bool, bool, uint256)"
      ];
      
      const contract = new ethers.Contract("0x5C92508875629928b643Cac27c931329bA8B74e5", contractABI, provider);
      const campaignId = campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId;
      
      const [_id, _firebaseId, farmer, goalAmount, raisedAmount, deadline] = await contract.getCampaignBasic(campaignId);
      const [_createdAt, status, _campaignType, _verified, _fundsWithdrawn, _backerCount] = await contract.getCampaignStatus(campaignId);
      
      const statusNames = ['Draft', 'Active', 'Funded', 'Expired', 'Cancelled', 'Completed'];
      const now = Math.floor(Date.now() / 1000);
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const userAddress = accounts[0];
      
      const debugInfo = {
        campaignId: campaignId,
        campaignStatus: statusNames[status] || `Unknown(${status})`,
        deadlineTimestamp: Number(deadline),
        currentTimestamp: now,
        isExpired: now >= Number(deadline),
        farmerAddress: farmer,
        userAddress: userAddress,
        isFarmer: userAddress?.toLowerCase() === farmer?.toLowerCase(),
        goalAmountETH: ethers.formatEther(goalAmount),
        raisedAmountETH: ethers.formatEther(raisedAmount),
        timeRemaining: Math.max(0, Number(deadline) - now)
      };
      
      console.log("CAMPAIGN DEBUG:", debugInfo);
      console.log(JSON.stringify(debugInfo, null, 2));
      
    } catch (error) {
      console.error("Debug failed:", error);
      alert("Debug failed: " + error.message);
    }
  };

  // UPDATED: Enhanced crypto backing function using integrated service
  const handleCryptoBacking = async () => {
    if (!web3Connected) {
      await connectWallet();
      return;
    }

    if (!backingAmount || parseFloat(backingAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive"
      });
      return;
    }

    if (!campaign.web3CampaignId && !campaign.blockchainDeployment?.web3CampaignId) {
      toast({
        title: "Campaign Not Available",
        description: "This campaign is not available for crypto backing yet",
        variant: "destructive"
      });
      return;
    }

    try {
      setBacking(true);

      // Your existing Web3 logic (unchanged)
      const { ethers } = await import('ethers');
      
      const contractAddress = import.meta.env.VITE_APP_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      const contractABI = [
        "function contribute(uint256 campaignId, uint256 rewardTierIndex) external payable",
        "function getCampaignBasic(uint256 campaignId) external view returns (uint256, string, address, uint256, uint256, uint256)",
        "event ContributionMade(uint256 indexed campaignId, address indexed backer, uint256 amount, uint256 totalRaised)"
      ];

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const amountWei = ethers.parseEther(backingAmount);
      const web3CampaignId = campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId;
      
      const tx = await contract.contribute(
        web3CampaignId,
        ethers.MaxUint256,
        { value: amountWei }
      );

      toast({
        title: "Transaction Sent",
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();
      
      // Use new unified payment success handler
      await handlePaymentSuccess({
        success: true,
        transactionHash: receipt.hash,
        amount: parseFloat(backingAmount),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        paymentMethod: 'traditional'
      });

    } catch (error) {
      // Use new unified error handler
      handlePaymentError(error);
    } finally {
      setBacking(false);
    }
  };

  const calculateProgress = () => {
    if (!campaign?.goalAmount) return 0;
    const currentEth = campaign.web3Data?.goalAmountEth * (campaign.currentAmount || 0) / campaign.goalAmount || 0;
    const goalEth = campaign.web3Data?.goalAmountEth || 1;
    return Math.min((currentEth / goalEth) * 100, 100);
  };

  const calculateDaysLeft = () => {
    if (!campaign?.endDate) return 0;
    const now = new Date();
    const end = new Date(campaign.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Campaign link copied to clipboard"
      });
    }
  };

  // NEW: Enhanced backing form with payment method tabs
  const renderBackingForm = () => (
    <div className="pt-4 border-t space-y-4">
      <div>
        <Label htmlFor="amount">Contribution Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          step="0.001"
          min="0.001"
          placeholder="0.01"
          value={backingAmount}
          onChange={(e) => setBackingAmount(e.target.value)}
          className="text-lg"
        />
        {backingAmount && (
          <p className="text-xs text-gray-500 mt-1">
            ≈ ${(parseFloat(backingAmount) * 3000).toFixed(2)} USD (estimated)
          </p>
        )}
      </div>

      <Separator />
      
      {/* Payment Method Tabs */}
      <Tabs value={activePaymentMethod} onValueChange={setActivePaymentMethod}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traditional" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Direct</span>
          </TabsTrigger>
          <TabsTrigger value="zetachain" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Cross-Chain</span>
            <Badge variant="secondary" className="ml-1 text-xs">New</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Traditional Payment Tab */}
        <TabsContent value="traditional" className="space-y-3">
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Direct Wallet Payment</p>
                <p className="text-xs text-gray-600">Pay from your connected wallet</p>
                {web3Connected && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Connected: {web3Account?.slice(0, 6)}...{web3Account?.slice(-4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCryptoBacking}
            disabled={backing || !backingAmount}
            className="w-full"
          >
            {backing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Send {backingAmount} ETH
              </>
            )}
          </Button>
        </TabsContent>

        {/* ZetaChain Cross-Chain Tab */}
        <TabsContent value="zetachain" className="space-y-3">
          <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Cross-Chain Payment</p>
                <p className="text-xs text-gray-600 mt-1">
                  Pay from Bitcoin, Solana, TON, or any EVM chain
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">₿ Bitcoin</Badge>
                  <Badge variant="outline" className="text-xs">◎ Solana</Badge>
                  <Badge variant="outline" className="text-xs">💎 TON</Badge>
                  <Badge variant="outline" className="text-xs">+ EVM</Badge>
                </div>
              </div>
            </div>
          </div>

          <ZetaChainPaymentButton
            campaignId={campaign?.web3CampaignId || campaign?.blockchainDeployment?.web3CampaignId}
            amount={parseFloat(backingAmount) || 0}
            targetContractAddress={import.meta.env.VITE_APP_CONTRACT_ADDRESS}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            disabled={!backingAmount || backing}
            className="w-full"
          />

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>How it works:</strong> Choose your preferred blockchain, and your payment will be automatically converted and sent to this campaign. 
              Cross-chain payments may take 2-10 minutes to complete.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowBackingForm(false)}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Campaign not found or no longer available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const progress = calculateProgress();
  const daysLeft = calculateDaysLeft();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          {campaign.verified && (
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Header */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{campaign.title}</h1>
                  <p className="text-gray-600 mt-2">{campaign.description}</p>
                </div>

                {/* Campaign Image */}
                {campaign.imageUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={campaign.imageUrl} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Campaign Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(campaign.web3Data?.goalAmountEth * (campaign.currentAmount || 0) / campaign.goalAmount || 0).toFixed(4)} ETH
                    </div>
                    <div className="text-sm text-gray-600">raised</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {campaign.backerCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">backers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {daysLeft}
                    </div>
                    <div className="text-sm text-gray-600">days left</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>About This Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Campaign Story</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {campaign.story || campaign.description}
                </p>
              </div>

              {campaign.timeline && campaign.timeline.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Project Timeline</h4>
                  <div className="space-y-2">
                    {campaign.timeline.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-medium">{item.phase || item.title}</h5>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <span className="text-xs text-gray-500">{item.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.risksChallenges && (
                <div>
                  <h4 className="font-semibold mb-2">Risks & Challenges</h4>
                  <p className="text-gray-700">{campaign.risksChallenges}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Farmer Information */}
          <Card>
            <CardHeader>
              <CardTitle>About the Farmer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{campaign.farmerName}</h4>
                  <p className="text-gray-600">{campaign.farmName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {campaign.location}
                    </div>
                  </div>
                </div>
              </div>
              
              {campaign.socialImpact && (
                <div>
                  <h5 className="font-medium mb-1">Social Impact</h5>
                  <p className="text-gray-700 text-sm">{campaign.socialImpact}</p>
                </div>
              )}

              {campaign.environmentalImpact && (
                <div>
                  <h5 className="font-medium mb-1">Environmental Impact</h5>
                  <p className="text-gray-700 text-sm">{campaign.environmentalImpact}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Goal</span>
                    <span className="font-medium">{campaign.web3Data?.goalAmountEth?.toFixed(4) || '0.0000'} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Raised</span>
                    <span className="font-medium">{(campaign.web3Data?.goalAmountEth * (campaign.currentAmount || 0) / campaign.goalAmount || 0).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Backers</span>
                    <span className="font-medium">{campaign.backerCount || 0}</span>
                  </div>
                </div>

                {/* Web3 Status Alert */}
                {(!campaign.web3Enabled || 
                  !(campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId) || 
                  campaign.blockchainDeployment?.status !== 'deployed') && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {!campaign.web3Enabled ? "Campaign not enabled for Web3 backing." :
                       !(campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId) ? "Campaign not linked to blockchain yet." :
                       campaign.blockchainDeployment?.status !== 'deployed' ? `Deployment status: ${campaign.blockchainDeployment?.status || 'unknown'}` :
                       "Campaign not available for crypto backing."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* ENHANCED: Crypto Backing Section with ZetaChain support */}
                {campaign.status === 'active' && 
                 campaign.web3Enabled && 
                 (campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId) && 
                 campaign.blockchainDeployment?.status === 'deployed' && (
                  <div className="pt-4 border-t space-y-3">
                    {!web3Connected ? (
                      <div className="space-y-2">
                        <Button 
                          className="w-full"
                          onClick={connectWallet}
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet to Back with Ethereum
                        </Button>
                        
                        {/* NEW: ZetaChain Payment Button for non-connected users */}
                        <ZetaChainPaymentButton
                          campaignId={campaign?.web3CampaignId || campaign?.blockchainDeployment?.web3CampaignId}
                          amount={0.01} // Default amount for demo
                          targetContractAddress={import.meta.env.VITE_APP_CONTRACT_ADDRESS}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                          disabled={false}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        />
                        
                        <div className="text-xs text-gray-500 text-center">
                          Pay from Bitcoin, Solana, TON, or other blockchains
                        </div>
                      </div>
                    ) : !showBackingForm ? (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">
                          Connected: {web3Account?.slice(0, 6)}...{web3Account?.slice(-4)}
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => setShowBackingForm(true)}
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Choose Payment Method
                        </Button>
                      </div>
                    ) : (
                      /* NEW: Enhanced backing form with payment method tabs */
                      renderBackingForm()
                    )}
                  </div>
                )}

                {/* Debug Button - Always show for now */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={debugCampaignBlockchain}
                    className="w-full"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Debug Campaign State
                  </Button>
                </div>

                {/* Blockchain Info */}
                {campaign.web3CampaignId && (
                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Blockchain Campaign ID: {campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId}</div>
                      {campaign.blockchainDeployment?.transactionHash && (
                        <div className="flex items-center gap-1">
                          <span>TX:</span>
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${campaign.blockchainDeployment.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {campaign.blockchainDeployment.transactionHash.slice(0, 8)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category</span>
                <Badge variant="outline">{campaign.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Type</span>
                <span>{campaign.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration</span>
                <span>{campaign.duration} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
              {campaign.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ends</span>
                  <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards Section */}
          {campaign.rewards && campaign.rewards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.rewards.map((reward, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{reward.title}</h4>
                      <span className="text-green-600 font-bold">{reward.amount} PLN</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                    {reward.estimatedDelivery && (
                      <div className="text-xs text-gray-500">
                        Delivery: {reward.estimatedDelivery}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;