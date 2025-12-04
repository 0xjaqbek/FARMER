//src/utils/networkUtils.js

export const NETWORK_CONFIG = {
  ETHEREUM_MAINNET: {
    chainId: '0x1',
    chainIdDecimal: 1,
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    currency: 'ETH'
  },
  SEPOLIA_TESTNET: {
    chainId: '0xaa36a7',
    chainIdDecimal: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    explorer: 'https://sepolia.etherscan.io',
    currency: 'ETH'
  },
  POLYGON_MAINNET: {
    chainId: '0x89',
    chainIdDecimal: 137,
    name: 'polygon',
    displayName: 'Polygon Mainnet',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC'
  },
  BSC_MAINNET: {
    chainId: '0x38',
    chainIdDecimal: 56,
    name: 'bsc',
    displayName: 'Binance Smart Chain',
    explorer: 'https://bscscan.com',
    currency: 'BNB'
  },
  ARBITRUM_MAINNET: {
    chainId: '0xa4b1',
    chainIdDecimal: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum Mainnet',
    explorer: 'https://arbiscan.io',
    currency: 'ETH'
  },
  OPTIMISM_MAINNET: {
    chainId: '0xa',
    chainIdDecimal: 10,
    name: 'optimism',
    displayName: 'Optimism Mainnet',
    explorer: 'https://optimistic.etherscan.io',
    currency: 'ETH'
  },
  AVALANCHE_MAINNET: {
    chainId: '0xa86a',
    chainIdDecimal: 43114,
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    explorer: 'https://snowtrace.io',
    currency: 'AVAX'
  }
};

// Get network configuration by chain ID
export const getNetworkByChainId = (chainId) => {
  // Convert decimal to hex if needed
  const hexChainId = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId;
  
  return Object.values(NETWORK_CONFIG).find(network => 
    network.chainId.toLowerCase() === hexChainId.toLowerCase()
  );
};

// Get network name from chain ID
export const getNetworkName = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network ? network.name : 'unknown';
};

// Get network display name from chain ID
export const getNetworkDisplayName = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network ? network.displayName : 'Unknown Network';
};

// Get block explorer URL for a transaction
export const getBlockExplorerUrl = (chainIdOrNetwork, txHash) => {
  let network;
  
  if (typeof chainIdOrNetwork === 'string' && chainIdOrNetwork.length <= 10) {
    // It's a network name
    network = Object.values(NETWORK_CONFIG).find(net => net.name === chainIdOrNetwork);
  } else {
    // It's a chain ID
    network = getNetworkByChainId(chainIdOrNetwork);
  }
  
  if (!network) {
    // Default to Sepolia for unknown networks (since you're using testnet)
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  
  return `${network.explorer}/tx/${txHash}`;
};

// Check if current network is a testnet
export const isTestnet = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network?.name === 'sepolia'; // Add more testnets as needed
};

// Get current network from MetaMask
export const getCurrentNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return getNetworkByChainId(chainId);
  } catch (error) {
    console.error('Error getting current network:', error);
    return null;
  }
};

// Switch to a specific network
export const switchToNetwork = async (targetNetwork) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetNetwork.chainId }],
    });
    return true;
  } catch (error) {
    // If network doesn't exist in wallet, try to add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetNetwork.chainId,
            chainName: targetNetwork.displayName,
            nativeCurrency: {
              name: targetNetwork.currency,
              symbol: targetNetwork.currency,
              decimals: 18,
            },
            rpcUrls: [`https://rpc.${targetNetwork.name}.org`], // Generic RPC
            blockExplorerUrls: [targetNetwork.explorer],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw addError;
      }
    }
    console.error('Error switching network:', error);
    throw error;
  }
};

// Default configuration - Set this to your preferred network
export const DEFAULT_NETWORK = NETWORK_CONFIG.SEPOLIA_TESTNET;

// Helper to get required chain ID for the app
export const getRequiredChainId = () => {
  return DEFAULT_NETWORK.chainId;
};

// Check if user is on the correct network
export const isCorrectNetwork = (currentChainId) => {
  return currentChainId === DEFAULT_NETWORK.chainId;
};

export default {
  NETWORK_CONFIG,
  getNetworkByChainId,
  getNetworkName,
  getNetworkDisplayName,
  getBlockExplorerUrl,
  isTestnet,
  getCurrentNetwork,
  switchToNetwork,
  DEFAULT_NETWORK,
  getRequiredChainId,
  isCorrectNetwork
};