// src/services/walletVerification.js
import { ethers } from 'ethers';

export class WalletVerificationService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  async initializeProvider() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  /**
   * Generate a unique message for the user to sign
   * @param {string} campaignId - Firebase campaign ID
   * @param {string} userEmail - User's email for verification
   * @returns {string} Message to sign
   */
  generateVerificationMessage(campaignId, userEmail) {
    const timestamp = Date.now();
    const message = `Farm Direct Campaign Ownership Verification
    
Campaign ID: ${campaignId}
Email: ${userEmail}
Timestamp: ${timestamp}
    
By signing this message, I confirm that I am the creator of this campaign and the owner of this wallet address.`;
    
    return message;
  }

  /**
   * Sign a message with the user's wallet
   * @param {string} message - Message to sign
   * @returns {Object} Signature data
   */
  async signMessage(message) {
    if (!this.signer) {
      await this.initializeProvider();
    }

    const address = await this.signer.getAddress();
    const signature = await this.signer.signMessage(message);
    
    return {
      address,
      signature,
      message,
      timestamp: Date.now()
    };
  }

  /**
   * Verify a signature (can be done server-side or client-side)
   * @param {string} message - Original message
   * @param {string} signature - Signature to verify
   * @param {string} expectedAddress - Expected signer address
   * @returns {boolean} Whether signature is valid
   */
  static verifySignature(message, signature, expectedAddress) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}

