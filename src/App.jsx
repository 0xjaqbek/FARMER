// src/App.jsx - Updated with Terms of Service and Privacy Policy routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import About from './pages/About';


// Legal Pages - NEW IMPORTS
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

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && userProfile?.role && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
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

// Public route component (for login/register pages)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

// App routes component
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
            <Home />
        } />
        
        {/* About Page - Public Route */}
        <Route path="/about" element={<About />} />
        
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Legal Pages - PUBLIC ACCESS (No authentication required) */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Debug Route (Development Only) */}
        <Route path="/debug" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <FirebaseDebug />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Profile Route */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Enhanced Search Routes */}
        <Route path="/search" element={
          <ProtectedRoute>
            <MainLayout>
              <SearchWithMap />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/location-picker" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <EnhancedLocationPicker showMap={true} />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Farmer Directory Routes */}
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

        {/* Product Tracker Route */}
        <Route path="/track" element={
          <ProtectedRoute>
            <MainLayout>
              <ProductTracker />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/track/:trackingCode" element={
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

        {/* Notification Routes */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <MainLayout>
              <NotificationPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/notifications/create" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <NotificationCreator />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* About Campaigns - Public Route */}
        <Route path="/campaigns/about" element={<AboutCampaigns />} />

        {/* Campaign Routes */}
        <Route path="/campaigns" element={
          <ProtectedRoute>
            <MainLayout>
              <CampaignViewer />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/campaigns/create" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <CampaignCreator />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/campaigns/edit/:id" element={
          <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
            <MainLayout>
              <CampaignEdit />
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

        <Route path="/campaigns/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <CampaignDetail />
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