// src/civic/config.js
export const civicConfig = {
  clientId: import.meta.env.VITE_CIVIC_CLIENT_ID, // Add this to your .env file
  displayMode: 'modal', // 'modal', 'redirect', or 'iframe'
  redirectUrl: `${window.location.origin}/auth/civic/callback`,
  postLogoutRedirectUrl: `${window.location.origin}/`
};