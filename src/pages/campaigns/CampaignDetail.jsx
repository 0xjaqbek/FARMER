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
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Share,
  Shield,
  AlertCircle,
  CheckCircle,
  Users,
  MapPin,
  ExternalLink,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';

// Import services
import { getCampaignById } from '../../firebase/crowdfunding';

// Import ZetaChain components and services
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

  useEffect(() => {
    loadCampaign();
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

  // Helper function to get block explorer URL
  const getBlockExplorerUrl = (txHash, sourceChain, sourceChainId) => {
    if (!txHash) return null;
    
    const blockExplorers = {
      // Ethereum mainnet
      1: 'https://etherscan.io',
      'ethereum': 'https://etherscan.io',
      
      // Sepolia testnet  
      11155111: 'https://sepolia.etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'Sepolia Testnet': 'https://sepolia.etherscan.io',
      
      // Bitcoin
      'btc-mainnet': 'https://blockstream.info',
      'bitcoin': 'https://blockstream.info',
      'btc-testnet': 'https://blockstream.info/testnet',
      
      // Solana
      'solana-mainnet': 'https://explorer.solana.com',
      'solana': 'https://explorer.solana.com',
      'solana-devnet': 'https://explorer.solana.com/?cluster=devnet',
      
      // TON
      'ton-mainnet': 'https://tonviewer.com',
      'ton': 'https://tonviewer.com',
      
      // Other chains
      137: 'https://polygonscan.com',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
      43114: 'https://snowtrace.io'
    };

    const explorer = blockExplorers[sourceChainId] || 
                     blockExplorers[sourceChain] || 
                     blockExplorers[sourceChain?.toLowerCase()];
    
    if (!explorer) return null;

    // Different URL formats for different chain types
    if (sourceChain?.toLowerCase().includes('solana')) {
      const clusterParam = sourceChain.toLowerCase().includes('devnet') ? '?cluster=devnet' : '';
      return `${explorer}/tx/${txHash}${clusterParam}`;
    } else if (sourceChain?.toLowerCase().includes('ton')) {
      return `${explorer}/transaction/${txHash}`;
    } else if (sourceChain?.toLowerCase().includes('bitcoin') || sourceChain?.toLowerCase().includes('btc')) {
      return `${explorer}/tx/${txHash}`;
    } else {
      // Default EVM format
      return `${explorer}/tx/${txHash}`;
    }
  };

  // ZetaChain-only payment success handler
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      console.log('ZetaChain payment successful:', paymentResult);
      setBacking(true);

      // Show processing toast
      toast({
        title: "🔄 Processing Cross-Chain Payment...",
        description: `Your payment of ${paymentResult.amount} ETH from ${paymentResult.sourceChain} is being processed...`,
        duration: Infinity
      });
      
      // Handle database updates and post-payment logic
      await integratedPaymentService.executePostPaymentLogic({
        paymentResult,
        campaignId: id,
        amount: parseFloat(backingAmount) || paymentResult.amount,
        user: userProfile,
        campaignData: campaign,
        paymentMethod: 'zetachain',
        sourceChain: paymentResult.sourceChain
      });

      console.log('✅ Database updates completed, refreshing campaign data...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadCampaign();
      
      // Get block explorer URL
      const explorerUrl = getBlockExplorerUrl(
        paymentResult.transactionHash, 
        paymentResult.sourceChain,
        paymentResult.sourceChainId
      );

      const txHashDisplay = paymentResult.transactionHash 
        ? `${paymentResult.transactionHash.slice(0, 10)}...${paymentResult.transactionHash.slice(-6)}`
        : 'Processing...';

      // Show success toast with clickable transaction hash
      toast({
        title: "✅ Cross-Chain Payment Complete!",
        description: (
          <div className="space-y-2">
            <p>Thank you for backing this campaign! Your cross-chain contribution has been recorded.</p>
            {paymentResult.transactionHash && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600">Transaction:</span>
                {explorerUrl ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-blue-500 hover:text-blue-700 underline font-mono flex items-center space-x-1"
                  >
                    <span>{txHashDisplay}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="font-mono text-gray-500">{txHashDisplay}</span>
                )}
              </div>
            )}
            {paymentResult.sourceChain && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600">Chain:</span>
                <span className="font-medium">{paymentResult.sourceChain}</span>
              </div>
            )}
          </div>
        ),
        duration: Infinity,
        action: {
          label: "Close",
          onClick: () => {
            setBackingAmount('');
            setShowBackingForm(false);
          }
        }
      });
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "❌ Payment Processing Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
        duration: Infinity,
        action: {
          label: "Close",
          onClick: () => {
            // User can retry after closing error
          }
        }
      });
    } finally {
      setBacking(false);
    }
  };

  // Payment error handler
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    
    let errorMessage = 'Cross-chain payment failed. Please try again.';
    
    if (error.message?.includes('user rejected')) {
      errorMessage = 'Transaction was cancelled.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient balance to complete this transaction.';
    } else if (error.message?.includes('Chain') && error.message?.includes('not supported')) {
      errorMessage = 'This blockchain is not supported for cross-chain payments.';
    }

    toast({
      title: "Payment Failed",
      description: errorMessage,
      variant: "destructive"
    });
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

  // Show backing form handler
  const showBackingFormHandler = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowBackingForm(true);
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

  // ZetaChain-only backing form (no tabs)
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        />
        {backingAmount && (
          <p className="text-xs text-gray-500 mt-1">
            ≈ ${(parseFloat(backingAmount) * 3000).toFixed(2)} USD (estimated)
          </p>
        )}
      </div>

      <Separator />
      
      {/* ZetaChain Cross-Chain Payment */}
      <div className="space-y-3">
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
      </div>

      <div className="flex justify-between pt-2">
        <Button 
          type="button"
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowBackingForm(false);
          }}
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

{/* ZetaChain-Only Payment Section */}
{campaign.status === 'active' && 
 campaign.web3Enabled && 
 (campaign.web3CampaignId || campaign.blockchainDeployment?.web3CampaignId) && 
 campaign.blockchainDeployment?.status === 'deployed' && (
  <div className="pt-4 border-t space-y-3">
    {!showBackingForm ? (
      <div className="space-y-3">
        {/* Button to show amount form */}
        <Button 
          type="button"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={showBackingFormHandler}
        >
          <Zap className="w-4 h-4 mr-2" />
          Back This Campaign with ZetaChain
        </Button>
        
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Pay from Bitcoin, Solana, TON, or any EVM chain</p>
          <div className="flex justify-center space-x-1">
            <Badge variant="outline" className="text-xs">₿ Bitcoin</Badge>
            <Badge variant="outline" className="text-xs">◎ Solana</Badge>
            <Badge variant="outline" className="text-xs">💎 TON</Badge>
            <Badge variant="outline" className="text-xs">+ EVM</Badge>
          </div>
        </div>
      </div>
    ) : (
      /* Show amount entry form */
      renderBackingForm()
    )}
  </div>
)}

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