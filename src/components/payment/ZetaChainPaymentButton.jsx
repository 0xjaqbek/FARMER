// src/components/payment/ZetaChainPaymentButton.jsx
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

  // Simple toast replacement function
  const showToast = (title, description, variant = 'default') => {
    console.log(`Toast: ${title} - ${description}`);
    // You can replace this with a simple alert or custom notification
    if (variant === 'destructive') {
      alert(`Error: ${description}`);
    } else {
      console.log(`Success: ${description}`);
    }
  };

  // Initialize supported chains
  useEffect(() => {
    const chains = zetaChainService.getSupportedChains();
    setSupportedChains(chains);
  }, []);

  // Update user balance and fees when chain is selected
  useEffect(() => {
    if (selectedChain && isDialogOpen) {
      updateBalanceAndFees();
    }
  }, [selectedChain, isDialogOpen]);

  const updateBalanceAndFees = async () => {
    try {
      setIsLoading(true);
      
      // Get user balance
      const balance = await zetaChainService.getUserBalance();
      setUserBalance(balance);

      // Estimate cross-chain fees
      const chainConfig = supportedChains.find(c => c.id === selectedChain);
      if (chainConfig) {
        const fees = await zetaChainService.estimateCrossChainFees(
          chainConfig.chainId,
          1 // Assuming destination is Ethereum mainnet
        );
        setEstimatedFees(fees);
      }

    } catch (error) {
      console.error('Error updating balance and fees:', error);
      setError(error.message);
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
      showToast("Wallet Connection Error", error.message, "destructive");
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

      // Execute cross-chain payment
      const result = await zetaChainService.executeCrossChainContribution({
        campaignId,
        amount,
        sourceChain: chainConfig.chainId,
        targetContractAddress,
        rewardIndex,
        onProgress: (message) => {
          showToast("Transaction Progress", message);
        }
      });

      setTransactionResult(result);
      setCurrentStep('success');

      // Call success callback to update database and trigger existing flow
      onPaymentSuccess?.({
        ...result,
        paymentMethod: 'zetachain',
        sourceChain: chainConfig.name,
        campaignId,
        amount
      });

      showToast("Cross-Chain Payment Successful!", `Payment of ${amount} ETH sent from ${chainConfig.name}`);

    } catch (error) {
      console.error('Cross-chain payment error:', error);
      setError(error.message);
      setCurrentStep('confirm');
      
      onPaymentError?.(error);
      
      showToast("Payment Failed", error.message, "destructive");
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
    if (!estimatedFees) return null;
    
    const paymentAmount = parseFloat(amount);
    const totalFees = parseFloat(estimatedFees.totalFee);
    return (paymentAmount + totalFees).toFixed(6);
  };

  const hasEnoughBalance = () => {
    if (!userBalance || !estimatedFees) return false;
    
    const totalCost = getTotalCost();
    return parseFloat(userBalance.balance) >= parseFloat(totalCost);
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
                        {chain.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{chain.name}</div>
                      <div className="text-xs text-gray-500">
                        Chain ID: {chain.chainId}
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
              <Badge variant="secondary" className="text-xs">New!</Badge>
            </h4>
            <div className="grid gap-2">
              {nonEvmChains.map((chain) => {
                // Custom icons and colors for each chain type
                let chainIcon = '🔗';
                let bgColor = 'from-gray-500 to-gray-600';
                
                if (chain.name.toLowerCase().includes('bitcoin')) {
                  chainIcon = '₿';
                  bgColor = 'from-orange-500 to-yellow-500';
                } else if (chain.name.toLowerCase().includes('solana')) {
                  chainIcon = 'S';
                  bgColor = 'from-purple-500 to-indigo-500';
                } else if (chain.name.toLowerCase().includes('ton')) {
                  chainIcon = '💎';
                  bgColor = 'from-cyan-500 to-blue-500';
                }

                return (
                  <Button
                    key={chain.id}
                    variant="outline"
                    className="p-4 h-auto justify-start border-dashed border-2 hover:border-solid"
                    onClick={() => handleChainSelect(chain.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 bg-gradient-to-r ${bgColor} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold">
                          {chainIcon}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium flex items-center space-x-2">
                          <span>{chain.name}</span>
                          {chain.name.toLowerCase().includes('bitcoin') && (
                            <Badge variant="outline" className="text-xs">UTXO</Badge>
                          )}
                          {chain.name.toLowerCase().includes('solana') && (
                            <Badge variant="outline" className="text-xs">SVM</Badge>
                          )}
                          {chain.name.toLowerCase().includes('ton') && (
                            <Badge variant="outline" className="text-xs">TON VM</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {chain.symbol && `Native ${chain.symbol}`}
                          {chain.name.toLowerCase().includes('bitcoin') && ' • Secure & Decentralized'}
                          {chain.name.toLowerCase().includes('solana') && ' • Fast & Low Cost'}
                          {chain.name.toLowerCase().includes('ton') && ' • Telegram Ecosystem'}
                        </div>
                      </div>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 ml-auto" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Bitcoin, Solana & TON:</strong> First time using? You'll need the appropriate wallet installed (Unisat/Xverse for Bitcoin, Phantom for Solana, TON Wallet for TON).
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderPaymentConfirmation = () => {
    const selectedChainConfig = supportedChains.find(c => c.id === selectedChain);
    const currency = estimatedFees?.currency || 'ETH';
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="text-lg font-semibold">Confirm Cross-Chain Payment</h3>
        </div>

        {selectedChainConfig && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">From:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                    <span className="font-medium">{selectedChainConfig.name}</span>
                    {selectedChainConfig.type !== 'evm' && (
                      <Badge variant="outline" className="text-xs">
                        {selectedChainConfig.type.toUpperCase()}
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
                    {selectedChainConfig.type === 'evm' ? `${amount} ETH` : 
                     selectedChainConfig.type === 'utxo' ? `${amount} BTC` :
                     selectedChainConfig.type === 'svm' ? `${amount} SOL` :
                     selectedChainConfig.type === 'ton' ? `${amount} TON` :
                     `${amount} ${currency}`}
                  </span>
                </div>

                {estimatedFees && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cross-Chain Fee:</span>
                      <span className="font-medium">{estimatedFees.totalFee} {currency}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold">
                      <span>Total Cost:</span>
                      <span>{getTotalCost()} {currency}</span>
                    </div>
                  </>
                )}

                {userBalance && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Your Balance:</span>
                    <span className={`font-medium ${hasEnoughBalance() ? 'text-green-600' : 'text-red-600'}`}>
                      {userBalance.balance} {userBalance.currency || currency}
                    </span>
                  </div>
                )}

                {/* Special notices for different chain types */}
                {selectedChainConfig.type === 'utxo' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Bitcoin Notice:</strong> Transaction will be processed through ZetaChain's Bitcoin gateway. Confirmation may take 10-30 minutes.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedChainConfig.type === 'svm' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Solana Notice:</strong> Make sure you have Phantom wallet connected and enough SOL for transaction fees.
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
            </CardContent>
          </Card>
        )}

        {!hasEnoughBalance() && userBalance && estimatedFees && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient balance. You need {getTotalCost()} {currency} but only have {userBalance.balance} {userBalance.currency || currency}.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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

  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
      <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
      
      {transactionResult && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Hash:</span>
                <a 
                  href="#" 
                  className="text-blue-600 hover:underline flex items-center space-x-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{transactionResult.transactionHash.slice(0, 10)}...</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span>{transactionResult.amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source:</span>
                <span>{zetaChainService.getChainDisplayName(transactionResult.sourceChain)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

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