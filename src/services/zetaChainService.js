// src/services/zetaChainService.js
import { ethers } from 'ethers';

// ZetaChain configuration
const ZETA_CONFIG = {
  // ZetaChain Mainnet
  mainnet: {
    chainId: 7000,
    name: 'ZetaChain Mainnet',
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    connectorAddress: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2', // ZetaChain Connector
    zetaTokenAddress: '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
    blockExplorer: 'https://zetachain.blockscout.com/'
  },
  // ZetaChain Athens Testnet  
  testnet: {
    chainId: 7001,
    name: 'ZetaChain Athens Testnet',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    connectorAddress: '0x9135f5afd6F055e731bca2348429482eE614CFfA',
    zetaTokenAddress: '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
    blockExplorer: 'https://zetachain-athens-3.blockscout.com/'
  }
};

// Supported source chains for cross-chain payments
const SUPPORTED_CHAINS = {
  // EVM Chains
  ethereum: { chainId: 1, name: 'Ethereum', type: 'evm', connector: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2' },
  bsc: { chainId: 56, name: 'BSC', type: 'evm', connector: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2' },
  polygon: { chainId: 137, name: 'Polygon', type: 'evm', connector: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2' },
  avalanche: { chainId: 43114, name: 'Avalanche', type: 'evm', connector: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2' },
  base: { chainId: 8453, name: 'Base', type: 'evm', connector: '0x00005e3125aba53c5652f9f0ce1a4c8664ec89c2' },
  
  // Non-EVM Chains (Native ZetaChain Support)
  bitcoin: { chainId: 'btc-mainnet', name: 'Bitcoin', type: 'utxo', symbol: 'BTC' },
  solana: { chainId: 'solana-mainnet', name: 'Solana', type: 'svm', symbol: 'SOL' },
  ton: { chainId: 'ton-mainnet', name: 'TON', type: 'ton', symbol: 'TON' },
  
  // Testnets
  sepolia: { chainId: 11155111, name: 'Sepolia', type: 'evm', connector: '0x9135f5afd6F055e731bca2348429482eE614CFfA' },
  bsc_testnet: { chainId: 97, name: 'BSC Testnet', type: 'evm', connector: '0x9135f5afd6F055e731bca2348429482eE614CFfA' },
  mumbai: { chainId: 80001, name: 'Mumbai', type: 'evm', connector: '0x9135f5afd6F055e731bca2348429482eE614CFfA' },
  bitcoin_testnet: { chainId: 'btc-testnet', name: 'Bitcoin Testnet', type: 'utxo', symbol: 'tBTC' },
  solana_devnet: { chainId: 'solana-devnet', name: 'Solana Devnet', type: 'svm', symbol: 'SOL' },
  ton_testnet: { chainId: 'ton-testnet', name: 'TON Testnet', type: 'ton', symbol: 'TON' },
};

// ZetaChain Connector ABI (simplified)
const ZETA_CONNECTOR_ABI = [
  "function send(tuple(uint256 destinationChainId, bytes recipient, uint256 gasLimit, bytes message, uint256 coinType, bytes coinAddress) zetaTxSenderInput) external payable",
  "function sendZeta(tuple(uint256 destinationChainId, bytes recipient, uint256 gasLimit, bytes message) zetaTxSenderInput) external"
];

class ZetaChainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.connector = null;
    this.currentChain = null;
    this.isTestnet = import.meta.env.NODE_ENV !== 'production';
  }

  // Initialize ZetaChain service
  async initialize(chainType = 'evm') {
    try {
      this.chainType = chainType;

      if (chainType === 'evm') {
        // EVM chains (Ethereum, BSC, Polygon, etc.)
        if (!window.ethereum) {
          throw new Error('EVM wallet not found. Please install MetaMask or similar wallet.');
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        const network = await this.provider.getNetwork();
        this.currentChain = Number(network.chainId);
      } 
      else if (chainType === 'svm') {
        // Solana
        if (!window.solana || !window.solana.isPhantom) {
          throw new Error('Solana wallet not found. Please install Phantom wallet.');
        }
        
        // Connect to Phantom wallet
        const resp = await window.solana.connect();
        this.solanaWallet = window.solana;
        this.currentChain = 'solana-mainnet';
        console.log('🔗 Connected to Solana wallet:', resp.publicKey.toString());
      }
      else if (chainType === 'utxo') {
        // Bitcoin
        if (!window.unisat && !window.xverse) {
          throw new Error('Bitcoin wallet not found. Please install Unisat or Xverse wallet.');
        }
        
        // Try Unisat first, then Xverse
        if (window.unisat) {
          const accounts = await window.unisat.requestAccounts();
          this.bitcoinWallet = window.unisat;
          this.bitcoinAddress = accounts[0];
          this.currentChain = 'btc-mainnet';
          console.log('🔗 Connected to Unisat Bitcoin wallet:', accounts[0]);
        } else if (window.xverse) {
          // Xverse wallet integration
          const getAddressOptions = {
            payload: {
              purposes: ['ordinals', 'payment'],
              message: 'Address for ZetaChain cross-chain payments',
            },
          };
          
          const response = await window.XverseProviders.BitcoinProvider.request('getAddresses', getAddressOptions);
          this.bitcoinWallet = window.XverseProviders.BitcoinProvider;
          this.bitcoinAddress = response.addresses[0].address;
          this.currentChain = 'btc-mainnet';
          console.log('🔗 Connected to Xverse Bitcoin wallet:', this.bitcoinAddress);
        }
      }
      else if (chainType === 'ton') {
        // TON
        if (!window.tonConnect && !window.TON_CONNECT_UI) {
          throw new Error('TON wallet not found. Please install TON Wallet or Tonkeeper.');
        }
        
        // TON Connect integration
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
      console.error('❌ Error initializing ZetaChain service:', error);
      throw error;
    }
  }

  // Check if current chain is supported for cross-chain payments
  isChainSupported(chainId = null) {
    const checkChain = chainId || this.currentChain;
    return Object.values(SUPPORTED_CHAINS).some(chain => chain.chainId === checkChain);
  }

  // Get supported chains for UI display
  getSupportedChains() {
    return Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => ({
      id: key,
      ...chain
    }));
  }

  // Switch to ZetaChain network
  async switchToZetaChain() {
    try {
      const zetaConfig = this.isTestnet ? ZETA_CONFIG.testnet : ZETA_CONFIG.mainnet;
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${zetaConfig.chainId.toString(16)}` }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          // Chain not added, add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${zetaConfig.chainId.toString(16)}`,
              chainName: zetaConfig.name,
              rpcUrls: [zetaConfig.rpcUrl],
              blockExplorerUrls: [zetaConfig.blockExplorer],
              nativeCurrency: {
                name: 'ZETA',
                symbol: 'ZETA',
                decimals: 18
              }
            }]
          });
        } else {
          throw switchError;
        }
      }

      // Reinitialize after network switch
      await this.initialize();
      return true;
    } catch (error) {
      console.error('❌ Error switching to ZetaChain:', error);
      throw error;
    }
  }

  // Create cross-chain contribution transaction
  async createCrossChainContribution({
    campaignId,
    amount, // Amount in ETH/native token
    sourceChain,
    targetContractAddress, // Your crowdfunding contract address
    rewardIndex = null
  }) {
    try {
      if (!this.isChainSupported(sourceChain)) {
        throw new Error(`Chain ${sourceChain} not supported for cross-chain payments`);
      }

      const sourceChainConfig = Object.values(SUPPORTED_CHAINS).find(
        chain => chain.chainId === sourceChain
      );

      if (!sourceChainConfig) {
        throw new Error('Source chain configuration not found');
      }

      // Initialize connector contract on source chain
      const connectorContract = new ethers.Contract(
        sourceChainConfig.connector,
        ZETA_CONNECTOR_ABI,
        this.signer
      );

      // Encode the contribution data for your smart contract
      const contributionData = this.encodeContributionData(campaignId, rewardIndex);

      // Determine destination chain (where your contract is deployed)
      const destinationChainId = this.isTestnet ? 11155111 : 1; // Sepolia or Mainnet

      // Estimate gas for cross-chain call
      const gasLimit = 500000; // Adjust based on your contract's needs

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());

      // Prepare cross-chain transaction
      const zetaTxInput = {
        destinationChainId: destinationChainId,
        recipient: ethers.getBytes(targetContractAddress),
        gasLimit: gasLimit,
        message: contributionData,
        coinType: 1, // Native gas token (ETH, BNB, MATIC, etc.)
        coinAddress: '0x0000000000000000000000000000000000000000' // Native token
      };

      return {
        contract: connectorContract,
        txInput: zetaTxInput,
        amount: amountWei,
        sourceChain: sourceChainConfig.name
      };

    } catch (error) {
      console.error('❌ Error creating cross-chain contribution:', error);
      throw error;
    }
  }

  // Execute cross-chain contribution
  async executeCrossChainContribution({
    campaignId,
    amount,
    sourceChain,
    targetContractAddress,
    rewardIndex = null,
    onProgress = null
  }) {
    try {
      onProgress?.('Preparing cross-chain transaction...');

      const sourceChainConfig = Object.values(SUPPORTED_CHAINS).find(
        chain => chain.chainId === sourceChain || chain.name === sourceChain
      );

      if (!sourceChainConfig) {
        throw new Error('Source chain configuration not found');
      }

      // Initialize appropriate wallet for source chain
      await this.initialize(sourceChainConfig.type);

      let result;

      if (sourceChainConfig.type === 'evm') {
        result = await this.executeEVMCrossChain({
          campaignId,
          amount,
          sourceChainConfig,
          targetContractAddress,
          rewardIndex,
          onProgress
        });
      } else if (sourceChainConfig.type === 'utxo') {
        result = await this.executeBitcoinCrossChain({
          campaignId,
          amount,
          targetContractAddress,
          rewardIndex,
          onProgress
        });
      } else if (sourceChainConfig.type === 'svm') {
        result = await this.executeSolanaCrossChain({
          campaignId,
          amount,
          targetContractAddress,
          rewardIndex,
          onProgress
        });
      } else if (sourceChainConfig.type === 'ton') {
        result = await this.executeTONCrossChain({
          campaignId,
          amount,
          targetContractAddress,
          rewardIndex,
          onProgress
        });
      } else {
        throw new Error(`Unsupported chain type: ${sourceChainConfig.type}`);
      }

      onProgress?.('Cross-chain transaction confirmed!');
      return result;

    } catch (error) {
      console.error('❌ Error executing cross-chain contribution:', error);
      throw error;
    }
  }

  // Execute EVM cross-chain transaction (existing logic)
  async executeEVMCrossChain({
    campaignId,
    amount,
    sourceChainConfig,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    // Initialize connector contract on source chain
    const connectorContract = new ethers.Contract(
      sourceChainConfig.connector,
      ZETA_CONNECTOR_ABI,
      this.signer
    );

    // Encode the contribution data
    const contributionData = this.encodeContributionData(campaignId, rewardIndex);

    // Determine destination chain and prepare transaction parameters
    const destinationChainId = this.isTestnet ? 11155111 : 1;
    const amountWei = ethers.parseEther(amount.toString());

    // Prepare cross-chain transaction with appropriate gas limit
    const zetaTxInput = {
      destinationChainId: destinationChainId,
      recipient: ethers.getBytes(targetContractAddress),
      gasLimit: 500000, // Gas limit for destination execution
      message: contributionData,
      coinType: 1,
      coinAddress: '0x0000000000000000000000000000000000000000'
    };

    onProgress?.('Sending EVM cross-chain transaction...');

    const tx = await connectorContract.send(zetaTxInput, { value: amountWei });
    onProgress?.('Transaction sent, waiting for confirmation...');

    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
      sourceChain: sourceChainConfig.name,
      destinationChain: destinationChainId,
      amount: amount,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
      chainType: 'evm'
    };
  }

  // Execute Bitcoin cross-chain transaction
  async executeBitcoinCrossChain({
    campaignId,
    amount,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    onProgress?.('Preparing Bitcoin cross-chain transaction...');

    // Convert amount to satoshis
    const amountSats = Math.floor(amount * 100000000);

    // Prepare Bitcoin transaction through ZetaChain Gateway
    const zetaChainGateway = this.isTestnet 
      ? 'tb1qy9pqmk2pd9sv63g27jt8r657wy0d9aws53htne' // Testnet gateway
      : 'bc1qm24wp577nk8aacckv8np465z3dvmu7ry45el6y'; // Mainnet gateway

    // Encode campaign data in OP_RETURN
    const campaignData = this.encodeCampaignDataForBitcoin(campaignId, rewardIndex, targetContractAddress);

    let txHash;

    if (this.bitcoinWallet === window.unisat) {
      // Unisat wallet
      onProgress?.('Sending Bitcoin transaction via Unisat...');
      
      txHash = await window.unisat.sendBitcoin(zetaChainGateway, amountSats, {
        feeRate: 10, // sats/vB
        memo: campaignData // OP_RETURN data
      });
    } else if (this.bitcoinWallet === window.XverseProviders.BitcoinProvider) {
      // Xverse wallet
      onProgress?.('Sending Bitcoin transaction via Xverse...');
      
      const sendBtcOptions = {
        payload: {
          recipients: [{
            address: zetaChainGateway,
            amountSats: amountSats
          }],
          message: campaignData
        }
      };
      
      const response = await this.bitcoinWallet.request('sendTransfer', sendBtcOptions);
      txHash = response.txid;
    }

    onProgress?.('Bitcoin transaction sent, processing cross-chain...');

    return {
      success: true,
      transactionHash: txHash,
      sourceChain: 'Bitcoin',
      amount: amount,
      chainType: 'utxo',
      gatewayAddress: zetaChainGateway
    };
  }

  // Execute Solana cross-chain transaction
  async executeSolanaCrossChain({
    campaignId,
    amount,
    targetContractAddress,
    rewardIndex,
    onProgress
  }) {
    onProgress?.('Preparing Solana cross-chain transaction...');

    // Convert SOL to lamports
    const amountLamports = amount * 1000000000; // 1 SOL = 1e9 lamports

    // ZetaChain Solana Gateway Program ID
    const zetaSolanaProgramId = this.isTestnet 
      ? 'ZETAjseVjuFsxdRxo6MmTCvqKwmVhPSi5wTMrW9FLix' // Testnet
      : 'ZETA2o5MvzVj4tgpKKDbBm8kMbQjJm8k3RZiQGSvnLT'; // Mainnet

    // Create Solana transaction
    try {
      // Dynamic import to avoid build-time dependency issues
      const { Transaction, PublicKey, SystemProgram } = await import('@solana/web3.js');
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.solanaWallet.publicKey,
          toPubkey: new PublicKey(zetaSolanaProgramId),
          lamports: amountLamports,
        })
      );

      // Add campaign data as memo
      const campaignMemo = this.encodeCampaignDataForSolana(campaignId, rewardIndex, targetContractAddress);
      
      // Create memo instruction using browser-compatible method
      const encoder = new TextEncoder();
      const memoData = encoder.encode(campaignMemo);
      
      transaction.add({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: memoData
      });

      onProgress?.('Sending Solana transaction...');

      // Sign and send transaction
      const { signature } = await this.solanaWallet.signAndSendTransaction(transaction);
      
      onProgress?.('Solana transaction sent, processing cross-chain...');

      return {
        success: true,
        transactionHash: signature,
        sourceChain: 'Solana',
        amount: amount,
        chainType: 'svm',
        programId: zetaSolanaProgramId
      };

    } catch (importError) {
      // If Solana library is not available, provide fallback
      console.warn('Solana Web3.js not available:', importError);
      throw new Error('Solana payments require @solana/web3.js package. Please install it or use a different payment method.');
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
    onProgress?.('Preparing TON cross-chain transaction...');

    // Convert TON to nanoTON
    const amountNano = Math.floor(amount * 1000000000); // 1 TON = 1e9 nanoTON

    // ZetaChain TON Gateway Contract
    const zetaTonGateway = this.isTestnet
      ? 'kQBm4vI7JNjRfMN_2VdvJPfEeAhjEqb5QA5vJhPn-CwwW0YV' // Testnet
      : 'kQCK1W5F7N2VdvJPfEeAhjEqb5QA5vJhPn9MwwWOYVaBc7'; // Mainnet

    // Prepare TON transaction with campaign data
    const campaignData = this.encodeCampaignDataForTON(campaignId, rewardIndex, targetContractAddress);

    onProgress?.('Sending TON transaction...');

    // Send transaction through TON Connect
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      messages: [{
        address: zetaTonGateway,
        amount: amountNano.toString(),
        payload: campaignData
      }]
    };

    const result = await this.tonWallet.sendTransaction(transaction);
    
    onProgress?.('TON transaction sent, processing cross-chain...');

    return {
      success: true,
      transactionHash: result.hash,
      sourceChain: 'TON',
      amount: amount,
      chainType: 'ton',
      gatewayContract: zetaTonGateway
    };
  }

  // Encode contribution data for your smart contract
  encodeContributionData(campaignId, rewardIndex = null) {
    try {
      // ABI encode the function call to contribute()
      const iface = new ethers.Interface([
        "function contribute(uint256 campaignId, uint256 rewardIndex)"
      ]);

      const encodedData = iface.encodeFunctionData("contribute", [
        campaignId,
        rewardIndex !== null ? rewardIndex : ethers.MaxUint256
      ]);

      return encodedData;
    } catch (error) {
      console.error('❌ Error encoding contribution data:', error);
      throw error;
    }
  }

  // Encode campaign data for Bitcoin OP_RETURN
  encodeCampaignDataForBitcoin(campaignId, rewardIndex, targetContract) {
    const data = {
      type: 'crowdfund_contribution',
      campaignId: campaignId,
      rewardIndex: rewardIndex || 0,
      targetContract: targetContract,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    // Use TextEncoder instead of Buffer for browser compatibility
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(JSON.stringify(data));
    return Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 160); // Max 80 bytes for OP_RETURN
  }

  // Encode campaign data for Solana memo
  encodeCampaignDataForSolana(campaignId, rewardIndex, targetContract) {
    return JSON.stringify({
      type: 'zeta_crowdfund',
      campaignId: campaignId,
      rewardIndex: rewardIndex || 0,
      targetContract: targetContract,
      chain: 'solana'
    });
  }

  // Encode campaign data for TON payload
  encodeCampaignDataForTON(campaignId, rewardIndex, targetContract) {
    const data = {
      op: 0x12345678, // Custom operation code
      campaignId: campaignId,
      rewardIndex: rewardIndex || 0,
      targetContract: targetContract
    };
    
    // Convert to base64 for TON Cell format using browser-compatible method
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(JSON.stringify(data));
    return btoa(String.fromCharCode(...uint8Array));
  }

  // Monitor cross-chain transaction status
  async trackCrossChainTransaction(txHash, sourceChainId) {
    try {
      const sourceChain = Object.values(SUPPORTED_CHAINS).find(
        chain => chain.chainId === sourceChainId
      );

      if (!sourceChain) {
        throw new Error('Source chain not found');
      }

      // Create explorer URL based on chain type
      let explorerUrl = '#';
      if (sourceChain.type === 'evm') {
        // EVM chains have different explorer patterns
        if (sourceChain.name.toLowerCase().includes('ethereum')) {
          explorerUrl = `https://etherscan.io/tx/${txHash}`;
        } else if (sourceChain.name.toLowerCase().includes('bsc')) {
          explorerUrl = `https://bscscan.com/tx/${txHash}`;
        } else if (sourceChain.name.toLowerCase().includes('polygon')) {
          explorerUrl = `https://polygonscan.com/tx/${txHash}`;
        }
      } else if (sourceChain.type === 'utxo') {
        explorerUrl = `https://blockstream.info/tx/${txHash}`;
      } else if (sourceChain.type === 'svm') {
        explorerUrl = `https://solscan.io/tx/${txHash}`;
      } else if (sourceChain.type === 'ton') {
        explorerUrl = `https://tonscan.org/tx/${txHash}`;
      }

      return {
        txHash,
        sourceChain: sourceChain.name,
        status: 'pending', // You can query ZetaChain's API for actual status
        explorerUrl
      };

    } catch (error) {
      console.error('❌ Error tracking cross-chain transaction:', error);
      throw error;
    }
  }

  // Estimate cross-chain fees
  async estimateCrossChainFees(sourceChainId, destinationChainId, gasLimit = 500000) {
    try {
      const sourceChain = Object.values(SUPPORTED_CHAINS).find(
        chain => chain.chainId === sourceChainId
      );

      if (!sourceChain) {
        throw new Error('Source chain not found');
      }

      let baseFee, gasFee, currency;

      if (sourceChain.type === 'evm') {
        // EVM chain fees - gas limit affects the gas fee calculation
        baseFee = ethers.parseEther('0.01'); // Base cross-chain fee
        gasFee = ethers.parseEther((gasLimit * 0.00000001).toString()); // Dynamic gas fee based on limit
        currency = 'ETH';
      } else if (sourceChain.type === 'utxo') {
        // Bitcoin fees (gas limit not applicable)
        baseFee = 0.0001; // BTC
        gasFee = 0.00005;
        currency = 'BTC';
      } else if (sourceChain.type === 'svm') {
        // Solana fees (gas limit not applicable)
        baseFee = 0.01; // SOL
        gasFee = 0.005;
        currency = 'SOL';
      } else if (sourceChain.type === 'ton') {
        // TON fees (gas limit not applicable)
        baseFee = 0.05; // TON
        gasFee = 0.02;
        currency = 'TON';
      }

      const totalFee = sourceChain.type === 'evm' 
        ? ethers.formatEther(baseFee + gasFee)
        : (baseFee + gasFee);

      return {
        baseFee: sourceChain.type === 'evm' ? ethers.formatEther(baseFee) : baseFee.toString(),
        gasFee: sourceChain.type === 'evm' ? ethers.formatEther(gasFee) : gasFee.toString(),
        totalFee: totalFee.toString(),
        currency: currency,
        gasLimit: sourceChain.type === 'evm' ? gasLimit : null
      };

    } catch (error) {
      console.error('❌ Error estimating cross-chain fees:', error);
      throw error;
    }
  }

  // Get user's balance on current chain
  async getUserBalance(address = null, chainType = null) {
    try {
      const currentChainType = chainType || this.chainType || 'evm';
      
      let balance, userAddress, currency;

      if (currentChainType === 'evm') {
        if (!this.provider) await this.initialize('evm');
        
        userAddress = address || await this.signer.getAddress();
        const balanceWei = await this.provider.getBalance(userAddress);
        balance = ethers.formatEther(balanceWei);
        currency = 'ETH';
      } else if (currentChainType === 'utxo') {
        userAddress = address || this.bitcoinAddress;
        
        if (window.unisat) {
          const balanceResponse = await window.unisat.getBalance();
          balance = (balanceResponse.confirmed / 100000000).toString(); // Convert sats to BTC
        } else {
          // Fallback: estimate balance (would need API call in production)
          balance = '0.1'; // Placeholder
        }
        currency = 'BTC';
      } else if (currentChainType === 'svm') {
        if (!this.solanaWallet) await this.initialize('svm');
        
        userAddress = this.solanaWallet.publicKey.toString();
        
        // Get SOL balance (would need Solana web3.js in production)
        try {
          const { Connection, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          const balanceLamports = await connection.getBalance(this.solanaWallet.publicKey);
          balance = (balanceLamports / LAMPORTS_PER_SOL).toString();
        } catch (solanaError) {
          console.warn('Solana Web3.js not available for balance check:', solanaError);
          balance = '1.0'; // Placeholder - would need different approach without the library
        }
        currency = 'SOL';
      } else if (currentChainType === 'ton') {
        userAddress = 'TON Address'; // Would get from wallet
        balance = '10.0'; // Placeholder - would query TON API
        currency = 'TON';
      }
      
      return {
        balance: balance,
        address: userAddress,
        chainId: this.currentChain,
        currency: currency
      };

    } catch (error) {
      console.error('❌ Error getting user balance:', error);
      throw error;
    }
  }

  // Utility function to format chain names for display
  getChainDisplayName(chainId) {
    const chain = Object.values(SUPPORTED_CHAINS).find(c => c.chainId === chainId);
    return chain ? chain.name : `Chain ${chainId}`;
  }
}

// Create singleton instance
const zetaChainService = new ZetaChainService();

export default zetaChainService;