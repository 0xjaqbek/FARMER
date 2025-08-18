// src/components/DebugDashboard.jsx
// Temporary component to debug the dashboard loading issue

import React from 'react';
import { useAuth } from '../context/AuthContext';

const DebugDashboard = () => {
  const auth = useAuth();
  
  console.log('🏠 Dashboard component rendered');
  console.log('🏠 Dashboard auth state:', auth.getDebugInfo());

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-600 mb-6">🎉 Dashboard Loaded Successfully!</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <div className="space-y-1 text-sm">
          <p><strong>User:</strong> {auth.user?.email || 'None'}</p>
          <p><strong>Role:</strong> {auth.userProfile?.role || 'None'}</p>
          <p><strong>Provider:</strong> {auth.authProvider || 'None'}</p>
          <p><strong>Loading:</strong> {auth.loading ? 'Yes' : 'No'}</p>
          <p><strong>Authenticated:</strong> {auth.isAuthenticated() ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Success! 🎊</h2>
        <p>If you can see this page, it means:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>✅ Civic authentication worked</li>
          <li>✅ User profile loaded from Firestore</li>
          <li>✅ React routing is working</li>
          <li>✅ ProtectedRoute is allowing access</li>
          <li>✅ Dashboard component is rendering</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(auth.getDebugInfo(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugDashboard;