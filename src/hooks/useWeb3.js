// src/hooks/useWeb3.js
import { useState, useEffect, useCallback, useRef } from 'react';
import web3Service from '../services/web3Service';

export const useWeb3 = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifiedFarmer, setIsVerifiedFarmer] = useState(false);
  const eventCleanupRef = useRef(null);

  // Initialize Web3 connection
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const connection = await web3Service.connect();
      
      setIsConnected(true);
      setAccount(connection.account);
      setNetwork(connection.network);
      
      // Check if user is a verified farmer (with error handling)
      try {
        const verified = await web3Service.isVerifiedFarmer();
        setIsVerifiedFarmer(verified);
      } catch (verificationError) {
        console.warn('Could not check farmer verification status:', verificationError);
        setIsVerifiedFarmer(false);
      }
      
      console.log('✅ Web3 connected successfully');
      
    } catch (err) {
      console.error('❌ Web3 connection failed:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect Web3
  const disconnect = useCallback(async () => {
    try {
      await web3Service.disconnect();
      setIsConnected(false);
      setAccount(null);
      setNetwork(null);
      setIsVerifiedFarmer(false);
      setError(null);
      
      // Clean up event listeners
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
      
      console.log('🔌 Web3 disconnected');
      
    } catch (err) {
      console.error('❌ Web3 disconnection failed:', err);
      setError(err.message);
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await web3Service.switchNetwork(chainId);
      
      // Reconnect to update network info
      await connect();
      
    } catch (err) {
      console.error('❌ Network switch failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [connect]);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (web3Service.isConnected()) {
        setIsConnected(true);
        setAccount(web3Service.account);
        setNetwork(web3Service.network);
        
        // Safely check farmer verification
        try {
          const verified = await web3Service.isVerifiedFarmer();
          setIsVerifiedFarmer(verified);
        } catch (err) {
          console.warn('Could not check farmer verification on mount:', err);
          setIsVerifiedFarmer(false);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          connect();
        }
      };

      const handleChainChanged = () => {
        connect(); // Reconnect when chain changes
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, connect, disconnect]);

  return {
    // Connection state
    isConnected,
    account,
    network,
    isLoading,
    error,
    isVerifiedFarmer,
    
    // Connection methods
    connect,
    disconnect,
    switchNetwork,
    
    // Clear error
    clearError: () => setError(null)
  };
};

// Campaign-specific hook
export const useCampaign = (campaignId) => {
  const [campaign, setCampaign] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [userContribution, setUserContribution] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const eventCleanupRef = useRef(null);

  const { isConnected, account } = useWeb3();

  // Load campaign data
  const loadCampaign = useCallback(async () => {
    if (!campaignId || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const [campaignData, milestonesData, rewardsData, contribution] = await Promise.all([
        web3Service.getCampaign(campaignId),
        web3Service.getCampaignMilestones(campaignId),
        web3Service.getCampaignRewards(campaignId),
        account ? web3Service.getUserContribution(campaignId) : '0'
      ]);

      setCampaign(campaignData);
      setMilestones(milestonesData);
      setRewards(rewardsData);
      setUserContribution(contribution);

    } catch (err) {
      console.error('❌ Error loading campaign:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, isConnected, account]);

  // Campaign actions
  const contribute = useCallback(async (amount, rewardTierIndex = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.contributeToToCampaign(
        campaignId, 
        amount, 
        rewardTierIndex
      );

      // Reload campaign data after contribution
      await loadCampaign();

      return result;

    } catch (err) {
      console.error('❌ Error contributing to campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, loadCampaign]);

  const withdrawFunds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.withdrawFunds(campaignId);

      // Reload campaign data after withdrawal
      await loadCampaign();

      return result;

    } catch (err) {
      console.error('❌ Error withdrawing funds:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, loadCampaign]);

  const requestRefund = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.requestRefund(campaignId);

      // Reload campaign data after refund
      await loadCampaign();

      return result;

    } catch (err) {
      console.error('❌ Error requesting refund:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, loadCampaign]);

  const completeMilestone = useCallback(async (milestoneIndex) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.completeMilestone(campaignId, milestoneIndex);

      // Reload campaign data after milestone completion
      await loadCampaign();

      return result;

    } catch (err) {
      console.error('❌ Error completing milestone:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, loadCampaign]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!campaignId || !isConnected) return;

    const setupEventListeners = async () => {
      try {
        const cleanup = await web3Service.listenToEvents(campaignId, (eventData) => {
          console.log('📡 Campaign event received:', eventData);
          
          // Reload campaign data when events occur
          loadCampaign();
        });

        eventCleanupRef.current = cleanup;

      } catch (err) {
        console.warn('Could not set up event listeners:', err);
      }
    };

    setupEventListeners();

    return () => {
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
    };
  }, [campaignId, isConnected, loadCampaign]);

  // Load campaign data when dependencies change
  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  return {
    // Campaign data
    campaign,
    milestones,
    rewards,
    userContribution,
    isLoading,
    error,
    
    // Campaign actions
    contribute,
    withdrawFunds,
    requestRefund,
    completeMilestone,
    
    // Utilities
    loadCampaign,
    clearError: () => setError(null)
  };
};

// Hook for managing multiple campaigns
export const useCampaigns = () => {
  const [farmerCampaigns, setFarmerCampaigns] = useState([]);
  const [backerCampaigns, setBackerCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isConnected, account } = useWeb3();

  // Load user's campaigns
  const loadCampaigns = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      setIsLoading(true);
      setError(null);

      const [farmerIds, backerIds] = await Promise.all([
        web3Service.getFarmerCampaigns(),
        web3Service.getBackerCampaigns()
      ]);

      // Load detailed campaign data
      const [farmerCampaignsData, backerCampaignsData] = await Promise.all([
        Promise.all(farmerIds.map(id => web3Service.getCampaign(id))),
        Promise.all(backerIds.map(id => web3Service.getCampaign(id)))
      ]);

      setFarmerCampaigns(farmerCampaignsData);
      setBackerCampaigns(backerCampaignsData);

    } catch (err) {
      console.error('❌ Error loading campaigns:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, account]);

  // Create new campaign
  const createCampaign = useCallback(async (firebaseId, goalAmountEth, durationDays, campaignType) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.createCampaign(
        firebaseId,
        goalAmountEth,
        durationDays,
        campaignType
      );

      // Reload campaigns after creation
      await loadCampaigns();

      return result;

    } catch (err) {
      console.error('❌ Error creating campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadCampaigns]);

  // Launch campaign
  const launchCampaign = useCallback(async (campaignId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await web3Service.launchCampaign(campaignId);

      // Reload campaigns after launch
      await loadCampaigns();

      return result;

    } catch (err) {
      console.error('❌ Error launching campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadCampaigns]);

  // Load campaigns when connected
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    // Campaign data
    farmerCampaigns,
    backerCampaigns,
    isLoading,
    error,
    
    // Campaign actions
    createCampaign,
    launchCampaign,
    
    // Utilities
    loadCampaigns,
    clearError: () => setError(null)
  };
};