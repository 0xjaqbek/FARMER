// src/main.jsx - Fixed to prevent double wallet prompts
import './polyfills.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, setupPWAInstall, clearServiceWorkerCache } from './utils/pwa';

// Development: Clear service worker cache on start
if (import.meta.env.DEV) {
  console.log('🔧 Development mode: Clearing SW cache for fresh start');
  clearServiceWorkerCache();
}

// Initialize PWA conditionally
const initializePWA = async () => {
  try {
    // Register service worker (conditional)
    await registerServiceWorker();
    
    // Setup PWA installation (conditional)
    setupPWAInstall();
    
    // Performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        performance.mark('app-loaded');
        performance.measure('app-load-time', 'app-start', 'app-loaded');
        
        if (import.meta.env.DEV) {
          const measure = performance.getEntriesByName('app-load-time')[0];
          console.log(`⚡ App loaded in ${Math.round(measure.duration)}ms`);
        }
      });
    }

    // Development debugging
    if (import.meta.env.DEV) {
      console.log('🚀 Development mode initialized');
      console.log('- Service Worker:', import.meta.env.VITE_ENABLE_SW_DEV === 'true' ? 'Enabled' : 'Disabled');
      console.log('- PWA Features:', import.meta.env.VITE_ENABLE_PWA_DEV === 'true' ? 'Enabled' : 'Disabled');
      console.log('- HMR Port: 3001');
      console.log('- Wallet Manager: Centralized (prevents double prompts)');
      
      // Add global helper for debugging
      window.__farmDirectDebug = {
        clearCache: clearServiceWorkerCache,
        reloadApp: () => window.location.reload(),
        walletManager: () => import('./utils/walletConnectionManager').then(m => m.walletManager)
      };
    }
    
  } catch (error) {
    console.error('PWA initialization failed:', error);
  }
};

// Start PWA initialization after a brief delay to ensure DOM is ready
setTimeout(() => {
  initializePWA();
}, import.meta.env.DEV ? 500 : 100);

// FIXED: Conditionally use StrictMode to prevent double wallet prompts
const AppWrapper = import.meta.env.DEV && import.meta.env.VITE_DISABLE_STRICT_MODE !== 'true' ? 
  ({ children }) => <React.StrictMode>{children}</React.StrictMode> :
  ({ children }) => children;

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <AppWrapper>
    <App />
  </AppWrapper>
);

// Add wallet connection debugging in development
if (import.meta.env.DEV) {
  // Listen for wallet events for debugging
  window.addEventListener('wallet-disconnected', (e) => {
    console.log('🔓 Wallet disconnected:', e.detail);
  });
  
  window.addEventListener('wallet-accounts-changed', (e) => {
    console.log('👤 Wallet accounts changed:', e.detail);
  });
  
  window.addEventListener('wallet-chain-changed', (e) => {
    console.log('⛓️ Wallet chain changed:', e.detail);
  });
}