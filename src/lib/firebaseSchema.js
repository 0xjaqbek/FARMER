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
  INVENTORY_LOGS: 'inventory_logs'
};

// Notification schema
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

// Notification types
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
  
  // Reviews
  NEW_REVIEW: 'new_review',
  REVIEW_RESPONSE: 'review_response',
  
  // Chat
  NEW_MESSAGE: 'new_message',
  
  // Seasonal
  SEASON_STARTING: 'season_starting',
  SEASON_ENDING: 'season_ending',
  
  // System
  PAYMENT_RECEIVED: 'payment_received',
  PROFILE_UPDATED: 'profile_updated',
  VERIFICATION_APPROVED: 'verification_approved'
};

// Product schema with inventory management
export const createProductSchema = () => ({
  id: '',
  name: '',
  description: '',
  price: 0,
  farmerId: '',
  rolnikId: '', // Alternative field name
  category: '',
  images: [],
  
  // Enhanced inventory system
  inventory: {
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
    lowStockThreshold: 10,
    unit: 'kg', // kg, pieces, bunches, liters, etc.
    
    batches: [], // Array of batch objects
    
    // Stock tracking
    lastRestocked: null,
    nextExpectedRestock: null
  },
  
  // Seasonal availability
  seasonality: {
    isActive: true,
    startSeason: null, // Date string
    endSeason: null,   // Date string
    recurringYearly: true
  },
  
  // Auto-management settings
  autoManagement: {
    hideWhenOutOfStock: true,
    allowBackorders: false,
    autoReactivateInSeason: true,
    autoDeactivateOutOfSeason: false
  },
  
  // Geographic and quality info
  location: {
    farmAddress: '',
    coordinates: { lat: 0, lng: 0 },
    geoHash: ''
  },
  
  // Quality indicators
  quality: {
    organic: false,
    localGrown: true,
    freshness: 'daily', // daily, weekly, preserved
    certifications: [] // organic, bio, fair-trade, etc.
  },
  
  // Status and metadata
  status: 'active', // active, inactive, sold_out, archived
  createdAt: null,
  updatedAt: null
});

// Enhanced order schema
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
  
  // Payment
  paymentMethod: 'cash', // cash, card, bank_transfer
  paymentStatus: 'pending', // pending, paid, failed, refunded
  
  // Timestamps
  createdAt: null,
  updatedAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null
});

// User schema
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
  
  // Notification preferences
  notificationPreferences: {
    email: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: false
    },
    sms: {
      orderUpdates: false,
      newMessages: false,
      lowStock: true,
      reviews: false
    },
    inApp: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true,
      reviews: true,
      marketing: true
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

// Message schema
export const createMessageSchema = () => ({
  id: '',
  conversationId: '',
  senderId: '',
  receiverId: '',
  content: '',
  type: 'text', // text, image, file
  
  // Read status
  readAt: null,
  deliveredAt: null,
  
  // Attachments
  attachments: [],
  
  createdAt: null
});

// Conversation schema
export const createConversationSchema = () => ({
  id: '',
  participants: [], // Array of user IDs
  type: 'direct', // direct, group
  
  // Last message info
  lastMessage: '',
  lastMessageAt: null,
  lastMessageSenderId: '',
  
  // Metadata
  title: '', // For group conversations
  isActive: true,
  
  createdAt: null,
  updatedAt: null
});

// Review schema
export const createReviewSchema = () => ({
  id: '',
  productId: '',
  customerId: '',
  farmerId: '',
  
  // Review content
  rating: 0, // 1-5 stars
  title: '',
  comment: '',
  
  // Media
  images: [],
  
  // Verification
  isVerified: false, // Verified purchase
  orderReference: '',
  
  // Response
  farmerResponse: '',
  farmerResponseAt: null,
  
  // Status
  status: 'published', // published, hidden, flagged
  
  createdAt: null,
  updatedAt: null
});

// Batch/Inventory Log schema
export const createInventoryLogSchema = () => ({
  id: '',
  productId: '',
  batchId: '',
  farmerId: '',
  
  // Transaction details
  type: 'restock', // restock, sale, adjustment, waste
  quantity: 0,
  unit: '',
  
  // Batch information
  batchInfo: {
    harvestDate: null,
    expiryDate: null,
    quality: 'A', // A, B, C grade
    certifications: [],
    notes: ''
  },
  
  // Reference
  referenceId: '', // Order ID for sales, etc.
  notes: '',
  
  createdAt: null
});

// Helper functions
export const getDefaultNotificationPreferences = () => ({
  email: {
    orderUpdates: true,
    newMessages: true,
    lowStock: true,
    reviews: true,
    marketing: false
  },
  sms: {
    orderUpdates: false,
    newMessages: false,
    lowStock: true,
    reviews: false
  },
  inApp: {
    orderUpdates: true,
    newMessages: true,
    lowStock: true,
    reviews: true,
    marketing: true
  }
});

export const getNotificationTypeDisplayName = (type) => {
  const displayNames = {
    [NOTIFICATION_TYPES.NEW_ORDER]: 'New Order',
    [NOTIFICATION_TYPES.ORDER_CONFIRMED]: 'Order Confirmed',
    [NOTIFICATION_TYPES.ORDER_SHIPPED]: 'Order Shipped',
    [NOTIFICATION_TYPES.ORDER_DELIVERED]: 'Order Delivered',
    [NOTIFICATION_TYPES.ORDER_CANCELLED]: 'Order Cancelled',
    [NOTIFICATION_TYPES.NEW_MESSAGE]: 'New Message',
    [NOTIFICATION_TYPES.NEW_REVIEW]: 'New Review',
    [NOTIFICATION_TYPES.REVIEW_RESPONSE]: 'Review Response',
    [NOTIFICATION_TYPES.LOW_STOCK]: 'Low Stock',
    [NOTIFICATION_TYPES.OUT_OF_STOCK]: 'Out of Stock',
    [NOTIFICATION_TYPES.BATCH_EXPIRING]: 'Batch Expiring',
    [NOTIFICATION_TYPES.SEASON_STARTING]: 'Season Starting',
    [NOTIFICATION_TYPES.SEASON_ENDING]: 'Season Ending',
    [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: 'Payment Received',
    [NOTIFICATION_TYPES.PROFILE_UPDATED]: 'Profile Updated',
    [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: 'Verification Approved'
  };
  
  return displayNames[type] || type;
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  };
  
  return colors[priority] || 'gray';
};