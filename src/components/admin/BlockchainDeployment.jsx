// src/components/admin/BlockchainDeployment.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Wallet, 
  ExternalLink,
  Copy
} from 'lucide-react';
import { getAllCampaignsForAdmin, updateCampaign } from '../../firebase/crowdfunding';
import web3Service from '../../services/web3Service';

export const BlockchainDeploymentPanel = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(new Set());

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const allCampaigns = await getAllCampaignsForAdmin();
      // Filter campaigns that are ready for blockchain deployment
      const readyForDeployment = allCampaigns.filter(c => 
        c.walletVerified && 
        ['draft', 'active'].includes(c.status) &&
        c.blockchainDeployment?.status !== 'deployed'
      );
      setCampaigns(readyForDeployment);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployCampaignToBlockchain = async (campaign) => {
    if (!web3Service.isConnected()) {
      alert('Please connect wallet first');
      return;
    }

    setDeploying(prev => new Set(prev).add(campaign.id));
    
    try {
      // Convert PLN to ETH (rough conversion - adjust as needed)
      const goalAmountEth = parseFloat(campaign.goalAmount) / 4000;
      
      // Map campaign type
      const typeMapping = {
        'preorder': 0,
        'equipment': 1, 
        'expansion': 2,
        'emergency': 3
      };
      const campaignType = typeMapping[campaign.type] || 0;

      // Deploy to blockchain
      const result = await web3Service.createCampaign(
        campaign.id, // Use Firebase ID as reference
        goalAmountEth,
        campaign.duration || 30,
        campaignType
      );

      // Update Firebase with blockchain details
      await updateCampaign(campaign.id, {
        blockchainDeployment: {
          status: 'deployed',
          contractAddress: import.meta.env.VITE_APP_CONTRACT_ADDRESS,
          web3CampaignId: result.campaignId,
          transactionHash: result.transactionHash,
          deployedAt: new Date(),
          deployedBy: web3Service.account
        },
        web3Enabled: true,
        status: 'active', // Activate campaign
        updatedAt: new Date()
      });

      alert('Campaign deployed to blockchain successfully!');
      loadCampaigns(); // Refresh list

    } catch (error) {
      console.error('Deployment failed:', error);
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaign.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (campaign) => {
    const deployment = campaign.blockchainDeployment;
    
    if (!campaign.walletVerified) {
      return <Badge variant="destructive">Wallet Not Verified</Badge>;
    }
    
    if (!deployment || deployment.status === 'pending') {
      return <Badge variant="secondary">Ready for Deployment</Badge>;
    }
    
    if (deployment.status === 'deployed') {
      return <Badge variant="default">Deployed</Badge>;
    }
    
    return <Badge variant="destructive">Failed</Badge>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Blockchain Deployment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Deploy verified campaigns to blockchain for transparent fund collection.
            Ensure you're connected to the correct network.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-gray-500">No campaigns ready for deployment</p>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{campaign.title}</h3>
                      <p className="text-sm text-gray-600">
                        Goal: {campaign.goalAmount} PLN • Duration: {campaign.duration} days
                      </p>
                      <p className="text-sm text-gray-500">
                        Creator: {campaign.farmerName} • Wallet: {campaign.farmerWallet?.slice(0, 10)}...
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(campaign.farmerWallet)}
                          className="ml-1 h-auto p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(campaign)}
                      
                      {campaign.walletVerified && 
                       (!campaign.blockchainDeployment || campaign.blockchainDeployment.status === 'pending') && (
                        <Button
                          onClick={() => deployCampaignToBlockchain(campaign)}
                          disabled={deploying.has(campaign.id)}
                          size="sm"
                        >
                          {deploying.has(campaign.id) ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            'Deploy to Blockchain'
                          )}
                        </Button>
                      )}
                      
                      {campaign.blockchainDeployment?.status === 'deployed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(
                            `https://sepolia.etherscan.io/tx/${campaign.blockchainDeployment.transactionHash}`,
                            '_blank'
                          )}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Etherscan
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {campaign.walletVerification && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Wallet verified: {new Date(campaign.walletVerification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};