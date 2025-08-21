// src/App.jsx - Updated with Farmer Profile Routes
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/use-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/layout/MainLayout';
import NotificationPage from './pages/NotificationPage';
import NotificationCreator from './components/farmer/NotificationCreator';
import AdminDashboard from './pages/admin/AdminDashboard';
import CampaignCreator from './pages/campaigns/CampaignCreator';
import CampaignViewer from './pages/campaigns/CampaignViewer';
import CampaignManager from './pages/campaigns/CampaignManager';
import CampaignDetail from './pages/campaigns/CampaignDetail';


// FIXED: Correct import paths for search components
import SearchWithMap from './components/search/SearchWithMap';
import EnhancedLocationPicker from './components/location/EnhancedLocationPicker';

// NEW: Farmer profile components
import FarmersDirectory from './pages/farmers/FarmersDirectory';
import FarmerProfile from './pages/farmers/FarmerProfile';

// Existing imports
import Login from './pages/Login';
import Register from './pages/Register';
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

// Protected route component - MUST be inside AuthProvider
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Routes component - MUST be inside AuthProvider
const AppRoutes = () => {
  useEffect(() => {
    FirebaseDebug.checkConfiguration();
    FirebaseDebug.testConnection();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Auth Routes - No layout needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* NEW: Farmer Directory and Profile Routes */}
        <Route path="/farmers" element={
          <ProtectedRoute>
            <MainLayout>
              <FarmersDirectory />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/farmers/:farmerId" element={
          <ProtectedRoute>
            <MainLayout>
              <FarmerProfile />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Notification Routes */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <MainLayout>
              <NotificationPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/notifications/create" element={
          <ProtectedRoute allowedRoles={['farmer', 'rolnik', 'admin']}>
            <MainLayout>
              <NotificationCreator />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Campaign Routes */}
        <Route path="/campaigns" element={
         <ProtectedRoute>
            <MainLayout>
              <CampaignViewer />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/campaigns/create" element={
         <ProtectedRoute>
            <MainLayout>
             <CampaignCreator />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/campaigns/:id" element={
         <ProtectedRoute>
            <MainLayout>
             <CampaignDetail />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/campaigns/manage" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <CampaignManager />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* SEARCH ROUTES - FIXED: Single route, correct component name */}
        <Route path="/search" element={
          <ProtectedRoute>
            <MainLayout>
              <SearchWithMap />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Farmer Location Setup Route */}
        <Route path="/farmer/location" element={
          <ProtectedRoute allowedRoles={['farmer', 'rolnik']}>
            <MainLayout>
              <EnhancedLocationPicker onLocationSet={(location) => {
                // Handle location update
                console.log('Location set:', location);
              }} />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Product Routes */}
        <Route path="/browse" element={
          <ProtectedRoute>
            <MainLayout>
              <ProductList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ProductDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/add" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <ProductAdd />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/manage" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <ProductManage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/:id/edit" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <ProductEdit />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/:id/images" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <ProductImages />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/:id/qr" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <ProductQR />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/products/:id/tracker" element={
          <ProtectedRoute>
            <MainLayout>
              <ProductTracker />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Order Routes */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <MainLayout>
              <OrderList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <OrderDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/orders/create/:productId" element={
          <ProtectedRoute allowedRoles={['klient', 'customer', 'admin']}>
            <MainLayout>
              <OrderCreate />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Cart and Checkout Routes */}
        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['klient', 'customer', 'admin']}>
            <MainLayout>
              <Cart />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['klient', 'customer', 'admin']}>
            <MainLayout>
              <Checkout />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Chat Routes */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <MainLayout>
              <ChatList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ChatDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={
          <ProtectedRoute>
            <MainLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <button 
                  onClick={() => window.history.back()} 
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Go Back
                </button>
              </div>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster />
    </Router>
  );
};

// Root App component
const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;