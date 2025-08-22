// src/firebase/orders.js - Compatible version with existing functions + payment support
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,  
  getDocs, 
  getDoc, 
  query, 
  where,  
  limit, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { 
  generatePaymentReference, 
  calculatePaymentDeadline,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES
} from '@/lib/firebaseSchema';

const ORDERS_COLLECTION = 'orders';

// Order status definitions (existing)
export const ORDER_STATUSES = {
  pending: {
    label: 'Pending',
    description: 'Order placed, awaiting farmer confirmation',
    color: 'yellow'
  },
  confirmed: {
    label: 'Confirmed', 
    description: 'Order confirmed by farmer',
    color: 'blue'
  },
  preparing: {
    label: 'Preparing',
    description: 'Farmer is preparing your order',
    color: 'purple'
  },
  ready: {
    label: 'Ready',
    description: 'Order is ready for pickup or delivery',
    color: 'blue'
  },
  in_transit: {
    label: 'In Transit',
    description: 'Order is being delivered',
    color: 'blue'
  },
  delivered: {
    label: 'Delivered',
    description: 'Order has been delivered',
    color: 'green'
  },
  completed: {
    label: 'Completed',
    description: 'Order process completed',
    color: 'green'
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order has been cancelled',
    color: 'red'
  }
};

// Generate a tracking ID (existing)
const generateTrackingId = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// EXISTING FUNCTIONS - Maintain compatibility

// Get orders by client ID (existing)
export const getOrdersByClient = async (clientId) => {
  try {
    if (!clientId || typeof clientId !== 'string') {
      console.warn('Invalid clientId provided to getOrdersByClient:', clientId);
      return [];
    }
    
    console.log('Fetching orders for client:', clientId);
    
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      where('clientId', '==', clientId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('Found orders for client:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('Error in getOrdersByClient:', error);
    return [];
  }
};

// Get orders by rolnik ID (existing)
export const getOrdersByRolnik = async (rolnikId) => {
  try {
    if (!rolnikId || typeof rolnikId !== 'string') {
      console.warn('Invalid rolnikId provided to getOrdersByRolnik:', rolnikId);
      return [];
    }
    
    console.log('Fetching orders for rolnik:', rolnikId);
    
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      where('rolnikId', '==', rolnikId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('Found orders for rolnik:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('Error in getOrdersByRolnik:', error);
    return [];
  }
};

// Get order by ID (existing)
export const getOrderById = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
};

// Find order by tracking code (existing)
export const findOrderByTrackingCode = async (trackingCode) => {
  try {
    if (!trackingCode || typeof trackingCode !== 'string') {
      throw new Error('Invalid tracking code provided');
    }
    
    console.log('Searching for order with tracking code:', trackingCode);
    
    // Strategy 1: Try to find by trackingId field
    try {
      const q1 = query(
        collection(db, ORDERS_COLLECTION),
        where('trackingId', '==', trackingCode)
      );
      
      const querySnapshot1 = await getDocs(q1);
      
      if (!querySnapshot1.empty) {
        const doc = querySnapshot1.docs[0];
        const data = doc.data();
        console.log('Found order by trackingId:', doc.id);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.log('Error searching by trackingId:', error);
    }
    
    // Strategy 2: Try to find by document ID directly
    try {
      const docRef = doc(db, ORDERS_COLLECTION, trackingCode);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Found order by document ID:', trackingCode);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.log('Error searching by document ID:', error);
    }
    
    // Strategy 3: Search for orders where the ID starts with the tracking code
    try {
      const q3 = query(collection(db, ORDERS_COLLECTION));
      const querySnapshot3 = await getDocs(q3);
        
      for (const docSnap of querySnapshot3.docs) {
        const orderId = docSnap.id;
        if (orderId.startsWith(trackingCode) || orderId.substring(0, 8) === trackingCode) {
          const data = docSnap.data();
          console.log('Found order by ID substring match:', orderId);
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }
      }
    } catch (error) {
      console.log('Error in substring search:', error);
    }
    
    console.log('No order found with tracking code:', trackingCode);
    throw new Error('Order not found');
    
  } catch (error) {
    console.error('Error in findOrderByTrackingCode:', error);
    throw error;
  }
};

// ENHANCED CREATE ORDER FUNCTION - Updated with payment support
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with payment data:', orderData);
    
    // Validate required fields
    if (!orderData.clientId) {
      throw new Error('Client ID is required for order creation');
    }
    
    // Generate payment reference if not provided and payment method requires it
    if (!orderData.transferTitle && orderData.payment?.method && orderData.payment.method !== 'cash') {
      orderData.transferTitle = generatePaymentReference(
        Date.now().toString(), 
        orderData.clientId
      );
    }
    
    // Set payment deadline if not cash payment
    if (orderData.payment?.method !== 'cash' && orderData.payment && !orderData.payment.expiresAt) {
      orderData.payment.expiresAt = calculatePaymentDeadline(24);
    }
    
    // Add status tracking (existing functionality)
    const statusHistory = [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Order created'
      }
    ];
    
    // Prepare the complete order document
    const completeOrderData = {
      ...orderData,
      status: orderData.status || 'pending',
      statusHistory,
      trackingId: generateTrackingId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Enhanced payment object
      payment: orderData.payment ? {
        method: orderData.payment.method || 'cash',
        status: orderData.payment.status || 'pending',
        paymentDetails: orderData.payment.paymentDetails || {},
        createdAt: serverTimestamp(),
        expiresAt: orderData.payment.expiresAt || null,
        verification: {
          method: 'manual',
          verifiedBy: null,
          verifiedAt: null,
          notes: ''
        },
        ...orderData.payment
      } : {
        method: 'cash',
        status: 'pending',
        paymentDetails: {},
        createdAt: serverTimestamp()
      }
    };
    
    console.log('Complete order data being saved:', completeOrderData);
    
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), completeOrderData);
    
    console.log('Order created successfully with ID:', docRef.id);
    
    // Create notification for farmer (if notification system is available)
    try {
      await createOrderNotification(docRef.id, completeOrderData);
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError);
      // Don't fail order creation if notification fails
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

// ENHANCED UPDATE ORDER STATUS - Updated with payment awareness
export const updateOrderStatus = async (orderId, status, note = '') => {
  try {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Get current order to update status history
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const currentData = orderSnap.data();
    const statusHistory = currentData.statusHistory || [];
    
    // Add new status to history
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status}`
    });
    
    const updateData = {
      status,
      statusHistory,
      updatedAt: serverTimestamp()
    };
    
    // Add status-specific timestamps
    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = serverTimestamp();
        break;
      case 'preparing':
        updateData.preparingAt = serverTimestamp();
        break;
      case 'ready':
        updateData.readyAt = serverTimestamp();
        break;
      case 'in_transit':
        updateData.shippedAt = serverTimestamp();
        break;
      case 'delivered':
        updateData.deliveredAt = serverTimestamp();
        break;
      case 'cancelled':
        updateData.cancelledAt = serverTimestamp();
        break;
    }
    
    await updateDoc(orderRef, updateData);
    
    console.log('Order status updated:', orderId, status);
    
    // Create status notification (if notification system is available)
    try {
      await createStatusNotification(orderId, status);
    } catch (notifError) {
      console.warn('Failed to create status notification:', notifError);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// NEW PAYMENT-SPECIFIC FUNCTIONS

// Update order with payment information
export const updateOrderPayment = async (orderId, paymentData) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    const updateData = {
      'payment.status': paymentData.status,
      'payment.verification': {
        ...paymentData.verification,
        verifiedAt: paymentData.verification?.verifiedAt || serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };
    
    // Add payment timestamp if paid
    if (paymentData.status === 'paid' || paymentData.status === 'confirmed') {
      updateData['payment.paidAt'] = serverTimestamp();
      updateData['payment.confirmedAt'] = serverTimestamp();
      updateData.status = 'confirmed';
      updateData.confirmedAt = serverTimestamp();
      
      // Update status history
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const currentData = orderSnap.data();
        const statusHistory = currentData.statusHistory || [];
        statusHistory.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: 'Payment confirmed - order status updated'
        });
        updateData.statusHistory = statusHistory;
      }
    }
    
    // Add transaction hash for crypto payments
    if (paymentData.txHash) {
      updateData['payment.paymentDetails.crypto.txHash'] = paymentData.txHash;
    }
    
    await updateDoc(orderRef, updateData);
    
    // Create payment notification
    try {
      await createPaymentNotification(orderId, paymentData.status);
    } catch (notifError) {
      console.warn('Failed to create payment notification:', notifError);
    }
    
    console.log('Order payment updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating order payment:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};

// Get orders with enhanced filters including payment status
export const getOrders = async (filters = {}) => {
  try {
    let q = collection(db, ORDERS_COLLECTION);
    
    // Apply filters
    if (filters.userId) {
      // Get orders for both customer and farmer
      const customerQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('clientId', '==', filters.userId)
      );
      
      const farmerQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('rolnikId', '==', filters.userId)
      );
      
      const [customerSnapshot, farmerSnapshot] = await Promise.all([
        getDocs(customerQuery),
        getDocs(farmerQuery)
      ]);
      
      const orders = [];
      
      customerSnapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          userRole: 'customer',
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      farmerSnapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          userRole: 'farmer',
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      // Sort by creation date
      orders.sort((a, b) => b.createdAt - a.createdAt);
      
      return orders;
    }
    
    // Apply other filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.paymentStatus) {
      q = query(q, where('payment.status', '==', filters.paymentStatus));
    }
    
    if (filters.paymentMethod) {
      q = query(q, where('payment.method', '==', filters.paymentMethod));
    }
    
    // Apply limit
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    const orders = [];
    
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    // Sort by creation date
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw new Error(`Failed to get orders: ${error.message}`);
  }
};

// Cancel order with payment handling
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Get current order data
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const currentData = orderSnap.data();
    const statusHistory = currentData.statusHistory || [];
    
    // Add cancellation to status history
    statusHistory.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: reason || 'Order cancelled'
    });
    
    const updateData = {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancellationReason: reason,
      statusHistory,
      updatedAt: serverTimestamp()
    };
    
    // If payment was made, update payment status
    if (currentData.payment?.status === 'paid' || currentData.payment?.status === 'confirmed') {
      updateData['payment.status'] = 'refunded';
      updateData['payment.refundedAt'] = serverTimestamp();
    }
    
    await updateDoc(orderRef, updateData);
    
    console.log('Order cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};

// NOTIFICATION HELPERS (simplified versions)

const createOrderNotification = async (orderId, orderData) => {
  try {
    // Simplified notification creation - you can enhance this based on your notification system
    console.log(`New order notification: Order ${orderId} for farmer ${orderData.rolnikId}`);
    // In a real implementation, you'd create a notification document in Firestore
  } catch (error) {
    console.error('Error creating order notification:', error);
  }
};

const createPaymentNotification = async (orderId, paymentStatus) => {
  try {
    console.log(`Payment notification: Order ${orderId} payment status: ${paymentStatus}`);
    // In a real implementation, you'd create payment notification documents
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
};

const createStatusNotification = async (orderId, status) => {
  try {
    console.log(`Status notification: Order ${orderId} status: ${status}`);
    // In a real implementation, you'd create status notification documents
  } catch (error) {
    console.error('Error creating status notification:', error);
  }
};

// REAL-TIME SUBSCRIPTIONS

// Listen to order changes (real-time updates)
export const subscribeToOrder = (orderId, callback) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to order changes:', error);
  });
};

// Listen to orders for a user (real-time updates)
export const subscribeToUserOrders = (userId, callback) => {
  const customerQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('clientId', '==', userId)
  );
  
  const farmerQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('rolnikId', '==', userId)
  );
  
  const unsubscribers = [];
  let customerOrders = [];
  let farmerOrders = [];
  
  const updateCallback = () => {
    const allOrders = [
      ...customerOrders.map(order => ({ ...order, userRole: 'customer' })),
      ...farmerOrders.map(order => ({ ...order, userRole: 'farmer' }))
    ].sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0;
      const bDate = b.createdAt?.getTime() || 0;
      return bDate - aDate;
    });
    
    callback(allOrders);
  };
  
  // Subscribe to customer orders
  const customerUnsubscribe = onSnapshot(customerQuery, (snapshot) => {
    customerOrders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      customerOrders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    updateCallback();
  });
  
  // Subscribe to farmer orders
  const farmerUnsubscribe = onSnapshot(farmerQuery, (snapshot) => {
    farmerOrders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      farmerOrders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    updateCallback();
  });
  
  unsubscribers.push(customerUnsubscribe, farmerUnsubscribe);
  
  // Return unsubscribe function
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};

// Export all functions for compatibility
export default {
  // Existing functions
  ORDER_STATUSES,
  getOrdersByClient,
  getOrdersByRolnik,
  getOrderById,
  findOrderByTrackingCode,
  createOrder,
  updateOrderStatus,
  
  // New payment functions
  updateOrderPayment,
  getOrders,
  cancelOrder,
  subscribeToOrder,
  subscribeToUserOrders
};