
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Copy,
  ExternalLink,
  CreditCard,
  Smartphone,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const PaymentStatus = ({ order, onStatusUpdate }) => {
  const { userProfile } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [txHash, setTxHash] = useState('');

  const payment = order.payment || {};
  const paymentMethod = payment.method || order.paymentMethod || 'cash';
  const paymentStatus = payment.status || (paymentMethod === 'cash' ? 'paid' : 'pending');
  const paymentDetails = payment.paymentDetails || {};
  const expiresAt = payment.expiresAt;

  // Check if payment is expired
  const isExpired = expiresAt && new Date() > new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt);

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple toast replacement
    console.log('Copied to clipboard:', text);
  };

  // Get block explorer URL based on network
  const getBlockExplorerUrl = (network, txHash) => {
    const explorers = {
      'ethereum': `https://etherscan.io/tx/${txHash}`,
      'sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
      'bitcoin': `https://blockstream.info/tx/${txHash}`,
      'polygon': `https://polygonscan.com/tx/${txHash}`,
      'bsc': `https://bscscan.com/tx/${txHash}`,
      'arbitrum': `https://arbiscan.io/tx/${txHash}`,
      'optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
      'avalanche': `https://snowtrace.io/tx/${txHash}`,
      'fantom': `https://ftmscan.com/tx/${txHash}`,
      'solana': `https://solscan.io/tx/${txHash}`,
      'cardano': `https://cardanoscan.io/transaction/${txHash}`,
      'tron': `https://tronscan.org/#/transaction/${txHash}`,
      'litecoin': `https://blockchair.com/litecoin/transaction/${txHash}`,
      'dogecoin': `https://blockchair.com/dogecoin/transaction/${txHash}`,
      'base': `https://basescan.org/tx/${txHash}`,
      'linea': `https://lineascan.build/tx/${txHash}`,
      'zksync': `https://explorer.zksync.io/tx/${txHash}`
    };
    
    return explorers[network?.toLowerCase()] || `https://etherscan.io/tx/${txHash}`;
  };

  // Mark payment as received (for farmers)
  const markAsReceived = async () => {
    try {
      setUpdating(true);
      
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        'payment.status': 'confirming',
        'payment.verification.method': 'manual',
        'payment.verification.verifiedBy': userProfile.uid,
        'payment.verification.verifiedAt': new Date(),
        'payment.verification.notes': 'Manually marked as received by farmer',
        updatedAt: new Date()
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Confirm payment (for farmers)
  const confirmPayment = async () => {
    try {
      setUpdating(true);
      
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        'payment.confirmedAt': new Date(),
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date()
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Submit crypto transaction hash
  const submitTxHash = async () => {
    if (!txHash.trim()) {
      return;
    }

    try {
      setUpdating(true);
      
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        'payment.status': 'confirming',
        'payment.paymentDetails.crypto.txHash': txHash,
        'payment.verification.method': 'blockchain',
        'payment.verification.notes': `Transaction hash provided by customer: ${txHash}`,
        updatedAt: new Date()
      });

      setTxHash('');
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error submitting transaction hash:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer': return CreditCard;
      case 'blik': return Smartphone;
      case 'crypto': return Wallet;
      default: return CreditCard;
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'yellow', 
          icon: Clock, 
          text: 'Awaiting Payment',
          description: 'Payment has not been received yet'
        };
      case 'confirming':
        return { 
          color: 'blue', 
          icon: RefreshCw, 
          text: 'Confirming',
          description: 'Payment received, waiting for confirmation'
        };
      case 'confirmed':
      case 'paid':
        return { 
          color: 'green', 
          icon: CheckCircle, 
          text: 'Paid',
          description: 'Payment confirmed and processed'
        };
      case 'failed':
        return { 
          color: 'red', 
          icon: XCircle, 
          text: 'Failed',
          description: 'Payment failed or was rejected'
        };
      case 'expired':
        return { 
          color: 'gray', 
          icon: XCircle, 
          text: 'Expired',
          description: 'Payment deadline has passed'
        };
      default:
        return { 
          color: 'gray', 
          icon: AlertCircle, 
          text: status,
          description: 'Unknown payment status'
        };
    }
  };

  const statusDisplay = getStatusDisplay(paymentStatus);
  const PaymentIcon = getPaymentMethodIcon(paymentMethod);
  const StatusIcon = statusDisplay.icon;
  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  const isCustomer = userProfile?.role === 'klient' || userProfile?.role === 'customer';

  // Handle cash payments
  if (paymentMethod === 'cash') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
            <Badge variant="secondary" className="ml-auto">
              Cash on Delivery
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Payment will be collected in cash when the order is delivered.
              Amount to pay: <strong>{order.totalPrice?.toFixed(2)} PLN</strong>
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
          <PaymentIcon className="h-5 w-5" />
          Payment Information
          <Badge 
            variant={statusDisplay.color === 'green' ? 'default' : 
                   statusDisplay.color === 'red' ? 'destructive' : 
                   'secondary'}
            className="ml-auto"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusDisplay.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status Description */}
        <Alert className={
          statusDisplay.color === 'green' ? 'border-green-200 bg-green-50' :
          statusDisplay.color === 'red' ? 'border-red-200 bg-red-50' :
          statusDisplay.color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
          'border-blue-200 bg-blue-50'
        }>
          <StatusIcon className="h-4 w-4" />
          <AlertDescription>
            {statusDisplay.description}
            {isExpired && paymentStatus === 'pending' && (
              <span className="block mt-1 text-red-600 font-medium">
                Payment deadline has expired. Please contact the farmer to arrange payment.
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Payment Deadline */}
        {expiresAt && !isExpired && (paymentStatus === 'pending' || paymentStatus === 'confirming') && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Payment due: {new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Bank Transfer Details */}
        {paymentMethod === 'bank_transfer' && paymentDetails.bankTransfer && (
          <div className="space-y-3">
            <h4 className="font-medium">Bank Transfer Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Bank:</span>
                <span className="text-sm">{paymentDetails.bankTransfer.bankName}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{paymentDetails.bankTransfer.iban}</span>
                  <Button 
                    onClick={() => copyToClipboard(paymentDetails.bankTransfer.iban)}
                    variant="ghost" 
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {order.transferTitle && (
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Transfer Title:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{order.transferTitle}</span>
                    <Button 
                      onClick={() => copyToClipboard(order.transferTitle)}
                      variant="ghost" 
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold text-green-600">
                  {paymentDetails.bankTransfer.amount?.toFixed(2)} {paymentDetails.bankTransfer.currency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BLIK Details */}
        {paymentMethod === 'blik' && paymentDetails.blik && (
          <div className="space-y-3">
            <h4 className="font-medium">BLIK Transfer Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Phone Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{paymentDetails.blik.phoneNumber}</span>
                  <Button 
                    onClick={() => copyToClipboard(paymentDetails.blik.phoneNumber)}
                    variant="ghost" 
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {order.transferTitle && (
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Transfer Title:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{order.transferTitle}</span>
                    <Button 
                      onClick={() => copyToClipboard(order.transferTitle)}
                      variant="ghost" 
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold text-green-600">
                  {paymentDetails.blik.amount?.toFixed(2)} {paymentDetails.blik.currency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Crypto Details */}
        {paymentMethod === 'crypto' && paymentDetails.crypto && (
          <div className="space-y-3">
            <h4 className="font-medium">Cryptocurrency Payment Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Network:</span>
                <span className="text-sm">{paymentDetails.crypto.network}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Wallet Address:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono break-all">{paymentDetails.crypto.walletAddress}</span>
                  <Button 
                    onClick={() => copyToClipboard(paymentDetails.crypto.walletAddress)}
                    variant="ghost" 
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold text-green-600">
                  {paymentDetails.crypto.amount?.toFixed(6)} {paymentDetails.crypto.currency}
                </span>
              </div>
              {paymentDetails.crypto.txHash && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-sm font-medium">Transaction Hash:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono break-all">{paymentDetails.crypto.txHash}</span>
                    <Button 
                      onClick={() => copyToClipboard(paymentDetails.crypto.txHash)}
                      variant="ghost" 
                      size="sm"
                      title="Copy transaction hash"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      onClick={() => {
                        const explorerUrl = getBlockExplorerUrl(paymentDetails.crypto.network, paymentDetails.crypto.txHash);
                        window.open(explorerUrl, '_blank');
                      }}
                      variant="ghost" 
                      size="sm"
                      title="View on block explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Crypto transaction submission for customers */}
            {isCustomer && order.clientId === userProfile.uid && paymentStatus === 'pending' && (
              <div className="space-y-2 pt-4 border-t">
                <h5 className="font-medium">Submit Transaction Hash</h5>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter transaction hash..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                  />
                  <Button 
                    onClick={submitTxHash}
                    disabled={updating || !txHash.trim()}
                    size="sm"
                  >
                    {updating ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Farmer Actions */}
        {isFarmer && order.rolnikId === userProfile.uid && paymentStatus !== 'paid' && paymentMethod !== 'cash' && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Farmer Actions</h4>
            
            {paymentStatus === 'pending' && (
              <Button 
                onClick={markAsReceived}
                disabled={updating}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {updating ? 'Updating...' : 'Mark Payment as Received'}
              </Button>
            )}
            
            {paymentStatus === 'confirming' && (
              <Button 
                onClick={confirmPayment}
                disabled={updating}
                className="w-full"
                size="sm"
              >
                {updating ? 'Confirming...' : 'Confirm Payment'}
              </Button>
            )}
            
            {(paymentStatus === 'confirmed' || paymentStatus === 'paid') && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                <p className="text-sm text-green-800">Payment confirmed and processed</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Actions */}
        {isCustomer && order.clientId === userProfile.uid && (
          <div className="space-y-2 pt-4 border-t">
            {paymentStatus === 'pending' && !isExpired && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Please complete the payment using the details above to confirm your order.
                </AlertDescription>
              </Alert>
            )}
            
            {paymentStatus === 'confirming' && (
              <Alert className="border-blue-200 bg-blue-50">
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  Your payment is being verified. This usually takes a few minutes to a few hours.
                </AlertDescription>
              </Alert>
            )}
            
            {(paymentStatus === 'confirmed' || paymentStatus === 'paid') && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment confirmed! Your order will be prepared and you'll receive updates.
                </AlertDescription>
              </Alert>
            )}
            
            {isExpired && paymentStatus === 'pending' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment deadline has expired. Please contact the farmer to arrange payment or place a new order.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Payment Timeline */}
        {payment.createdAt && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Payment Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Order placed:</span>
                <span>{new Date(payment.createdAt.seconds ? payment.createdAt.seconds * 1000 : payment.createdAt).toLocaleString()}</span>
              </div>
              
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span>Payment received:</span>
                  <span>{new Date(payment.paidAt.seconds ? payment.paidAt.seconds * 1000 : payment.paidAt).toLocaleString()}</span>
                </div>
              )}
              
              {payment.confirmedAt && (
                <div className="flex justify-between">
                  <span>Payment confirmed:</span>
                  <span>{new Date(payment.confirmedAt.seconds ? payment.confirmedAt.seconds * 1000 : payment.confirmedAt).toLocaleString()}</span>
                </div>
              )}
              
              {expiresAt && (
                <div className="flex justify-between">
                  <span>Payment deadline:</span>
                  <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                    {new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Details */}
        {payment.verification && payment.verification.verifiedAt && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Verification Details</h4>
            <div className="text-sm text-gray-600">
              <p>Method: {payment.verification.method}</p>
              <p>Verified: {new Date(payment.verification.verifiedAt.seconds ? payment.verification.verifiedAt.seconds * 1000 : payment.verification.verifiedAt).toLocaleString()}</p>
              {payment.verification.notes && (
                <p>Notes: {payment.verification.notes}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatus;