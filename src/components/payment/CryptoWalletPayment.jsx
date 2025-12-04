// src/components/payment/CryptoWalletPayment.jsx - Fixed to prevent double wallet prompts
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Copy, 
  ExternalLink,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { walletManager, useWalletConnection } from '../utils/walletConnectionManager';

import { ethers } from 'ethers'; 

const CryptoWalletPayment = ({ 
  wallet, 
  orderData, 
  exchangeRate, 
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [currentChainId, setCurrentChainId] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState(''); // 'pending', 'success', 'failed'
  const [error, setError] = useState('');
  
  // Use centralized wallet connection
  const { connectWallet, isConnecting } = useWalletConnection();
  
  const cryptoAmount = (orderData.totalPrice / exchangeRate).toFixed(6);
  const requiredChainId = getRequiredChainId(wallet.network);
  
  // Ref to prevent double initialization
  const initializedRef = useRef(false);

  // Check wallet connection on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      checkWalletConnection();
    }
  }, []);

  // Listen for wallet events using centralized manager
  useEffect(() => {
    const handleWalletDisconnected = (event) => {
      if (event.detail.wallet === 'metamask') {
        setWalletConnected(false);
        setConnectedAddress('');
      }
    };

    const handleAccountsChanged = (event) => {
      if (event.detail.wallet === 'metamask') {
        const accounts = event.detail.accounts;
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          setWalletConnected(true);
        } else {
          setWalletConnected(false);
          setConnectedAddress('');
        }
      }
    };

    const handleChainChanged = (event) => {
      if (event.detail.wallet === 'metamask') {
        setCurrentChainId(event.detail.chainId);
        setCurrentNetwork(event.detail.network);
      }
    };

    window.addEventListener('wallet-disconnected', handleWalletDisconnected);
    window.addEventListener('wallet-accounts-changed', handleAccountsChanged);
    window.addEventListener('wallet-chain-changed', handleChainChanged);

    return () => {
      window.removeEventListener('wallet-disconnected', handleWalletDisconnected);
      window.removeEventListener('wallet-accounts-changed', handleAccountsChanged);
      window.removeEventListener('wallet-chain-changed', handleChainChanged);
    };
  }, []);

  const checkWalletConnection = async () => {
    try {
      const walletInfo = walletManager.getWalletInfo('metamask');
      if (walletInfo) {
        setWalletConnected(true);
        setConnectedAddress(walletInfo.address);
        setCurrentNetwork(walletInfo.network);
        setCurrentChainId(walletInfo.chainId);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError('');
      const walletInfo = await connectWallet('metamask');
      
      setWalletConnected(true);
      setConnectedAddress(walletInfo.address);
      setCurrentNetwork(walletInfo.network);
      setCurrentChainId(walletInfo.chainId);
      
      // Switch to required network if needed
      if (walletInfo.chainId !== requiredChainId) {
        await switchToRequiredNetwork();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const switchToRequiredNetwork = async () => {
    setLoading(true);
    try {
      await walletManager.switchNetwork(requiredChainId, getNetworkConfig(wallet.network));
      setCurrentNetwork(wallet.network);
      setCurrentChainId(requiredChainId);
    } catch (error) {
      setError(`Failed to switch to ${wallet.network} network: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendPayment = async () => {
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('');

    try {
      // Ensure we're on the correct network
      if (currentChainId !== requiredChainId) {
        await switchToRequiredNetwork();
      }

      // Send transaction
      const hash = await sendEthereumTransaction({
        to: wallet.address,
        value: cryptoAmount,
        tokenAddress: wallet.tokenAddress || null,
        decimals: wallet.decimals || 18
      });

      setTxHash(hash);
      setTxStatus('pending');
      
      // Wait for transaction confirmation
      await waitForTransactionConfirmation(hash);
      
    } catch (error) {
      setError(error.message);
      setTxStatus('failed');
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const waitForTransactionConfirmation = async (hash) => {
    try {
      const checkTransaction = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [hash]
          });

          if (receipt) {
            if (receipt.status === '0x1') {
              setTxStatus('success');
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  txHash: hash,
                  network: wallet.network,
                  amount: cryptoAmount,
                  currency: wallet.currency
                });
              }
            } else {
              setTxStatus('failed');
              setError('Transaction failed');
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error checking transaction:', error);
          return false;
        }
      };

      // Poll for transaction status
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (!confirmed && attempts < maxAttempts) {
        confirmed = await checkTransaction();
        if (!confirmed) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        }
      }

      if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
      }
    } catch (error) {
      setTxStatus('failed');
      setError(error.message);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src={wallet.icon || '/crypto-icons/generic.svg'} 
            alt={wallet.currency}
            className="w-6 h-6"
          />
          Pay with {wallet.currency} ({wallet.network})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Amount to Pay</div>
          <div className="text-lg font-semibold">{cryptoAmount} {wallet.currency}</div>
          <div className="text-sm text-gray-500">≈ ${orderData.totalPrice}</div>
        </div>

        {/* Wallet Connection Status */}
        {!walletConnected ? (
          <div className="space-y-2">
            <Button 
              onClick={handleConnectWallet} 
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect {wallet.currency} Wallet
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Wallet Info */}
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Wallet Connected</span>
              </div>
              <div className="text-sm text-green-600 mt-1 font-mono">
                {formatAddress(connectedAddress)}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Network Check */}
            {currentNetwork !== wallet.network && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Please switch to {wallet.network} network</span>
                  <Button 
                    onClick={switchToRequiredNetwork}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    disabled={loading}
                  >
                    {loading ? 'Switching...' : 'Switch Network'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Send Payment Button */}
            {currentNetwork === wallet.network && (
              <Button 
                onClick={sendPayment}
                disabled={loading || txStatus === 'success'}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : txStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Payment Sent Successfully
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Send Payment
                  </>
                )}
              </Button>
            )}

            {/* Transaction Status */}
            {txHash && (
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transaction:</span>
                  <Badge 
                    variant={txStatus === 'success' ? 'success' : 
                           txStatus === 'failed' ? 'destructive' : 
                           'secondary'}
                  >
                    {txStatus === 'pending' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                    {txStatus === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {txStatus === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {txStatus || 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono break-all">{formatAddress(txHash)}</span>
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => copyToClipboard(txHash)}
                      variant="ghost" 
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      onClick={() => window.open(getBlockExplorerUrl(txHash, wallet.network), '_blank')}
                      variant="ghost" 
                      size="sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Double-check the recipient address and amount before sending. Cryptocurrency transactions cannot be reversed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions (keep your existing implementations)
const getRequiredChainId = (network) => {
  const chainIds = {
    ethereum: '0x1',
    polygon: '0x89',
    bsc: '0x38',
    avalanche: '0xa86a',
    arbitrum: '0xa4b1',
    sepolia: '0xaa36a7'
  };
  return chainIds[network] || '0x1';
};

const getNetworkConfig = (network) => {
  // Return network configuration for adding to wallet
  const configs = {
    polygon: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/'],
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
    },
    // Add other network configs as needed
  };
  return configs[network];
};

const getBlockExplorerUrl = (txHash, network) => {
  const explorers = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    avalanche: `https://snowtrace.io/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    sepolia: `https://sepolia.etherscan.io/tx/${txHash}`
  };
  return explorers[network] || `https://etherscan.io/tx/${txHash}`;
};

// Keep your existing sendEthereumTransaction implementation
const sendEthereumTransaction = async ({ to, value, tokenAddress, decimals }) => {
  // Your existing transaction logic
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  if (tokenAddress) {
    // ERC-20 token transfer
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const amount = ethers.parseUnits(value.toString(), decimals);
    const tx = await tokenContract.transfer(to, amount);
    return tx.hash;
  } else {
    // Native token transfer
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(value.toString())
    });
    return tx.hash;
  }
};

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

export default CryptoWalletPayment;