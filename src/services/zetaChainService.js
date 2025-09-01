// src/services/zetaChainService.js - Complete ZetaChain Cross-Chain Payment Service
import { ethers } from 'ethers';
import { walletManager } from '../utils/walletConnectionManager';
import { BufferPolyfill, DataUtils } from '../utils/browserPolyfills';

// Extract utility functions for cleaner code
const { stringToHex, numberToBytes } = DataUtils;

// ZetaChain Network Configurations
const ZETA_CONFIG = {
  mainnet: {
    chainId: 7000,
    name: 'ZetaChain Mainnet',
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://explorer.zetachain.com',
    connector: '0x1c40ce2ccc2346b43fb1b3cee8f9a8c37d9d7ec7', // Lowercase, will be checksummed
    tss: '0x1c40ce2ccc2346b43fb1b3cee8f9a8c37d9d7ec7' // Lowercase, will be checksummed
  },
  testnet: {
    chainId: 7001,
    name: 'ZetaChain Athens Testnet',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://athens3.explorer.zetachain.com',
    connector: '0x1c40ce2ccc2346b43fb1b3cee8f9a8c37d9d7ec7', // Lowercase, will be checksummed
    tss: '0x1c40ce2ccc2346b43fb1b3cee8f9a8c37d9d7ec7' // Lowercase, will be checksummed
  }
};

// Supported Cross-Chain Networks with proper checksummed addresses
const SUPPORTED_CHAINS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    icon: '/crypto-icons/eth.svg'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://sepolia.etherscan.io',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'SepoliaETH', decimals: 18 },
    icon: '/crypto-icons/eth.svg'
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    icon: '/crypto-icons/bnb.svg'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    icon: '/crypto-icons/matic.svg'
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    icon: '/crypto-icons/avax.svg'
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7', // Will be checksummed at runtime
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    icon: '/crypto-icons/arb.svg'
  },
  'btc-mainnet': {
    chainId: 'btc-mainnet',
    name: 'Bitcoin',
    type: 'bitcoin',
    gateway: 'bc1qm24wp577nk8aacckv8np465z3dvmu7ry45el6y',
    blockExplorer: 'https://blockstream.info',
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    icon: '/crypto-icons/btc.svg'
  },
  'btc-testnet': {
    chainId: 'btc-testnet',
    name: 'Bitcoin Testnet',
    type: 'bitcoin',
    gateway: 'tb1qy9pqmk2pd9sv63g27jt8r657wy0d9aws53htne',
    blockExplorer: 'https://blockstream.info/testnet',
    nativeCurrency: { name: 'Bitcoin', symbol: 'tBTC', decimals: 8 },
    icon: '/crypto-icons/btc.svg'
  },
  'solana-mainnet': {
    chainId: 'solana-mainnet',
    name: 'Solana',
    type: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://explorer.solana.com',
    gateway: 'ZETAjseVjuFsxdRxo6MmTCvqzj9euhXS3AWX2vnz4Ph',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    icon: '/crypto-icons/sol.svg'
  },
  'solana-devnet': {
    chainId: 'solana-devnet',
    name: 'Solana Devnet',
    type: 'solana',
    rpcUrl: 'https://api.devnet.solana.com',
    blockExplorer: 'https://explorer.solana.com?cluster=devnet',
    gateway: 'ZETAjseVjuFsxdRxo6MmTCvqzj9euhXS3AWX2vnz4Ph',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    icon: '/crypto-icons/sol.svg'
  }
};

// ZetaChain Connector ABI
const ZETA_CONNECTOR_ABI = [
  "function send((uint256 destinationChainId, bytes recipient, uint256 gasLimit, bytes message, uint256 coinType, address coinAddress) zetaTxInput) payable",
  "function onReceive(bytes calldata originSenderAddress, uint256 originChainId, bytes calldata message) external",
  "event ZetaSent(address indexed sourceAddress, uint256 indexed destinationChainId, bytes recipient, bytes message, uint256 gasLimit, uint256 coinType, address coinAddress, uint256 amount)"
];

// ERC-20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

/**
 * ZetaChain Cross-Chain Payment Service
 * Provides comprehensive cross-chain payment functionality across multiple blockchain networks
 */
class ZetaChainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.currentChain = null;
    this.isTestnet = import.meta.env.VITE_NETWORK === 'testnet' || import.meta.env.DEV;
    this.initialized = false;
    this.initializationPromise = null;
    
    // Multi-chain wallet connections
    this.ethereumWallet = null;
    this.bitcoinWallet = null;
    this.solanaWallet = null;
    this.tonWallet = null;
    
    // Bitcoin address for UTXO chains
    this.bitcoinAddress = null;
  }

  /**
   * Initialize ZetaChain service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initialized) return true;
    if (this.initializationPromise) return await this.initializationPromise;

    this.initializationPromise = this._performInitialization();
    return await this.initializationPromise;
  }

  /**
   * Internal initialization logic
   * @private
   * @returns {Promise<boolean>}
   */
  async _performInitialization() {
    try {
      console.log('🚀 Initializing ZetaChain Service...');

      // Use centralized wallet manager for MetaMask connection
      const walletInfo = await walletManager.connectWallet('metamask');
      
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.currentChain = walletInfo.chainId;
      this.ethereumWallet = window.ethereum;
      this.initialized = true;

      console.log('✅ ZetaChain Service initialized with wallet:', walletInfo.address);
      console.log('🌐 Current chain:', walletInfo.network);
      
      return true;

    } catch (error) {
      console.error('❌ Error initializing ZetaChain service:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Initialize specific chain type wallet
   * @param {string} chainType - Type of chain (evm, bitcoin, solana, ton)
   * @returns {Promise<boolean>}
   */
  async initializeChainWallet(chainType) {
    try {
      console.log(`🔗 Initializing ${chainType} wallet...`);

      if (chainType === 'evm') {
        // EVM chains (Ethereum, BSC, Polygon, etc.)
        const walletInfo = await walletManager.connectWallet('metamask');
        this.ethereumWallet = window.ethereum;
        this.currentChain = walletInfo.chainId;
        console.log('🔗 Connected to EVM wallet:', walletInfo.address);
      }
      else if (chainType === 'solana') {
        // Solana
        if (!window.solana || !window.solana.isPhantom) {
          throw new Error('Phantom wallet not found. Please install Phantom wallet.');
        }
        
        const walletInfo = await walletManager.connectWallet('solana');
        this.solanaWallet = window.solana;
        this.currentChain = 'solana-mainnet';
        console.log('🔗 Connected to Solana wallet:', walletInfo.address);
      }
      else if (chainType === 'bitcoin') {
        // Bitcoin
        const walletInfo = await walletManager.connectWallet('bitcoin');
        this.bitcoinAddress = walletInfo.address;
        this.currentChain = 'btc-mainnet';
        console.log('🔗 Connected to Bitcoin wallet:', walletInfo.address);
      }
      else if (chainType === 'ton') {
        // TON
        if (!window.tonConnect && !window.TON_CONNECT_UI) {
          throw new Error('TON wallet not found. Please install TON Wallet or Tonkeeper.');
        }
        
        if (window.TON_CONNECT_UI) {
          await window.TON_CONNECT_UI.connectWallet();
          this.tonWallet = window.TON_CONNECT_UI;
          this.currentChain = 'ton-mainnet';
          console.log('🔗 Connected to TON wallet');
        }
      }
      
      console.log('🔗 ZetaChain Service initialized for', chainType, 'on chain:', this.currentChain);
      return true;
    } catch (error) {
      console.error('❌ Error initializing chain wallet:', error);
      throw error;
    }
  }

  // Check if current chain is supported for cross-chain payments
  isChainSupported(chainId = null) {
    const checkChain = chainId || this.currentChain;
    return Object.values(SUPPORTED_CHAINS).some(chain => 
      chain.chainId === checkChain || chain.chainId.toString() === checkChain?.toString()
    );
  }

  // Get supported chains for UI display
  /**
   * Validate and get checksummed Ethereum address
   * @param {string} address - Address to validate
   * @param {string} fieldName - Field name for error messages
   * @returns {string} Checksummed address
   */
  validateAndChecksumAddress(address, fieldName = 'Address') {
    try {
      if (!address || typeof address !== 'string') {
        throw new Error(`${fieldName} is required and must be a string`);
      }

      // Use ethers.js to get proper checksummed address
      const checksummedAddress = ethers.getAddress(address.toLowerCase());
      
      if (address !== checksummedAddress) {
        console.warn(`⚠️ ${fieldName} checksum corrected: ${address} -> ${checksummedAddress}`);
      }

      return checksummedAddress;
    } catch (error) {
      console.error(`❌ Invalid ${fieldName}:`, address, error);
      throw new Error(`Invalid ${fieldName}: ${error.message}`);
    }
  }

  /**
   * Get supported chains with checksummed addresses
   * @returns {Array} Supported chains with corrected addresses
   */
  getSupportedChains() {
    return Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => {
      const chainWithChecksum = { ...chain, id: key };
      
      // Fix connector address checksum for EVM chains
      if (chainWithChecksum.connector) {
        try {
          chainWithChecksum.connector = this.validateAndChecksumAddress(
            chainWithChecksum.connector, 
            `${chainWithChecksum.name} connector`
          );
        } catch (error) {
          console.warn(`Failed to checksum connector address for ${chainWithChecksum.name}:`, error.message);
          // Use the original address as fallback
          chainWithChecksum.connector = chain.connector;
        }
      }
      
      return chainWithChecksum;
    });
  }

  // Get chain type (evm, bitcoin, solana, ton)
  getChainType(chainId) {
    const chain = Object.values(SUPPORTED_CHAINS).find(c => 
      c.chainId === chainId || c.chainId.toString() === chainId?.toString()
    );
    
    if (!chain) return 'unknown';
    
    if (chain.type) return chain.type;
    
    // Default to EVM for numeric chain IDs
    if (typeof chain.chainId === 'number') return 'evm';
    
    return 'unknown';
  }

  /**
   * Switch to ZetaChain network
   * @returns {Promise<boolean>} Success status
   */
  async switchToZetaChain() {
    try {
      const zetaConfig = this.isTestnet ? ZETA_CONFIG.testnet : ZETA_CONFIG.mainnet;
      
      // Checksum the ZetaChain addresses
      const checksummedConnector = this.validateAndChecksumAddress(
        zetaConfig.connector, 
        'ZetaChain connector'
      );
      
      const networkConfig = {
        chainId: `0x${zetaConfig.chainId.toString(16)}`,
        chainName: zetaConfig.name,
        rpcUrls: [zetaConfig.rpcUrl],
        blockExplorerUrls: [zetaConfig.blockExplorer],
        nativeCurrency: {
          name: 'ZETA',
          symbol: 'ZETA',
          decimals: 18
        }
      };

      await walletManager.switchNetwork(
        networkConfig.chainId,
        networkConfig
      );

      // Update the configuration with checksummed address
      zetaConfig.connector = checksummedConnector;

      // Reinitialize after network switch
      await this.initialize();
      return true;
    } catch (error) {
      console.error('❌ Error switching to ZetaChain:', error);
      throw error;
    }
  }

  /**
   * Main cross-chain contribution execution
   * @param {Object} params - Contribution parameters
   * @param {number|string} params.campaignId - Campaign ID
   * @param {number} params.amount - Amount to contribute
   * @param {number|string} params.sourceChain - Source chain ID
   * @param {string} params.targetContractAddress - Target contract address
   * @param {number} params.rewardIndex - Reward tier index
   * @param {Function} params.onProgress - Progress callback
   * @returns {Promise<Object>} Transaction result
   */
  async executeCrossChainContribution({
    campaignId,
    amount,
    sourceChain,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    try {
      onProgress?.('Validating contribution parameters...');
      
      // Validate all required parameters
      const validationResult = this.validateContributionParameters({
        campaignId,
        amount,
        sourceChain,
        targetContractAddress,
        rewardIndex
      });

      if (!validationResult.isValid) {
        throw new Error(`Parameter validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Use validated parameters
      const {
        campaignId: validCampaignId,
        amount: validAmount,
        sourceChain: validSourceChain,
        targetContractAddress: validTargetContract,
        rewardIndex: validRewardIndex
      } = validationResult.validatedParams;

      onProgress?.('Initializing cross-chain service...');
      
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      onProgress?.('Checking chain support...');

      if (!this.isChainSupported(validSourceChain)) {
        throw new Error(`Chain ${validSourceChain} not supported for cross-chain payments`);
      }

      // Get chain type and execute appropriate flow
      const chainType = this.getChainType(validSourceChain);
      onProgress?.(`Preparing ${chainType.toUpperCase()} cross-chain transaction...`);

      let result;
      switch (chainType) {
        case 'evm':
          result = await this.executeEVMCrossChain({
            campaignId: validCampaignId,
            amount: validAmount,
            sourceChainConfig: this.getSupportedChains().find(c => 
              c.chainId === validSourceChain || c.chainId.toString() === validSourceChain.toString()
            ),
            targetContractAddress: validTargetContract,
            rewardIndex: validRewardIndex,
            onProgress
          });
          break;
          
        case 'bitcoin':
          result = await this.executeBitcoinCrossChain({
            campaignId: validCampaignId,
            amount: validAmount,
            targetContractAddress: validTargetContract,
            rewardIndex: validRewardIndex,
            onProgress
          });
          break;
          
        case 'solana':
          result = await this.executeSolanaCrossChain({
            campaignId: validCampaignId,
            amount: validAmount,
            targetContractAddress: validTargetContract,
            rewardIndex: validRewardIndex,
            onProgress
          });
          break;
          
        case 'ton':
          result = await this.executeTONCrossChain({
            campaignId: validCampaignId,
            amount: validAmount,
            targetContractAddress: validTargetContract,
            rewardIndex: validRewardIndex,
            onProgress
          });
          break;
          
        default:
          throw new Error(`Unsupported chain type: ${chainType} for chain ${validSourceChain}`);
      }

      onProgress?.('Cross-chain transaction confirmed!');
      
      return {
        ...result,
        campaignId: validCampaignId,
        rewardIndex: validRewardIndex,
        timestamp: new Date().toISOString(),
        validatedParams: validationResult.validatedParams
      };

    } catch (error) {
      console.error('❌ Error executing cross-chain contribution:', error);
      throw error;
    }
  }

  /**
   * Validate contribution parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateContributionParameters({
    campaignId,
    amount,
    sourceChain,
    targetContractAddress,
    rewardIndex
  }) {
    const errors = [];
    const validatedParams = {};

    // Validate campaignId
    try {
      validatedParams.campaignId = this.validateAndFormatNumber(campaignId, 'Campaign ID');
      if (validatedParams.campaignId <= 0) {
        errors.push('Campaign ID must be a positive number');
      }
    } catch (error) {
      errors.push(`Invalid Campaign ID: ${error.message}`);
      validatedParams.campaignId = 1; // Fallback
    }

    // Validate amount
    if (amount === null || amount === undefined || amount === '' || isNaN(amount) || parseFloat(amount) <= 0) {
      errors.push('Amount must be a positive number');
      validatedParams.amount = 0.001; // Minimum fallback
    } else {
      validatedParams.amount = parseFloat(amount);
    }

    // Validate sourceChain
    if (!sourceChain && sourceChain !== 0) {
      errors.push('Source chain is required');
      validatedParams.sourceChain = 1; // Ethereum mainnet fallback
    } else {
      validatedParams.sourceChain = sourceChain;
    }

    // Validate and checksum targetContractAddress
    if (!targetContractAddress || typeof targetContractAddress !== 'string') {
      errors.push('Target contract address is required');
      validatedParams.targetContractAddress = '0x0000000000000000000000000000000000000000';
    } else {
      try {
        // Validate and get checksummed address
        validatedParams.targetContractAddress = this.validateAndChecksumAddress(
          targetContractAddress, 
          'Target contract address'
        );
      } catch (error) {
        errors.push(`Invalid target contract address: ${error.message}`);
        validatedParams.targetContractAddress = ethers.getAddress('0x0000000000000000000000000000000000000000');
      }
    }

    // Validate rewardIndex
    try {
      validatedParams.rewardIndex = this.validateAndFormatNumber(rewardIndex, 'Reward Index', 0);
    } catch (error) {
      console.warn('Reward index validation failed, using 0:', error.message);
      validatedParams.rewardIndex = 0;
    }

    // Log validation results
    console.log('📋 Parameter validation results:', {
      errors: errors,
      original: { campaignId, amount, sourceChain, targetContractAddress, rewardIndex },
      validated: validatedParams
    });

    return {
      isValid: errors.length === 0,
      errors,
      validatedParams
    };
  }

  // Execute EVM cross-chain transaction
  async executeEVMCrossChain({
    campaignId,
    amount,
    sourceChainConfig,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    try {
      onProgress?.(`Connecting to ${sourceChainConfig.name}...`);

      // Initialize chain-specific wallet if needed
      await this.initializeChainWallet('evm');

      // Check if we need to switch networks
      const walletInfo = walletManager.getWalletInfo('metamask');
      const requiredChainId = `0x${sourceChainConfig.chainId.toString(16)}`;
      
      if (walletInfo.chainId !== requiredChainId) {
        onProgress?.(`Switching to ${sourceChainConfig.name} network...`);
        
        await walletManager.switchNetwork(requiredChainId, {
          chainId: requiredChainId,
          chainName: sourceChainConfig.name,
          rpcUrls: [sourceChainConfig.rpcUrl],
          blockExplorerUrls: [sourceChainConfig.blockExplorer],
          nativeCurrency: sourceChainConfig.nativeCurrency
        });

        // Reinitialize provider after network switch
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      }

      onProgress?.('Preparing cross-chain transaction...');

      // Initialize connector contract on source chain
      const connectorContract = new ethers.Contract(
        sourceChainConfig.connector,
        ZETA_CONNECTOR_ABI,
        this.signer
      );

      // Encode the contribution data
      const contributionData = this.encodeContributionData(campaignId, rewardIndex);

      // Determine destination chain (where your crowdfunding contract is deployed)
      const destinationChainId = this.isTestnet ? 11155111 : 1; // Sepolia or Ethereum mainnet

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());

      // Estimate gas for the transaction
      const gasEstimate = await connectorContract.send.estimateGas(
        {
          destinationChainId: destinationChainId,
          recipient: ethers.getBytes(targetContractAddress),
          gasLimit: 500000, // Gas limit for destination execution
          message: contributionData,
          coinType: 1, // Native gas token
          coinAddress: '0x0000000000000000000000000000000000000000'
        },
        { value: amountWei }
      );

      onProgress?.('Sending cross-chain transaction...');

      // Execute the cross-chain transaction
      const tx = await connectorContract.send(
        {
          destinationChainId: destinationChainId,
          recipient: ethers.getBytes(targetContractAddress),
          gasLimit: 500000,
          message: contributionData,
          coinType: 1,
          coinAddress: '0x0000000000000000000000000000000000000000'
        },
        { 
          value: amountWei,
          gasLimit: gasEstimate + 50000n // Add buffer
        }
      );
      
      onProgress?.('Transaction sent, waiting for confirmation...');

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        sourceChain: sourceChainConfig.name,
        sourceChainId: sourceChainConfig.chainId,
        destinationChain: destinationChainId === 11155111 ? 'Sepolia' : 'Ethereum',
        destinationChainId: destinationChainId,
        amount: amount,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        chainType: 'evm',
        txReceipt: receipt
      };

    } catch (error) {
      console.error('❌ EVM cross-chain execution error:', error);
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      if (error.code === -32603) {
        throw new Error('Internal JSON-RPC error. Check network connection.');
      }
      throw error;
    }
  }

  // Execute Bitcoin cross-chain transaction
  async executeBitcoinCrossChain({
    campaignId,
    amount,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    try {
      onProgress?.('Connecting to Bitcoin wallet...');
      
      // Initialize Bitcoin wallet
      await this.initializeChainWallet('bitcoin');

      onProgress?.('Preparing Bitcoin cross-chain transaction...');

      // Validate amount
      if (amount <= 0) {
        throw new Error(`Invalid Bitcoin amount: ${amount} BTC`);
      }

      // Convert amount to satoshis (1 BTC = 100,000,000 satoshis)
      const amountSats = Math.floor(amount * 100000000);
      
      // Check minimum amount (dust limit)
      if (amountSats < 546) { // 546 satoshis is typical dust limit
        throw new Error(`Amount too small. Minimum: 0.00000546 BTC (546 sats), provided: ${amount} BTC (${amountSats} sats)`);
      }

      // Get Bitcoin gateway address
      const gatewayConfig = this.isTestnet ? 
        SUPPORTED_CHAINS['btc-testnet'] : 
        SUPPORTED_CHAINS['btc-mainnet'];
      
      onProgress?.(`Sending ${amount} BTC (${amountSats} satoshis) to gateway...`);

      // Encode campaign data in OP_RETURN
      const campaignDataHex = this.encodeCampaignDataForBitcoin(campaignId, rewardIndex, targetContractAddress);

      let txHash;
      let txDetails = {};

      if (window.unisat) {
        onProgress?.('Sending Bitcoin transaction via Unisat...');
        
        try {
          // Check wallet balance first
          const balance = await window.unisat.getBalance();
          const balanceBTC = balance.total / 100000000;
          
          if (balanceBTC < amount) {
            throw new Error(`Insufficient Bitcoin balance. Available: ${balanceBTC} BTC, Required: ${amount} BTC`);
          }

          // Send Bitcoin with memo containing campaign data
          txHash = await window.unisat.sendBitcoin(
            gatewayConfig.gateway,
            amountSats,
            {
              memo: campaignDataHex,
              feeRate: 'fast' // Use fast fee rate for quicker confirmation
            }
          );
          
          txDetails = {
            wallet: 'unisat',
            feeRate: 'fast',
            memo: campaignDataHex
          };

        } catch (unisatError) {
          console.error('Unisat transaction error:', unisatError);
          throw new Error(`Unisat transaction failed: ${unisatError.message}`);
        }
        
      } else if (window.xverse) {
        onProgress?.('Sending Bitcoin transaction via Xverse...');
        
        try {
          // Xverse wallet transaction
          const sendBtcOptions = {
            payload: {
              network: this.isTestnet ? 'Testnet' : 'Mainnet',
              recipients: [
                {
                  address: gatewayConfig.gateway,
                  amountSats: amountSats,
                }
              ],
              senderAddress: this.bitcoinAddress,
              message: `ZetaChain cross-chain contribution: ${amount} BTC for campaign ${campaignId}`,
              // Note: Xverse doesn't support OP_RETURN directly, so we use the message field
              opReturn: campaignDataHex
            },
          };
          
          const response = await window.XverseProviders.BitcoinProvider.request(
            'sendTransfer', 
            sendBtcOptions
          );
          
          txHash = response.txid;
          txDetails = {
            wallet: 'xverse',
            recipients: sendBtcOptions.payload.recipients,
            opReturn: campaignDataHex
          };

        } catch (xverseError) {
          console.error('Xverse transaction error:', xverseError);
          throw new Error(`Xverse transaction failed: ${xverseError.message}`);
        }
        
      } else {
        throw new Error('No compatible Bitcoin wallet found. Please install Unisat or Xverse wallet.');
      }

      if (!txHash) {
        throw new Error('Failed to get transaction hash from Bitcoin wallet');
      }

      onProgress?.(`Bitcoin transaction sent successfully: ${txHash}`);

      return {
        success: true,
        transactionHash: txHash,
        sourceChain: 'Bitcoin',
        sourceChainId: gatewayConfig.chainId,
        destinationChain: this.isTestnet ? 'Sepolia' : 'Ethereum',
        destinationChainId: this.isTestnet ? 11155111 : 1,
        amount: amount,
        amountSats: amountSats,
        chainType: 'bitcoin',
        gateway: gatewayConfig.gateway,
        campaignData: campaignDataHex,
        txDetails: txDetails,
        explorerUrl: `${gatewayConfig.blockExplorer}/tx/${txHash}`
      };

    } catch (error) {
      console.error('❌ Bitcoin cross-chain execution error:', error);
      
      // Handle specific Bitcoin wallet errors
      if (error.message?.includes('User rejected')) {
        throw new Error('Bitcoin transaction rejected by user');
      }
      if (error.message?.includes('Insufficient funds') || error.message?.includes('Insufficient Bitcoin balance')) {
        throw new Error(`Insufficient Bitcoin balance for ${amount} BTC transaction`);
      }
      if (error.message?.includes('dust')) {
        throw new Error('Transaction amount too small (below dust limit)');
      }
      
      throw error;
    }
  }

  // Execute Solana cross-chain transaction
  async executeSolanaCrossChain({
    campaignId,
    amount,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    try {
      onProgress?.('Connecting to Solana wallet...');
      
      // Initialize Solana wallet
      await this.initializeChainWallet('solana');

      onProgress?.('Preparing Solana cross-chain transaction...');

      if (!window.solana || !window.solana.isConnected) {
        throw new Error('Solana wallet not connected');
      }

      // Convert amount to lamports (1 SOL = 1e9 lamports)
      const amountLamports = Math.floor(amount * 1e9);

      // Validate amount
      if (amountLamports <= 0) {
        throw new Error(`Invalid amount: ${amount} SOL`);
      }

      // Check minimum amount (rent exemption + fees)
      if (amountLamports < 5000) { // 0.000005 SOL minimum
        throw new Error(`Amount too small. Minimum: 0.000005 SOL, provided: ${amount} SOL`);
      }

      // Get Solana gateway
      const gatewayConfig = this.isTestnet ? 
        SUPPORTED_CHAINS['solana-devnet'] : 
        SUPPORTED_CHAINS['solana-mainnet'];

      onProgress?.(`Preparing ${amount} SOL (${amountLamports} lamports) transaction...`);

      // Try to import Solana web3.js if available, otherwise use simplified approach
      let connection, blockhash, txSignature;
      
      try {
        // Dynamic import for Solana web3.js (if available)
        const { Connection, Transaction, SystemProgram, PublicKey, TransactionInstruction } = await import('@solana/web3.js');
        
        // Create connection to Solana network
        connection = new Connection(gatewayConfig.rpcUrl, 'confirmed');
        
        // Get recent blockhash
        const { blockhash: latestBlockhash } = await connection.getLatestBlockhash();
        blockhash = latestBlockhash;

        // Create transaction instruction data for the cross-chain call
        const instructionData = this.encodeCampaignDataForSolana(
          campaignId, 
          rewardIndex, 
          targetContractAddress, 
          amount
        );

        // Create Solana transaction
        const transaction = new Transaction({
          feePayer: window.solana.publicKey,
          recentBlockhash: blockhash
        });

        // Add cross-chain instruction with encoded campaign data
        transaction.add(
          new TransactionInstruction({
            keys: [
              { pubkey: window.solana.publicKey, isSigner: true, isWritable: true },
              { pubkey: new PublicKey(gatewayConfig.gateway), isSigner: false, isWritable: true }
            ],
            programId: new PublicKey(gatewayConfig.gateway),
            data: instructionData // Now properly using the instruction data
          })
        );

        // Add system transfer instruction for the amount
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: window.solana.publicKey,
            toPubkey: new PublicKey(gatewayConfig.gateway),
            lamports: amountLamports
          })
        );

        onProgress?.('Signing Solana transaction...');

        // Sign the transaction
        const signedTransaction = await window.solana.signTransaction(transaction);
        
        if (!signedTransaction) {
          throw new Error('Failed to sign Solana transaction');
        }

        onProgress?.('Broadcasting Solana transaction...');

        // Serialize and send the signed transaction
        const serializedTransaction = signedTransaction.serialize();
        txSignature = await connection.sendRawTransaction(serializedTransaction, {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });

        // Confirm transaction
        onProgress?.('Confirming Solana transaction...');
        
        const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Solana transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

      } catch (importError) {
        console.warn('Solana web3.js not available, using wallet-only approach:', importError.message);
        
        // Fallback: Use wallet's built-in send method if available
        if (window.solana.send) {
          onProgress?.('Using wallet native send method...');
          
          // Create memo with campaign data for the fallback method
          const campaignMemo = `Campaign: ${campaignId}, Reward: ${rewardIndex || 0}, Target: ${targetContractAddress}, Amount: ${amount} SOL`;
          
          const result = await window.solana.send({
            to: gatewayConfig.gateway,
            amount: amountLamports,
            memo: campaignMemo // Using the amount and campaign data in memo
          });
          
          txSignature = result.signature || result.txid || result;
        } else {
          throw new Error('Solana web3.js library required but not available. Please install @solana/web3.js or use a wallet with built-in send functionality');
        }
      }

      if (!txSignature) {
        throw new Error('Failed to get transaction signature');
      }

      onProgress?.(`Solana transaction confirmed: ${txSignature}`);

      return {
        success: true,
        transactionHash: txSignature,
        sourceChain: 'Solana',
        sourceChainId: gatewayConfig.chainId,
        destinationChain: this.isTestnet ? 'Sepolia' : 'Ethereum',
        destinationChainId: this.isTestnet ? 11155111 : 1,
        amount: amount,
        amountLamports: amountLamports,
        chainType: 'solana',
        gateway: gatewayConfig.gateway,
        explorerUrl: `${gatewayConfig.blockExplorer}/tx/${txSignature}`
      };

    } catch (error) {
      console.error('❌ Solana cross-chain execution error:', error);
      
      // Handle specific Solana errors
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        throw new Error('Solana transaction rejected by user');
      }
      if (error.message?.includes('Insufficient funds') || error.message?.includes('insufficient lamports')) {
        throw new Error(`Insufficient SOL balance. Required: ${amount} SOL`);
      }
      if (error.message?.includes('Blockhash not found')) {
        throw new Error('Network error: Failed to get recent blockhash');
      }
      
      throw error;
    }
  }

  // Execute TON cross-chain transaction
  async executeTONCrossChain({
    campaignId,
    amount,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    try {
      onProgress?.('Connecting to TON wallet...');
      
      // Initialize TON wallet
      await this.initializeChainWallet('ton');

      onProgress?.('Preparing TON cross-chain transaction...');

      if (!this.tonWallet) {
        throw new Error('TON wallet not connected');
      }

      // Validate amount
      if (amount <= 0) {
        throw new Error(`Invalid TON amount: ${amount} TON`);
      }

      // Convert amount to nanotons (1 TON = 1e9 nanotons)
      const amountNanotons = Math.floor(amount * 1e9);
      
      // Check minimum amount
      if (amountNanotons < 10000000) { // 0.01 TON minimum
        throw new Error(`Amount too small. Minimum: 0.01 TON, provided: ${amount} TON`);
      }

      onProgress?.(`Sending ${amount} TON (${amountNanotons} nanotons) via TON network...`);

      // Encode campaign data for TON
      const campaignPayload = this.encodeCampaignDataForTON(campaignId, rewardIndex, targetContractAddress);

      // Prepare TON transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes validity
        messages: [
          {
            address: 'EQD8TJ8xEWB1SpnRE4d89YO3jl0W0EiBnNS4IBaHaUmdfizE', // TON gateway address placeholder
            amount: amountNanotons.toString(),
            payload: campaignPayload,
            stateInit: null // No state init needed for simple transfer
          }
        ]
      };

      onProgress?.('Signing TON transaction...');

      // Send transaction through TON Connect
      const result = await this.tonWallet.sendTransaction(transaction);

      if (!result || !result.boc) {
        throw new Error('TON transaction failed or returned invalid result');
      }

      onProgress?.(`TON transaction sent successfully: ${result.boc}`);

      return {
        success: true,
        transactionHash: result.boc, // TON uses BOC (Bag of Cells) as transaction hash
        sourceChain: 'TON',
        sourceChainId: 'ton-mainnet',
        destinationChain: this.isTestnet ? 'Sepolia' : 'Ethereum',
        destinationChainId: this.isTestnet ? 11155111 : 1,
        amount: amount,
        amountNanotons: amountNanotons,
        chainType: 'ton',
        payload: campaignPayload,
        validUntil: transaction.validUntil,
        explorerUrl: `https://tonviewer.com/transaction/${result.boc}`
      };

    } catch (error) {
      console.error('❌ TON cross-chain execution error:', error);
      
      // Handle specific TON errors
      if (error.message?.includes('User rejected') || error.message?.includes('Cancelled by user')) {
        throw new Error('TON transaction rejected by user');
      }
      if (error.message?.includes('Insufficient funds')) {
        throw new Error(`Insufficient TON balance for ${amount} TON transaction`);
      }
      
      throw error;
    }
  }

  // Estimate cross-chain fees
  async estimateCrossChainFees(sourceChain, amount) {
    try {
      const chainType = this.getChainType(sourceChain);
      const sourceChainConfig = this.getSupportedChains().find(c => c.chainId === sourceChain);
      
      if (!sourceChainConfig) {
        throw new Error(`Chain configuration not found for ${sourceChain}`);
      }

      let fees = {
        gasEstimate: '0',
        networkFee: '0',
        zetaFee: '0',
        totalFee: '0',
        currency: sourceChainConfig.nativeCurrency.symbol,
        amountDetails: {
          inputAmount: amount,
          currency: sourceChainConfig.nativeCurrency.symbol
        }
      };

      switch (chainType) {
        case 'evm': {
          // Estimate EVM gas fees
          if (this.signer && this.provider) {
            try {
              const gasPrice = await this.provider.getFeeData();
              const gasEstimate = 500000n; // Estimated gas for cross-chain transaction
              
              fees.gasEstimate = ethers.formatUnits(gasEstimate, 'wei');
              fees.networkFee = ethers.formatEther(gasPrice.gasPrice * gasEstimate);
              fees.zetaFee = '0.01'; // Estimated ZetaChain protocol fee
              fees.totalFee = (parseFloat(fees.networkFee) + parseFloat(fees.zetaFee)).toString();
              
              // Add amount validation
              const minAmount = parseFloat(fees.totalFee) + 0.001; // Minimum amount needed
              fees.amountDetails.minRequired = minAmount.toString();
              fees.amountDetails.sufficient = parseFloat(amount) >= minAmount;
              
            } catch (gasError) {
              console.warn('Failed to estimate EVM gas fees:', gasError);
              // Fallback estimates
              fees.networkFee = '0.002';
              fees.zetaFee = '0.01';
              fees.totalFee = '0.012';
            }
          } else {
            // Default estimates when provider not available
            fees.networkFee = '0.002';
            fees.zetaFee = '0.01';
            fees.totalFee = '0.012';
          }
          break;
        }
          
        case 'bitcoin': {
          // Bitcoin fee estimation based on current network conditions
          const baseFee = 0.001; // Base Bitcoin network fee
          const protocolFee = 0.0001; // ZetaChain protocol fee
          
          fees.networkFee = baseFee.toString();
          fees.zetaFee = protocolFee.toString();
          fees.totalFee = (baseFee + protocolFee).toString();
          
          // Bitcoin amount validation (dust limit)
          const dustLimit = 0.00000546; // 546 satoshis
          fees.amountDetails.minRequired = Math.max(dustLimit, parseFloat(fees.totalFee) + 0.00001).toString();
          fees.amountDetails.sufficient = parseFloat(amount) >= parseFloat(fees.amountDetails.minRequired);
          
          break;
        }
          
        case 'solana': {
          // Solana fee estimation
          const baseFee = 0.00025; // Typical Solana transaction fee
          const protocolFee = 0.001; // ZetaChain protocol fee
          
          fees.networkFee = baseFee.toString();
          fees.zetaFee = protocolFee.toString();
          fees.totalFee = (baseFee + protocolFee).toString();
          
          // Solana amount validation (rent exemption)
          const rentExemption = 0.000005; // Minimum for rent exemption
          fees.amountDetails.minRequired = Math.max(rentExemption, parseFloat(fees.totalFee) + 0.001).toString();
          fees.amountDetails.sufficient = parseFloat(amount) >= parseFloat(fees.amountDetails.minRequired);
          
          break;
        }
          
        case 'ton': {
          // TON fee estimation
          const baseFee = 0.01; // TON transaction fee
          const protocolFee = 0.005; // ZetaChain protocol fee
          
          fees.networkFee = baseFee.toString();
          fees.zetaFee = protocolFee.toString();
          fees.totalFee = (baseFee + protocolFee).toString();
          
          // TON amount validation
          fees.amountDetails.minRequired = Math.max(0.01, parseFloat(fees.totalFee) + 0.001).toString();
          fees.amountDetails.sufficient = parseFloat(amount) >= parseFloat(fees.amountDetails.minRequired);
          
          break;
        }
          
        default: {
          throw new Error(`Fee estimation not implemented for chain type: ${chainType}`);
        }
      }

      return fees;

    } catch (error) {
      console.error('❌ Error estimating cross-chain fees:', error);
      throw error;
    }
  }

  // Get user balance for specific chain
  async getUserBalance(chainId, tokenAddress = null) {
    try {
      const chainType = this.getChainType(chainId);
      
      switch (chainType) {
        case 'evm': {
          if (!this.provider || !this.signer) {
            throw new Error('Provider not initialized for EVM balance check');
          }
          
          const userAddress = await this.signer.getAddress();
          
          if (tokenAddress) {
            // ERC-20 token balance
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            const balance = await tokenContract.balanceOf(userAddress);
            const decimals = await tokenContract.decimals();
            return ethers.formatUnits(balance, decimals);
          } else {
            // Native token balance
            const balance = await this.provider.getBalance(userAddress);
            return ethers.formatEther(balance);
          }
        }
          
        case 'bitcoin': {
          // Bitcoin balance check would need external API or wallet method
          if (window.unisat) {
            try {
              const balance = await window.unisat.getBalance();
              const balanceBTC = balance.total / 100000000; // Convert satoshis to BTC
              return balanceBTC.toString();
            } catch (error) {
              console.warn('Failed to get Bitcoin balance from Unisat:', error);
              return '0.0';
            }
          } else if (this.bitcoinAddress) {
            // Would need to implement Bitcoin RPC or API call
            console.warn('Bitcoin balance check requires external API - returning placeholder');
            return '0.0';
          }
          return '0.0';
        }
          
        case 'solana': {
          // Solana balance check
          if (window.solana && window.solana.isConnected) {
            try {
              const { Connection, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
              const gatewayConfig = this.isTestnet ? 
                SUPPORTED_CHAINS['solana-devnet'] : 
                SUPPORTED_CHAINS['solana-mainnet'];
              
              const connection = new Connection(gatewayConfig.rpcUrl, 'confirmed');
              const balance = await connection.getBalance(window.solana.publicKey);
              return (balance / LAMPORTS_PER_SOL).toString();
            } catch (error) {
              console.warn('Failed to get Solana balance:', error);
              return '0.0';
            }
          }
          return '0.0';
        }
          
        case 'ton': {
          // TON balance check would need TON-specific API
          if (this.tonWallet) {
            try {
              // TON Connect balance check (pseudo-code - would need actual implementation)
              const balance = await this.tonWallet.getBalance?.() || '0';
              const balanceTON = parseFloat(balance) / 1e9; // Convert nanotons to TON
              return balanceTON.toString();
            } catch (error) {
              console.warn('Failed to get TON balance:', error);
              return '0.0';
            }
          }
          return '0.0';
        }
          
        default: {
          throw new Error(`Balance check not implemented for chain type: ${chainType}`);
        }
      }
    } catch (error) {
      console.error('❌ Error getting user balance:', error);
      return '0.0';
    }
  }

  /**
   * Encode contribution data for Ethereum target
   * @param {number|string} campaignId - Campaign ID
   * @param {number|string} rewardIndex - Reward tier index
   * @returns {string} Encoded data
   */
  encodeContributionData(campaignId, rewardIndex = 0) {
    try {
      // Validate and sanitize inputs
      const safeCampaignId = this.validateAndFormatNumber(campaignId, 'Campaign ID');
      const safeRewardIndex = this.validateAndFormatNumber(rewardIndex, 'Reward Index', 0);
      
      console.log('🔧 Encoding contribution data:', {
        campaignId: safeCampaignId,
        rewardIndex: safeRewardIndex,
        originalCampaignId: campaignId,
        originalRewardIndex: rewardIndex
      });

      const encoder = new ethers.AbiCoder();
      return encoder.encode(
        ['uint256', 'uint256', 'bytes'],
        [
          safeCampaignId.toString(),
          safeRewardIndex.toString(),
          ethers.toUtf8Bytes('cross-chain-contribution')
        ]
      );
    } catch (error) {
      console.error('❌ Error encoding contribution data:', error);
      console.error('Input values:', { campaignId, rewardIndex });
      throw new Error(`Failed to encode contribution data: ${error.message}`);
    }
  }

  /**
   * Validate and format number for BigNumber operations
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {number} defaultValue - Default value if invalid
   * @returns {number} Validated number
   */
  validateAndFormatNumber(value, fieldName, defaultValue = 0) {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      console.warn(`⚠️ ${fieldName} is null/undefined, using default: ${defaultValue}`);
      return defaultValue;
    }

    // Convert to number
    const numValue = Number(value);
    
    // Check if it's a valid number
    if (isNaN(numValue) || !isFinite(numValue)) {
      console.warn(`⚠️ ${fieldName} is not a valid number (${value}), using default: ${defaultValue}`);
      return defaultValue;
    }

    // Ensure it's a non-negative integer
    const intValue = Math.floor(Math.abs(numValue));
    
    if (intValue !== numValue) {
      console.warn(`⚠️ ${fieldName} was converted from ${numValue} to ${intValue}`);
    }

    return intValue;
  }

  // Encode campaign data for Bitcoin OP_RETURN
  encodeCampaignDataForBitcoin(campaignId, rewardIndex, targetContract) {
    try {
      const data = {
        campaignId: campaignId,
        rewardIndex: rewardIndex || 0,
        target: targetContract,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // Convert to JSON string then to hex using browser-compatible method
      const jsonString = JSON.stringify(data);
      return stringToHex(jsonString);
    } catch (error) {
      console.error('❌ Error encoding Bitcoin campaign data:', error);
      throw error;
    }
  }

  /**
   * Encode campaign data for Solana
   * @param {number} campaignId - Campaign ID
   * @param {number} rewardIndex - Reward tier index
   * @param {string} targetContract - Target contract address
   * @param {number} amount - Transaction amount
   * @returns {Uint8Array} Encoded instruction data
   */
  encodeCampaignDataForSolana(campaignId, rewardIndex, targetContract, amount) {
    try {
      // Create instruction data for Solana program using browser-compatible arrays
      const data = new Uint8Array(64); // Adjust size based on your program's requirements
      
      // Write campaign ID (4 bytes, little-endian)
      const campaignIdBytes = numberToBytes(campaignId, 4);
      data.set(campaignIdBytes, 0);
      
      // Write reward index (4 bytes, little-endian)
      const rewardIndexBytes = numberToBytes(rewardIndex || 0, 4);
      data.set(rewardIndexBytes, 4);
      
      // Write amount (8 bytes as double, little-endian)
      const amountBytes = numberToBytes(amount, 8);
      data.set(amountBytes, 8);
      
      // Add target contract address bytes (remove 0x prefix and convert to bytes)
      const contractBytes = BufferPolyfill.from(targetContract.slice(2), 'hex');
      data.set(contractBytes.slice(0, Math.min(contractBytes.length, 20)), 16); // Take first 20 bytes
      
      return data;
    } catch (error) {
      console.error('❌ Error encoding Solana campaign data:', error);
      throw error;
    }
  }

  // Encode campaign data for TON
  encodeCampaignDataForTON(campaignId, rewardIndex, targetContract) {
    try {
      // TON cell structure for cross-chain data
      const data = {
        op: 0x12345678, // Operation code for cross-chain contribution
        campaignId: campaignId,
        rewardIndex: rewardIndex || 0,
        targetContract: targetContract,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      return JSON.stringify(data);
    } catch (error) {
      console.error('❌ Error encoding TON campaign data:', error);
      throw error;
    }
  }

  // Monitor cross-chain transaction status
  async monitorCrossChainTransaction(txHash, sourceChain) {
    try {
      const chainType = this.getChainType(sourceChain);
      
      // Implementation would depend on chain type and monitoring service
      console.log(`🔍 Monitoring ${chainType} transaction:`, txHash);
      
      // This is a placeholder - implement actual monitoring logic
      return {
        status: 'pending',
        confirmations: 0,
        sourceChain: sourceChain,
        transactionHash: txHash
      };
      
    } catch (error) {
      console.error('❌ Error monitoring cross-chain transaction:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash, chainId) {
    try {
      const chainType = this.getChainType(chainId);
      
      switch (chainType) {
        case 'evm': {
          if (!this.provider) {
            throw new Error('Provider not initialized for EVM transaction status check');
          }
          
          const receipt = await this.provider.getTransactionReceipt(txHash);
          const currentBlock = await this.provider.getBlockNumber();
          
          return {
            status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed?.toString(),
            confirmations: receipt ? currentBlock - receipt.blockNumber : 0,
            explorerUrl: this.getExplorerUrl(txHash, chainId)
          };
        }
          
        case 'bitcoin': {
          // For Bitcoin, we'd typically use a block explorer API
          return {
            status: 'pending', // Would need to implement Bitcoin RPC or API call
            confirmations: 0,
            explorerUrl: this.getExplorerUrl(txHash, chainId)
          };
        }
          
        case 'solana': {
          // For Solana, would need Solana web3.js
          try {
            const { Connection } = await import('@solana/web3.js');
            const gatewayConfig = this.isTestnet ? 
              SUPPORTED_CHAINS['solana-devnet'] : 
              SUPPORTED_CHAINS['solana-mainnet'];
            
            const connection = new Connection(gatewayConfig.rpcUrl, 'confirmed');
            const status = await connection.getSignatureStatus(txHash);
            
            return {
              status: status.value ? (status.value.err ? 'failed' : 'success') : 'pending',
              confirmations: status.value?.confirmations || 0,
              explorerUrl: this.getExplorerUrl(txHash, chainId)
            };
          } catch {
            console.warn('Solana web3.js not available for status check');
            return {
              status: 'unknown',
              error: 'Solana web3.js library required',
              explorerUrl: this.getExplorerUrl(txHash, chainId)
            };
          }
        }
          
        case 'ton': {
          // For TON, would need TON-specific API
          return {
            status: 'pending', // Would need to implement TON API call
            confirmations: 0,
            explorerUrl: this.getExplorerUrl(txHash, chainId)
          };
        }
          
        default: {
          return {
            status: 'unknown',
            error: `Status check not implemented for chain type: ${chainType}`,
            explorerUrl: this.getExplorerUrl(txHash, chainId)
          };
        }
      }
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      return {
        status: 'error',
        error: error.message,
        explorerUrl: this.getExplorerUrl(txHash, chainId)
      };
    }
  }

  // Helper to get explorer URL
  getExplorerUrl(txHash, chainId) {
    const chain = Object.values(SUPPORTED_CHAINS).find(c => 
      c.chainId === chainId || c.chainId.toString() === chainId?.toString()
    );
    
    if (!chain) return null;
    
    const baseUrl = chain.blockExplorer;
    if (!baseUrl) return null;
    
    // Different chains have different URL formats
    switch (chain.type || 'evm') {
      case 'bitcoin':
        return `${baseUrl}/tx/${txHash}`;
      case 'solana':
        return `${baseUrl}/tx/${txHash}`;
      case 'ton':
        return `https://tonviewer.com/transaction/${txHash}`;
      default: // EVM chains
        return `${baseUrl}/tx/${txHash}`;
    }
  }

  // Clean up connections
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.currentChain = null;
    this.initialized = false;
    this.initializationPromise = null;
    
    // Clear wallet connections
    this.ethereumWallet = null;
    this.bitcoinWallet = null;
    this.solanaWallet = null;
    this.tonWallet = null;
    this.bitcoinAddress = null;
    
    console.log('🔌 ZetaChain Service disconnected');
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.initialized,
      currentChain: this.currentChain,
      isTestnet: this.isTestnet,
      supportedChains: this.getSupportedChains().length,
      connectedWallets: {
        ethereum: !!this.ethereumWallet,
        bitcoin: !!this.bitcoinWallet,
        solana: !!this.solanaWallet,
        ton: !!this.tonWallet
      }
    };
  }
}

// Create and export singleton instance
const zetaChainService = new ZetaChainService();
export default zetaChainService;

// Export additional utilities
export {
  SUPPORTED_CHAINS,
  ZETA_CONFIG,
  ZETA_CONNECTOR_ABI,
  ERC20_ABI
};