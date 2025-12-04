// src/components/auth/BaseMiniAppProtectedRoute.jsx
// Protected route component for Base Mini App authentication

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/BaseMiniAppAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component
 * Redirects to authentication if user is not logged in
 */
export function ProtectedRoute({ children, requireFarmer = false, requireAdmin = false }) {
  const { currentUser, loading, signIn, isFarmer, isAdmin } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Sign in with Farcaster to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={signIn}
              className="w-full"
              size="lg"
            >
              Sign In with Farcaster
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (requireFarmer && !isFarmer && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Farmer Access Required</CardTitle>
            <CardDescription>
              This page is only accessible to farmers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              This page is only accessible to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

/**
 * Simple wrapper that redirects to home if not authenticated
 */
export function RequireAuth({ children, redirectTo = '/' }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;