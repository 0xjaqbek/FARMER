// src/utils/walletConnectionManager.js
// Centralized wallet connection manager to prevent double wallet prompts

import { useState, useCallback } from 'react';

class WalletConnectionManager {
  constructor() {
    this.isConnecting = false;
    this.connectionPromise = null;
    this.connectedWallets = new Map();
    this.eventListeners = new Set();
  }

  // Singleton pattern
  static getInstance() {
    if (!WalletConnectionManager.instance) {
      WalletConnectionManager.instance = new WalletConnectionManager();
    }
    return WalletConnectionManager.instance;
  }

  // Connect wallet with deduplication
  async connectWallet(walletType = 'metamask', options = {}) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ Wallet connection already in progress, waiting...');
      return await this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._performConnection(walletType, options);

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  async _performConnection(walletType, options) {
    try {
      console.log(`🔗 Connecting to ${walletType} wallet...`);

      // Use options for wallet-specific configuration
      const config = {
        timeout: options.timeout || 30000,
        retries: options.retries || 1,
        network: options.network || 'mainnet',
        ...options
      };

      switch (walletType) {
        case 'metamask':
          return await this._connectMetaMask(config);
        case 'solana':
          return await this._connectSolana(config);
        case 'bitcoin':
          return await this._connectBitcoin(config);
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error(`❌ Failed to connect ${walletType} wallet:`, error);
      throw error;
    }
  }

  async _connectMetaMask(options) {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    // Check if already connected
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      console.log('✅ MetaMask already connected:', accounts[0]);
      const result = {
        address: accounts[0],
        network: await this._getCurrentNetwork(),
        chainId: await window.ethereum.request({ method: 'eth_chainId' })
      };
      this.connectedWallets.set('metamask', result);
      return result;
    }

    // Request connection with timeout
    const connectWithTimeout = () => {
      return Promise.race([
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), options.timeout)
        )
      ]);
    };

    const requestedAccounts = await connectWithTimeout();

    const result = {
      address: requestedAccounts[0],
      network: await this._getCurrentNetwork(),
      chainId: await window.ethereum.request({ method: 'eth_chainId' })
    };

    this.connectedWallets.set('metamask', result);
    
    // Set up event listeners only once
    this._setupMetaMaskEventListeners();
    
    return result;
  }

  async _connectSolana(options) {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    if (window.solana.isConnected) {
      console.log('✅ Phantom already connected');
      const result = {
        address: window.solana.publicKey.toString(),
        network: options.network || 'solana-mainnet'
      };
      this.connectedWallets.set('solana', result);
      return result;
    }

    // Connect with timeout
    const connectWithTimeout = () => {
      return Promise.race([
        window.solana.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Solana connection timeout')), options.timeout)
        )
      ]);
    };

    const resp = await connectWithTimeout();
    const result = {
      address: resp.publicKey.toString(),
      network: options.network || 'solana-mainnet'
    };

    this.connectedWallets.set('solana', result);
    return result;
  }

  async _connectBitcoin(options) {
    const preferredWallet = options.preferredWallet || 'unisat';
    
    if (preferredWallet === 'unisat' && window.unisat) {
      const accounts = await window.unisat.requestAccounts();
      const result = {
        address: accounts[0],
        network: options.network || 'btc-mainnet',
        wallet: 'unisat'
      };
      this.connectedWallets.set('bitcoin', result);
      return result;
    } else if (window.xverse) {
      // Xverse connection logic
      const response = await window.XverseProviders.BitcoinProvider.request('getAddresses', {
        payload: {
          purposes: ['ordinals', 'payment'],
          message: 'Connect for cross-chain payments',
        },
      });
      const result = {
        address: response.addresses[0].address,
        network: options.network || 'btc-mainnet',
        wallet: 'xverse'
      };
      this.connectedWallets.set('bitcoin', result);
      return result;
    } else {
      throw new Error('Bitcoin wallet not found. Please install Unisat or Xverse wallet.');
    }
  }

  async _getCurrentNetwork() {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networks = {
        '0x1': 'ethereum',
        '0x89': 'polygon',
        '0x38': 'bsc',
        '0xa86a': 'avalanche',
        '0xa4b1': 'arbitrum',
        '0xaa36a7': 'sepolia'
      };
      return networks[chainId] || 'unknown';
    } catch  {
      return 'unknown';
    }
  }

  _setupMetaMaskEventListeners() {
    // Prevent duplicate event listeners
    if (this.eventListeners.has('metamask')) return;

    const handleAccountsChanged = (accounts) => {
      console.log('👤 MetaMask accounts changed:', accounts);
      if (accounts.length === 0) {
        this.connectedWallets.delete('metamask');
        window.dispatchEvent(new CustomEvent('wallet-disconnected', { detail: { wallet: 'metamask' } }));
      } else {
        const updated = { ...this.connectedWallets.get('metamask'), address: accounts[0] };
        this.connectedWallets.set('metamask', updated);
        window.dispatchEvent(new CustomEvent('wallet-accounts-changed', { 
          detail: { wallet: 'metamask', accounts } 
        }));
      }
    };

    const handleChainChanged = (chainId) => {
      console.log('⛓️ MetaMask chain changed:', chainId);
      this._getCurrentNetwork().then(network => {
        const updated = { ...this.connectedWallets.get('metamask'), chainId, network };
        this.connectedWallets.set('metamask', updated);
        window.dispatchEvent(new CustomEvent('wallet-chain-changed', { 
          detail: { wallet: 'metamask', chainId, network } 
        }));
      });
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    this.eventListeners.add('metamask');

    // Cleanup function
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      this.eventListeners.delete('metamask');
    };
  }

  // Switch network with deduplication
  async switchNetwork(chainId, networkConfig = null) {
    if (this.isSwitching) {
      console.log('⏳ Network switch already in progress...');
      return;
    }

    this.isSwitching = true;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 && networkConfig) {
        // Add network if not exists
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
      } else {
        throw switchError;
      }
    } finally {
      this.isSwitching = false;
    }
  }

  // Get connected wallet info
  getWalletInfo(walletType) {
    return this.connectedWallets.get(walletType);
  }

  // Check if wallet is connected
  isWalletConnected(walletType) {
    return this.connectedWallets.has(walletType);
  }

  // Disconnect wallet
  async disconnectWallet(walletType) {
    this.connectedWallets.delete(walletType);
    
    if (walletType === 'solana' && window.solana) {
      await window.solana.disconnect();
    }
    
    window.dispatchEvent(new CustomEvent('wallet-disconnected', { detail: { wallet: walletType } }));
  }

  // Clear all connections
  clearAll() {
    this.connectedWallets.clear();
    this.eventListeners.clear();
    this.isConnecting = false;
    this.isSwitching = false;
    this.connectionPromise = null;
  }

  // Get connection status for debugging
  getStatus() {
    return {
      isConnecting: this.isConnecting,
      isSwitching: this.isSwitching,
      connectedWallets: Array.from(this.connectedWallets.keys()),
      activeListeners: Array.from(this.eventListeners)
    };
  }
}

// Export singleton instance
export const walletManager = WalletConnectionManager.getInstance();

// Helper hooks for React components
export const useWalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async (walletType, options = {}) => {
    setIsConnecting(true);
    try {
      return await walletManager.connectWallet(walletType, options);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async (walletType) => {
    return await walletManager.disconnectWallet(walletType);
  }, []);

  const switchNetwork = useCallback(async (chainId, networkConfig) => {
    return await walletManager.switchNetwork(chainId, networkConfig);
  }, []);

  return {
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnecting,
    getWalletInfo: walletManager.getWalletInfo.bind(walletManager),
    isWalletConnected: walletManager.isWalletConnected.bind(walletManager),
    getStatus: walletManager.getStatus.bind(walletManager)
  };
};