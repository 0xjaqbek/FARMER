// src/pages/NotificationPage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import NotificationCenter from '../components/notifications/NotificationCenter';

const NotificationPage = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <NotificationCenter />
    </div>
  );
};

export default NotificationPage;