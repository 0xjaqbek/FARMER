// src/components/debug/AuthStateDebug.jsx
// Temporary debug component to identify infinite loop causes

import React, { useEffect, useRef } from 'react';
import { useUser } from '@civic/auth/react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthStateDebug = () => {
  const civicAuth = useUser();
  const customAuth = useAuth();
  const renderCount = useRef(0);
  const lastCivicUser = useRef(null);
  const lastCivicLoading = useRef(null);

  renderCount.current += 1;

  useEffect(() => {
    const civicUserChanged = civicAuth.user !== lastCivicUser.current;
    const civicLoadingChanged = civicAuth.isLoading !== lastCivicLoading.current;
    
    if (civicUserChanged || civicLoadingChanged) {
      console.log('🔍 AUTH STATE CHANGE DETECTED:', {
        renderCount: renderCount.current,
        civicUserChanged,
        civicLoadingChanged,
        civicUser: civicAuth.user?.email || 'none',
        civicLoading: civicAuth.isLoading,
        customUser: customAuth.currentUser?.email || 'none',
        customLoading: customAuth.loading,
        timestamp: new Date().toLocaleTimeString()
      });
      
      lastCivicUser.current = civicAuth.user;
      lastCivicLoading.current = civicAuth.isLoading;
    }
  });

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-800">
          Auth Debug (Render: {renderCount.current})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Civic Auth:</strong>
            <div>User: {civicAuth.user?.email || 'None'}</div>
            <div>Loading: {civicAuth.isLoading ? 'Yes' : 'No'}</div>
            <div>Status: {civicAuth.authStatus || 'Unknown'}</div>
          </div>
          <div>
            <strong>Custom Auth:</strong>
            <div>User: {customAuth.currentUser?.email || 'None'}</div>
            <div>Loading: {customAuth.loading ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
        <div className="bg-yellow-100 p-2 rounded text-yellow-800">
          <strong>Fix:</strong> This component includes a temporary redirect fix.
          Remove this component once the infinite loop is resolved.
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthStateDebug;