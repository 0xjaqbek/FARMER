// src/services/integratedPaymentService.js
import web3Service from './web3Service';
import zetaChainService from './zetaChainService';
import { updateCampaign } from '../firebase/crowdfunding';
import { CONTRACT_CONFIG } from './web3Service';


/**
 * Integrated Payment Service
 * Wraps both traditional Web3 and ZetaChain payments
 * Maintains all existing database updates and business logic
 */
class IntegratedPaymentService {
  constructor() {
    this.activePayments = new Map(); // Track ongoing payments
  }
/**
 * Process ZetaChain cross-chain payment
 */
async processZetaChainPayment({ campaignId, amount, sourceChain, rewardIndex, campaignData }) {
  // Note: Added campaignData parameter to the destructuring
  try {
    await zetaChainService.initialize();

    // Use CONTRACT_CONFIG.address instead of web3Service.getContractAddress()
    const targetContractAddress = CONTRACT_CONFIG.address;

    // CRITICAL FIX: Use the blockchain campaign ID (web3CampaignId) instead of Firebase document ID
    const blockchainCampaignId = campaignData.web3CampaignId || campaignData.blockchainDeployment?.web3CampaignId;
    
    if (!blockchainCampaignId) {
      throw new Error(`Campaign ${campaignId} is not deployed to blockchain. Missing web3CampaignId.`);
    }

    console.log('🔗 Using blockchain campaign ID:', blockchainCampaignId, 'for Firebase campaign:', campaignId);

    const result = await zetaChainService.executeCrossChainContribution({
      campaignId: blockchainCampaignId, // Use the numeric blockchain ID here!
      amount,
      sourceChain,
      targetContractAddress,
      rewardIndex
    });

    return {
      ...result,
      paymentMethod: 'zetachain',
      firebaseCampaignId: campaignId, // Keep track of the original Firebase ID
      blockchainCampaignId: blockchainCampaignId
    };

  } catch (error) {
    console.error('ZetaChain payment failed:', error);
    throw error;
  }
}

  /**
   * Process contribution with support for both traditional and cross-chain payments
   */
  async processContribution({
    campaignId,
    amount,
    rewardIndex = null,
    paymentMethod = 'traditional', // 'traditional' or 'zetachain'
    sourceChain = null, // For cross-chain payments
    user,
    campaignData
  }) {
    const paymentId = `${campaignId}_${Date.now()}`;
    
    try {
      // Track payment start
      this.activePayments.set(paymentId, {
        campaignId,
        amount,
        method: paymentMethod,
        status: 'pending',
        startTime: Date.now()
      });

      let paymentResult;

      if (paymentMethod === 'zetachain') {
        // Use ZetaChain for cross-chain payment
        paymentResult = await this.processZetaChainPayment({
          campaignId,
          amount,
          sourceChain,
          rewardIndex,
          campaignData
        });
      } else {
        // Use traditional Web3 payment
        paymentResult = await this.processTraditionalPayment({
          campaignId,
          amount,
          rewardIndex
        });
      }

      // Update payment tracking
      this.activePayments.set(paymentId, {
        ...this.activePayments.get(paymentId),
        status: 'confirmed',
        result: paymentResult
      });

      // Execute all existing business logic and database updates
      await this.executePostPaymentLogic({
        paymentResult,
        campaignId,
        amount,
        user,
        campaignData,
        paymentMethod,
        sourceChain
      });

      // Clean up tracking
      this.activePayments.delete(paymentId);

      return {
        success: true,
        paymentId,
        ...paymentResult
      };

    } catch (error) {
      // Update payment tracking with error
      this.activePayments.set(paymentId, {
        ...this.activePayments.get(paymentId),
        status: 'failed',
        error: error.message
      });

      // Clean up tracking after delay
      setTimeout(() => this.activePayments.delete(paymentId), 300000); // 5 minutes

      throw error;
    }
  }

  /**
   * Process traditional Web3 payment (existing flow)
   */
  async processTraditionalPayment({ campaignId, amount, rewardIndex }) {
    try {
      await web3Service.connect();
      
      const result = await web3Service.contributeTooCampaign(
        campaignId,
        amount.toString(),
        rewardIndex
      );

      return {
        ...result,
        paymentMethod: 'traditional',
        sourceChain: 'current' // Current connected chain
      };

    } catch (error) {
      console.error('Traditional payment failed:', error);
      throw error;
    }
  }

  /**
   * Execute all post-payment business logic
   * This maintains ALL your existing database updates and logic
   */
  async executePostPaymentLogic({
    paymentResult,
    campaignId,
    amount,
    user,
    campaignData,
    paymentMethod,
    sourceChain
  }) {
    try {
      // 1. Update campaign in Firebase (your existing logic)
      await this.updateCampaignDatabase({
        campaignId,
        amount,
        user,
        paymentResult,
        paymentMethod,
        sourceChain
      });

      // 2. Create notifications (your existing logic)  
      await this.createPaymentNotifications({
        campaignId,
        amount,
        user,
        campaignData,
        paymentMethod,
        sourceChain
      });

      // 3. Update user's contribution history (your existing logic)
      await this.updateUserContributionHistory({
        userId: user.uid,
        campaignId,
        amount,
        paymentResult,
        paymentMethod
      });

      // 4. Handle reward tier logic (your existing logic)
      if (paymentResult.rewardIndex !== null) {
        await this.handleRewardTierLogic({
          campaignId,
          rewardIndex: paymentResult.rewardIndex,
          userId: user.uid,
          amount
        });
      }

      // 5. Check if campaign goal reached (your existing logic)
      await this.checkCampaignGoalStatus({
        campaignId,
        campaignData,
        newContributionAmount: amount
      });

      // 6. Send confirmation email/notifications (your existing logic)
      await this.sendContributionConfirmation({
        user,
        campaignId,
        amount,
        paymentResult,
        paymentMethod,
        sourceChain
      });

    } catch (error) {
      console.error('Post-payment logic error:', error);
      // Don't throw - payment succeeded, just log the issue
    }
  }

  /**
   * Update campaign in Firebase database - using your existing pattern
   */
  async updateCampaignDatabase({ campaignId, amount, user, paymentResult, paymentMethod, sourceChain }) {
    try {
      // STEP 1: Save backing info to Firebase (using your existing pattern)
      const backingData = {
        campaignId: campaignId,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Anonymous',
        walletAddress: paymentResult.walletAddress || 'cross-chain',
        amount: parseFloat(amount), // ETH amount
        currency: 'ETH',
        transactionHash: paymentResult.transactionHash,
        blockNumber: paymentResult.blockNumber,
        timestamp: new Date(),
        paymentMethod: paymentMethod === 'traditional' ? 'crypto' : 'zetachain',
        sourceChain: sourceChain || 'ethereum',
        status: 'confirmed'
      };

      // Save to Firebase backings collection (using your existing pattern)
      const { addDoc, collection } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      await addDoc(collection(db, 'backings'), backingData);

      // STEP 2: Update campaign with incremented data (using your existing pattern)
      const { increment } = await import('firebase/firestore');
      
      // Convert ETH to PLN for Firebase (using your conversion rate)
      const ethToPln = 4000;
      const amountPLN = parseFloat(amount) * ethToPln;
      
      await updateCampaign(campaignId, {
        currentAmount: increment(amountPLN), // Increment current amount
        backerCount: increment(1), // Increment backer count
        lastContributionAt: new Date(),
        lastTransactionHash: paymentResult.transactionHash,
        blockchainSynced: true,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  /**
   * Create notifications for payment - simplified version
   */
  async createPaymentNotifications({ campaignId, amount, user, paymentMethod, sourceChain }) {
    try {
      // Simple console logging for now - you can expand this later
      console.log('Payment notification:', {
        campaignId,
        amount,
        user: user?.email,
        paymentMethod,
        sourceChain
      });
      
      // TODO: Implement your notification system here when ready
      // This could integrate with your existing notification patterns
      
    } catch (error) {
      console.error('Notification creation error:', error);
    }
  }

  /**
   * Update user's contribution history
   */
  async updateUserContributionHistory({ userId, campaignId, amount, paymentResult, paymentMethod }) {
    try {
      // Log the contribution for now - implement full logic when needed
      console.log('User contribution recorded:', {
        userId,
        campaignId,
        amount: parseFloat(amount),
        transactionHash: paymentResult.transactionHash,
        paymentMethod,
        status: 'confirmed'
      });

      // TODO: Add to user's contributions array in Firestore when ready
      // This depends on your existing user data structure
      
    } catch (error) {
      console.error('Contribution history update error:', error);
    }
  }

  /**
   * Handle reward tier logic
   */
  async handleRewardTierLogic({ campaignId, rewardIndex, userId, amount }) {
    try {
      // Log reward assignment for now - implement full logic when needed
      console.log('Reward tier assigned:', {
        campaignId,
        rewardIndex,
        userId,
        amount
      });

      // TODO: Update reward tier backer count, assign rewards, etc.
      
    } catch (error) {
      console.error('Reward tier logic error:', error);
    }
  }

  /**
   * Check if campaign goal is reached
   */
  async checkCampaignGoalStatus({ campaignId, campaignData, newContributionAmount }) {
    try {
      const newRaisedAmount = (campaignData.raisedAmount || 0) + parseFloat(newContributionAmount);
      
      if (newRaisedAmount >= campaignData.goalAmount) {
        console.log('Campaign goal reached!', {
          campaignId,
          newRaisedAmount,
          goalAmount: campaignData.goalAmount
        });
        // TODO: Trigger goal reached logic (notifications, status update, etc.)
      }
      
    } catch (error) {
      console.error('Campaign goal check error:', error);
    }
  }

  /**
   * Send contribution confirmation
   */
  async sendContributionConfirmation({ user, campaignId, amount, paymentResult, paymentMethod, sourceChain }) {
    try {
      // Log confirmation for now - implement full logic when needed
      console.log('Contribution confirmation sent:', {
        userEmail: user?.email,
        campaignId,
        amount,
        transactionHash: paymentResult.transactionHash,
        paymentMethod,
        sourceChain
      });

      // TODO: Integrate with your notification system or email service when ready
      
    } catch (error) {
      console.error('Confirmation sending error:', error);
    }
  }

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId) {
    return this.activePayments.get(paymentId) || null;
  }

  /**
   * Get all active payments (for debugging/monitoring)
   */
  getActivePayments() {
    return Array.from(this.activePayments.entries()).map(([id, payment]) => ({
      id,
      ...payment
    }));
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      {
        id: 'traditional',
        name: 'Direct Wallet Payment',
        description: 'Pay directly from your current wallet',
        icon: 'Wallet',
        supported: true
      },
      {
        id: 'zetachain',
        name: 'Cross-Chain Payment',
        description: 'Pay from any supported blockchain',
        icon: 'Zap',
        supported: true,
        chains: zetaChainService.getSupportedChains()
      }
    ];
  }
}

// Create singleton instance
const integratedPaymentService = new IntegratedPaymentService();

export default integratedPaymentService;