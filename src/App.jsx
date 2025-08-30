// src/App.jsx - Complete Civic Auth Integration with PWA Support
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// PWA Components
import { PWAProvider, usePWA } from './components/PWAProvider';
import { useOffline } from './hooks/useOffline';

// Auth Components
import CivicAuthWrapper from './components/auth/CivicAuthProvider';
import CivicAuthProvider from './components/auth/CivicAuthProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Lazy load pages for better PWA performance
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));

// Civic Auth Pages
const CivicLogin = React.lazy(() => import('./pages/CivicLogin'));
const CivicRegister = React.lazy(() => import('./pages/CivicRegister'));

// Legal Pages
const TermsOfService = React.lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));

// Main Pages
const NotificationPage = React.lazy(() => import('./pages/NotificationPage'));
const NotificationCreator = React.lazy(() => import('./components/farmer/NotificationCreator'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));

// Campaign Pages
const CampaignCreator = React.lazy(() => import('./pages/campaigns/CampaignCreator'));
const CampaignViewer = React.lazy(() => import('./pages/campaigns/CampaignViewer'));
const CampaignManager = React.lazy(() => import('./pages/campaigns/CampaignManager'));
const CampaignDetail = React.lazy(() => import('./pages/campaigns/CampaignDetail'));
const CampaignEdit = React.lazy(() => import('./pages/campaigns/CampaignEdit'));
const AboutCampaigns = React.lazy(() => import('./pages/campaigns/AboutCampaigns'));

// Search and Location Pages
const SearchWithMap = React.lazy(() => import('./components/search/SearchWithMap'));
const EnhancedLocationPicker = React.lazy(() => import('./components/location/EnhancedLocationPicker'));

// Farmer Pages
const FarmersDirectory = React.lazy(() => import('./pages/farmers/FarmersDirectory'));
const FarmerProfile = React.lazy(() => import('./pages/farmers/FarmerProfile'));

// Product Pages
const ProductList = React.lazy(() => import('./pages/products/ProductList'));
const ProductDetail = React.lazy(() => import('./pages/products/ProductDetail'));
const ProductAdd = React.lazy(() => import('./pages/products/ProductAdd'));
const ProductManage = React.lazy(() => import('./pages/products/ProductManage'));
const ProductEdit = React.lazy(() => import('./pages/products/ProductEdit'));
const ProductImages = React.lazy(() => import('./pages/products/ProductImages'));
const ProductQR = React.lazy(() => import('./pages/products/ProductQR'));
const ProductTracker = React.lazy(() => import('./pages/products/ProductTracker'));

// Order Pages
const OrderList = React.lazy(() => import('./pages/orders/OrderList'));
const OrderDetail = React.lazy(() => import('./pages/orders/OrderDetail'));
const OrderCreate = React.lazy(() => import('./pages/orders/OrderCreate'));

// Cart and Checkout
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));

// Chat Pages
const ChatList = React.lazy(() => import('./pages/chat/ChatList'));
const ChatDetail = React.lazy(() => import('./pages/chat/ChatDetail'));

// Debug Page
const FirebaseDebug = React.lazy(() => import('./utils/firebaseDebug'));

// PWA-specific pages
const OfflinePage = React.lazy(() => import('./pages/OfflinePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Loading Component for PWA
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p className="text-gray-600 font-medium">Loading Farm Direct...</p>
    </div>
  </div>
);

// Enhanced Loading Fallback for Suspense
const LoadingFallback = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  </div>
);

// PWA Offline Status Banner
const OfflineStatusBanner = () => {
  const { isOnline, hasOfflineData, syncing, forcSync } = useOffline();
  
  if (isOnline && !hasOfflineData) return null;
  
  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium
      ${isOnline 
        ? 'bg-blue-50 text-blue-800 border-b border-blue-200' 
        : 'bg-yellow-50 text-yellow-800 border-b border-yellow-200'
      }
    `}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              {syncing ? 'Syncing offline data...' : `${hasOfflineData ? 'Offline data ready to sync' : 'All data synced'}`}
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              You're offline - changes will sync when connected
            </>
          )}
        </div>
        
        {isOnline && hasOfflineData && (
          <button
            onClick={forcSync}
            className="text-blue-600 hover:text-blue-800 font-medium"
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};

// UPDATED: Protected Route Component with PWA awareness
const CivicProtectedRoute = ({ 
  children, 
  allowedRoles = null,
  requireAdmin = false,
  requireFarmer = false,
  requireCustomer = false 
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin check
  if (requireAdmin && !userProfile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Farmer check
  if (requireFarmer && userProfile?.role !== 'rolnik') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to farmers.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Customer check
  if (requireCustomer && userProfile?.role !== 'klient') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to customers.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Legacy allowedRoles check (backward compatibility)
  if (allowedRoles && userProfile?.role && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">Required roles: {allowedRoles.join(', ')}</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// UPDATED: Public Route Component (for auth pages)
const PublicRoute = ({ children }) => {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return children;
};

// App Routes Component with PWA awareness
const AppRoutes = () => {
  const { loading } = useAuth();
  const { isInstalled } = usePWA();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Add top padding when app is installed as PWA to account for status bar
  const routesClasses = isInstalled ? 'pt-safe-area-inset-top' : '';

  return (
    <div className={routesClasses}>
      <OfflineStatusBanner />
      
      <Router>
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/home" element={<PublicRoute><Home /></PublicRoute>} />
          
          {/* About Page - Public Route */}
          <Route path="/about" element={<About />} />
          
          {/* UPDATED: Civic Auth Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <CivicLogin />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <CivicRegister />
            </PublicRoute>
          } />

          {/* Legal Pages - PUBLIC ACCESS (No authentication required) */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Debug Route (Development Only) */}
          <Route path="/debug" element={
            <CivicProtectedRoute requireAdmin>
              <MainLayout>
                <FirebaseDebug />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            <CivicProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Profile Route */}
          <Route path="/profile" element={
            <CivicProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Enhanced Search Routes */}
          <Route path="/search" element={
            <CivicProtectedRoute>
              <MainLayout>
                <SearchWithMap />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/location-picker" element={
            <CivicProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <EnhancedLocationPicker showMap={true} />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Farmer Directory Routes */}
          <Route path="/farmers" element={
            <CivicProtectedRoute>
              <MainLayout>
                <FarmersDirectory />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/farmers/:farmerId" element={
            <CivicProtectedRoute>
              <MainLayout>
                <FarmerProfile />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Product Routes */}
          <Route path="/browse" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ProductList />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/:id" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ProductDetail />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/add" element={
            <CivicProtectedRoute requireFarmer>
              <MainLayout>
                <ProductAdd />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/manage" element={
            <CivicProtectedRoute requireFarmer>
              <MainLayout>
                <ProductManage />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/:id/edit" element={
            <CivicProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductEdit />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/:id/images" element={
            <CivicProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductImages />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/products/:id/qr" element={
            <CivicProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductQR />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Product Tracker Route */}
          <Route path="/track" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ProductTracker />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/track/:trackingCode" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ProductTracker />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Order Routes */}
          <Route path="/orders" element={
            <CivicProtectedRoute>
              <MainLayout>
                <OrderList />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/orders/:id" element={
            <CivicProtectedRoute>
              <MainLayout>
                <OrderDetail />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/orders/create/:productId" element={
            <CivicProtectedRoute requireCustomer>
              <MainLayout>
                <OrderCreate />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          {/* Cart and Checkout Routes */}
          <Route path="/cart" element={
            <CivicProtectedRoute requireCustomer>
              <MainLayout>
                <Cart />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/checkout" element={
            <CivicProtectedRoute requireCustomer>
              <MainLayout>
                <Checkout />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          {/* Chat Routes */}
          <Route path="/chat" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ChatList />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          <Route path="/chat/:id" element={
            <CivicProtectedRoute>
              <MainLayout>
                <ChatDetail />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* Notification Routes */}
          <Route path="/notifications" element={
            <CivicProtectedRoute>
              <MainLayout>
                <NotificationPage />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/notifications/create" element={
            <CivicProtectedRoute allowedRoles={['farmer', 'admin']}>
              <MainLayout>
                <NotificationCreator />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* About Campaigns - Public Route */}
          <Route path="/campaigns/about" element={<AboutCampaigns />} />

          {/* Campaign Routes */}
          <Route path="/campaigns" element={
            <CivicProtectedRoute>
              <MainLayout>
                <CampaignViewer />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/campaigns/create" element={
            <CivicProtectedRoute requireFarmer>
              <MainLayout>
                <CampaignCreator />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/campaigns/edit/:id" element={
            <CivicProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <CampaignEdit />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/campaigns/manage" element={
            <CivicProtectedRoute requireFarmer>
              <MainLayout>
                <CampaignManager />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          <Route path="/campaigns/:id" element={
            <CivicProtectedRoute>
              <MainLayout>
                <CampaignDetail />
              </MainLayout>
            </CivicProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <CivicProtectedRoute requireAdmin>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </CivicProtectedRoute>
          } />

          {/* PWA-specific routes */}
          <Route path="/offline" element={<OfflinePage />} />

          {/* Fallback Routes */}
          <Route path="*" element={
            <CivicProtectedRoute>
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            </CivicProtectedRoute>
          } />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster />
      </Router>
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const { isInstalled } = usePWA();
  
  // Add PWA-specific body classes and safe area handling
  const appClasses = isInstalled 
    ? 'pwa-installed min-h-screen-safe bg-gray-50' 
    : 'min-h-screen bg-gray-50';

  return (
    <div className={appClasses}>
      <CivicAuthProvider>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<LoadingFallback message="Loading Farm Direct..." />}>
              <AppRoutes />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </CivicAuthProvider>
    </div>
  );
};

// UPDATED: Root App component with PWA Integration
const App = () => {
  useEffect(() => {
    // Performance monitoring for PWA
    if ('performance' in window && 'mark' in performance) {
      performance.mark('app-mount');
    }
    
    // PWA-specific viewport handling for iOS
    const setupiOSViewport = () => {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport && window.navigator.standalone) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
          );
        }
      }
    };
    
    setupiOSViewport();
    
    // Add PWA-specific CSS classes to body
    document.body.classList.add('pwa-app');
    
    // Handle app visibility changes (for PWA background/foreground events)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Farm Direct: App became visible (foreground)');
        // Refresh data when app comes to foreground
        window.dispatchEvent(new CustomEvent('app-foreground'));
      } else {
        console.log('Farm Direct: App became hidden (background)');
        // Save state when app goes to background
        window.dispatchEvent(new CustomEvent('app-background'));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // PWA-specific keyboard handling
    const handleKeyboard = (e) => {
      // Prevent zoom on input focus in PWA mode
      if (window.navigator.standalone && e.target.tagName === 'INPUT') {
        e.target.style.fontSize = '16px';
      }
    };
    
    document.addEventListener('focusin', handleKeyboard);
    
    // Handle app install events
    const handleAppInstalled = () => {
      console.log('Farm Direct PWA installed successfully');
      // Track installation in analytics if available
    if (window.gtag) { // Check if gtag is defined on the window object
      window.gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'Farm Direct PWA Installation'
      });
      }
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focusin', handleKeyboard);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.body.classList.remove('pwa-app');
    };
  }, []);

  return (
    <PWAProvider>
      <AppContent />
    </PWAProvider>
  );
};

export default App;