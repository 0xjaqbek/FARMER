// src/utils/pwa.js - Development-safe version

let deferredPrompt = null;
let serviceWorkerRegistration = null;

// Check if we should register service worker (skip in development)
const shouldRegisterSW = () => {
  return (
    'serviceWorker' in navigator &&
    (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW_DEV === 'true')
  );
};

// Register service worker (conditional)
export const registerServiceWorker = async () => {
  if (!shouldRegisterSW()) {
    console.log('Service Worker registration skipped in development');
    return null;
  }

  try {
    // Clear any existing service workers in development
    if (import.meta.env.DEV) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('Unregistered existing service worker');
      }
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: import.meta.env.DEV ? 'none' : 'imports' // No cache in dev
    });
    
    serviceWorkerRegistration = registration;
    console.log('Service Worker registered successfully:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('New Service Worker found, installing...');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New Service Worker installed, update available');
          notifyUserOfUpdate();
        }
      });
    });
    
    // Force update in development
    if (import.meta.env.DEV) {
      registration.update();
    }
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Export service worker registration
export const getServiceWorkerRegistration = () => {
  return serviceWorkerRegistration;
};

// Handle PWA install prompt
export const setupPWAInstall = () => {
  // Skip PWA features in development
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_PWA_DEV !== 'true') {
    console.log('PWA install features disabled in development');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    hideInstallButton();
    trackPWAInstallation();
  });
};

// Clear service worker cache (development helper)
export const clearServiceWorkerCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    console.log('Service Worker cache cleared');
    return true;
  }
  return false;
};

// Development helper to force refresh
export const forceRefresh = () => {
  if (import.meta.env.DEV) {
    clearServiceWorkerCache().then(() => {
      window.location.reload();
    });
  }
};

// Trigger PWA installation
export const installPWA = async () => {
  if (!deferredPrompt) {
    console.log('PWA install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('PWA install outcome:', outcome);
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA installation failed:', error);
    return false;
  }
};

// Check if app is running as PWA
export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );
};

// Check if PWA is installable
export const isPWAInstallable = () => {
  return !!deferredPrompt;
};

// Setup network monitoring
export const setupNetworkMonitoring = (onOnline, onOffline) => {
  if (import.meta.env.DEV) {
    console.log('Network monitoring simplified for development');
  }

  const handleOnline = () => {
    console.log('Network: Online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('Network: Offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Simplified capabilities for development
export const getPWACapabilities = () => {
  return {
    serviceWorker: shouldRegisterSW(),
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    installPrompt: import.meta.env.PROD ? ('beforeinstallprompt' in window || isPWA()) : false,
    webShare: 'share' in navigator,
    geolocation: 'geolocation' in navigator,
    devMode: import.meta.env.DEV
  };
};

// Setup push notifications (production only)
export const setupPushNotifications = async () => {
  if (import.meta.env.DEV) {
    console.log('Push notifications disabled in development');
    return null;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  const registration = getServiceWorkerRegistration();
  if (!registration) {
    console.log('Service Worker not registered yet');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      });
      
      console.log('Push subscription created:', subscription);
      return subscription;
    } else {
      console.log('Push notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Push notification setup failed:', error);
    return null;
  }
};

// Offline data management
export const saveOfflineData = async (storeName, data) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmDirectOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const addRequest = store.put({ ...data, timestamp: Date.now() });
      
      addRequest.onsuccess = () => {
        console.log('Offline data saved:', storeName, data.id);
        resolve();
      };
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
};

export const getOfflineData = async (storeName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmDirectOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
};

// Background sync registration
export const registerBackgroundSync = async (tag) => {
  if (import.meta.env.DEV) {
    console.log('Background sync disabled in development:', tag);
    return false;
  }

  const registration = getServiceWorkerRegistration();
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype && registration) {
    try {
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

// Helper functions for UI feedback
const showInstallButton = () => {
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
};

const hideInstallButton = () => {
  window.dispatchEvent(new CustomEvent('pwa-install-hidden'));
};

const notifyUserOfUpdate = () => {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
};

const trackPWAInstallation = () => {
  window.dispatchEvent(new CustomEvent('pwa-installed'));
};