// src/App.jsx - Cleaned version without blockchain
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/use-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/layout/MainLayout';

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
import { useEffect } from 'react';



// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  // Add this temporarily to debug
useEffect(() => {
  FirebaseDebug.checkConfiguration();
  FirebaseDebug.testConnection();
}, []);
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Main Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Product Routes */}
              <Route 
                path="/browse" 
                element={
                  <ProtectedRoute allowedRoles={['klient', 'customer', 'admin']}>
                    <ProductList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/:id" 
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/add" 
                element={
                  <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
                    <ProductAdd />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/manage" 
                element={
                  <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
                    <ProductManage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/edit/:id" 
                element={
                  <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
                    <ProductEdit />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/images/:id" 
                element={
                  <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
                    <ProductImages />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/qr/:id" 
                element={
                  <ProtectedRoute allowedRoles={['rolnik', 'farmer', 'admin']}>
                    <ProductQR />
                  </ProtectedRoute>
                } 
              />
              
              {/* Public tracking */}
              <Route 
                path="/track/product/:id" 
                element={<ProductTracker />} 
              />
              
              {/* Order Routes */}
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <OrderList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders/:id" 
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/:id/order" 
                element={
                  <ProtectedRoute allowedRoles={['klient', 'customer']}>
                    <OrderCreate />
                  </ProtectedRoute>
                } 
              />

              {/* Cart Routes */}
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute allowedRoles={['klient', 'customer']}>
                    <Cart />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute allowedRoles={['klient', 'customer']}>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />

              {/* Chat Routes */}
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:id" 
                element={
                  <ProtectedRoute>
                    <ChatDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect root to dashboard if logged in, otherwise to login */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
            </Routes>
          </MainLayout>
          <Toaster />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;