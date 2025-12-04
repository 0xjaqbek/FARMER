// src/lib/firebaseSchema.js
// Complete database schema definitions and utilities

export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  RATINGS: 'ratings',
  NOTIFICATIONS: 'notifications',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  INVENTORY_LOGS: 'inventory_logs',
  PAYMENT_METHODS: 'payment_methods'
};

// Payment method types
export const PAYMENT_TYPES = {
  BANK_TRANSFER: 'bank_transfer',
  BLIK: 'blik',
  CRYPTO: 'crypto',
  CASH: 'cash',
  CARD: 'card'
};

// Crypto networks
export const CRYPTO_NETWORKS = {
  ETHEREUM: 'ethereum',
  BITCOIN: 'bitcoin',
  POLYGON: 'polygon',
  BSC: 'bsc',
  SOLANA: 'solana'
};

// Payment status types
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  EXPIRED: 'expired'
};

// Enhanced order schema with advanced payment support
export const createOrderSchema = () => ({
  id: '',
  customerId: '',
  clientId: '', // Alternative field name
  farmerId: '',
  rolnikId: '', // Alternative field name
  
  // Items with inventory tracking
  items: [
    {
      productId: '',
      productName: '',
      quantity: 0,
      unitPrice: 0,
      unit: '',
      batchId: '', // Links to specific inventory batch
      totalPrice: 0
    }
  ],
  
  // Pricing
  subtotal: 0,
  taxes: 0,
  shippingCost: 0,
  totalPrice: 0,
  
  // Status and tracking
  status: 'pending', // pending, confirmed, preparing, ready, shipped, delivered, cancelled
  trackingNumber: '',
  
  // Customer information
  customerInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  },
  
  // Delivery information
  deliveryMethod: 'pickup', // pickup, delivery
  deliveryDate: null,
  deliveryTimeSlot: '',
  deliveryInstructions: '',
  
  // Enhanced Payment Information
  payment: {
    method: 'cash', // cash, bank_transfer, blik, crypto, card
    status: 'pending', // pending, confirming, confirmed, paid, failed, refunded
    
    // Payment details based on method
    paymentDetails: {
      // Bank transfer details
      bankTransfer: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        transferTitle: '',
        amount: 0,
        currency: 'PLN',
        deadline: null // Payment deadline
      },
      
      // BLIK details
      blik: {
        phoneNumber: '',
        amount: 0,
        currency: 'PLN',
        transferTitle: '',
        deadline: null
      },
      
      // Crypto details
      crypto: {
        network: '', // ethereum, bitcoin, polygon, etc.
        walletAddress: '',
        amount: 0,
        currency: '', // ETH, BTC, USDC, etc.
        txHash: '', // Transaction hash when paid
        confirmations: 0,
        requiredConfirmations: 3,
        exchangeRate: 0, // Rate at time of order (crypto to PLN)
        deadline: null
      },
      
      // Card payment details (for future use)
      card: {
        paymentIntentId: '',
        last4: '',
        brand: '',
        processingFee: 0
      }
    },
    
    // Payment tracking
    createdAt: null,
    paidAt: null,
    confirmedAt: null,
    expiresAt: null,
    
    // Payment verification
    verification: {
      method: 'manual', // manual, automatic, webhook
      verifiedBy: '', // User ID who verified
      verifiedAt: null,
      notes: ''
    }
  },
  
  // Timestamps
  createdAt: null,
  updatedAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null
});

// Enhanced User schema with payment information
export const createUserSchema = () => ({
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  displayName: '',
  role: 'klient', // klient, rolnik, admin
  
  // Contact information
  phoneNumber: '',
  postalCode: '',
  address: '',
  city: '',
  
  // Profile
  profileImage: '',
  bio: '',
  
  // Location data
  location: {
    coordinates: { lat: 0, lng: 0 },
    address: '',
    geoHash: ''
  },
  
  // Payment information (for farmers)
  paymentInfo: {
    // Bank transfer information
    bankAccount: {
      enabled: false,
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      swiftCode: '',
      iban: '',
      verified: false,
      verifiedAt: null
    },
    
    // BLIK information
    blik: {
      enabled: false,
      phoneNumber: '',
      verified: false,
      verifiedAt: null,
      lastTestAmount: null // For verification
    },
    
    // Crypto wallets
    cryptoWallets: [
      {
        id: '',
        network: 'ethereum', // ethereum, bitcoin, polygon, etc.
        address: '',
        currency: 'ETH', // ETH, BTC, USDC, etc.
        label: '', // Custom label for the wallet
        enabled: true,
        verified: false,
        verifiedAt: null,
        verificationTxHash: '' // Hash of verification transaction
      }
    ],
    
    // Payment preferences
    preferences: {
      autoConfirmPayments: false,
      paymentDeadlineHours: 24,
      minimumOrderAmount: 0,
      acceptedCurrencies: ['PLN'],
      preferredMethod: 'bank_transfer' // Default payment method
    }
  },
  
  // Notification preferences
  notificationPreferences: {
    email: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: false,
      paymentReceived: true,
      paymentDeadline: true
    },
    sms: {
      orderUpdates: false,
      newMessages: false,
      lowStock: true,
      reviews: false,
      paymentReceived: true,
      paymentDeadline: true
    },
    inApp: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: true,
      paymentReceived: true,
      paymentDeadline: true
    }
  },
  
  // Verification and status
  isVerified: false,
  verificationDate: null,
  status: 'active', // active, suspended, pending
  
  // Timestamps
  createdAt: null,
  updatedAt: null,
  lastLoginAt: null
});

// Payment method schema for storing farmer payment configurations
export const createPaymentMethodSchema = () => ({
  id: '',
  farmerId: '',
  type: '', // bank_transfer, blik, crypto
  
  // Payment method details
  details: {
    // Bank account details
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    swiftCode: '',
    iban: '',
    
    // BLIK phone number
    phoneNumber: '',
    
    // Crypto wallet details
    network: '',
    address: '',
    currency: '',
    label: ''
  },
  
  // Verification status
  verified: false,
  verifiedAt: null,
  verificationMethod: '', // document_upload, test_transaction, third_party
  
  // Settings
  enabled: true,
  isDefault: false,
  minimumAmount: 0,
  maximumAmount: null,
  
  // Metadata
  createdAt: null,
  updatedAt: null,
  lastUsedAt: null
});

// Notification schema with payment events
export const createNotificationSchema = () => ({
  id: '',
  userId: '',
  type: '', // See NOTIFICATION_TYPES
  priority: 'medium', // low, medium, high, urgent
  
  title: '',
  message: '',
  
  // Action data for navigation
  actionData: {},
  
  // Delivery channels
  channels: {
    inApp: { sent: false, read: false, readAt: null },
    email: { sent: false, delivered: false, sentAt: null },
    sms: { sent: false, delivered: false, sentAt: null }
  },
  
  // Scheduling
  scheduledFor: null, // For delayed notifications
  expiresAt: null,
  
  createdAt: null,
  readAt: null
});

// Enhanced notification types including payment events
export const NOTIFICATION_TYPES = {
  // Inventory
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  BATCH_EXPIRING: 'batch_expiring',
  
  // Orders
  NEW_ORDER: 'new_order',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Payment Events
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_DEADLINE_APPROACHING: 'payment_deadline_approaching',
  PAYMENT_EXPIRED: 'payment_expired',
  
  // Reviews
  NEW_REVIEW: 'new_review',
  REVIEW_RESPONSE: 'review_response',
  
  // Chat
  NEW_MESSAGE: 'new_message',
  
  // Seasonal
  SEASON_STARTING: 'season_starting',
  SEASON_ENDING: 'season_ending',
  
  // System
  PROFILE_UPDATED: 'profile_updated',
  VERIFICATION_APPROVED: 'verification_approved',
  PAYMENT_METHOD_ADDED: 'payment_method_added',
  PAYMENT_METHOD_VERIFIED: 'payment_method_verified'
};

// Helper functions for payment processing
export const getPaymentMethodDisplayName = (method) => {
  const displayNames = {
    [PAYMENT_TYPES.CASH]: 'Cash on Delivery',
    [PAYMENT_TYPES.BANK_TRANSFER]: 'Bank Transfer',
    [PAYMENT_TYPES.BLIK]: 'BLIK Transfer',
    [PAYMENT_TYPES.CRYPTO]: 'Cryptocurrency',
    [PAYMENT_TYPES.CARD]: 'Credit/Debit Card'
  };
  
  return displayNames[method] || method;
};

export const getCryptoNetworkDisplayName = (network) => {
  const displayNames = {
    [CRYPTO_NETWORKS.ETHEREUM]: 'Ethereum (ETH)',
    [CRYPTO_NETWORKS.BITCOIN]: 'Bitcoin (BTC)',
    [CRYPTO_NETWORKS.POLYGON]: 'Polygon (MATIC)',
    [CRYPTO_NETWORKS.BSC]: 'Binance Smart Chain (BNB)',
    [CRYPTO_NETWORKS.SOLANA]: 'Solana (SOL)'
  };
  
  return displayNames[network] || network;
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    [PAYMENT_STATUS.PENDING]: 'yellow',
    [PAYMENT_STATUS.CONFIRMING]: 'blue',
    [PAYMENT_STATUS.CONFIRMED]: 'green',
    [PAYMENT_STATUS.PAID]: 'green',
    [PAYMENT_STATUS.FAILED]: 'red',
    [PAYMENT_STATUS.CANCELLED]: 'gray',
    [PAYMENT_STATUS.REFUNDED]: 'orange',
    [PAYMENT_STATUS.EXPIRED]: 'red'
  };
  
  return colors[status] || 'gray';
};

// Generate payment reference for bank transfers and BLIK
export const generatePaymentReference = (orderId, customerId) => {
  const timestamp = Date.now().toString().slice(-6);
  const customerSuffix = customerId.slice(-4);
  const orderSuffix = orderId.slice(-4);
  
  return `FD${timestamp}${customerSuffix}${orderSuffix}`.toUpperCase();
};

// Calculate payment deadline
export const calculatePaymentDeadline = (hours = 24) => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
};

// Validate crypto wallet address format
export const validateCryptoAddress = (address, network) => {
  const validators = {
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    polygon: /^0x[a-fA-F0-9]{40}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  };
  
  const validator = validators[network];
  return validator ? validator.test(address) : false;
};

// Validate Polish bank account number (IBAN)
export const validatePolishIBAN = (iban) => {
  const polishIBANRegex = /^PL\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/;
  return polishIBANRegex.test(iban.replace(/\s/g, ''));
};

// Validate Polish phone number for BLIK
export const validatePolishPhoneNumber = (phoneNumber) => {
  const polishPhoneRegex = /^(\+48)?[-.\s]?[4-9]\d{8}$/;
  return polishPhoneRegex.test(phoneNumber.replace(/[-.\s]/g, ''));
};

export default {
  COLLECTIONS,
  PAYMENT_TYPES,
  CRYPTO_NETWORKS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  createOrderSchema,
  createUserSchema,
  createPaymentMethodSchema,
  createNotificationSchema,
  getPaymentMethodDisplayName,
  getCryptoNetworkDisplayName,
  getPaymentStatusColor,
  generatePaymentReference,
  calculatePaymentDeadline,
  validateCryptoAddress,
  validatePolishIBAN,
  validatePolishPhoneNumber
};