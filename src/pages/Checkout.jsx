// Fixed Checkout.jsx - With Real Crypto Wallet Integration

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Wallet,
  Copy,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  QrCode,
  Loader2,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/use-toast';
import { createOrder, updateOrderPayment } from '../firebase/orders';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  generatePaymentReference, 
  calculatePaymentDeadline,
  PAYMENT_TYPES 
} from '../lib/firebaseSchema';

// Web3 Integration Functions
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

const getNetworkName = (chainId) => {
  const networks = {
    '0x1': 'ethereum',
    '0xaa36a7': 'sepolia', // Sepolia testnet
    '0x89': 'polygon',
    '0x38': 'bsc'
  };
  return networks[chainId] || 'unknown';
};

const getRequiredChainId = (network) => {
  const chainIds = {
    ethereum: '0xaa36a7', // Use Sepolia instead of mainnet
    sepolia: '0xaa36a7',
    polygon: '0x89',
    bsc: '0x38'
  };
  return chainIds[network] || '0xaa36a7'; // Default to Sepolia
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
      // Network not added, add it
      const networkConfigs = {
        '0x89': {
          chainId: '0x89',
          chainName: 'Polygon',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/']
        },
        '0x38': {
          chainId: '0x38',
          chainName: 'Binance Smart Chain',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed1.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com/']
        }
      };

      const config = networkConfigs[targetChainId];
      if (config) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [config]
        });
      }
    } else {
      throw error;
    }
  }
};

const sendEthereumTransaction = async ({ to, value }) => {
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

    const weiValue = (parseFloat(value) * Math.pow(10, 18)).toString(16);
    
    const txParams = {
      from: accounts[0],
      to: to,
      value: `0x${weiValue}`,
      gas: '0x5208' // 21,000 gas limit for ETH transfer
    };

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

const getBlockExplorerUrl = (txHash, network) => {
  const explorers = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`
  };
  return explorers[network] || `https://etherscan.io/tx/${txHash}`;
};

// Payment method components
const BankTransferPayment = ({ paymentDetails, orderData, onCopy }) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Bank Transfer Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Please complete the transfer within 24 hours. Your order will be confirmed once payment is received.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">Bank Name</Label>
            <p className="text-sm">{paymentDetails.bankName}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">Account Holder</Label>
            <p className="text-sm">{paymentDetails.accountHolder}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">IBAN</Label>
            <p className="text-sm font-mono">{paymentDetails.iban}</p>
          </div>
          <Button 
            onClick={() => onCopy(paymentDetails.iban)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">Transfer Title</Label>
            <p className="text-sm font-mono">{orderData.transferTitle}</p>
          </div>
          <Button 
            onClick={() => onCopy(orderData.transferTitle)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
          <div>
            <Label className="text-sm font-medium">Amount</Label>
            <p className="text-lg font-bold text-green-600">{orderData.totalPrice.toFixed(2)} PLN</p>
          </div>
          <Button 
            onClick={() => onCopy(`${orderData.totalPrice.toFixed(2)} PLN`)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const BlikPayment = ({ paymentDetails, orderData, onCopy }) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Smartphone className="h-5 w-5" />
        BLIK Transfer Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Send BLIK transfer to the phone number below. Include the transfer title for faster processing.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">Phone Number</Label>
            <p className="text-lg font-mono">{paymentDetails.phoneNumber}</p>
          </div>
          <Button 
            onClick={() => onCopy(paymentDetails.phoneNumber)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <Label className="text-sm font-medium">Transfer Title</Label>
            <p className="text-sm font-mono">{orderData.transferTitle}</p>
          </div>
          <Button 
            onClick={() => onCopy(orderData.transferTitle)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
          <div>
            <Label className="text-sm font-medium">Amount</Label>
            <p className="text-lg font-bold text-green-600">{orderData.totalPrice.toFixed(2)} PLN</p>
          </div>
          <Button 
            onClick={() => onCopy(`${orderData.totalPrice.toFixed(2)} PLN`)}
            variant="outline" 
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-center p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          Open your banking app and send a BLIK transfer to the phone number above
        </p>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Crypto Payment Component with Real Wallet Integration
const CryptoPayment = ({ wallet, orderData, exchangeRate, onCopy, onPaymentSuccess, onPaymentError, disabled = false }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [error, setError] = useState('');

  const cryptoAmount = (orderData.totalPrice / exchangeRate).toFixed(6);
  const requiredChainId = getRequiredChainId(wallet.network);

  // Check wallet connection on mount
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
    if (disabled || !onPaymentSuccess) {
      setError('Please place your order first before making payment.');
      return;
    }

    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('');

    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (chainId !== requiredChainId) {
        await switchToRequiredNetwork();
      }

      const hash = await sendEthereumTransaction({
        to: wallet.address,
        value: cryptoAmount
      });

      setTxHash(hash);
      setTxStatus('pending');
      
      // Notify parent component of successful payment
      if (onPaymentSuccess) {
        onPaymentSuccess({
          txHash: hash,
          network: wallet.network,
          amount: cryptoAmount,
          currency: wallet.currency
        });
      }
      
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

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isWeb3Available()) {
    return (
      <Card className="mt-4">
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
    <Card className="mt-4">
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

        {/* Wallet Connection Status */}
        {walletConnected ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                <p className="text-xs text-green-600">{formatAddress(connectedAddress)}</p>
                <p className="text-xs text-green-600">Network: {currentNetwork}</p>
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                🧪 TESTNET MODE: You're using Sepolia testnet. This is for testing only - no real money will be transferred.
                <br />
                Send exactly the amount shown below to the wallet address. Network: {wallet.network}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <Label className="text-sm font-medium">Wallet Address</Label>
                  <p className="text-xs font-mono break-all">{wallet.address}</p>
                </div>
                <Button 
                  onClick={() => onCopy(wallet.address)}
                  variant="outline" 
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-bold text-green-600">{cryptoAmount} {wallet.currency}</p>
                  <p className="text-xs text-gray-500">≈ {orderData.totalPrice.toFixed(2)} PLN</p>
                </div>
                <Button 
                  onClick={() => onCopy(cryptoAmount)}
                  variant="outline" 
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <Label className="text-sm font-medium">Exchange Rate</Label>
                  <p className="text-sm">1 {wallet.currency} = {exchangeRate.toFixed(2)} PLN</p>
                </div>
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
                disabled={loading || txStatus === 'success' || disabled}
                className="w-full"
                size="lg"
              >
                {disabled ? (
                  'Place Order First'
                ) : loading ? (
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
                      onClick={() => onCopy(txHash)}
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
            <div className="text-center p-4 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Send only {wallet.currency} on {wallet.network} network. Sending other tokens may result in permanent loss.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [farmerPaymentMethods, setFarmerPaymentMethods] = useState({});
  const [exchangeRates, setExchangeRates] = useState({});
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phoneNumber || '',
    address: userProfile?.address?.street || '',
    city: userProfile?.address?.city || '',
    postalCode: userProfile?.address?.postalCode || '',
    notes: ''
  });

  // Load farmer payment methods when component mounts
  useEffect(() => {
    const loadFarmerPaymentMethods = async () => {
      try {
        const farmerIds = [...new Set(cartItems.map(item => item.farmerId || item.rolnikId))];
        const paymentMethods = {};
        
        for (const farmerId of farmerIds) {
          const farmerDoc = await getDoc(doc(db, 'users', farmerId));
          if (farmerDoc.exists()) {
            const farmerData = farmerDoc.data();
            paymentMethods[farmerId] = farmerData.paymentInfo || {};
          }
        }
        
        setFarmerPaymentMethods(paymentMethods);
        
        // Set default payment method
        const firstFarmer = Object.values(paymentMethods)[0];
        if (firstFarmer) {
          if (firstFarmer.bankAccount?.enabled) {
            setSelectedPaymentMethod('bank_transfer');
          } else if (firstFarmer.blik?.enabled) {
            setSelectedPaymentMethod('blik');
          } else if (firstFarmer.cryptoWallets?.some(w => w.enabled)) {
            setSelectedPaymentMethod('crypto');
          } else {
            setSelectedPaymentMethod('cash');
          }
        }
      } catch (error) {
        console.error('Error loading farmer payment methods:', error);
      }
    };

    if (cartItems.length > 0) {
      loadFarmerPaymentMethods();
    }
  }, [cartItems]);

  // Load crypto exchange rates
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        // Testnet exchange rates - using lower values for testing
        const rates = {
          ETH: 8500, // 1 ETH = 8500 PLN (same rate for testnet ETH)
          SepoliaETH: 8500, // 1 SepoliaETH = 8500 PLN 
          BTC: 180000,
          USDC: 4.2,
          MATIC: 3.8,
          BNB: 1200,
          SOL: 400
        };
        setExchangeRates(rates);
      } catch (error) {
        console.error('Error loading exchange rates:', error);
      }
    };

    loadExchangeRates();
  }, []);

  // Calculate total price
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Handle form field changes
  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard'
    });
  };

  // Handle crypto payment success
  const handleCryptoPaymentSuccess = async (paymentData) => {
    try {
      if (!currentOrderId) {
        throw new Error('No order ID available');
      }

      // Update order with crypto payment details
      await updateOrderPayment(currentOrderId, {
        status: 'confirming',
        txHash: paymentData.txHash,
        verification: {
          method: 'blockchain',
          verifiedAt: new Date(),
          notes: `Crypto payment sent: ${paymentData.txHash} on ${paymentData.network}`
        }
      });

      toast({
        title: 'Payment Sent!',
        description: 'Your crypto payment has been sent. Waiting for blockchain confirmation.'
      });

      setSuccess(true);
      clearCart();

      setTimeout(() => {
        navigate('/orders');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating crypto payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Payment sent but failed to update order. Please contact support.',
        variant: 'destructive'
      });
    }
  };

  // Handle crypto payment error
  const handleCryptoPaymentError = (error) => {
    console.error('Crypto payment error:', error);
    toast({
      title: 'Payment Failed',
      description: error.message,
      variant: 'destructive'
    });
  };

  // Get available payment methods for the first farmer (simplified for demo)
  const getAvailablePaymentMethods = () => {
    const firstFarmerPayments = Object.values(farmerPaymentMethods)[0];
    if (!firstFarmerPayments) return [];

    const methods = [];
    
    if (firstFarmerPayments.bankAccount?.enabled) {
      methods.push({
        id: 'bank_transfer',
        name: 'Bank Transfer',
        icon: CreditCard,
        description: 'Traditional bank transfer (IBAN)'
      });
    }
    
    if (firstFarmerPayments.blik?.enabled) {
      methods.push({
        id: 'blik',
        name: 'BLIK',
        icon: Smartphone,
        description: 'Mobile payment to phone number'
      });
    }
    
    if (firstFarmerPayments.cryptoWallets?.some(w => w.enabled)) {
      methods.push({
        id: 'crypto',
        name: 'Cryptocurrency',
        icon: Wallet,
        description: 'Pay with crypto (ETH, BTC, etc.)'
      });
    }
    
    // Cash is always available
    methods.push({
      id: 'cash',
      name: 'Cash on Delivery',
      icon: CreditCard,
      description: 'Pay when you receive the order'
    });

    return methods;
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('Please fill in all required fields');
      }

      // Group items by farmer
      const itemsByRolnik = {};
      cartItems.forEach(item => {
        const farmerId = item.farmerId || item.rolnikId;
        const farmerName = item.farmerName || item.rolnikName;
        
        if (!itemsByRolnik[farmerId]) {
          itemsByRolnik[farmerId] = {
            rolnikId: farmerId,
            rolnikName: farmerName,
            items: []
          };
        }
        itemsByRolnik[farmerId].items.push(item);
      });

      // Create orders for each farmer
      const createdOrderIds = [];
      
      for (const { rolnikId, rolnikName, items } of Object.values(itemsByRolnik)) {
        const orderItems = items.map(item => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit || 'piece',
          totalPrice: item.price * item.quantity
        }));
        
        const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const transferTitle = generatePaymentReference(Date.now().toString(), userProfile.uid);
        
        // Get farmer payment info
        const farmerPayments = farmerPaymentMethods[rolnikId] || {};
        
        // Prepare payment details based on selected method
        let paymentDetails = {};
        
        if (selectedPaymentMethod === 'bank_transfer' && farmerPayments.bankAccount) {
          paymentDetails = {
            bankTransfer: {
              bankName: farmerPayments.bankAccount.bankName,
              accountNumber: farmerPayments.bankAccount.accountNumber,
              accountHolder: farmerPayments.bankAccount.accountHolder,
              iban: farmerPayments.bankAccount.iban,
              transferTitle,
              amount: subtotal,
              currency: 'PLN',
              deadline: calculatePaymentDeadline(24)
            }
          };
        } else if (selectedPaymentMethod === 'blik' && farmerPayments.blik) {
          paymentDetails = {
            blik: {
              phoneNumber: farmerPayments.blik.phoneNumber,
              transferTitle,
              amount: subtotal,
              currency: 'PLN',
              deadline: calculatePaymentDeadline(24)
            }
          };
        } else if (selectedPaymentMethod === 'crypto' && farmerPayments.cryptoWallets) {
          const selectedWallet = farmerPayments.cryptoWallets.find(w => w.enabled);
          if (selectedWallet) {
            const exchangeRate = exchangeRates[selectedWallet.currency] || 1;
            paymentDetails = {
              crypto: {
                network: selectedWallet.network,
                walletAddress: selectedWallet.address,
                amount: subtotal / exchangeRate,
                currency: selectedWallet.currency,
                exchangeRate,
                deadline: calculatePaymentDeadline(24),
                requiredConfirmations: 3
              }
            };
          }
        }
        
        const orderData = {
          items: orderItems,
          subtotal,
          totalPrice: subtotal,
          status: 'pending',
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode
          },
          payment: {
            method: selectedPaymentMethod,
            status: selectedPaymentMethod === 'cash' ? 'pending' : 'pending',
            paymentDetails,
            createdAt: new Date(),
            expiresAt: selectedPaymentMethod === 'cash' ? null : calculatePaymentDeadline(24)
          },
          transferTitle,
          notes: formData.notes,
          clientId: userProfile.uid,
          clientName: `${formData.firstName} ${formData.lastName}`,
          clientPostalCode: formData.postalCode,
          rolnikId,
          rolnikName
        };
        
        const orderId = await createOrder(orderData);
        createdOrderIds.push(orderId);
      }
      
      // Store the first order ID for crypto payments (assuming single farmer for now)
      if (selectedPaymentMethod === 'crypto' && createdOrderIds.length > 0) {
        setCurrentOrderId(createdOrderIds[0]);
        setOrderCreated(true);
      }
      
      // For crypto payments, don't set success immediately - wait for payment
      if (selectedPaymentMethod !== 'crypto') {
        setSuccess(true);
        clearCart();
        
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } else {
        // For crypto payments, just show success message but don't redirect yet
        toast({
          title: 'Order Created!',
          description: 'Please complete the crypto payment below to confirm your order.'
        });
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to process your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show success screen
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Order Placed Successfully!</h2>
              <p className="text-gray-600 mb-6">
                {selectedPaymentMethod === 'cash' 
                  ? 'Your order has been placed. You can pay when you receive your items.'
                  : selectedPaymentMethod === 'crypto'
                  ? 'Your crypto payment has been sent. The order will be confirmed once the transaction is verified.'
                  : 'Please complete the payment to confirm your order.'
                }
              </p>
              <Button asChild>
                <Link to="/orders">View Your Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty cart
  if (cartItems.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">
                You need to add products to your cart before checkout.
              </p>
              <Button asChild>
                <Link to="/browse">Browse Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availablePaymentMethods = getAvailablePaymentMethods();
  const firstFarmerPayments = Object.values(farmerPaymentMethods)[0] || {};

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/cart" 
          className="text-green-600 hover:underline flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Cart
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Form */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for the farmer..."
                    rows={3}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <div className="space-y-3">
                  {availablePaymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {item.price.toFixed(2)} PLN
                      </p>
                    </div>
                    <p className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} PLN
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>{totalPrice.toFixed(2)} PLN</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          {selectedPaymentMethod === 'bank_transfer' && firstFarmerPayments.bankAccount && (
            <BankTransferPayment
              paymentDetails={firstFarmerPayments.bankAccount}
              orderData={{ totalPrice, transferTitle: generatePaymentReference(Date.now().toString(), userProfile?.uid || '') }}
              onCopy={copyToClipboard}
            />
          )}

          {selectedPaymentMethod === 'blik' && firstFarmerPayments.blik && (
            <BlikPayment
              paymentDetails={firstFarmerPayments.blik}
              orderData={{ totalPrice, transferTitle: generatePaymentReference(Date.now().toString(), userProfile?.uid || '') }}
              onCopy={copyToClipboard}
            />
          )}

          {selectedPaymentMethod === 'crypto' && firstFarmerPayments.cryptoWallets && (
            (() => {
              const selectedWallet = firstFarmerPayments.cryptoWallets.find(w => w.enabled);
              const exchangeRate = exchangeRates[selectedWallet?.currency] || 1;
              
              return selectedWallet ? (
                <div className="space-y-4">
                  {!orderCreated && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please place your order first, then you can complete the crypto payment below.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <CryptoPayment
                    wallet={selectedWallet}
                    orderData={{ totalPrice }}
                    exchangeRate={exchangeRate}
                    onCopy={copyToClipboard}
                    onPaymentSuccess={orderCreated ? handleCryptoPaymentSuccess : null}
                    onPaymentError={handleCryptoPaymentError}
                    disabled={!orderCreated}
                  />
                </div>
              ) : null;
            })()
          )}

          {selectedPaymentMethod === 'cash' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cash on Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You will pay {totalPrice.toFixed(2)} PLN in cash when you receive your order.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Place Order Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedPaymentMethod}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : `Place Order - ${totalPrice.toFixed(2)} PLN`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;