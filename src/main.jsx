// src/main.jsx - Entry point
import './polyfills.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, setupPWAInstall } from './utils/pwa';

registerServiceWorker();
setupPWAInstall();

// Initialize PWA
const initializePWA = async () => {
  // Register service worker
  await registerServiceWorker();
  
  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      performance.mark('app-loaded');
      performance.measure('app-load-time', 'app-start', 'app-loaded');
    });
  }
};

// Start PWA initialization
initializePWA();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);