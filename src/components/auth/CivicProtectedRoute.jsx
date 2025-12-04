// src/components/auth/CivicProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CivicProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireFarmer = false,
  requireCustomer = false 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requireAdmin && !(userProfile?.isAdmin || userProfile?.role === 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireFarmer && userProfile?.role !== 'rolnik') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireCustomer && userProfile?.role !== 'klient') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default CivicProtectedRoute;