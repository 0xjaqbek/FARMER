// src/App.jsx - Complete Civic Auth Integration
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// NEW: Civic Auth Components
import CivicAuthWrapper from './components/auth/CivicAuthProvider';
import CivicAuthProvider from './components/auth/CivicAuthProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import About from './pages/About';

// NEW: Civic Auth Pages (Replace old Login/Register)
import CivicLogin from './pages/CivicLogin';
import CivicRegister from './pages/CivicRegister';

// Legal Pages
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';

// Existing imports
import NotificationPage from './pages/NotificationPage';
import NotificationCreator from './components/farmer/NotificationCreator';
import AdminDashboard from './pages/admin/AdminDashboard';
import CampaignCreator from './pages/campaigns/CampaignCreator';
import CampaignViewer from './pages/campaigns/CampaignViewer';
import CampaignManager from './pages/campaigns/CampaignManager';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import CampaignEdit from './pages/campaigns/CampaignEdit';
import AboutCampaigns from './pages/campaigns/AboutCampaigns';
import SearchWithMap from './components/search/SearchWithMap';
import EnhancedLocationPicker from './components/location/EnhancedLocationPicker';
import FarmersDirectory from './pages/farmers/FarmersDirectory';
import FarmerProfile from './pages/farmers/FarmerProfile';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ProductAdd from './pages/products/ProductAdd';
import ProductManage from './pages/products/ProductManage';
import ProductEdit from './pages/products/ProductEdit';
import ProductImages from './pages/products/ProductImages';
import ProductQR from './pages/products/ProductQR';
import ProductTracker from './pages/products/ProductTracker';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderCreate from './pages/orders/OrderCreate';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ChatList from './pages/chat/ChatList';
import ChatDetail from './pages/chat/ChatDetail';
import { FirebaseDebug } from './utils/firebaseDebug';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// UPDATED: Civic Protected Route Component
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
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Home Route */}
        <Route path="/" element={<Home />} />
        
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
          <CivicProtectedRoute requireFarmer>
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

        {/* Fallback Routes */}
        <Route path="*" element={
          <CivicProtectedRoute>
            <MainLayout>
              <div className="text-center py-12 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                <div className="space-x-4">
                  <button 
                    onClick={() => window.history.back()} 
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={() => window.location.href = '/dashboard'} 
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </MainLayout>
          </CivicProtectedRoute>
        } />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster />
    </Router>
  );
};

// UPDATED: Root App component with Civic Auth Wrapper
const App = () => {
  return (
    <CivicAuthProvider>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </CivicAuthProvider>
  );
};

export default App;