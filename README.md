# 🌾 Farmer - Farm-to-Table Marketplace & Farcaster Mini App

<div align="center">

![Farmer Logo](https://farmer4u.web.app/icons/android/android-launchericon-512-512.png)

**A progressive web application connecting farmers directly with customers, powered by blockchain transparency and Farcaster social integration**

[![Deploy Status](https://img.shields.io/badge/deploy-firebase-orange)](https://farmer4u.web.app)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Base](https://img.shields.io/badge/Base-Blockchain-blue)](https://base.org)

[Live Demo](https://farmer4u.web.app) • [Report Bug](https://github.com/0xjaqbek/FARMER/issues) • [Request Feature](https://github.com/0xjaqbek/FARMER/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Architecture](#-project-architecture)
- [Firebase Setup](#-firebase-setup)
- [Blockchain Integration](#-blockchain-integration)
- [Farcaster Mini App](#-farcaster-mini-app-integration)
- [PWA Features](#-pwa-features)
- [User Roles & Permissions](#-user-roles--permissions)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Farmer** is a comprehensive farm-to-table marketplace that bridges the gap between local farmers and consumers. Built as both a Progressive Web App (PWA) and a Farcaster Mini App, it leverages blockchain technology for transparent crowdfunding and secure transactions.

### What Makes Farmer Special?

- **Direct Connection**: Eliminate middlemen and connect farmers with consumers directly
- **Blockchain Transparency**: All crowdfunding campaigns tracked on-chain with Base network
- **Social Integration**: Native Farcaster Mini App for seamless social commerce
- **Real-Time Communication**: Built-in chat system for farmer-customer interaction
- **Geolocation Services**: Find farmers and products near you with map integration
- **Crowdfunding Platform**: Support farm projects through transparent blockchain campaigns
- **PWA Experience**: Install on any device, works offline, fast and reliable

---

## 🎯 Key Features

### 👨‍🌾 For Farmers

#### Product Management
- **Product Listing**: Create detailed product listings with images, pricing, and inventory
- **Inventory Tracking**: Real-time stock management with automatic alerts
- **QR Code Generation**: Generate QR codes for product tracking and authenticity
- **Seasonal Planning**: Mark products as seasonal with availability dates
- **Batch Management**: Track product batches with expiry dates and quality metrics
- **Image Gallery**: Upload multiple high-quality images per product
- **Product Analytics**: View product performance and customer preferences

#### Order & Delivery Management
- **Order Dashboard**: Centralized view of all orders with status tracking
- **Real-Time Notifications**: Instant alerts for new orders and messages
- **Delivery Scheduling**: Plan and manage delivery routes efficiently
- **Order Timeline**: Track each order from placement to delivery
- **Status Updates**: Keep customers informed with automated status updates

#### Crowdfunding Campaigns
- **Campaign Creation**: Launch blockchain-backed crowdfunding campaigns
- **Milestone Tracking**: Set and track campaign milestones with transparency
- **Reward System**: Offer rewards for campaign supporters
- **On-Chain Verification**: All transactions recorded on Base blockchain
- **Campaign Analytics**: Monitor funding progress and supporter engagement

#### Communication Tools
- **Direct Messaging**: Built-in chat system with farmers and customers
- **Notification Center**: Manage all notifications in one place
- **Announcement System**: Broadcast updates to customers
- **Customer Reviews**: Receive and respond to customer feedback

#### Financial Management
- **Crypto Wallet Integration**: Accept payments via Base network
- **Payment Tracking**: Monitor all transactions with blockchain transparency
- **Earnings Dashboard**: View revenue analytics and trends
- **Multi-Currency Support**: Accept various cryptocurrencies

### 🛒 For Customers

#### Shopping Experience
- **Product Discovery**: Browse products by category, location, or farmer
- **Advanced Search**: Filter by price, location, seasonality, and more
- **Map Integration**: Find farmers near you with interactive maps
- **Product Details**: View comprehensive product information and farmer profiles
- **Shopping Cart**: Add multiple products with quantity management
- **Wishlist**: Save favorite products for later

#### Order Management
- **Easy Checkout**: Streamlined checkout process with multiple payment options
- **Order Tracking**: Real-time order status updates with timeline view
- **Delivery Updates**: Get notified at every stage of delivery
- **Order History**: View past orders and reorder with one click
- **QR Verification**: Verify product authenticity with QR scanning

#### Social Features
- **Farmer Profiles**: View farmer bios, ratings, and product offerings
- **Reviews & Ratings**: Share experiences and read community feedback
- **Chat with Farmers**: Direct messaging for questions and special requests
- **Campaign Support**: Contribute to farm projects through crowdfunding
- **Social Sharing**: Share products and campaigns on Farcaster

#### Community & Support
- **Campaign Participation**: Support local farm projects with crypto
- **Reward Programs**: Earn rewards for campaign contributions
- **Community Updates**: Stay informed about local farming initiatives
- **Customer Support**: Access help and support resources

### 👤 For Administrators

#### System Management
- **User Management**: Approve and manage farmer accounts
- **Campaign Verification**: Review and verify crowdfunding campaigns
- **Contract Deployment**: Deploy and manage blockchain smart contracts
- **Platform Analytics**: Monitor system-wide metrics and performance
- **Content Moderation**: Review and moderate user-generated content

#### Security & Compliance
- **Role-Based Access**: Manage user permissions and access levels
- **Security Monitoring**: Track suspicious activities and enforce policies
- **Data Management**: Backup and restore system data
- **Audit Logs**: Complete audit trail of all administrative actions

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 19.1.0**: Latest React with concurrent features
- **React Router 7.6.0**: Client-side routing with data loading
- **Vite 6.3.5**: Next-generation frontend tooling
- **TypeScript/JavaScript**: Modern ES6+ JavaScript

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
  - Dialog, Dropdown, Select, Tabs, Toast, and more
- **Framer Motion 12.23.12**: Animation library
- **Lucide React**: Modern icon library
- **React Three Fiber**: 3D graphics and animations

### State Management & Data
- **React Context API**: Global state management
- **TanStack Query 5.90.2**: Server state management
- **React Hook Form 7.56.4**: Form handling and validation
- **Zod 3.25.16**: Schema validation

### Backend & Database
- **Firebase 11.8.0**: Backend-as-a-Service platform
  - **Firestore**: NoSQL database
  - **Authentication**: User management
  - **Storage**: File uploads and media
  - **Cloud Functions**: Serverless backend
  - **Hosting**: Static site hosting
- **Firebase Admin 13.4.0**: Server-side Firebase SDK

### Blockchain & Web3
- **Base Network**: Layer 2 Ethereum solution
- **OnchainKit 1.1.0**: Coinbase's Base development kit
- **Ethers.js 6.15.0**: Ethereum wallet and contract interaction
- **Viem 2.37.9**: TypeScript Ethereum interface
- **Wagmi 2.17.5**: React hooks for Ethereum
- **OpenZeppelin Contracts 5.4.0**: Secure smart contract library

### Farcaster Integration
- **@farcaster/miniapp-sdk 0.1.10**: Farcaster Mini App development kit
- **@civic/auth 0.9.5**: Decentralized authentication

### Maps & Location
- **Google Maps API**: Interactive maps and geolocation
- **Custom Geoqueries**: Location-based product search

### PWA & Performance
- **Service Workers**: Offline functionality
- **Web App Manifest**: Installable web app
- **Cache Strategies**: Optimized caching for speed
- **Code Splitting**: Lazy loading for performance

### Development Tools
- **ESLint**: Code linting and quality
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing
- **Vite Plugins**: Node polyfills and React optimization

### Utilities
- **date-fns 4.1.0**: Date manipulation
- **crypto-js 4.2.0**: Cryptographic functions
- **qrcode.react 4.2.0**: QR code generation
- **class-variance-authority**: Variant-based styling
- **clsx & tailwind-merge**: Dynamic class names

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Firebase CLI** - `npm install -g firebase-tools`
- **Crypto Wallet** (MetaMask, Coinbase Wallet, etc.)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/0xjaqbek/FARMER.git
cd FARMER
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React Router
- Firebase SDK
- Blockchain libraries (Ethers, Wagmi, Viem)
- UI components (Radix UI, Tailwind)
- All other dependencies

#### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Blockchain Configuration (Base Network)
VITE_ETHEREUM_RPC_URL=https://mainnet.base.org
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_CHAIN_ID=8453

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Farcaster Configuration
VITE_FARCASTER_APP_ID=your_farcaster_app_id

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173/api
```

#### 4. Firebase Setup

**Create Firebase Project:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Storage**: Enable for file uploads
   - **Hosting**: For deployment
   - **Cloud Functions**: For serverless backend

**Configure Firebase:**

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select the following features:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

**Deploy Firestore Rules:**

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

**Deploy Cloud Functions:**

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

#### 5. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create API credentials
4. Restrict API key to your domain
5. Add the API key to your `.env` file

#### 6. Blockchain Setup (Optional for Development)

For testing, you can use Base Sepolia testnet:

```env
VITE_ETHEREUM_RPC_URL=https://sepolia.base.org
VITE_CHAIN_ID=84532
```

Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

#### 7. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Quick Start Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Firebase
firebase deploy          # Deploy everything
firebase deploy --only hosting    # Deploy hosting only
firebase deploy --only functions  # Deploy functions only

# Testing
npm test                 # Run tests (if configured)
```

---

## 🏗️ Project Architecture

### Directory Structure

```
FARMER/
├── .claude/                    # Claude Code configuration
├── .firebase/                  # Firebase cache
├── .git/                       # Git repository
├── dist/                       # Production build output
├── functions/                  # Firebase Cloud Functions
│   ├── index.js               # Function definitions
│   └── package.json           # Function dependencies
├── public/                     # Static public assets
│   ├── .well-known/           # Farcaster manifest
│   │   └── farcaster.json     # Mini App configuration
│   ├── icons/                 # App icons (iOS, Android)
│   ├── sw.js                  # Service Worker
│   └── manifest.json          # PWA manifest
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   └── ...
│   │   ├── layout/           # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── auth/             # Authentication components
│   │   ├── products/         # Product components
│   │   ├── orders/           # Order components
│   │   ├── chat/             # Chat components
│   │   ├── farmer/           # Farmer-specific components
│   │   ├── payment/          # Payment components
│   │   ├── maps/             # Map components
│   │   ├── location/         # Location picker
│   │   ├── search/           # Search components
│   │   ├── providers/        # Context providers
│   │   │   └── OnchainProviders.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PWAProvider.jsx
│   │   └── PWAErrorBoundary.jsx
│   ├── pages/                # Page components
│   │   ├── Home.jsx          # Landing page
│   │   ├── About.jsx         # About page
│   │   ├── Dashboard.jsx     # User dashboard
│   │   ├── Profile.jsx       # User profile
│   │   ├── Cart.jsx          # Shopping cart
│   │   ├── Checkout.jsx      # Checkout page
│   │   ├── NotificationPage.jsx
│   │   ├── admin/           # Admin pages
│   │   │   └── AdminDashboard.jsx
│   │   ├── campaigns/       # Campaign pages
│   │   │   ├── CampaignCreator.jsx
│   │   │   ├── CampaignViewer.jsx
│   │   │   ├── CampaignManager.jsx
│   │   │   ├── CampaignDetail.jsx
│   │   │   ├── CampaignEdit.jsx
│   │   │   └── AboutCampaigns.jsx
│   │   ├── chat/            # Chat pages
│   │   │   ├── ChatList.jsx
│   │   │   └── ChatDetail.jsx
│   │   ├── farmers/         # Farmer pages
│   │   │   ├── FarmersDirectory.jsx
│   │   │   └── FarmerProfile.jsx
│   │   ├── products/        # Product pages
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── ProductAdd.jsx
│   │   │   ├── ProductManage.jsx
│   │   │   ├── ProductEdit.jsx
│   │   │   ├── ProductImages.jsx
│   │   │   ├── ProductQR.jsx
│   │   │   └── ProductTracker.jsx
│   │   ├── orders/          # Order pages
│   │   │   ├── OrderList.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   └── OrderCreate.jsx
│   │   ├── legal/           # Legal pages
│   │   │   ├── TermsOfService.jsx
│   │   │   └── PrivacyPolicy.jsx
│   │   ├── OfflinePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── context/              # React Context
│   │   ├── AuthContext.jsx
│   │   ├── BaseMiniAppAuthContext.jsx
│   │   └── CartContext.jsx
│   ├── firebase/             # Firebase services
│   │   ├── config.jsx        # Firebase config
│   │   ├── auth.jsx          # Authentication
│   │   ├── products.jsx      # Product operations
│   │   ├── orders.jsx        # Order operations
│   │   ├── chat.jsx          # Chat operations
│   │   ├── crowdfunding.jsx  # Campaign operations
│   │   ├── users.jsx         # User operations
│   │   ├── reviews.jsx       # Review operations
│   │   ├── geoQueries.jsx    # Geolocation queries
│   │   └── admin.jsx         # Admin operations
│   ├── hooks/                # Custom React hooks
│   │   ├── use-toast.js      # Toast notifications
│   │   ├── useWeb3.js        # Web3 interactions
│   │   ├── useLocation.js    # Geolocation
│   │   ├── useOffline.js     # Offline detection
│   │   ├── useNotifications.js
│   │   ├── useBlockchainSync.js
│   │   └── useBaseAccountCapabilities.js
│   ├── lib/                  # Utility libraries
│   │   ├── utils.js          # General utilities
│   │   └── firebaseSchema.js # Data schemas
│   ├── examples/             # Example components
│   │   └── QuickStart.jsx
│   ├── utils/                # Utility functions
│   │   └── firebaseDebug.jsx
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .firebaserc               # Firebase project config
├── .gitignore                # Git ignore rules
├── eslint.config.js          # ESLint configuration
├── firebase.json             # Firebase configuration
├── index.html                # HTML entry point
├── jsconfig.json             # JavaScript config
├── package.json              # Project dependencies
├── package-lock.json         # Dependency lock file
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite configuration
├── BASE_MINIAPP_SETUP.md     # Base Mini App guide
├── BASE_MINIAPP_AUTH_MIGRATION.md  # Auth migration guide
├── DEPLOYMENT_CHECKLIST.md   # Deployment guide
└── README.md                 # This file
```

### Component Architecture

```
┌─────────────────────────────────────┐
│          App.jsx (Root)             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │   OnchainProviders          │   │
│  │   (Web3, Wagmi, Base)       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   PWAProvider               │   │
│  │   (Service Worker, Offline) │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   AuthProvider              │   │
│  │   (Authentication, User)    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   CartProvider              │   │
│  │   (Shopping Cart State)     │   │
│  └─────────────────────────────┘   │
│         │                           │
│         ▼                           │
│  ┌─────────────────────────────┐   │
│  │   Router (React Router)     │   │
│  └─────────────────────────────┘   │
│         │                           │
│         ▼                           │
│  ┌─────────────────────────────┐   │
│  │   MainLayout                │   │
│  │   ├── Navbar                │   │
│  │   ├── Main Content          │   │
│  │   └── Footer (optional)     │   │
│  └─────────────────────────────┘   │
│         │                           │
│         ▼                           │
│  ┌─────────────────────────────┐   │
│  │   Page Components           │   │
│  │   (Home, Products, Orders)  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  React UI   │◄────►│  Firebase   │◄────►│  Firestore  │
│ Components  │      │  Services   │      │  Database   │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│             │      │             │
│   Web3      │◄────►│   Base      │
│   Hooks     │      │  Blockchain │
│             │      │             │
└─────────────┘      └─────────────┘
```

---

## 🔥 Firebase Setup

### Firestore Database Structure

#### Collections Overview

```
firestore/
├── users/                    # User profiles
├── products/                 # Product listings
├── orders/                   # Order records
├── conversations/            # Chat conversations
├── messages/                 # Chat messages
├── notifications/            # User notifications
├── campaigns/                # Crowdfunding campaigns
├── reviews/                  # Product/farmer reviews
├── inventory_logs/           # Inventory history
└── admin_logs/              # Admin activity logs
```

#### Detailed Schema

**users/** - User profile documents
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  role: string,             // 'customer', 'farmer', 'admin'
  avatar: string,           // Storage URL
  phone: string,
  location: {
    latitude: number,
    longitude: number,
    address: string,
    city: string,
    state: string,
    zipCode: string
  },
  walletAddress: string,    // Crypto wallet
  farmerProfile: {          // Only for farmers
    bio: string,
    farmName: string,
    certifications: string[],
    specialties: string[],
    yearsExperience: number
  },
  preferences: {
    notifications: boolean,
    language: string,
    currency: string
  },
  stats: {
    totalOrders: number,
    totalSpent: number,
    reviewCount: number,
    rating: number
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  lastActive: timestamp
}
```

**products/** - Product listings
```javascript
{
  id: string,
  farmerId: string,         // User UID
  name: string,
  description: string,
  category: string,         // 'vegetables', 'fruits', 'dairy', etc.
  price: number,
  unit: string,             // 'kg', 'lb', 'piece', etc.
  inventory: number,
  images: string[],         // Storage URLs
  location: geopoint,       // Firestore GeoPoint
  address: string,
  seasonal: boolean,
  seasonStart: timestamp,
  seasonEnd: timestamp,
  organic: boolean,
  certifications: string[],
  tags: string[],
  qrCode: string,           // QR code data
  batches: [{
    batchId: string,
    quantity: number,
    expiryDate: timestamp,
    harvestDate: timestamp
  }],
  stats: {
    views: number,
    orders: number,
    rating: number,
    reviewCount: number
  },
  status: string,           // 'active', 'inactive', 'out_of_stock'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**orders/** - Order records
```javascript
{
  id: string,
  customerId: string,
  farmerId: string,
  items: [{
    productId: string,
    productName: string,
    quantity: number,
    price: number,
    subtotal: number
  }],
  total: number,
  status: string,           // 'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'
  payment: {
    method: string,         // 'crypto', 'cash'
    transactionHash: string,
    status: string,
    paidAt: timestamp
  },
  delivery: {
    address: string,
    location: geopoint,
    scheduledDate: timestamp,
    deliveredDate: timestamp,
    instructions: string
  },
  timeline: [{
    status: string,
    timestamp: timestamp,
    note: string
  }],
  qrCode: string,          // Order verification QR
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**campaigns/** - Crowdfunding campaigns
```javascript
{
  id: string,
  farmerId: string,
  title: string,
  description: string,
  story: string,
  goalAmount: number,
  currentAmount: number,
  currency: string,
  blockchain: {
    contractAddress: string,
    campaignId: number,
    network: string,
    verified: boolean
  },
  images: string[],
  video: string,
  category: string,
  tags: string[],
  milestones: [{
    title: string,
    description: string,
    amount: number,
    completed: boolean,
    completedAt: timestamp
  }],
  rewards: [{
    title: string,
    description: string,
    amount: number,
    quantity: number,
    claimed: number,
    deliveryDate: timestamp
  }],
  contributors: [{
    userId: string,
    amount: number,
    timestamp: timestamp,
    transactionHash: string
  }],
  status: string,          // 'draft', 'active', 'funded', 'completed', 'cancelled'
  startDate: timestamp,
  endDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**conversations/** - Chat conversations
```javascript
{
  id: string,
  participants: string[],  // Array of user IDs
  lastMessage: {
    text: string,
    senderId: string,
    timestamp: timestamp,
    read: boolean
  },
  metadata: {
    productId: string,     // Optional, if chat is about a product
    orderId: string        // Optional, if chat is about an order
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**messages/** - Individual messages
```javascript
{
  id: string,
  conversationId: string,
  senderId: string,
  text: string,
  type: string,            // 'text', 'image', 'file'
  attachments: [{
    type: string,
    url: string,
    name: string
  }],
  read: boolean,
  readAt: timestamp,
  createdAt: timestamp
}
```

**notifications/** - User notifications
```javascript
{
  id: string,
  userId: string,
  type: string,            // 'order', 'message', 'campaign', 'system'
  title: string,
  message: string,
  data: object,            // Additional contextual data
  read: boolean,
  readAt: timestamp,
  actionUrl: string,
  createdAt: timestamp
}
```

**reviews/** - Product and farmer reviews
```javascript
{
  id: string,
  productId: string,
  farmerId: string,
  customerId: string,
  orderId: string,
  rating: number,          // 1-5
  title: string,
  comment: string,
  images: string[],
  helpful: number,         // Helpful votes
  verified: boolean,       // Verified purchase
  response: {             // Farmer response
    text: string,
    timestamp: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Firestore Security Rules

Create `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isFarmer() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'farmer';
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Products collection
    match /products/{productId} {
      allow read: if true;  // Public read
      allow create: if isFarmer();
      allow update: if isFarmer() &&
        resource.data.farmerId == request.auth.uid;
      allow delete: if isFarmer() &&
        resource.data.farmerId == request.auth.uid;
    }

    // Orders collection
    match /orders/{orderId} {
      allow read: if isAuthenticated() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.farmerId == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.farmerId == request.auth.uid
      );
      allow delete: if isAdmin();
    }

    // Campaigns collection
    match /campaigns/{campaignId} {
      allow read: if true;  // Public read
      allow create: if isFarmer();
      allow update: if isFarmer() &&
        resource.data.farmerId == request.auth.uid;
      allow delete: if isAdmin();
    }

    // Conversations and messages
    match /conversations/{conversationId} {
      allow read, write: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;
    }

    match /messages/{messageId} {
      allow read, write: if isAuthenticated();
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated();
    }

    // Reviews
    match /reviews/{reviewId} {
      allow read: if true;  // Public read
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
        resource.data.customerId == request.auth.uid;
      allow delete: if isAdmin();
    }
  }
}
```

### Firebase Storage Rules

Create `storage.rules` file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }

    // User avatars
    match /users/avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        isOwner(userId) &&
        isImage() &&
        isUnder10MB();
    }

    // Product images
    match /products/{productId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        isImage() &&
        isUnder10MB();
    }

    // Campaign media
    match /campaigns/{campaignId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        isUnder10MB();
    }

    // Chat attachments
    match /chat/{conversationId}/{fileName} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### Firebase Cloud Functions

Example function in `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Send notification on new order
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();

    // Notify farmer
    await admin.firestore().collection('notifications').add({
      userId: order.farmerId,
      type: 'order',
      title: 'New Order',
      message: `You have a new order for $${order.total}`,
      data: { orderId: context.params.orderId },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Scheduled function to check batch expiry
exports.checkBatchExpiry = functions.pubsub
  .schedule('0 0 * * *')  // Daily at midnight
  .onRun(async (context) => {
    const today = admin.firestore.Timestamp.now();

    const expiredBatches = await admin.firestore()
      .collection('products')
      .where('batches', 'array-contains', {
        expiryDate: today
      })
      .get();

    // Notify farmers about expiring batches
    // Implementation here...
  });
```

---

## ⛓️ Blockchain Integration

### Base Network Overview

Farmer uses the **Base** network (Coinbase's Layer 2 solution) for:
- Fast and cheap transactions
- Ethereum compatibility
- Seamless wallet integration
- Transparent crowdfunding

### Smart Contract Architecture

#### FarmDirectCrowdfunding Contract

Located in `src/smartcontract/` (Solidity contracts)

**Key Features:**
- Campaign creation and management
- Contribution tracking
- Milestone-based fund release
- Refund mechanism
- Admin verification
- Event emission for frontend synchronization

**Main Functions:**

```solidity
// Create new campaign
function createCampaign(
    string memory _title,
    uint256 _goalAmount,
    uint256 _deadline
) external returns (uint256 campaignId)

// Contribute to campaign
function contribute(uint256 _campaignId) external payable

// Claim funds (farmer)
function claimFunds(uint256 _campaignId) external

// Request refund (contributor)
function refund(uint256 _campaignId) external

// Verify campaign (admin)
function verifyCampaign(uint256 _campaignId) external onlyAdmin
```

**Events:**

```solidity
event CampaignCreated(uint256 campaignId, address farmer, uint256 goalAmount);
event ContributionMade(uint256 campaignId, address contributor, uint256 amount);
event FundsClaimed(uint256 campaignId, uint256 amount);
event RefundIssued(uint256 campaignId, address contributor, uint256 amount);
event CampaignVerified(uint256 campaignId);
```

### Web3 Integration

**Using OnchainKit** (`src/components/providers/OnchainProviders.jsx:1`):

```jsx
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

<OnchainKitProvider
  apiKey={process.env.VITE_ONCHAINKIT_API_KEY}
  chain={base}
>
  {children}
</OnchainKitProvider>
```

**Custom Hooks** (`src/hooks/useWeb3.js:1`):

```javascript
// Connect wallet
const { connect, disconnect, address, isConnected } = useWeb3();

// Contribute to campaign
const contribute = async (campaignId, amount) => {
  const tx = await contract.contribute(campaignId, {
    value: ethers.utils.parseEther(amount.toString())
  });
  await tx.wait();
};
```

**Blockchain Sync** (`src/hooks/useBlockchainSync.js:1`):

Automatically syncs blockchain events with Firestore database for consistency.

### Deployment Guide

#### Deploy Smart Contract

1. **Install Hardhat:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. **Configure Hardhat:**
Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY]
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

3. **Deploy Contract:**
```bash
npx hardhat run scripts/deploy.js --network base
```

4. **Update Contract Address:**
Add deployed address to `.env`:
```env
VITE_CONTRACT_ADDRESS=0x...
```

#### Verify Contract

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

---

## 🎯 Farcaster Mini App Integration

### What is a Farcaster Mini App?

Farcaster Mini Apps allow users to interact with your application directly within the Farcaster social network, providing seamless social commerce integration.

### Configuration

**Manifest File** (`public/.well-known/farcaster.json:1`):

```json
{
  "accountAssociation": {
    "header": "",
    "payload": "",
    "signature": ""
  },
  "baseBuilder": {
    "allowedAddresses": [""]
  },
  "miniapp": {
    "version": "1",
    "name": "Farmer",
    "homeUrl": "https://farmer4u.web.app",
    "iconUrl": "https://farmer4u.web.app/icons/android/android-launchericon-512-512.png",
    "splashImageUrl": "https://farmer4u.web.app/icons/android/android-launchericon-512-512.png",
    "splashBackgroundColor": "#16a34a",
    "webhookUrl": "https://farmer4u.web.app/api/webhook",
    "subtitle": "Connect with local farmers for fresh produce",
    "description": "A farm-to-table marketplace connecting you directly with local farmers for fresh, seasonal produce and supporting farm projects through crowdfunding.",
    "primaryCategory": "shopping",
    "tags": ["farming", "marketplace", "local", "organic", "fresh-produce"],
    "tagline": "Fresh from farm to table"
  }
}
```

### Meta Tag Configuration

In `index.html:65`:

```html
<meta name="fc:miniapp" content='{
  "version":"next",
  "imageUrl":"https://farmer4u.web.app/icons/android/android-launchericon-512-512.png",
  "button":{
    "title":"Open Farmer",
    "action":{
      "type":"launch_miniapp",
      "name":"Farmer",
      "url":"https://farmer4u.web.app"
    }
  }
}' />
```

### Authentication

**Sign In With Farcaster (SIWF)** implemented in `src/context/BaseMiniAppAuthContext.jsx:1`:

```javascript
import { useMiniAppAuthentication } from '@farcaster/miniapp-sdk';

const { authenticate, user, isAuthenticated } = useMiniAppAuthentication();
```

### Deployment Steps

1. **Build and Deploy:**
```bash
npm run build
firebase deploy --only hosting
```

2. **Generate Account Association:**
Visit [Base Builder](https://build.base.org) and generate account association with your Base account.

3. **Update Manifest:**
Add account association data to `farcaster.json`.

4. **Submit to Farcaster:**
Submit your Mini App for review in the Farcaster ecosystem.

5. **Test:**
Test your Mini App in the Farcaster mobile app or web client.

For detailed setup instructions, see `BASE_MINIAPP_SETUP.md`.

---

## 📱 PWA Features

### Progressive Web App Capabilities

#### Installation
- **Install on Any Device**: Add to home screen on iOS, Android, desktop
- **Standalone Mode**: Runs like a native app without browser UI
- **Custom App Icon**: Branded icon and splash screens

#### Offline Support
- **Service Worker**: Caches critical assets for offline access
- **Offline Page**: Custom offline experience when network unavailable
- **Background Sync**: Sync data when connection restored

#### Performance
- **Fast Loading**: Optimized caching strategies
- **Code Splitting**: Lazy load routes for faster initial load
- **Image Optimization**: Responsive images with proper caching

### Service Worker Configuration

**Service Worker** (`public/sw.js:1`):

```javascript
const CACHE_NAME = 'farmer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/android/android-launchericon-512-512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

### Manifest Configuration

**Web App Manifest** (`public/manifest.json`):

```json
{
  "name": "Farmer - Farm Direct",
  "short_name": "Farmer",
  "description": "Connect with local farmers for fresh produce",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#16a34a",
  "background_color": "#ffffff",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/android/android-launchericon-192-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/android/android-launchericon-512-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["shopping", "food", "lifestyle"],
  "shortcuts": [
    {
      "name": "Browse Products",
      "url": "/products",
      "icons": [{"src": "/icons/android/android-launchericon-96-96.png", "sizes": "96x96"}]
    },
    {
      "name": "My Orders",
      "url": "/orders",
      "icons": [{"src": "/icons/android/android-launchericon-96-96.png", "sizes": "96x96"}]
    }
  ]
}
```

### PWA Implementation

**PWA Provider** (`src/components/PWAProvider.jsx:1`):

```jsx
export function PWAProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Handle install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle offline/online
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ isOnline, isInstallable, deferredPrompt }}>
      {children}
    </PWAContext.Provider>
  );
}
```

### Install Instructions

#### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

#### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install App" or "Add to Home Screen"
4. Confirm installation

#### Desktop (Chrome/Edge)
1. Open the app
2. Look for the install icon in the address bar
3. Click "Install"

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
Admin (Full Access)
  │
  ├─► Farmer (Seller Permissions)
  │     │
  │     └─► Product Management
  │     └─► Order Management
  │     └─► Campaign Management
  │     └─► Chat with Customers
  │
  └─► Customer (Buyer Permissions)
        │
        └─► Browse & Purchase
        └─► Order Tracking
        └─► Campaign Support
        └─► Chat with Farmers
```

### Detailed Permissions

#### Customer Role
✅ Browse products and farmers
✅ Add products to cart
✅ Place and track orders
✅ Chat with farmers
✅ Leave reviews and ratings
✅ Contribute to campaigns
✅ Update profile and preferences
❌ Create products
❌ Manage campaigns
❌ Access admin dashboard

#### Farmer Role
✅ All Customer permissions
✅ Create and manage products
✅ Manage inventory and batches
✅ Process orders
✅ Create crowdfunding campaigns
✅ Chat with customers
✅ View sales analytics
✅ Generate QR codes
❌ Verify other farmers
❌ Deploy smart contracts
❌ Access admin functions

#### Admin Role
✅ All Farmer permissions
✅ Verify farmer accounts
✅ Verify campaigns
✅ Deploy smart contracts
✅ Manage all users
✅ Access system analytics
✅ Moderate content
✅ Configure system settings

### Role Assignment

**Setting User Role** (Admin only):

```javascript
import { updateUserRole } from '@/firebase/admin';

// Promote user to farmer
await updateUserRole(userId, 'farmer');

// Promote user to admin
await updateUserRole(userId, 'admin');
```

**Checking Roles in Components:**

```jsx
import { useAuth } from '@/context/BaseMiniAppAuthContext';

function MyComponent() {
  const { user, isFarmer, isAdmin } = useAuth();

  return (
    <>
      {isFarmer && <FarmerDashboard />}
      {isAdmin && <AdminDashboard />}
      <CustomerView />
    </>
  );
}
```

**Protected Routes** (`src/components/ProtectedRoute.jsx:1`):

```jsx
function ProtectedRoute({ children, requiredRole }) {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

---

## 📡 API Reference

### Firebase Services

#### Authentication API

**File:** `src/firebase/auth.jsx`

```javascript
// Register new user
await registerUser(email, password, userData);

// Login
await loginUser(email, password);

// Logout
await logoutUser();

// Reset password
await resetPassword(email);

// Update profile
await updateUserProfile(userId, updates);
```

#### Product API

**File:** `src/firebase/products.jsx`

```javascript
// Create product
await createProduct(productData);

// Get all products
const products = await getProducts(filters);

// Get product by ID
const product = await getProductById(productId);

// Update product
await updateProduct(productId, updates);

// Delete product
await deleteProduct(productId);

// Search products
const results = await searchProducts(query, filters);

// Get nearby products
const nearby = await getNearbyProducts(location, radius);
```

#### Order API

**File:** `src/firebase/orders.jsx`

```javascript
// Create order
await createOrder(orderData);

// Get user orders
const orders = await getUserOrders(userId);

// Get farmer orders
const farmerOrders = await getFarmerOrders(farmerId);

// Update order status
await updateOrderStatus(orderId, status);

// Get order details
const order = await getOrderById(orderId);
```

#### Campaign API

**File:** `src/firebase/crowdfunding.jsx`

```javascript
// Create campaign
await createCampaign(campaignData);

// Get all campaigns
const campaigns = await getCampaigns();

// Get campaign by ID
const campaign = await getCampaignById(campaignId);

// Update campaign
await updateCampaign(campaignId, updates);

// Add contribution
await addContribution(campaignId, contributionData);

// Sync with blockchain
await syncCampaignWithBlockchain(campaignId);
```

#### Chat API

**File:** `src/firebase/chat.jsx`

```javascript
// Create conversation
await createConversation(participants);

// Get user conversations
const conversations = await getUserConversations(userId);

// Send message
await sendMessage(conversationId, messageData);

// Get messages
const messages = await getMessages(conversationId);

// Mark as read
await markAsRead(conversationId, userId);
```

### Web3 API

**File:** `src/hooks/useWeb3.js`

```javascript
// Connect wallet
const { address, connect, disconnect } = useWeb3();

// Get contract
const contract = useContract(contractAddress, abi);

// Create campaign on-chain
const tx = await contract.createCampaign(title, goalAmount, deadline);

// Contribute to campaign
const tx = await contract.contribute(campaignId, { value: amount });

// Claim funds
const tx = await contract.claimFunds(campaignId);
```

### Geolocation API

**File:** `src/firebase/geoQueries.jsx`

```javascript
// Get current location
const location = await getCurrentLocation();

// Get nearby farmers
const farmers = await getNearbyFarmers(location, radiusKm);

// Calculate distance
const distance = calculateDistance(point1, point2);

// Geocode address
const coords = await geocodeAddress(address);
```

---

## 🚀 Deployment

### Firebase Hosting Deployment

#### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created
- Logged in: `firebase login`

#### Step-by-Step Deployment

1. **Build the Application:**
```bash
npm run build
```

2. **Test Production Build Locally:**
```bash
npm run preview
```

3. **Deploy to Firebase:**
```bash
firebase deploy
```

Or deploy hosting only:
```bash
firebase deploy --only hosting
```

4. **Deploy Functions:**
```bash
firebase deploy --only functions
```

5. **Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

6. **Deploy Everything:**
```bash
firebase deploy
```

### Environment Variables for Production

Create `.env.production`:

```env
VITE_FIREBASE_API_KEY=your_production_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_ETHEREUM_RPC_URL=https://mainnet.base.org
VITE_CHAIN_ID=8453
VITE_CONTRACT_ADDRESS=your_production_contract

VITE_GOOGLE_MAPS_API_KEY=your_production_maps_key
VITE_APP_URL=https://farmer4u.web.app
```

### Deployment Checklist

See `DEPLOYMENT_CHECKLIST.md` for comprehensive deployment steps.

**Quick Checklist:**
- [ ] Update environment variables
- [ ] Build application (`npm run build`)
- [ ] Test production build locally
- [ ] Deploy smart contract (if needed)
- [ ] Update contract address in config
- [ ] Deploy Firebase Functions
- [ ] Deploy Firestore rules
- [ ] Deploy Storage rules
- [ ] Deploy hosting
- [ ] Test deployed application
- [ ] Generate Farcaster account association
- [ ] Update manifest with account data
- [ ] Submit to Farcaster (if applicable)
- [ ] Monitor for errors
- [ ] Update documentation

### Custom Domain Setup

1. **Add Custom Domain in Firebase Console:**
   - Go to Hosting section
   - Click "Add custom domain"
   - Enter your domain
   - Follow DNS configuration instructions

2. **Update DNS Records:**
   Add the provided TXT and A records to your DNS provider

3. **Update Environment Variables:**
   ```env
   VITE_APP_URL=https://yourdomain.com
   ```

4. **Update Farcaster Manifest:**
   Update all URLs in `farcaster.json` to use your custom domain

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # Add other env variables

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## 💻 Development Guide

### Code Style Guidelines

#### Component Structure

```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Types/Interfaces (if using TypeScript)

// 3. Component
function MyComponent({ prop1, prop2 }) {
  // 4. Hooks
  const navigate = useNavigate();
  const [state, setState] = useState(null);

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Event Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 8. Export
export default MyComponent;
```

#### Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.js`)
- **Utilities**: camelCase (`formatPrice.js`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **CSS Classes**: kebab-case or Tailwind utilities

#### Best Practices

✅ **DO:**
- Use functional components with hooks
- Keep components small and focused
- Use Zod for form validation
- Add JSDoc comments for complex functions
- Use destructuring for props
- Use semantic HTML
- Implement error boundaries
- Handle loading states
- Add keyboard navigation support

❌ **DON'T:**
- Use class components
- Put business logic in components
- Hardcode values
- Ignore accessibility
- Skip error handling
- Create deeply nested components
- Use inline styles (use Tailwind)
- Ignore performance optimization

### Testing

```bash
# Run tests (when configured)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Debugging

#### Firebase Debugging

```javascript
// Enable Firestore debugging
firebase.firestore.setLogLevel('debug');

// Test connection
import { testFirebaseConnection } from '@/utils/firebaseDebug';
await testFirebaseConnection();
```

#### Web3 Debugging

```javascript
// Check wallet connection
console.log('Connected:', address);
console.log('Network:', chain?.name);

// Log transaction
console.log('Transaction:', tx.hash);
await tx.wait();
console.log('Confirmed!');
```

### Performance Optimization

#### Code Splitting

```jsx
// Lazy load components
const ProductDetail = React.lazy(() => import('./pages/products/ProductDetail'));

// Use in routes
<Route path="/products/:id" element={
  <Suspense fallback={<LoadingSpinner />}>
    <ProductDetail />
  </Suspense>
} />
```

#### Image Optimization

```jsx
// Use responsive images
<img
  src={imageUrl}
  srcSet={`${imageUrl}?w=400 400w, ${imageUrl}?w=800 800w`}
  sizes="(max-width: 600px) 400px, 800px"
  alt="Product"
  loading="lazy"
/>
```

#### Memoization

```jsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## 🔧 Troubleshooting

### Common Issues

#### Firebase Connection Issues

**Problem:** "Firebase not initialized" error

**Solution:**
```javascript
// Check firebase config
console.log('Firebase config:', process.env.VITE_FIREBASE_PROJECT_ID);

// Ensure .env file exists and has correct values
// Restart dev server after changing .env
```

#### Wallet Connection Issues

**Problem:** Wallet won't connect

**Solutions:**
1. Check network configuration:
   ```javascript
   // Ensure correct chain ID
   VITE_CHAIN_ID=8453 // Base mainnet
   ```

2. Switch network in wallet:
   ```javascript
   await switchChain({ chainId: base.id });
   ```

3. Clear browser cache and reconnect

#### Build Errors

**Problem:** Build fails with module errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

#### Deployment Issues

**Problem:** Firebase deploy fails

**Solutions:**
1. Check Firebase CLI version:
   ```bash
   firebase --version
   npm install -g firebase-tools@latest
   ```

2. Re-login to Firebase:
   ```bash
   firebase logout
   firebase login
   ```

3. Check project configuration:
   ```bash
   firebase use --add
   ```

#### Service Worker Issues

**Problem:** Service worker not updating

**Solution:**
```javascript
// Unregister old service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Clear cache
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Firebase: Error (auth/popup-blocked)` | Popup blocker | Use redirect method or ask user to allow popups |
| `Insufficient funds` | Not enough crypto | Add funds to wallet |
| `Network timeout` | Poor connection | Check internet, retry operation |
| `Permission denied` | Firestore rules | Check security rules, verify user role |
| `Contract not deployed` | Wrong network | Switch to correct network (Base) |

### Debug Mode

Enable debug mode in `.env.local`:

```env
VITE_DEBUG=true
```

Then check console for detailed logs.

### Getting Help

1. **Check Documentation:**
   - Firebase: https://firebase.google.com/docs
   - Base: https://docs.base.org
   - Farcaster: https://docs.farcaster.xyz

2. **Search Issues:**
   - GitHub Issues: https://github.com/0xjaqbek/FARMER/issues

3. **Ask for Help:**
   - Create new issue with detailed description
   - Include error messages and steps to reproduce
   - Provide environment details

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or feedback, your help is appreciated.

### How to Contribute

1. **Fork the Repository**
   ```bash
   # Click 'Fork' on GitHub
   git clone https://github.com/YOUR_USERNAME/FARMER.git
   cd FARMER
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-fix
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow the code style guidelines
   - Test your changes thoroughly
   - Update documentation if needed

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

   **Commit Message Format:**
   ```
   type(scope): subject

   body (optional)

   footer (optional)
   ```

   **Types:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting)
   - `refactor`: Code refactoring
   - `test`: Adding tests
   - `chore`: Maintenance tasks

5. **Push to GitHub**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill in description of changes
   - Link related issues
   - Wait for review

### Development Setup

See [Getting Started](#-getting-started) for full setup instructions.

### Code Review Process

1. Automated checks must pass (linting, build)
2. At least one maintainer review required
3. Changes may be requested
4. Once approved, changes will be merged

### Contribution Guidelines

- Write clear, concise code
- Add comments for complex logic
- Update tests if applicable
- Update documentation
- Be respectful in discussions

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🌍 Translations
- ⚡ Performance improvements
- ✅ Test coverage

### Reporting Bugs

**Before reporting:**
- Check existing issues
- Verify bug on latest version
- Gather reproduction steps

**Bug report should include:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, etc.)
- Error messages/logs

**Create issue at:** https://github.com/0xjaqbek/FARMER/issues

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Farmer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE](LICENSE) file for full license text.

---

## 🙏 Acknowledgments

### Technologies

- [React](https://reactjs.org) - UI framework
- [Firebase](https://firebase.google.com) - Backend platform
- [Base](https://base.org) - Blockchain infrastructure
- [Coinbase](https://www.coinbase.com) - OnchainKit and wallet
- [Farcaster](https://www.farcaster.xyz) - Social protocol
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://www.radix-ui.com) - UI components
- [Vite](https://vitejs.dev) - Build tool

### Community

Thank you to all contributors and supporters who help make Farmer better!

### Inspiration

Built with ❤️ for farmers and local communities, inspired by the farm-to-table movement and the potential of blockchain for transparent, direct commerce.

---

## 📞 Support & Contact

### Get Help

- **Documentation**: You're reading it!
- **GitHub Issues**: [Report bugs or request features](https://github.com/0xjaqbek/FARMER/issues)
- **Discussions**: [Community discussions](https://github.com/0xjaqbek/FARMER/discussions)

### Stay Updated

- **Website**: [https://farmer4u.web.app](https://farmer4u.web.app)
- **GitHub**: [https://github.com/0xjaqbek/FARMER](https://github.com/0xjaqbek/FARMER)

### Connect

Found a bug? Have a feature request? Want to contribute?

We'd love to hear from you! Open an issue on GitHub and let's make Farmer better together.

---

<div align="center">

**Built with 🌱 for a sustainable, transparent farm-to-table future**

[⬆ Back to Top](#-farmer---farm-to-table-marketplace--farcaster-mini-app)

</div>
