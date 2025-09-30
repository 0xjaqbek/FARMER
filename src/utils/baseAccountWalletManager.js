// src/utils/baseAccountWalletManager.js
// Enhanced wallet manager with Base Account support for Mini Apps

import { walletManager } from './walletConnectionManager';

/**
 * Enhanced wallet manager that adds Base Account capabilities
 * on top of the existing wallet connection manager
 */
class BaseAccountWalletManager {
  constructor() {
    this.baseWalletManager = walletManager;
    this.capabilities = {};
    this.isBaseAccount = false;
  }

  static getInstance() {
    if (!BaseAccountWalletManager.instance) {
      BaseAccountWalletManager.instance = new BaseAccountWalletManager();
    }
    return BaseAccountWalletManager.instance;
  }

  /**
   * Connect wallet and detect Base Account capabilities
   */
  async connectWallet(walletType = 'metamask', options = {}) {
    // Use the existing wallet connection manager
    const result = await this.baseWalletManager.connectWallet(walletType, options);

    // Detect Base Account capabilities after connection
    if (walletType === 'metamask' && result.address) {
      await this.detectCapabilities(result.address);
    }

    return {
      ...result,
      isBaseAccount: this.isBaseAccount,
      capabilities: this.capabilities
    };
  }

  /**
   * Detect Base Account capabilities for a connected wallet
   */
  async detectCapabilities(address) {
    if (!window.ethereum || !address) {
      console.log('⚠️ Cannot detect capabilities: no wallet or address');
      return;
    }

    try {
      const BASE_CHAIN_ID = '0x2105'; // Base chain ID

      const caps = await window.ethereum.request({
        method: 'wallet_getCapabilities',
        params: [address]
      });

      const baseCapabilities = caps[BASE_CHAIN_ID] || {};

      this.capabilities = {
        atomicBatch: baseCapabilities.atomicBatch?.supported === true,
        paymasterService: baseCapabilities.paymasterService?.supported === true,
        auxiliaryFunds: baseCapabilities.auxiliaryFunds?.supported === true
      };

      this.isBaseAccount = Object.keys(baseCapabilities).length > 0;

      console.log('🔍 Base Account capabilities:', this.capabilities);
      console.log('✅ Is Base Account:', this.isBaseAccount);

    } catch (error) {
      console.error('❌ Failed to detect Base Account capabilities:', error);
      this.capabilities = {
        atomicBatch: false,
        paymasterService: false,
        auxiliaryFunds: false
      };
      this.isBaseAccount = false;
    }
  }

  /**
   * Send a transaction with optional sponsored gas (paymaster service)
   * @param {object} transaction - Transaction object
   * @param {boolean} useSponsoredGas - Whether to use sponsored gas if available
   * @returns {Promise<string>} - Transaction hash
   */
  async sendTransaction(transaction, useSponsoredGas = true) {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    // If Base Account with paymaster support, add paymaster capability
    if (useSponsoredGas && this.capabilities.paymasterService) {
      console.log('💰 Using sponsored gas (paymaster service)');

      // For writeContracts call
      return await this.sendSponsoredTransaction(transaction);
    }

    // Standard transaction
    console.log('⛽ Using standard gas payment');
    return await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
  }

  /**
   * Send a sponsored transaction using paymaster service
   */
  async sendSponsoredTransaction(transaction) {
    const paymasterUrl = process.env.VITE_PAYMASTER_URL ||
      `https://api.developer.coinbase.com/rpc/v1/base/${process.env.VITE_COINBASE_API_KEY || 'YOUR_API_KEY'}`;

    try {
      // Use experimental wallet_sendCalls with paymaster capability
      const result = await window.ethereum.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x2105', // Base chain
          from: transaction.from,
          calls: [{
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || '0x0'
          }],
          capabilities: {
            paymasterService: {
              url: paymasterUrl
            }
          }
        }]
      });

      console.log('✅ Sponsored transaction sent:', result);
      return result;

    } catch (error) {
      console.error('❌ Sponsored transaction failed, falling back to standard:', error);
      // Fallback to standard transaction
      return await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });
    }
  }

  /**
   * Send multiple transactions as an atomic batch
   * @param {Array} transactions - Array of transaction objects
   * @param {boolean} useSponsoredGas - Whether to use sponsored gas if available
   * @returns {Promise<string>} - Batch transaction hash/ID
   */
  async sendBatchTransactions(transactions, useSponsoredGas = true) {
    if (!this.capabilities.atomicBatch) {
      throw new Error('Atomic batch transactions not supported by this wallet');
    }

    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    const calls = transactions.map(tx => ({
      to: tx.to,
      data: tx.data,
      value: tx.value || '0x0'
    }));

    const capabilities = {};

    if (useSponsoredGas && this.capabilities.paymasterService) {
      const paymasterUrl = process.env.VITE_PAYMASTER_URL ||
        `https://api.developer.coinbase.com/rpc/v1/base/${process.env.VITE_COINBASE_API_KEY || 'YOUR_API_KEY'}`;

      capabilities.paymasterService = { url: paymasterUrl };
      console.log('💰 Using sponsored gas for batch transaction');
    }

    try {
      const result = await window.ethereum.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x2105', // Base chain
          from: transactions[0].from,
          calls,
          capabilities
        }]
      });

      console.log('✅ Batch transaction sent:', result);
      return result;

    } catch (error) {
      console.error('❌ Batch transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet capabilities
   */
  getCapabilities() {
    return {
      ...this.capabilities,
      isBaseAccount: this.isBaseAccount
    };
  }

  /**
   * Check if connected to a Base Account
   */
  isConnectedToBaseAccount() {
    return this.isBaseAccount;
  }

  /**
   * Passthrough methods to base wallet manager
   */
  async disconnectWallet(walletType) {
    this.capabilities = {};
    this.isBaseAccount = false;
    return await this.baseWalletManager.disconnectWallet(walletType);
  }

  async switchNetwork(chainId, networkConfig) {
    return await this.baseWalletManager.switchNetwork(chainId, networkConfig);
  }

  getWalletInfo(walletType) {
    const info = this.baseWalletManager.getWalletInfo(walletType);
    if (info) {
      return {
        ...info,
        isBaseAccount: this.isBaseAccount,
        capabilities: this.capabilities
      };
    }
    return null;
  }

  isWalletConnected(walletType) {
    return this.baseWalletManager.isWalletConnected(walletType);
  }

  getStatus() {
    return {
      ...this.baseWalletManager.getStatus(),
      isBaseAccount: this.isBaseAccount,
      capabilities: this.capabilities
    };
  }
}

// Export singleton instance
export const baseAccountWalletManager = BaseAccountWalletManager.getInstance();

// Export helper function for easy transaction sending
export async function sendTransactionWithCapabilities(transaction, options = {}) {
  const manager = BaseAccountWalletManager.getInstance();
  const { useSponsoredGas = true } = options;
  return await manager.sendTransaction(transaction, useSponsoredGas);
}

// Export helper function for batch transactions
export async function sendBatchTransactions(transactions, options = {}) {
  const manager = BaseAccountWalletManager.getInstance();
  const { useSponsoredGas = true } = options;
  return await manager.sendBatchTransactions(transactions, useSponsoredGas);
}