// src/hooks/useCivicAuth.js
import { useUser } from "@civic/auth/react";

export const useCivicAuth = () => {
  const userContext = useUser();
  
  return {
    user: userContext.user,
    isAuthenticated: !!userContext.user,
    isLoading: userContext.isLoading,
    authStatus: userContext.authStatus,
    signIn: userContext.signIn,
    signOut: userContext.signOut,
    error: userContext.error
  };
};