// src/services/firebaseWeb3Bridge.js
import web3Service from './web3Service';
import { 
  createCampaign as createFirebaseCampaign,
  updateCampaign as updateFirebaseCampaign,
  getCampaignById,
  backCampaign as backFirebaseCampaign,
  launchCampaign as launchFirebaseCampaign
} from '../firebase/crowdfunding';

/**
 * Bridge service that synchronizes Firebase and Web3 data
 * Ensures consistency between off-chain (Firebase) and on-chain (Ethereum) states
 */
class FirebaseWeb3Bridge {
  constructor() {
    this.syncInProgress = new Set(); // Track ongoing sync operations
  }

  // ============ Campaign Creation & Management ============

  /**
   * Create a campaign with both Firebase and Web3 integration
   * @param {Object} campaignData - Campaign data for Firebase
   * @param {Object} web3Data - Web3-specific data (goalAmount, duration, type)
   * @param {Object} userProfile - Current user profile
   */
  async createCampaign(campaignData, web3Data, userProfile) {
    let firebaseCampaignId = null; // Declare outside try block
    
    try {
      console.log('🌉 Creating hybrid Firebase-Web3 campaign...');

      // Step 1: Create campaign in Firebase first (draft state)
      firebaseCampaignId = await createFirebaseCampaign({
        ...campaignData,
        status: 'draft',
        web3Enabled: true,
        web3Data: {
          goalAmountEth: web3Data.goalAmountEth,
          durationDays: web3Data.durationDays,
          campaignType: web3Data.campaignType
        },
        farmerId: userProfile.uid,
        farmName: userProfile.displayName || userProfile.farmName,
        farmerWallet: web3Service.account // Store farmer's wallet address
      });

      console.log('✅ Firebase campaign created:', firebaseCampaignId);

      // Step 2: Create campaign on blockchain
      const web3Result = await web3Service.createCampaign(
        firebaseCampaignId, // Use Firebase ID as reference
        web3Data.goalAmountEth,
        web3Data.durationDays,
        web3Data.campaignType
      );

      console.log('✅ Web3 campaign created:', web3Result);

      // Step 3: Update Firebase with Web3 details
      await updateFirebaseCampaign(firebaseCampaignId, {
        web3CampaignId: web3Result.campaignId,
        web3TransactionHash: web3Result.transactionHash,
        web3Status: 'created',
        blockchainSynced: true,
        updatedAt: new Date()
      });

      return {
        firebaseId: firebaseCampaignId,
        web3Id: web3Result.campaignId,
        transactionHash: web3Result.transactionHash,
        success: true
      };

    } catch (error) {
      console.error('❌ Error creating hybrid campaign:', error);
      
      // If Web3 creation failed, update Firebase to reflect error
      if (firebaseCampaignId) {
        try {
          await updateFirebaseCampaign(firebaseCampaignId, {
            web3Status: 'error',
            web3Error: error.message,
            blockchainSynced: false
          });
        } catch (updateError) {
          console.error('❌ Error updating Firebase with error status:', updateError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Launch a campaign (activate it on blockchain)
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async launchCampaign(firebaseCampaignId) {
    try {
      console.log('🚀 Launching hybrid campaign:', firebaseCampaignId);

      // Get campaign from Firebase
      const campaign = await getCampaignById(firebaseCampaignId);
      if (!campaign.web3CampaignId) {
        throw new Error('Campaign not linked to blockchain');
      }

      // Launch on blockchain
      const web3Result = await web3Service.launchCampaign(campaign.web3CampaignId);

      // Update Firebase status
      await Promise.all([
        launchFirebaseCampaign(firebaseCampaignId),
        updateFirebaseCampaign(firebaseCampaignId, {
          web3Status: 'active',
          launchTransactionHash: web3Result.transactionHash,
          blockchainSynced: true
        })
      ]);

      return {
        firebaseId: firebaseCampaignId,
        web3Id: campaign.web3CampaignId,
        transactionHash: web3Result.transactionHash,
        success: true
      };

    } catch (error) {
      console.error('❌ Error launching hybrid campaign:', error);
      
      // Update Firebase with error status
      await updateFirebaseCampaign(firebaseCampaignId, {
        web3Status: 'error',
        web3Error: error.message,
        blockchainSynced: false
      });
      
      throw error;
    }
  }

  /**
   * Back a campaign with both Firebase and Web3 recording
   * @param {string} firebaseCampaignId - Firebase campaign ID
   * @param {string} backerId - Backer's user ID
   * @param {number} amountEth - Amount in ETH
   * @param {Object} rewardTier - Selected reward tier
   * @param {number} rewardTierIndex - Blockchain reward tier index
   */
  async backCampaign(firebaseCampaignId, backerId, amountEth, rewardTier = null, rewardTierIndex = null) {
    try {
      console.log('💰 Processing hybrid campaign backing...', {
        firebaseCampaignId,
        backerId,
        amountEth,
        rewardTierIndex
      });

      // Get campaign from Firebase
      const campaign = await getCampaignById(firebaseCampaignId);
      if (!campaign.web3CampaignId) {
        throw new Error('Campaign not linked to blockchain');
      }

      // Step 1: Create blockchain contribution
      const web3Result = await web3Service.contributeToToCampaign(
        campaign.web3CampaignId,
        amountEth,
        rewardTierIndex
      );

      console.log('✅ Blockchain contribution successful:', web3Result);

      // Step 2: Record in Firebase
      const firebaseBackingId = await backFirebaseCampaign(
        firebaseCampaignId,
        backerId,
        amountEth, // Store ETH amount
        rewardTier
      );

      // Step 3: Update Firebase backing with Web3 details
      await updateFirebaseCampaign(firebaseCampaignId, {
        web3Status: 'active',
        lastBackingTransactionHash: web3Result.transactionHash,
        blockchainSynced: true
      });

      // Step 4: Sync campaign totals from blockchain
      await this.syncCampaignTotals(firebaseCampaignId);

      return {
        firebaseBackingId,
        web3TransactionHash: web3Result.transactionHash,
        amount: amountEth,
        success: true
      };

    } catch (error) {
      console.error('❌ Error backing hybrid campaign:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from successful campaign
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async withdrawFunds(firebaseCampaignId) {
    try {
      console.log('💸 Processing funds withdrawal...', firebaseCampaignId);

      // Get campaign from Firebase
      const campaign = await getCampaignById(firebaseCampaignId);
      if (!campaign.web3CampaignId) {
        throw new Error('Campaign not linked to blockchain');
      }

      // Withdraw from blockchain
      const web3Result = await web3Service.withdrawFunds(campaign.web3CampaignId);

      // Update Firebase
      await updateFirebaseCampaign(firebaseCampaignId, {
        status: 'completed',
        web3Status: 'funds_withdrawn',
        withdrawalTransactionHash: web3Result.transactionHash,
        fundsWithdrawn: true,
        withdrawnAt: new Date(),
        blockchainSynced: true
      });

      return {
        transactionHash: web3Result.transactionHash,
        success: true
      };

    } catch (error) {
      console.error('❌ Error withdrawing funds:', error);
      throw error;
    }
  }

  /**
   * Request refund for failed campaign
   * @param {string} firebaseCampaignId - Firebase campaign ID
   * @param {string} backerId - Backer's user ID
   */
  async requestRefund(firebaseCampaignId, backerId) {
    try {
      console.log('🔄 Processing refund request...', { firebaseCampaignId, backerId });

      // Get campaign from Firebase
      const campaign = await getCampaignById(firebaseCampaignId);
      if (!campaign.web3CampaignId) {
        throw new Error('Campaign not linked to blockchain');
      }

      // Request refund from blockchain
      const web3Result = await web3Service.requestRefund(campaign.web3CampaignId);

      // Update Firebase backing status
      // Note: You'll need to implement updateBacking function in crowdfunding.js
      // await updateBacking(backingId, { status: 'refunded', refundTransactionHash: web3Result.transactionHash });

      return {
        transactionHash: web3Result.transactionHash,
        success: true
      };

    } catch (error) {
      console.error('❌ Error requesting refund:', error);
      throw error;
    }
  }

  // ============ Synchronization Functions ============

  /**
   * Sync campaign totals from blockchain to Firebase
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async syncCampaignTotals(firebaseCampaignId) {
    if (this.syncInProgress.has(firebaseCampaignId)) {
      console.log('⏳ Sync already in progress for campaign:', firebaseCampaignId);
      return;
    }

    try {
      this.syncInProgress.add(firebaseCampaignId);
      console.log('🔄 Syncing campaign totals from blockchain...', firebaseCampaignId);

      // Get campaign from Firebase
      const firebaseCampaign = await getCampaignById(firebaseCampaignId);
      if (!firebaseCampaign.web3CampaignId) {
        console.warn('Campaign not linked to blockchain, skipping sync');
        return;
      }

      // Get current state from blockchain
      const web3Campaign = await web3Service.getCampaign(firebaseCampaign.web3CampaignId);

      // Update Firebase with blockchain data
      await updateFirebaseCampaign(firebaseCampaignId, {
        currentAmount: parseFloat(web3Campaign.raisedAmount),
        backerCount: parseInt(web3Campaign.backerCount),
        web3Status: web3Campaign.status.toLowerCase(),
        blockchainSynced: true,
        lastSyncedAt: new Date()
      });

      console.log('✅ Campaign totals synced successfully');

    } catch (error) {
      console.error('❌ Error syncing campaign totals:', error);
    } finally {
      this.syncInProgress.delete(firebaseCampaignId);
    }
  }

  /**
   * Sync multiple campaigns from blockchain
   * @param {Array} firebaseCampaignIds - Array of Firebase campaign IDs
   */
  async syncMultipleCampaigns(firebaseCampaignIds) {
    console.log('🔄 Syncing multiple campaigns...', firebaseCampaignIds.length);

    const syncPromises = firebaseCampaignIds.map(id => 
      this.syncCampaignTotals(id).catch(error => 
        console.error(`Failed to sync campaign ${id}:`, error)
      )
    );

    await Promise.allSettled(syncPromises);
    console.log('✅ Bulk campaign sync completed');
  }

  /**
   * Verify blockchain data matches Firebase data
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async verifyCampaignConsistency(firebaseCampaignId) {
    try {
      console.log('🔍 Verifying campaign consistency...', firebaseCampaignId);

      const firebaseCampaign = await getCampaignById(firebaseCampaignId);
      if (!firebaseCampaign.web3CampaignId) {
        return { consistent: false, reason: 'No blockchain link' };
      }

      const web3Campaign = await web3Service.getCampaign(firebaseCampaign.web3CampaignId);

      const issues = [];

      // Check goal amount
      if (Math.abs(firebaseCampaign.goalAmount - parseFloat(web3Campaign.goalAmount)) > 0.001) {
        issues.push('Goal amount mismatch');
      }

      // Check raised amount
      if (Math.abs(firebaseCampaign.currentAmount - parseFloat(web3Campaign.raisedAmount)) > 0.001) {
        issues.push('Raised amount mismatch');
      }

      // Check backer count
      if (firebaseCampaign.backerCount !== parseInt(web3Campaign.backerCount)) {
        issues.push('Backer count mismatch');
      }

      // Check status alignment
      const statusMapping = {
        'draft': 'Draft',
        'active': 'Active',
        'funded': 'Funded',
        'expired': 'Expired',
        'cancelled': 'Cancelled',
        'completed': 'Completed'
      };

      if (statusMapping[firebaseCampaign.status] !== web3Campaign.status) {
        issues.push('Status mismatch');
      }

      return {
        consistent: issues.length === 0,
        issues,
        firebaseData: {
          goalAmount: firebaseCampaign.goalAmount,
          currentAmount: firebaseCampaign.currentAmount,
          backerCount: firebaseCampaign.backerCount,
          status: firebaseCampaign.status
        },
        blockchainData: {
          goalAmount: parseFloat(web3Campaign.goalAmount),
          currentAmount: parseFloat(web3Campaign.raisedAmount),
          backerCount: parseInt(web3Campaign.backerCount),
          status: web3Campaign.status
        }
      };

    } catch (error) {
      console.error('❌ Error verifying campaign consistency:', error);
      return { consistent: false, error: error.message };
    }
  }

  // ============ Event Monitoring ============

  /**
   * Set up event listeners for blockchain events and sync to Firebase
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async startEventMonitoring(firebaseCampaignId) {
    try {
      const campaign = await getCampaignById(firebaseCampaignId);
      if (!campaign.web3CampaignId) {
        throw new Error('Campaign not linked to blockchain');
      }

      console.log('📡 Starting event monitoring for campaign:', firebaseCampaignId);

      const cleanup = await web3Service.listenToEvents(campaign.web3CampaignId, async (eventData) => {
        console.log('📡 Blockchain event received:', eventData);

        try {
          switch (eventData.event) {
            case 'ContributionMade':
              await this.syncCampaignTotals(firebaseCampaignId);
              break;

            case 'CampaignStatusChanged':
              await this.syncCampaignTotals(firebaseCampaignId);
              break;

            case 'FundsWithdrawn':
              await updateFirebaseCampaign(firebaseCampaignId, {
                status: 'completed',
                fundsWithdrawn: true,
                withdrawnAt: new Date()
              });
              break;

            case 'MilestoneCompleted':
              // Update milestone status in Firebase
              // You'll need to implement milestone updates in Firebase
              console.log('Milestone completed event received');
              break;

            default:
              console.log('Unhandled event type:', eventData.event);
          }
        } catch (error) {
          console.error('Error processing blockchain event:', error);
        }
      });

      return cleanup;

    } catch (error) {
      console.error('❌ Error starting event monitoring:', error);
      throw error;
    }
  }

  // ============ Utility Functions ============

  /**
   * Get campaign type index for blockchain
   * @param {string} campaignType - Firebase campaign type
   */
  getCampaignTypeIndex(campaignType) {
    const typeMapping = {
      'preorder': 0,
      'equipment': 1,
      'expansion': 2,
      'emergency': 3
    };
    return typeMapping[campaignType.toLowerCase()] || 0;
  }

  /**
   * Convert ETH to Wei for blockchain transactions
   * @param {number} ethAmount - Amount in ETH
   */
  ethToWei(ethAmount) {
    return web3Service.parseEther(ethAmount);
  }

  /**
   * Convert Wei to ETH for display
   * @param {string} weiAmount - Amount in Wei
   */
  weiToEth(weiAmount) {
    return web3Service.formatEther(weiAmount);
  }

  /**
   * Check if user's wallet matches farmer's wallet for campaign
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async isUserCampaignOwner(firebaseCampaignId) {
    try {
      const campaign = await getCampaignById(firebaseCampaignId);
      return campaign.farmerWallet?.toLowerCase() === web3Service.account?.toLowerCase();
    } catch (error) {
      console.error('Error checking campaign ownership:', error);
      return false;
    }
  }

  /**
   * Get comprehensive campaign data (Firebase + Web3)
   * @param {string} firebaseCampaignId - Firebase campaign ID
   */
  async getHybridCampaignData(firebaseCampaignId) {
    try {
      console.log('📊 Loading hybrid campaign data...', firebaseCampaignId);

      const firebaseCampaign = await getCampaignById(firebaseCampaignId);
      
      let web3Data = null;
      let milestones = [];
      let rewards = [];

      if (firebaseCampaign.web3CampaignId && web3Service.isConnected()) {
        try {
          [web3Data, milestones, rewards] = await Promise.all([
            web3Service.getCampaign(firebaseCampaign.web3CampaignId),
            web3Service.getCampaignMilestones(firebaseCampaign.web3CampaignId),
            web3Service.getCampaignRewards(firebaseCampaign.web3CampaignId)
          ]);
        } catch (error) {
          console.warn('Could not load Web3 data:', error);
        }
      }

      return {
        firebase: firebaseCampaign,
        web3: web3Data,
        milestones,
        rewards,
        isConsistent: web3Data ? await this.verifyCampaignConsistency(firebaseCampaignId) : null
      };

    } catch (error) {
      console.error('❌ Error loading hybrid campaign data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const firebaseWeb3Bridge = new FirebaseWeb3Bridge();

export default firebaseWeb3Bridge;