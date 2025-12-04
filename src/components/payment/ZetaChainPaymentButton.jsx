// src/components/payment/ZetaChainPaymentButton.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  ArrowRightLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import zetaChainService from '../../services/zetaChainService';

const ZetaChainPaymentButton = ({ 
  campaignId,
  amount,
  rewardIndex = null,
  targetContractAddress,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState('');
  const [supportedChains, setSupportedChains] = useState([]);
  const [userBalance, setUserBalance] = useState(null);
  const [estimatedFees, setEstimatedFees] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('select'); // select, confirm, processing, success
  const [transactionResult, setTransactionResult] = useState(null);
  const [error, setError] = useState(null);

  // Validate props on component mount
  useEffect(() => {
    console.log('🔍 ZetaChainPaymentButton props validation:', {
      campaignId,
      amount,
      rewardIndex,
      targetContractAddress,
      hasOnPaymentSuccess: !!onPaymentSuccess,
      hasOnPaymentError: !!onPaymentError,
      disabled,
      className
    });

    // Validate required props
    const validationErrors = [];
    
    if (campaignId === null || campaignId === undefined) {
      validationErrors.push('campaignId is required');
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      validationErrors.push('amount must be a positive number');
    }
    
    if (!targetContractAddress) {
      validationErrors.push('targetContractAddress is required');
    }

    if (validationErrors.length > 0) {
      console.error('❌ ZetaChainPaymentButton validation errors:', validationErrors);
      setError(`Component validation failed: ${validationErrors.join(', ')}`);
    }
  }, [campaignId, amount, rewardIndex, targetContractAddress]);

  // Helper function to safely get chain display name
  const getChainDisplayName = (chainName) => {
    return chainName || 'Unknown Chain';
  };

  // Helper function to safely get chain type display
  const getChainTypeDisplay = (chainType) => {
    if (!chainType) return null;
    return chainType.toUpperCase();
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (chain) => {
    if (!chain || !chain.nativeCurrency) return 'ETH';
    return chain.nativeCurrency.symbol || 'ETH';
  };

  // Helper function to get amount display
  const getAmountDisplay = (chain, amount) => {
    const symbol = getCurrencySymbol(chain);
    return `${amount} ${symbol}`;
  };

  // Simple toast replacement function
  const showToast = (title, description, variant = 'default') => {
    console.log(`Toast: ${title} - ${description}`);
    if (variant === 'destructive') {
      console.error(`Error: ${description}`);
    } else {
      console.log(`Success: ${description}`);
    }
  };

  // Initialize supported chains
  useEffect(() => {
    try {
      const chains = zetaChainService.getSupportedChains();
      setSupportedChains(chains || []);
    } catch (error) {
      console.error('Error loading supported chains:', error);
      setSupportedChains([]);
    }
  }, []);

  // Update user balance and fees when chain is selected
  useEffect(() => {
    if (selectedChain && isDialogOpen) {
      updateBalanceAndFees();
    }
  }, [selectedChain, isDialogOpen, amount]);

  const updateBalanceAndFees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const chainConfig = supportedChains.find(c => c.id === selectedChain);
      if (!chainConfig) {
        throw new Error('Selected chain configuration not found');
      }

      // Get user balance
      const balance = await zetaChainService.getUserBalance(chainConfig.chainId);
      setUserBalance({
        balance: balance || '0.0',
        currency: getCurrencySymbol(chainConfig)
      });

      // Estimate cross-chain fees
      if (amount && parseFloat(amount) > 0) {
        const fees = await zetaChainService.estimateCrossChainFees(
          chainConfig.chainId,
          parseFloat(amount)
        );
        setEstimatedFees(fees);
      }

    } catch (error) {
      console.error('Error updating balance and fees:', error);
      setError(error.message || 'Failed to load balance and fees');
      setUserBalance({ balance: '0.0', currency: 'ETH' });
      setEstimatedFees(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    try {
      setError(null);
      await zetaChainService.initialize();
      setIsDialogOpen(true);
    } catch (error) {
      showToast("Wallet Connection Error", error.message || 'Failed to initialize ZetaChain service', "destructive");
    }
  };

  const handleChainSelect = (chainId) => {
    setSelectedChain(chainId);
    setCurrentStep('confirm');
  };

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      setCurrentStep('processing');
      setError(null);

      const chainConfig = supportedChains.find(c => c.id === selectedChain);
      if (!chainConfig) {
        throw new Error('Selected chain configuration not found');
      }

      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Validate campaignId - ensure it's not null/undefined
      if (!campaignId && campaignId !== 0) {
        throw new Error('Campaign ID is required');
      }

      // Validate targetContractAddress
      if (!targetContractAddress) {
        throw new Error('Target contract address is required');
      }

      // Log all parameters for debugging
      console.log('🚀 Initiating cross-chain payment with parameters:', {
        campaignId,
        amount: parseFloat(amount),
        sourceChain: chainConfig.chainId,
        targetContractAddress,
        rewardIndex: rewardIndex || 0,
        chainConfig
      });

      // Execute cross-chain payment with validated parameters
      const result = await zetaChainService.executeCrossChainContribution({
        campaignId: campaignId, // Ensure it's passed explicitly
        amount: parseFloat(amount),
        sourceChain: chainConfig.chainId,
        targetContractAddress: targetContractAddress,
        rewardIndex: rewardIndex || 0, // Provide default if null
        onProgress: (message) => {
          console.log('🔄 Progress:', message);
          showToast("Transaction Progress", message);
        }
      });

      console.log('✅ Cross-chain payment successful:', result);

      setTransactionResult(result);
      setCurrentStep('success');

      // Call success callback to update database and trigger existing flow
      if (onPaymentSuccess) {
        onPaymentSuccess({
          ...result,
          paymentMethod: 'zetachain',
          sourceChain: getChainDisplayName(chainConfig.name),
          campaignId: campaignId,
          amount: parseFloat(amount)
        });
      }

      showToast("Cross-Chain Payment Successful!", `Payment of ${getAmountDisplay(chainConfig, amount)} sent from ${getChainDisplayName(chainConfig.name)}`);

    } catch (error) {
      console.error('❌ Cross-chain payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      setCurrentStep('confirm');
      
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      showToast("Payment Failed", errorMessage, "destructive");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setCurrentStep('select');
    setSelectedChain('');
    setUserBalance(null);
    setEstimatedFees(null);
    setTransactionResult(null);
    setError(null);
    setIsDialogOpen(false);
  };

  const getTotalCost = () => {
    if (!estimatedFees || !amount) return null;
    
    const paymentAmount = parseFloat(amount);
    const totalFees = parseFloat(estimatedFees.totalFee || '0');
    return (paymentAmount + totalFees).toFixed(6);
  };

  const hasEnoughBalance = () => {
    if (!userBalance || !estimatedFees || !amount) return false;
    
    const totalCost = getTotalCost();
    return parseFloat(userBalance.balance || '0') >= parseFloat(totalCost || '0');
  };

  const renderChainSelect = () => {
    // Group chains by type for better UX
    const evmChains = supportedChains.filter(c => c.chainId && typeof c.chainId === 'number');
    const nonEvmChains = supportedChains.filter(c => !c.chainId || typeof c.chainId === 'string');

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto text-blue-500 mb-3" />
          <h3 className="text-lg font-semibold">Choose Source Blockchain</h3>
          <p className="text-sm text-gray-600 mt-2">
            Select the blockchain you want to pay from
          </p>
        </div>

        {/* EVM Chains */}
        {evmChains.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>EVM Compatible Chains</span>
            </h4>
            <div className="grid gap-2">
              {evmChains.map((chain) => (
                <Button
                  key={chain.id}
                  variant="outline"
                  className="p-4 h-auto justify-start"
                  onClick={() => handleChainSelect(chain.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(chain.name || 'ETH').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{getChainDisplayName(chain.name)}</div>
                      <div className="text-xs text-gray-500">
                        Chain ID: {chain.chainId || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Non-EVM Chains */}
        {nonEvmChains.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Native Blockchain Support</span>
            </h4>
            <div className="grid gap-2">
              {nonEvmChains.map((chain) => (
                <Button
                  key={chain.id}
                  variant="outline"
                  className="p-4 h-auto justify-start"
                  onClick={() => handleChainSelect(chain.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(chain.name || 'COIN').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{getChainDisplayName(chain.name)}</div>
                      <div className="text-xs text-gray-500">
                        {getChainTypeDisplay(chain.type) && (
                          <Badge variant="outline" className="text-xs">
                            {getChainTypeDisplay(chain.type)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {supportedChains.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No supported chains available. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderPaymentConfirmation = () => {
    const selectedChainConfig = supportedChains.find(c => c.id === selectedChain);
    const currency = estimatedFees?.currency || getCurrencySymbol(selectedChainConfig);
    
    // Safety check for selectedChainConfig
    if (!selectedChainConfig) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selected chain configuration not found. Please try selecting a chain again.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="text-lg font-semibold">Confirm Cross-Chain Payment</h3>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">From:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  <span className="font-medium">{getChainDisplayName(selectedChainConfig.name)}</span>
                  {getChainTypeDisplay(selectedChainConfig.type) && (
                    <Badge variant="outline" className="text-xs">
                      {getChainTypeDisplay(selectedChainConfig.type)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">To:</span>
                <span className="font-medium">Your Campaign Contract</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Amount:</span>
                <span className="font-medium">
                  {getAmountDisplay(selectedChainConfig, amount)}
                </span>
              </div>

              {estimatedFees && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Network Fee:</span>
                    <span className="text-sm">{estimatedFees.networkFee} {currency}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cross-Chain Fee:</span>
                    <span className="text-sm">{estimatedFees.zetaFee || '0'} {currency}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span>{getTotalCost()} {currency}</span>
                  </div>
                </>
              )}

              {userBalance && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className={parseFloat(userBalance.balance) >= parseFloat(getTotalCost() || '0') ? 'text-green-600' : 'text-red-600'}>
                    {userBalance.balance} {userBalance.currency}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chain-specific warnings */}
        <div className="space-y-2">
          {selectedChainConfig.type === 'bitcoin' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Bitcoin Notice:</strong> Transaction may take 10-30 minutes for confirmation. 
                You'll need Unisat or Xverse wallet installed.
              </AlertDescription>
            </Alert>
          )}

          {selectedChainConfig.type === 'solana' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Solana Notice:</strong> Make sure you have Phantom wallet installed. 
                Transaction fees are typically low (≈0.00025 SOL).
              </AlertDescription>
            </Alert>
          )}

          {selectedChainConfig.type === 'ton' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>TON Notice:</strong> This feature is in beta. Make sure you have TON Wallet or Tonkeeper installed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {!hasEnoughBalance() && userBalance && estimatedFees && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient balance. You need {getTotalCost()} {currency} but only have {userBalance.balance} {userBalance.currency}.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading balance and fee information...</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
      <h3 className="text-lg font-semibold">Processing Cross-Chain Payment</h3>
      <p className="text-sm text-gray-600">
        Your transaction is being processed across blockchains. This may take a few minutes.
      </p>
    </div>
  );

  const getBlockExplorerUrl = (txHash, sourceChain, sourceChainId) => {
    if (!txHash) return null;
    
    const blockExplorers = {
      // Ethereum mainnet
      1: 'https://etherscan.io',
      'ethereum': 'https://etherscan.io',
      
      // Sepolia testnet  
      11155111: 'https://sepolia.etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'Sepolia Testnet': 'https://sepolia.etherscan.io',
      
      // Bitcoin
      'btc-mainnet': 'https://blockstream.info',
      'bitcoin': 'https://blockstream.info',
      'btc-testnet': 'https://blockstream.info/testnet',
      
      // Solana
      'solana-mainnet': 'https://explorer.solana.com',
      'solana': 'https://explorer.solana.com',
      'solana-devnet': 'https://explorer.solana.com/?cluster=devnet',
      
      // TON
      'ton-mainnet': 'https://tonviewer.com',
      'ton': 'https://tonviewer.com',
      
      // Other chains
      137: 'https://polygonscan.com',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
      43114: 'https://snowtrace.io'
    };

    const explorer = blockExplorers[sourceChainId] || 
                    blockExplorers[sourceChain] || 
                    blockExplorers[sourceChain?.toLowerCase()];
    
    if (!explorer) return null;

    // Different URL formats for different chain types
    if (sourceChain?.toLowerCase().includes('solana')) {
      const clusterParam = sourceChain.toLowerCase().includes('devnet') ? '?cluster=devnet' : '';
      return `${explorer}/tx/${txHash}${clusterParam}`;
    } else if (sourceChain?.toLowerCase().includes('ton')) {
      return `${explorer}/transaction/${txHash}`;
    } else if (sourceChain?.toLowerCase().includes('bitcoin') || sourceChain?.toLowerCase().includes('btc')) {
      return `${explorer}/tx/${txHash}`;
    } else {
      // Default EVM format
      return `${explorer}/tx/${txHash}`;
    }
  };

  const renderSuccess = () => {
    // Get the block explorer URL
    const explorerUrl = transactionResult ? getBlockExplorerUrl(
      transactionResult.transactionHash,
      transactionResult.sourceChain,
      transactionResult.sourceChainId
    ) : null;

    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
        <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
        
        {transactionResult && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Hash:</span>
                  <div className="flex items-center space-x-1">
                    {transactionResult.transactionHash ? (
                      explorerUrl ? (
                        // Clickable transaction hash
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <span className="font-mono text-xs underline">
                            {`${transactionResult.transactionHash.slice(0, 10)}...${transactionResult.transactionHash.slice(-6)}`}
                          </span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        // Non-clickable fallback
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-xs text-gray-600">
                            {`${transactionResult.transactionHash.slice(0, 10)}...${transactionResult.transactionHash.slice(-6)}`}
                          </span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      )
                    ) : (
                      <span className="font-mono text-xs text-gray-500">Processing...</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span>{transactionResult.amount} {getCurrencySymbol()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span>{getChainDisplayName(transactionResult.sourceChain)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        disabled={disabled || !amount}
        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${className}`}
        size="lg"
      >
        <Zap className="mr-2 h-4 w-4" />
        Pay with ZetaChain
        <Badge variant="secondary" className="ml-2">Cross-Chain</Badge>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>ZetaChain Cross-Chain Payment</span>
            </DialogTitle>
            <DialogDescription>
              Pay from any supported blockchain to your campaign
            </DialogDescription>
          </DialogHeader>

          {currentStep === 'select' && renderChainSelect()}
          {currentStep === 'confirm' && renderPaymentConfirmation()}
          {currentStep === 'processing' && renderProcessing()}
          {currentStep === 'success' && renderSuccess()}

          <DialogFooter>
            {currentStep === 'select' && (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            )}
            
            {currentStep === 'confirm' && (
              <div className="flex space-x-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('select')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={!hasEnoughBalance() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </div>
            )}
            
            {currentStep === 'success' && (
              <Button onClick={resetDialog} className="w-full">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ZetaChainPaymentButton;