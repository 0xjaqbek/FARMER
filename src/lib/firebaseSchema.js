// src/lib/firebaseSchema.js
// Enhanced database schema definitions and utilities

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

// Product schema with inventory management
export const createProductSchema = () => ({
  id: '',
  name: '',
  description: '',
  price: 0,
  farmerId: '',
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
  
  // Search and categorization
  tags: [],
  searchKeywords: [],
  
  // Status and timestamps
  status: 'active', // active, inactive, out_of_season, discontinued
  createdAt: null,
  updatedAt: null
});

// Batch schema for inventory tracking
export const createBatchSchema = () => ({
  id: '',
  quantity: 0,
  harvestDate: null,
  expiryDate: null,
  status: 'available', // available, reserved, sold, expired, damaged
  cost: 0, // Cost per unit for this batch
  notes: ''
});

// Enhanced user schema with location services
export const createUserSchema = () => ({
  id: '',
  email: '',
  displayName: '',
  role: 'customer', // customer, farmer, admin
  
  // Enhanced location data
  location: {
    address: '',
    coordinates: { lat: 0, lng: 0 },
    geoHash: '',
    city: '',
    region: '',
    country: 'Poland',
    
    // For farmers - delivery zones
    deliveryZones: [
      {
        radius: 25, // km
        deliveryFee: 5, // EUR
        freeDeliveryThreshold: 50,
        isActive: true
      }
    ],
    
    // For customers - delivery preferences
    deliveryAddresses: [
      {
        id: '',
        label: 'Home',
        address: '',
        coordinates: { lat: 0, lng: 0 },
        isDefault: true,
        deliveryInstructions: ''
      }
    ]
  },
  
  // Notification preferences
  notificationPreferences: {
    email: {
      orderUpdates: true,
      newMessages: true,
      lowStock: true, // For farmers
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
  
  // Farmer-specific data
  farmInfo: {
    farmName: '',
    description: '',
    established: null,
    farmSize: 0, // hectares
    farmingMethods: [], // organic, conventional, biodynamic
    specialties: [], // vegetables, fruits, dairy, etc.
    certifications: [],
    website: '',
    socialMedia: {}
  },
  
  // Customer-specific data
  customerInfo: {
    preferredCategories: [],
    dietaryRestrictions: [],
    averageOrderValue: 0,
    totalOrders: 0
  },
  
  // Profile data
  profileImage: '',
  phoneNumber: '',
  isVerified: false,
  verificationDate: null,
  
  createdAt: null,
  updatedAt: null
});

// Review schema
export const createReviewSchema = () => ({
  id: '',
  type: 'product', // product, farmer, order
  targetId: '',
  customerId: '',
  orderId: '', // Links to verified purchase
  
  rating: 5,
  title: '',
  comment: '',
  
  // Detailed ratings
  detailedRatings: {
    quality: 5,
    freshness: 5,
    value: 4,
    packaging: 5,
    communication: 5 // For farmer reviews
  },
  
  // Verification and media
  isVerifiedPurchase: false,
  images: [],
  
  // Moderation
  status: 'pending', // pending, approved, rejected
  moderationNotes: '',
  helpfulVotes: 0,
  reportCount: 0,
  
  // Farmer response
  farmerResponse: {
    comment: '',
    respondedAt: null
  },
  
  createdAt: null,
  updatedAt: null
});

// Aggregated ratings schema
export const createRatingSchema = () => ({
  targetId: '',
  targetType: 'product', // product, farmer
  
  overall: {
    average: 0,
    count: 0,
    distribution: {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }
  },
  
  detailed: {
    quality: 0,
    freshness: 0,
    value: 0,
    packaging: 0,
    communication: 0
  },
  
  lastUpdated: null
});

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

// Enhanced order schema
export const createOrderSchema = () => ({
  id: '',
  customerId: '',
  farmerId: '',
  
  // Items with inventory tracking
  items: [
    {
      productId: '',
      quantity: 0,
      unitPrice: 0,
      batchId: '', // Links to specific inventory batch
      productSnapshot: {} // Product data at time of order
    }
  ],
  
  // Pricing
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  
  // Delivery information
  delivery: {
    address: '',
    coordinates: { lat: 0, lng: 0 },
    instructions: '',
    preferredDate: null,
    estimatedDate: null,
    actualDate: null
  },
  
  // Status tracking
  status: 'pending', // pending, confirmed, preparing, shipped, delivered, cancelled
  statusHistory: [
    {
      status: 'pending',
      timestamp: null,
      notes: ''
    }
  ],
  
  // Payment
  payment: {
    method: 'cash', // cash, card, bank_transfer
    status: 'pending', // pending, paid, failed, refunded
    transactionId: '',
    paidAt: null
  },
  
  // Communication
  notes: '',
  cancellationReason: '',
  
  createdAt: null,
  updatedAt: null
});

// Inventory log for tracking stock changes
export const createInventoryLogSchema = () => ({
  id: '',
  productId: '',
  batchId: '',
  type: 'restock', // restock, sale, reservation, release, adjustment, expiry
  
  quantityBefore: 0,
  quantityChange: 0,
  quantityAfter: 0,
  
  reason: '',
  orderId: '', // If related to an order
  userId: '', // Who made the change
  
  createdAt: null
});

// Utility functions for schema validation
export const validateSchema = (data, schemaCreator) => {
  const schema = schemaCreator();
  const errors = [];
  
  // Basic validation logic here
  // In a real app, you'd use a library like Zod or Joi
  
  return { isValid: errors.length === 0, errors };
};

// GeoHash utility for location-based queries
export const generateGeoHash = (lat, lng, precision = 7) => {
  // Simple geohash implementation
  // In production, use a proper geohash library
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let hash = '';
  let even = true;
  
  while (hash.length < precision) {
    if (even) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        hash += '1';
        lngRange[0] = mid;
      } else {
        hash += '0';
        lngRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        hash += '1';
        latRange[0] = mid;
      } else {
        hash += '0';
        latRange[1] = mid;
      }
    }
    even = !even;
  }
  
  // Convert binary to base32
  let result = '';
  for (let i = 0; i < hash.length; i += 5) {
    const chunk = hash.substr(i, 5).padEnd(5, '0');
    const index = parseInt(chunk, 2);
    result += base32[index];
  }
  
  return result;
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};