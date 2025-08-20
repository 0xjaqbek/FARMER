// src/services/web3Service.js
import { ethers } from 'ethers';

// Contract ABI (Application Binary Interface)
const CROWDFUNDING_ABI = [
  // Constructor
  "constructor()",
  
  // Events
  "event CampaignCreated(uint256 indexed campaignId, string firebaseId, address indexed farmer, uint256 goalAmount, uint256 deadline, uint8 campaignType)",
  "event ContributionMade(uint256 indexed campaignId, address indexed backer, uint256 amount, uint256 totalRaised)",
  "event CampaignStatusChanged(uint256 indexed campaignId, uint8 oldStatus, uint8 newStatus)",
  "event FundsWithdrawn(uint256 indexed campaignId, address indexed farmer, uint256 amount, uint256 platformFee)",
  "event RefundIssued(uint256 indexed campaignId, address indexed backer, uint256 amount)",
  "event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex, uint256 timestamp)",
  "event FarmerVerified(address indexed farmer, bool verified)",
  "event CampaignVerified(uint256 indexed campaignId, bool verified)",
  
  // Main functions
  "function createCampaign(string memory firebaseId, uint256 goalAmount, uint256 durationDays, uint8 campaignType) external returns (uint256)",
  "function launchCampaign(uint256 campaignId) external",
  "function contribute(uint256 campaignId, uint256 rewardTierIndex) external payable",
  "function withdrawFunds(uint256 campaignId) external",
  "function requestRefund(uint256 campaignId) external",
  "function completeMilestone(uint256 campaignId, uint256 milestoneIndex) external",
  
  // Admin functions
  "function verifyFarmer(address farmer, bool verified) external",
  "function verifyCampaign(uint256 campaignId, bool verified) external",
  "function emergencyStopCampaign(uint256 campaignId, bool stopped) external",
  "function cancelCampaign(uint256 campaignId) external",
  "function setPlatformFeeRate(uint256 feeRate) external",
  
  // View functions (split due to stack limitations)
  "function getCampaignBasic(uint256 campaignId) external view returns (uint256, string, address, uint256, uint256, uint256)",
  "function getCampaignStatus(uint256 campaignId) external view returns (uint256, uint8, uint8, bool, bool, uint256)",
  "function getUserContribution(uint256 campaignId, address user) external view returns (uint256)",
  "function getCampaignMilestones(uint256 campaignId) external view returns (tuple(string description, uint256 amount, bool completed, uint256 completedAt)[])",
  "function getCampaignRewards(uint256 campaignId) external view returns (tuple(uint256 minContribution, string description, uint256 maxBackers, uint256 currentBackers, bool isPhysical)[])",
  "function getFarmerCampaigns(address farmer) external view returns (uint256[])",
  "function getBackerCampaigns(address backer) external view returns (uint256[])",
  "function getTotalCampaigns() external view returns (uint256)",
  "function getCampaignBackers(uint256 campaignId) external view returns (address[])",
  "function verifiedFarmers(address) external view returns (bool)",
  "function platformFeeRate() external view returns (uint256)"
];

// Contract configuration
const CONTRACT_CONFIG = {
  // Deploy this contract to your preferred network
  address: import.meta.env.REACT_APP_CONTRACT_ADDRESS || "0x...", // Replace with deployed contract address
  abi: CROWDFUNDING_ABI,
  
  // Network configuration
  networks: {
    mainnet: {
      chainId: 1,
      name: "Ethereum Mainnet",
      rpc: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
    },
    sepolia: {
      chainId: 11155111,
      name: "Sepolia Testnet", 
      rpc: "https://sepolia.infura.io/v3/1fb2fc8c46f44fc5b86e6c37309ce7a8"
    },
    polygon: {
      chainId: 137,
      name: "Polygon Mainnet",
      rpc: "https://polygon-rpc.com"
    },
    mumbai: {
      chainId: 80001,
      name: "Mumbai Testnet",
      rpc: "https://rpc-mumbai.maticvigil.com"
    }
  }
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.network = null;
  }

  // ============ Connection Management ============

  async connect() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Validate account address
      const accountAddress = accounts[0];
      if (!ethers.isAddress(accountAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accountAddress;

      // Get network information
      this.network = await this.provider.getNetwork();

      // Initialize contract
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi,
        this.signer
      );

      console.log('✅ Web3 connected:', {
        account: this.account,
        network: this.network.name,
        chainId: this.network.chainId
      });

      return {
        account: this.account,
        network: this.network,
        connected: true
      };

    } catch (error) {
      console.error('❌ Web3 connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.network = null;
    console.log('🔌 Web3 disconnected');
  }

  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        const networkConfig = Object.values(CONTRACT_CONFIG.networks)
          .find(net => net.chainId === chainId);
        
        if (networkConfig) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: networkConfig.name,
              rpcUrls: [networkConfig.rpc],
            }],
          });
        }
      }
      throw error;
    }
  }

  isConnected() {
    return !!(this.provider && this.signer && this.account);
  }

  // ============ Campaign Management ============

  async createCampaign(firebaseId, goalAmountEth, durationDays, campaignType) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const goalAmountWei = ethers.parseEther(goalAmountEth.toString());
      
      // Campaign types: 0=PreOrder, 1=Equipment, 2=Expansion, 3=Emergency
      const tx = await this.contract.createCampaign(
        firebaseId,
        goalAmountWei,
        durationDays,
        campaignType
      );

      console.log('🔥 Creating campaign transaction:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract campaign ID from events
      const campaignCreatedEvent = receipt.logs.find(
        log => log.fragment?.name === 'CampaignCreated'
      );
      
      const campaignId = campaignCreatedEvent?.args?.[0];
      
      return {
        success: true,
        campaignId: campaignId?.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error creating campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async launchCampaign(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.launchCampaign(campaignId);
      console.log('🚀 Launching campaign transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error launching campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async contributeToToCampaign(campaignId, amountEth, rewardTierIndex = null) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const amountWei = ethers.parseEther(amountEth.toString());
      const rewardIndex = rewardTierIndex ?? ethers.MaxUint256; // Use MaxUint256 for no reward
      
      const tx = await this.contract.contribute(campaignId, rewardIndex, {
        value: amountWei
      });

      console.log('💰 Contributing to campaign transaction:', tx.hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: amountEth
      };

    } catch (error) {
      console.error('❌ Error contributing to campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async withdrawFunds(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.withdrawFunds(campaignId);
      console.log('💸 Withdrawing funds transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error withdrawing funds:', error);
      throw this.handleContractError(error);
    }
  }

  async requestRefund(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.requestRefund(campaignId);
      console.log('🔄 Requesting refund transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error requesting refund:', error);
      throw this.handleContractError(error);
    }
  }

  async completeMilestone(campaignId, milestoneIndex) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.completeMilestone(campaignId, milestoneIndex);
      console.log('✅ Completing milestone transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error completing milestone:', error);
      throw this.handleContractError(error);
    }
  }

  // ============ Data Retrieval ============

  async getCampaign(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      // Get campaign data using split functions to avoid stack too deep error
      const [basicData, statusData] = await Promise.all([
        this.contract.getCampaignBasic(campaignId),
        this.contract.getCampaignStatus(campaignId)
      ]);
      
      return {
        id: basicData[0].toString(),
        firebaseId: basicData[1],
        farmer: basicData[2],
        goalAmount: ethers.formatEther(basicData[3]),
        raisedAmount: ethers.formatEther(basicData[4]),
        deadline: new Date(Number(basicData[5]) * 1000),
        createdAt: new Date(Number(statusData[0]) * 1000),
        status: this.getStatusName(Number(statusData[1])),
        campaignType: this.getCampaignTypeName(Number(statusData[2])),
        verified: statusData[3],
        fundsWithdrawn: statusData[4],
        backerCount: statusData[5].toString()
      };

    } catch (error) {
      console.error('❌ Error getting campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async getUserContribution(campaignId, userAddress = null) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const address = userAddress || this.account;
      const contribution = await this.contract.getUserContribution(campaignId, address);
      
      return ethers.formatEther(contribution);

    } catch (error) {
      console.error('❌ Error getting user contribution:', error);
      throw this.handleContractError(error);
    }
  }

  async getCampaignMilestones(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const milestones = await this.contract.getCampaignMilestones(campaignId);
      
      return milestones.map(milestone => ({
        description: milestone.description,
        amount: ethers.formatEther(milestone.amount),
        completed: milestone.completed,
        completedAt: milestone.completed ? new Date(Number(milestone.completedAt) * 1000) : null
      }));

    } catch (error) {
      console.error('❌ Error getting campaign milestones:', error);
      throw this.handleContractError(error);
    }
  }

  async getCampaignRewards(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const rewards = await this.contract.getCampaignRewards(campaignId);
      
      return rewards.map(reward => ({
        minContribution: ethers.formatEther(reward.minContribution),
        description: reward.description,
        maxBackers: reward.maxBackers.toString(),
        currentBackers: reward.currentBackers.toString(),
        isPhysical: reward.isPhysical
      }));

    } catch (error) {
      console.error('❌ Error getting campaign rewards:', error);
      throw this.handleContractError(error);
    }
  }

  async getFarmerCampaigns(farmerAddress = null) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const address = farmerAddress || this.account;
      const campaignIds = await this.contract.getFarmerCampaigns(address);
      
      return campaignIds.map(id => id.toString());

    } catch (error) {
      console.error('❌ Error getting farmer campaigns:', error);
      throw this.handleContractError(error);
    }
  }

  async getBackerCampaigns(backerAddress = null) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const address = backerAddress || this.account;
      const campaignIds = await this.contract.getBackerCampaigns(address);
      
      return campaignIds.map(id => id.toString());

    } catch (error) {
      console.error('❌ Error getting backer campaigns:', error);
      throw this.handleContractError(error);
    }
  }

  async isVerifiedFarmer(farmerAddress = null) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const address = farmerAddress || this.account;
      
      // Validate the address format before calling contract
      if (!address || !ethers.isAddress(address)) {
        console.warn('Invalid address provided for farmer verification:', address);
        return false;
      }
      
      return await this.contract.verifiedFarmers(address);

    } catch (error) {
      console.error('❌ Error checking farmer verification:', error);
      // Return false instead of throwing to prevent UI breaks
      return false;
    }
  }

  async getPlatformFeeRate() {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const feeRate = await this.contract.platformFeeRate();
      return Number(feeRate) / 100; // Convert basis points to percentage

    } catch (error) {
      console.error('❌ Error getting platform fee rate:', error);
      throw this.handleContractError(error);
    }
  }

  // ============ Event Listening ============

  async listenToEvents(campaignId, callback) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      // Listen to all campaign-related events
      const eventFilters = [
        this.contract.filters.ContributionMade(campaignId),
        this.contract.filters.CampaignStatusChanged(campaignId),
        this.contract.filters.FundsWithdrawn(campaignId),
        this.contract.filters.RefundIssued(campaignId),
        this.contract.filters.MilestoneCompleted(campaignId),
        this.contract.filters.CampaignVerified(campaignId)
      ];

      const listeners = [];

      for (const filter of eventFilters) {
        const listener = (...args) => {
          const event = args[args.length - 1]; // Last argument is the event object
          callback({
            event: event.fragment.name,
            campaignId: campaignId,
            data: args.slice(0, -1),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        };

        this.contract.on(filter, listener);
        listeners.push({ filter, listener });
      }

      // Return cleanup function
      return () => {
        listeners.forEach(({ filter, listener }) => {
          this.contract.off(filter, listener);
        });
      };

    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
      throw this.handleContractError(error);
    }
  }

  // ============ Utility Functions ============

  getStatusName(statusIndex) {
    const statuses = ['Draft', 'Active', 'Funded', 'Expired', 'Cancelled', 'Completed'];
    return statuses[statusIndex] || 'Unknown';
  }

  getCampaignTypeName(typeIndex) {
    const types = ['PreOrder', 'Equipment', 'Expansion', 'Emergency'];
    return types[typeIndex] || 'Unknown';
  }

  formatEther(weiAmount) {
    return ethers.formatEther(weiAmount);
  }

  parseEther(etherAmount) {
    return ethers.parseEther(etherAmount.toString());
  }

  handleContractError(error) {
    // Parse common contract errors
    if (error.reason) {
      return new Error(error.reason);
    }
    
    if (error.message?.includes('user rejected')) {
      return new Error('Transaction rejected by user');
    }
    
    if (error.message?.includes('insufficient funds')) {
      return new Error('Insufficient funds for transaction');
    }
    
    if (error.message?.includes('execution reverted')) {
      return new Error('Transaction failed - check contract conditions');
    }
    
    return error;
  }

  // ============ Admin Functions (for admin users) ============

  async verifyFarmer(farmerAddress, verified) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.verifyFarmer(farmerAddress, verified);
      console.log('👨‍🌾 Verifying farmer transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error verifying farmer:', error);
      throw this.handleContractError(error);
    }
  }

  async verifyCampaign(campaignId, verified) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.verifyCampaign(campaignId, verified);
      console.log('✅ Verifying campaign transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error verifying campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async emergencyStopCampaign(campaignId, stopped) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.emergencyStopCampaign(campaignId, stopped);
      console.log('🛑 Emergency stop transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error emergency stopping campaign:', error);
      throw this.handleContractError(error);
    }
  }

  async cancelCampaign(campaignId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.cancelCampaign(campaignId);
      console.log('🚫 Canceling campaign transaction:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error canceling campaign:', error);
      throw this.handleContractError(error);
    }
  }
}

// Create singleton instance
const web3Service = new Web3Service();

export default web3Service;

// Export utility functions
export const {
  formatEther,
  parseEther
} = ethers;