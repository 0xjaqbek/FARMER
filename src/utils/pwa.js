// PWA Installation and Management Utilities

let deferredPrompt = null;
let serviceWorkerRegistration = null;

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
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
            // Notify user about update
            notifyUserOfUpdate();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Workers not supported');
    return null;
  }
};

// Export service worker registration
export const getServiceWorkerRegistration = () => {
  return serviceWorkerRegistration;
};

// Handle PWA install prompt
export const setupPWAInstall = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    hideInstallButton();
    
    // Track installation
    trackPWAInstallation();
  });
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
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
};

// Check if PWA is installable
export const isPWAInstallable = () => {
  return deferredPrompt !== null;
};

// Network status detection
export const getNetworkStatus = () => {
  return {
    online: navigator.onLine,
    connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
    effectiveType: (navigator.connection && navigator.connection.effectiveType) || 'unknown'
  };
};

// Setup network monitoring
export const setupNetworkMonitoring = (onOnline, onOffline) => {
  window.addEventListener('online', () => {
    console.log('Network: Back online');
    onOnline && onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('Network: Gone offline');
    onOffline && onOffline();
  });
};

// Background sync registration
export const registerBackgroundSync = async (tag) => {
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

// Push notifications setup
export const setupPushNotifications = async () => {
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
      
      // Send subscription to your backend
      await sendSubscriptionToBackend(subscription);
      
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

// Get offline data
export const getOfflineData = async (storeName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmDirectOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
};

// PWA update management
export const checkForAppUpdate = async () => {
  const registration = getServiceWorkerRegistration();
  if (registration) {
    await registration.update();
  }
};

// Helper functions for UI components
const showInstallButton = () => {
  const event = new CustomEvent('pwa-install-available');
  window.dispatchEvent(event);
};

const hideInstallButton = () => {
  const event = new CustomEvent('pwa-installed');
  window.dispatchEvent(event);
};

const notifyUserOfUpdate = () => {
  const event = new CustomEvent('pwa-update-available');
  window.dispatchEvent(event);
};

const trackPWAInstallation = () => {
  // Track PWA installation in your analytics
  console.log('PWA installation tracked');
  
  // You could send this to Firebase Analytics or your preferred analytics service
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installation'
    });
  }
};

const sendSubscriptionToBackend = async (subscription) => {
  try {
    // Send push subscription to your Firebase Function or API
    const response = await fetch('/api/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send subscription to backend');
    }
    
    console.log('Push subscription sent to backend');
  } catch (error) {
    console.error('Failed to send push subscription:', error);
  }
};

// PWA capabilities detection
export const getPWACapabilities = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
    installPrompt: 'beforeinstallprompt' in window || isPWA(),
    fileSystemAccess: 'showOpenFilePicker' in window,
    webShare: 'share' in navigator,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  };
};

// Web Share API integration
export const shareContent = async (shareData) => {
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Web Share failed:', error);
      return false;
    }
  }
  
  // Fallback to clipboard
  if (navigator.clipboard && shareData.url) {
    try {
      await navigator.clipboard.writeText(shareData.url);
      console.log('URL copied to clipboard');
      return true;
    } catch (error) {
      console.error('Clipboard write failed:', error);
      return false;
    }
  }
  
  return false;
};