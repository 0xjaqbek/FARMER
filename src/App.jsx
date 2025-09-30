// src/App.jsx - Base Mini App with SIWF Authentication
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// PWA Components
import { PWAProvider, usePWA } from './components/PWAProvider';
import PWAErrorBoundary from './components/PWAErrorBoundary';
import { useOffline } from './hooks/useOffline';

// Base Mini App Auth Components
import OnchainProviders from './components/providers/OnchainProviders';
import { AuthProvider, useAuth } from './context/BaseMiniAppAuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Lazy load pages for better PWA performance
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));

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
// Base Mini App Protected Route Component
const BaseMiniAppProtectedRoute = ({
  children,
  allowedRoles = null,
  requireAdmin = false,
  requireFarmer = false,
  requireCustomer = false
}) => {
  const { currentUser, userProfile, loading, signIn, isAdmin, isFarmer } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    // Show sign in prompt instead of redirecting
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
          <p className="text-gray-600">Sign in with Farcaster to access this page</p>
          <button
            onClick={signIn}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
          >
            Sign In with Farcaster
          </button>
        </div>
      </div>
    );
  }

  // Admin check
  if (requireAdmin && !isAdmin) {
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
  if (requireFarmer && !isFarmer && !isAdmin) {
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

  // Customer check (for now, any authenticated user is a customer)
  if (requireCustomer && !currentUser) {
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
  if (allowedRoles && userProfile?.role && !allowedRoles.includes(userProfile.role) && !isAdmin) {
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
          
          {/* Base Mini App - No separate login/register pages needed */}
          {/* Authentication is handled in-app via Sign In with Farcaster */}

          {/* Legal Pages - PUBLIC ACCESS (No authentication required) */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Debug Route (Development Only) */}
          <Route path="/debug" element={
            <BaseMiniAppProtectedRoute requireAdmin>
              <MainLayout>
                <FirebaseDebug />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Profile Route */}
          <Route path="/profile" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Enhanced Search Routes */}
          <Route path="/search" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <SearchWithMap />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/location-picker" element={
            <BaseMiniAppProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <EnhancedLocationPicker showMap={true} />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Farmer Directory Routes */}
          <Route path="/farmers" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <FarmersDirectory />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/farmers/:farmerId" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <FarmerProfile />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Product Routes */}
          <Route path="/browse" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ProductList />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/:id" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ProductDetail />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/add" element={
            <BaseMiniAppProtectedRoute requireFarmer>
              <MainLayout>
                <ProductAdd />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/manage" element={
            <BaseMiniAppProtectedRoute requireFarmer>
              <MainLayout>
                <ProductManage />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/:id/edit" element={
            <BaseMiniAppProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductEdit />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/:id/images" element={
            <BaseMiniAppProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductImages />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/products/:id/qr" element={
            <BaseMiniAppProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <ProductQR />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Product Tracker Route */}
          <Route path="/track" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ProductTracker />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/track/:trackingCode" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ProductTracker />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Order Routes */}
          <Route path="/orders" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <OrderList />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/orders/:id" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <OrderDetail />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/orders/create/:productId" element={
            <BaseMiniAppProtectedRoute requireCustomer>
              <MainLayout>
                <OrderCreate />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          {/* Cart and Checkout Routes */}
          <Route path="/cart" element={
            <BaseMiniAppProtectedRoute requireCustomer>
              <MainLayout>
                <Cart />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/checkout" element={
            <BaseMiniAppProtectedRoute requireCustomer>
              <MainLayout>
                <Checkout />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          {/* Chat Routes */}
          <Route path="/chat" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ChatList />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          <Route path="/chat/:id" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <ChatDetail />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* Notification Routes */}
          <Route path="/notifications" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <NotificationPage />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/notifications/create" element={
            <BaseMiniAppProtectedRoute allowedRoles={['farmer', 'admin']}>
              <MainLayout>
                <NotificationCreator />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* About Campaigns - Public Route */}
          <Route path="/campaigns/about" element={<AboutCampaigns />} />

          {/* Campaign Routes */}
          <Route path="/campaigns" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <CampaignViewer />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/campaigns/create" element={
            <BaseMiniAppProtectedRoute requireFarmer>
              <MainLayout>
                <CampaignCreator />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/campaigns/edit/:id" element={
            <BaseMiniAppProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
              <MainLayout>
                <CampaignEdit />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/campaigns/manage" element={
            <BaseMiniAppProtectedRoute requireFarmer>
              <MainLayout>
                <CampaignManager />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          <Route path="/campaigns/:id" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <CampaignDetail />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <BaseMiniAppProtectedRoute requireAdmin>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
          } />

          {/* PWA-specific routes */}
          <Route path="/offline" element={<OfflinePage />} />

          {/* Fallback Routes */}
          <Route path="*" element={
            <BaseMiniAppProtectedRoute>
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            </BaseMiniAppProtectedRoute>
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
      <OnchainProviders>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<LoadingFallback message="Loading Farm Direct..." />}>
              <AppRoutes />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </OnchainProviders>
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
    <PWAErrorBoundary>
      <PWAProvider>
        <AppContent />
      </PWAProvider>
    </PWAErrorBoundary>
  );
};

export default App;