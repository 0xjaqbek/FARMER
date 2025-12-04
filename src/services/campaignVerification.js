// src/services/campaignVerification.js
import { updateCampaign } from '../firebase/crowdfunding';
import { WalletVerificationService } from './walletVerification';

export class CampaignVerificationService {
  constructor() {
    this.walletService = new WalletVerificationService();
  }

  /**
   * Complete campaign creation with wallet verification
   * @param {Object} campaignData - Campaign data
   * @param {Object} userProfile - User profile
   * @returns {Object} Campaign creation result
   */
  async createVerifiedCampaign(campaignData, userProfile) {
    try {
      // 1. Create campaign in Firebase first
      const { createCampaign } = await import('../firebase/crowdfunding');
      const campaignId = await createCampaign({
        ...campaignData,
        status: 'pending_wallet_verification',
        walletVerified: false,
        blockchainDeployment: {
          status: 'pending', // pending, deployed, failed
          contractAddress: null,
          transactionHash: null,
          deployedAt: null,
          deployedBy: null
        }
      });

      // 2. Generate verification message
      const message = this.walletService.generateVerificationMessage(
        campaignId, 
        userProfile.email
      );

      // 3. Request wallet signature
      const signatureData = await this.walletService.signMessage(message);

      // 4. Update campaign with wallet verification
      await updateCampaign(campaignId, {
        walletVerification: {
          address: signatureData.address,
          signature: signatureData.signature,
          message: signatureData.message,
          timestamp: signatureData.timestamp,
          verified: true
        },
        status: 'draft', // Ready for admin review
        walletVerified: true,
        farmerWallet: signatureData.address,
        updatedAt: new Date()
      });

      return {
        success: true,
        campaignId,
        walletAddress: signatureData.address,
        message: 'Campaign created and wallet verified successfully'
      };

    } catch (error) {
      console.error('Campaign verification failed:', error);
      throw new Error(`Campaign verification failed: ${error.message}`);
    }
  }

  /**
   * Verify wallet ownership for existing campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} userProfile - User profile
   */
  async verifyWalletOwnership(campaignId, userProfile) {
    try {
      const message = this.walletService.generateVerificationMessage(
        campaignId, 
        userProfile.email
      );

      const signatureData = await this.walletService.signMessage(message);

      await updateCampaign(campaignId, {
        walletVerification: {
          address: signatureData.address,
          signature: signatureData.signature,
          message: signatureData.message,
          timestamp: signatureData.timestamp,
          verified: true
        },
        walletVerified: true,
        farmerWallet: signatureData.address,
        updatedAt: new Date()
      });

      return {
        success: true,
        walletAddress: signatureData.address
      };

    } catch (error) {
      console.error('Wallet verification failed:', error);
      throw error;
    }
  }
}

