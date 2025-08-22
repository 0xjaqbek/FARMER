// src/components/payment/CryptoWalletPayment.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  QrCode
} from 'lucide-react';

import { getNetworkName, getNetworkDisplayName, isTestnet } from '../../utils/networkUtils';

// Web3 integration utilities
const isWeb3Available = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

const connectMetaMask = async () => {
  if (!isWeb3Available()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    return {
      address: accounts[0],
      chainId: chainId,
      network: getNetworkName(chainId)
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request.');
    }
    throw error;
  }
};

const switchNetwork = async (targetChainId) => {
  if (!isWeb3Available()) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }]
    });
  } catch (error) {
    if (error.code === 4902) {
      await addNetwork(targetChainId);
    } else {
      throw error;
    }
  }
};

const addNetwork = async (chainId) => {
  const networkConfigs = {
    '0x89': {
      chainId: '0x89',
      chainName: 'Polygon',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/']
    },
    '0x38': {
      chainId: '0x38',
      chainName: 'Binance Smart Chain',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      rpcUrls: ['https://bsc-dataseed1.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com/']
    }
  };

  const config = networkConfigs[chainId];
  if (!config) {
    throw new Error('Network configuration not found');
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [config]
  });
};

const sendEthereumTransaction = async ({ to, value, tokenAddress = null, decimals = 18 }) => {
  if (!isWeb3Available()) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    if (accounts.length === 0) {
      throw new Error('No connected accounts found.');
    }

    let txParams;

    if (tokenAddress) {
      // ERC-20 token transfer
      const amount = (parseFloat(value) * Math.pow(10, decimals)).toString(16);
      const data = `0xa9059cbb${to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      
      txParams = {
        from: accounts[0],
        to: tokenAddress,
        data: data,
        gas: '0x186a0' // 100,000 gas limit
      };
    } else {
      // Native ETH transfer
      const weiValue = (parseFloat(value) * Math.pow(10, 18)).toString(16);
      
      txParams = {
        from: accounts[0],
        to: to,
        value: `0x${weiValue}`,
        gas: '0x5208' // 21,000 gas limit for ETH transfer
      };
    }

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams]
    });

    return txHash;
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected the transaction.');
    }
    throw error;
  }
};

const getRequiredChainId = (network) => {
  const chainIds = {
    ethereum: '0x1',
    polygon: '0x89',
    bsc: '0x38',
    avalanche: '0xa86a',
    arbitrum: '0xa4b1'
  };
  
  return chainIds[network] || '0x1';
};

const getBlockExplorerUrl = (txHash, network) => {
  const explorers = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    avalanche: `https://snowtrace.io/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`
  };
  
  return explorers[network] || `https://etherscan.io/tx/${txHash}`;
};

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
  
  const cryptoAmount = (orderData.totalPrice / exchangeRate).toFixed(6);
  const requiredChainId = getRequiredChainId(wallet.network);

  // Check if wallet is already connected
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (isWeb3Available()) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletConnected(false);
          setConnectedAddress('');
        } else {
          setConnectedAddress(accounts[0]);
        }
      };

        const handleChainChanged = (chainId) => {
        setCurrentNetwork(getNetworkName(chainId));
        setCurrentChainId(chainId); // Add this line
        };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

    const checkWalletConnection = async () => {
    if (!isWeb3Available()) return;

    try {
        const accounts = await window.ethereum.request({
        method: 'eth_accounts'
        });

        if (accounts.length > 0) {
        setWalletConnected(true);
        setConnectedAddress(accounts[0]);
        
        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });
        setCurrentNetwork(getNetworkName(chainId));
        setCurrentChainId(chainId); // Add this line
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
    };

    const connectWallet = async () => {
    setLoading(true);
    setError('');

    try {
        const connection = await connectMetaMask();
        setWalletConnected(true);
        setConnectedAddress(connection.address);
        setCurrentNetwork(connection.network);
        setCurrentChainId(connection.chainId); // Add this line
        
        // Check if we need to switch networks
        if (connection.chainId !== requiredChainId) {
        await switchToRequiredNetwork();
        }
        
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
    };

  const switchToRequiredNetwork = async () => {
    setLoading(true);
    try {
      await switchNetwork(requiredChainId);
      setCurrentNetwork(wallet.network);
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
      // Double-check network
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (chainId !== requiredChainId) {
        await switchToRequiredNetwork();
      }

      // Send transaction
      const hash = await sendEthereumTransaction({
        to: wallet.address,
        value: cryptoAmount,
        tokenAddress: wallet.tokenAddress || null, // For ERC-20 tokens
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
      // Poll for transaction receipt
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
        } catch {
          return false;
        }
      };

      // Poll every 2 seconds for up to 5 minutes
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes

      const pollTransaction = async () => {
        const confirmed = await checkTransaction();
        if (confirmed || attempts >= maxAttempts) {
          return;
        }
        
        attempts++;
        setTimeout(pollTransaction, 2000);
      };

      await pollTransaction();
      
    } catch (error) {
      console.error('Error waiting for confirmation:', error);
      setError('Failed to confirm transaction');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #10b981; color: white;
      padding: 12px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;
    `;
    notification.textContent = 'Copied to clipboard';
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isWeb3Available()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cryptocurrency Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              MetaMask is not installed. Please install MetaMask browser extension to pay with cryptocurrency.
              <div className="mt-2">
                <Button asChild variant="outline" size="sm">
                  <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Install MetaMask
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {wallet.currency} Payment
          {walletConnected && (
            <Badge variant="success" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {walletConnected && isTestnet(currentChainId) && (
  <Alert className="mb-3">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      🧪 TESTNET MODE: Connected to {getNetworkDisplayName(currentChainId)}
    </AlertDescription>
  </Alert>
)}

        {/* Wallet Connection Status */}
        {walletConnected ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                <p className="text-xs text-green-600">{formatAddress(connectedAddress)}</p>
                <p className="text-xs text-green-600">Network: {getNetworkDisplayName(currentNetwork)}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        ) : (
          <Button onClick={connectWallet} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        )}

        {/* Payment Details */}
        {walletConnected && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Recipient:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{formatAddress(wallet.address)}</span>
                  <Button 
                    onClick={() => copyToClipboard(wallet.address)}
                    variant="ghost" 
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium">Amount:</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">{cryptoAmount} {wallet.currency}</span>
                  <p className="text-xs text-gray-500">≈ {orderData.totalPrice.toFixed(2)} PLN</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Network:</span>
                <span className="text-sm">{wallet.network}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Exchange Rate:</span>
                <span className="text-sm">1 {wallet.currency} = {exchangeRate.toFixed(2)} PLN</span>
              </div>
            </div>

            {/* Network Switch Warning */}
            {currentNetwork !== wallet.network && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please switch to {wallet.network} network to continue.
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

export default CryptoWalletPayment;