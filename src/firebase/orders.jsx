// Fixed orders.jsx - Handle undefined clientId parameter

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config.jsx';

// Order status definitions
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

// Generate a tracking ID
const generateTrackingId = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Get orders by client ID
export const getOrdersByClient = async (clientId) => {
  try {
    // FIXED: Check if clientId is valid before making query
    if (!clientId || typeof clientId !== 'string') {
      console.warn('Invalid clientId provided to getOrdersByClient:', clientId);
      return []; // Return empty array instead of throwing error
    }
    
    console.log('Fetching orders for client:', clientId);
    
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'orders'), 
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
    
    // Sort by createdAt in JavaScript
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('Found orders for client:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('Error in getOrdersByClient:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get orders by rolnik ID
export const getOrdersByRolnik = async (rolnikId) => {
  try {
    // FIXED: Check if rolnikId is valid before making query
    if (!rolnikId || typeof rolnikId !== 'string') {
      console.warn('Invalid rolnikId provided to getOrdersByRolnik:', rolnikId);
      return []; // Return empty array instead of throwing error
    }
    
    console.log('Fetching orders for rolnik:', rolnikId);
    
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'orders'), 
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
    
    // Sort by createdAt in JavaScript
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('Found orders for rolnik:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('Error in getOrdersByRolnik:', error);
    return []; // Return empty array instead of throwing
  }
};

// Enhanced order lookup function
export const findOrderByTrackingCode = async (trackingCode) => {
  try {
    if (!trackingCode || typeof trackingCode !== 'string') {
      throw new Error('Invalid tracking code provided');
    }
    
    console.log('Searching for order with tracking code:', trackingCode);
    
    // Strategy 1: Try to find by trackingId field
    try {
      const q1 = query(
        collection(db, 'orders'),
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
      const docRef = doc(db, 'orders', trackingCode);
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
    // This handles cases where tracking code is a substring of the full ID
    try {
      const q3 = query(collection(db, 'orders'));
      const querySnapshot3 = await getDocs(q3);
        
      for (const docSnap of querySnapshot3.docs) {
        const orderId = docSnap.id;
        // Check if the order ID starts with the tracking code
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
    
    // If no order found by any method
    console.log('No order found with tracking code:', trackingCode);
    throw new Error('Order not found');
    
  } catch (error) {
    console.error('Error in findOrderByTrackingCode:', error);
    throw error;
  }
};

// Create order function
export const createOrder = async (orderData) => {
  try {
    // Validate required fields
    if (!orderData.clientId) {
      throw new Error('Client ID is required for order creation');
    }
    
    // Add status tracking
    const statusHistory = [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Order created'
      }
    ];
    
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending', // Initial status
      statusHistory,
      trackingId: generateTrackingId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Order created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, note = '') => {
  try {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }
    
    const orderRef = doc(db, 'orders', orderId);
    
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
    
    await updateDoc(orderRef, {
      status,
      statusHistory,
      updatedAt: serverTimestamp()
    });
    
    console.log('Order status updated:', orderId, status);
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    const docRef = doc(db, 'orders', orderId);
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