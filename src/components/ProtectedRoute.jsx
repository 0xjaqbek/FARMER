// src/components/ProtectedRoute.jsx - FIXED VERSION
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading, isAuthenticated, authStateSettled } = useAuth();
  
  console.log('🛡️ ProtectedRoute check:', {
    hasUser: !!user,
    hasProfile: !!userProfile,
    loading,
    authStateSettled,
    isAuthenticated: isAuthenticated(),
    userRole: userProfile?.role
  });
  
  // CRITICAL: Wait for auth state to settle before making decisions
  if (loading || !authStateSettled) {
    console.log('⏳ ProtectedRoute: Waiting for auth state to settle...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect if we're certain user is not authenticated
  if (!isAuthenticated()) {
    console.log('🚫 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && userProfile) {
    const userRole = userProfile.role;
    const hasAccess = allowedRoles.includes(userRole);
    
    console.log('🔐 Role check:', {
      userRole,
      allowedRoles,
      hasAccess
    });
    
    if (!hasAccess) {
      console.log('🚫 User role not allowed, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  console.log('✅ ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;