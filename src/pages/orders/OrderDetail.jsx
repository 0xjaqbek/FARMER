import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrderById, updateOrderStatus, ORDER_STATUSES } from '../../firebase/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import OrderStatus from '@/components/orders/OrderStatus';
import OrderTimeline from '@/components/orders/OrderTimeline';
import OrderQR from '@/components/orders/OrderQR';
import { 
  QrCode, 
  ArrowLeft, 
  Truck, 
  Package, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  CreditCard,
  Smartphone,
  Wallet,
  Copy,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Simple PaymentStatus component (inline since we don't have the separate file)
const PaymentStatus = ({ order, onStatusUpdate }) => {
  const { userProfile } = useAuth();
  const [updating, _setUpdating] = useState(false);

  const payment = order?.payment || {};
  const paymentMethod = payment.method || order.paymentMethod || 'cash';
  const paymentStatus = payment.status || (paymentMethod === 'cash' ? 'pending' : 'pending');
  const paymentDetails = payment.paymentDetails || {};

  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  const isCustomer = userProfile?.role === 'klient' || userProfile?.role === 'customer';

  // Copy to clipboard helper
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

  // Get payment method icon
  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'bank_transfer': return CreditCard;
      case 'blik': return Smartphone;
      case 'crypto': return Wallet;
      default: return CreditCard;
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'yellow', icon: Clock, text: 'Awaiting Payment' };
      case 'confirming':
        return { color: 'blue', icon: RefreshCw, text: 'Confirming' };
      case 'confirmed':
      case 'paid':
        return { color: 'green', icon: CheckCircle, text: 'Paid' };
      case 'failed':
        return { color: 'red', icon: XCircle, text: 'Failed' };
      case 'expired':
        return { color: 'gray', icon: XCircle, text: 'Expired' };
      default:
        return { color: 'gray', icon: AlertCircle, text: status };
    }
  };

  const statusDisplay = getStatusDisplay(paymentStatus);
  const PaymentIcon = getPaymentMethodIcon();
  const StatusIcon = statusDisplay.icon;

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
            variant={statusDisplay.color === 'green' ? 'success' : 
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
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment deadline warning */}
        {payment.expiresAt && paymentStatus === 'pending' && (
          <Alert variant="destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Payment deadline: {new Date(payment.expiresAt.seconds ? payment.expiresAt.seconds * 1000 : payment.expiresAt).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Farmer Actions */}
        {isFarmer && order.rolnikId === userProfile.uid && paymentStatus !== 'paid' && paymentMethod !== 'cash' && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Farmer Actions</h4>
            
            {paymentStatus === 'pending' && (
              <Button 
                onClick={() => {
                  // In a real implementation, you'd call updateOrderPayment
                  console.log('Mark payment as received');
                }}
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
                onClick={() => {
                  // In a real implementation, you'd call updateOrderPayment
                  console.log('Confirm payment');
                  if (onStatusUpdate) onStatusUpdate();
                }}
                disabled={updating}
                className="w-full"
                size="sm"
              >
                {updating ? 'Confirming...' : 'Confirm Payment'}
              </Button>
            )}
          </div>
        )}

        {/* Customer Actions */}
        {isCustomer && order.clientId === userProfile.uid && paymentStatus === 'pending' && paymentMethod !== 'cash' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Please complete the payment using the details above to confirm your order.
            </AlertDescription>
          </Alert>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const isRolnik = userProfile?.role === 'rolnik';
  const isAdmin = userProfile?.role === 'admin';
  const canChangeStatus = isRolnik || isAdmin;
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        console.log('Fetching order:', id);
        const orderData = await getOrderById(id);
        console.log('Order data received:', orderData);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id]);

  // Refresh order data
  const refreshOrder = async () => {
    try {
      const orderData = await getOrderById(id);
      setOrder(orderData);
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };

  const handlePrintQR = () => {
    setIsQrModalOpen(true);
  };
  
  const handleUpdateStatus = async (newStatus, note = '') => {
    console.log('handleUpdateStatus called with:', { newStatus, note, orderId: id });
    
    if (!canChangeStatus) {
      const errorMsg = 'You do not have permission to update this order status';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    if (!order) {
      const errorMsg = 'Order data not available';
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    // Check if this is a valid status transition
    const currentStatus = order.status;
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['in_transit', 'delivered', 'completed', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    
    const allowedStatuses = statusFlow[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      const errorMsg = `Cannot change status from ${currentStatus} to ${newStatus}`;
      console.error(errorMsg);
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    try {
      setStatusUpdating(true);
      setError('');
      setSuccess('');
      
      console.log('Calling updateOrderStatus...');
      await updateOrderStatus(id, newStatus, note || statusNote);
      console.log('Status update successful');
      
      // Refresh order data
      await refreshOrder();
      
      setSuccess(`Order status updated to ${ORDER_STATUSES[newStatus].label}`);
      setStatusNote('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMsg = `Failed to update order status: ${error.message}`;
      setError(errorMsg);
      return Promise.reject(error);
    } finally {
      setStatusUpdating(false);
    }
  };
  
  const getNextAvailableStatuses = () => {
    if (!order) return [];
    
    const currentStatus = order.status;
    
    // Define status flow
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['in_transit', 'delivered', 'completed', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    
    return statusFlow[currentStatus] || [];
  };

  // Helper function to get payment method display name
  const getPaymentMethodDisplayName = (method) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'blik': return 'BLIK';
      case 'crypto': return 'Cryptocurrency';
      case 'card': return 'Credit Card';
      case 'cash': return 'Cash on Delivery';
      default: return method || 'Cash on Delivery';
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }
  
  if (error && !order) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Button asChild>
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-500">Order #{order.trackingId || order.id}</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Order Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <OrderStatus 
                  status={order.status} 
                  showDescription={true} 
                  size="large"
                  clickable={true}
                  canChangeStatus={canChangeStatus && (isAdmin || order.rolnikId === userProfile?.uid)}
                  onStatusChange={handleUpdateStatus}
                  statusHistory={order.statusHistory}
                  orderId={order.id}
                  userRole={userProfile?.role}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product details */}
                <div>
                  <h3 className="font-medium mb-3">Items</h3>
                  {Array.isArray(order.items) ? (
                    <ul className="divide-y">
                      {order.items.map((item, index) => (
                        <li key={index} className="py-3 first:pt-0 last:pb-0 flex">
                          <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100 mr-4">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-gray-500">
                              {item.quantity} {item.unit} × {item.price?.toFixed(2)} PLN
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.totalPrice?.toFixed(2)} PLN</p>
                            {item.productId && (
                              <Button variant="ghost" size="sm" asChild className="text-xs">
                                <Link to={`/products/${item.productId}`}>
                                  View Product
                                </Link>
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Fallback for old order structure
                    <div className="flex items-start">
                      <div className="h-20 w-20 overflow-hidden rounded-md mr-4">
                        <img
                          src={order.productImage}
                          alt={order.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{order.productName}</h4>
                        <div className="mt-1">
                          <p>
                            <span className="text-sm text-gray-500">Quantity:</span> {order.quantity} {order.unit}
                          </p>
                          <p>
                            <span className="text-sm text-gray-500">Price:</span> {order.price?.toFixed(2)} PLN / {order.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Order total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{(order.subtotal || order.totalPrice)?.toFixed(2)} PLN</span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span>{order.shippingCost.toFixed(2)} PLN</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{order.totalPrice?.toFixed(2)} PLN</span>
                  </div>
                </div>
                
                {/* Customer/Farmer info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  {isRolnik ? (
                    <div>
                      <h3 className="font-medium mb-2">Customer Information</h3>
                      <p>{order.clientName}</p>
                      {order.customerInfo && (
                        <>
                          <p className="text-sm text-gray-600">
                            {order.customerInfo.address}, {order.customerInfo.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customerInfo.postalCode}
                          </p>
                          {order.customerInfo.phone && (
                            <p className="text-sm text-gray-600">
                              {order.customerInfo.phone}
                            </p>
                          )}
                          {order.customerInfo.email && (
                            <p className="text-sm text-gray-600">
                              {order.customerInfo.email}
                            </p>
                          )}
                        </>
                      )}
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/chat/${order.clientId}`}>
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Message Customer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-2">Seller Information</h3>
                      <p>{order.rolnikName}</p>
                      <p className="text-sm text-gray-600">
                        Location: {order.rolnikPostalCode || 'Not available'}
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/chat/${order.rolnikId}`}>
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Message Farmer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium mb-2">Payment & Delivery</h3>
                    <p className="mb-1">
                      <span className="text-sm text-gray-600">Payment Method:</span>{' '}
                      {getPaymentMethodDisplayName(order.payment?.method || order.paymentMethod)}
                    </p>
                    <p>
                      <span className="text-sm text-gray-600">Delivery Method:</span>{' '}
                      {order.deliveryMethod || 'Standard Delivery'}
                    </p>
                  </div>
                </div>
                
                {/* Order notes */}
                {order.notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Order Notes</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{order.notes}</p>
                  </div>
                )}
                
                {/* Order tracking */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Order Timeline</h3>
                  <OrderTimeline statusHistory={order.statusHistory || []} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Card */}
          <PaymentStatus order={order} onStatusUpdate={refreshOrder} />
        </div>
        
        <div>
          {/* QR Tracking Code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Customers can track this order using the tracking ID or by scanning the QR code.
              </p>
              
              <div className="mb-4">
                <p className="font-semibold">Tracking ID:</p>
                <div className="flex items-center mt-1">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm flex-1 text-center">
                    {order.trackingId || id.substring(0, 8)}
                  </code>
                </div>
              </div>
              
              <div className="text-center">
                <Button variant="outline" className="w-full mb-2" asChild>
                  <Link to={`/track/product/${order.trackingId || id}`} target="_blank">
                    <Truck className="mr-2 h-4 w-4" />
                    Track Order
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={handlePrintQR}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Print QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Status Management for Farmers */}
          {canChangeStatus && (order.rolnikId === userProfile?.uid || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Status Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">
                    Current Status: <OrderStatus status={order.status} size="badge" clickable={false} />
                  </p>
                  
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Note (Optional)
                        </label>
                        <Textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Add details about this status update..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        {getNextAvailableStatuses().map(status => {
                          const statusInfo = ORDER_STATUSES[status];
                          let ButtonIcon;
                          
                          switch (status) {
                            case 'confirmed':
                              ButtonIcon = CheckCircle;
                              break;
                            case 'preparing':
                              ButtonIcon = Package;
                              break;
                            case 'ready':
                            case 'completed':
                              ButtonIcon = CheckCircle;
                              break;
                            case 'in_transit':
                            case 'delivered':
                              ButtonIcon = Truck;
                              break;
                            case 'cancelled':
                              ButtonIcon = XCircle;
                              break;
                            default:
                              ButtonIcon = null;
                          }
                          
                          return (
                            <Button
                              key={status}
                              className="w-full"
                              variant={status === 'cancelled' ? 'destructive' : 'default'}
                              disabled={statusUpdating}
                              onClick={() => handleUpdateStatus(status)}
                            >
                              {ButtonIcon && <ButtonIcon className="mr-2 h-4 w-4" />}
                              Mark as {statusInfo.label}
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <Alert className={order.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      <AlertDescription className={order.status === 'completed' ? 'text-green-700' : 'text-red-700'}>
                        This order is {order.status}. No further status updates are possible.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      <OrderQR 
        order={order} 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
      />
    </div>
  );
};

export default OrderDetail;