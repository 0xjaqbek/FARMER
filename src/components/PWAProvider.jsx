// src/components/PWAProvider.jsx - Development-safe version
import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X,
  Smartphone,
  CheckCircle
} from 'lucide-react';
import {
  registerServiceWorker,
  setupPWAInstall,
  installPWA,
  isPWA,
  isPWAInstallable,
  setupNetworkMonitoring,
  setupPushNotifications,
  getPWACapabilities,
  getServiceWorkerRegistration,
  clearServiceWorkerCache
} from '../utils/pwa';

const PWAContext = createContext();

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }) => {
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  
  // Development mode detection
  const isDev = import.meta.env.DEV;
  
  // Initial states with development considerations
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    try {
      return !isDev && isPWA();
    } catch {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState(() => {
    try {
      return navigator?.onLine ?? true;
    } catch {
      return true;
    }
  });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [capabilities, setCapabilities] = useState({});
  const [isDevMode, setIsDevMode] = useState(isDev);

  // Safe state setter that checks if component is still mounted
  const safeSetState = (setter, value) => {
    try {
      if (mountedRef.current) {
        setter(value);
      }
    } catch (error) {
      if (isDev) console.warn('PWAProvider: State update failed:', error);
    }
  };

  // Development helpers
  const devHelpers = useMemo(() => {
    if (!isDev) return {};
    
    return {
      clearCache: async () => {
        console.log('🧹 Clearing service worker cache...');
        await clearServiceWorkerCache();
        window.location.reload();
      },
      forceReload: () => {
        console.log('🔄 Force reloading app...');
        window.location.reload();
      },
      togglePWA: () => {
        console.log('🔧 Toggling PWA features...');
        // This could restart with PWA enabled
        window.location.search = '?pwa=dev';
      }
    };
  }, [isDev]);
  
  useEffect(() => {
    mountedRef.current = true;

    // Skip initialization if already in progress
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initializePWA = async () => {
      try {
        if (!mountedRef.current) return;

        // Get initial capabilities
        safeSetState(setCapabilities, getPWACapabilities());
        
        // Skip service worker registration in development unless explicitly enabled
        if (isDev && import.meta.env.VITE_ENABLE_SW_DEV !== 'true') {
          console.log('🔧 PWA features disabled in development mode');
          safeSetState(setIsDevMode, true);
          return;
        }

        // Register service worker
        await registerServiceWorker();
        
        if (!mountedRef.current) return;

        // Setup PWA installation handling
        setupPWAInstall();
        
        if (!mountedRef.current) return;

        // Check initial states with safety checks
        safeSetState(setIsInstalled, isPWA());
        safeSetState(setIsInstallable, isPWAInstallable());
        
        if (!mountedRef.current) return;

        // Setup network monitoring
        const cleanupNetworkMonitoring = setupNetworkMonitoring(
          () => {
            safeSetState(setIsOnline, true);
            safeSetState(setShowOfflineAlert, false);
          },
          () => {
            safeSetState(setIsOnline, false);
            safeSetState(setShowOfflineAlert, true);
            // Auto-hide after 5 seconds
            setTimeout(() => {
              safeSetState(setShowOfflineAlert, false);
            }, 5000);
          }
        );
        
        // Setup push notifications if user is already logged in (production only)
        if (!isDev && localStorage.getItem('authToken') && mountedRef.current) {
          setupPushNotifications();
        }

        // Store cleanup function
        return cleanupNetworkMonitoring;
        
      } catch (error) {
        console.error('PWA initialization failed:', error);
        if (isDev) {
          console.log('💡 This is normal in development mode');
        }
      }
    };
    
    // Initialize with delay to ensure component is fully mounted
    const initTimer = setTimeout(() => {
      if (mountedRef.current) {
        initializePWA().then((cleanup) => {
          // Store cleanup for later use
          if (cleanup && typeof cleanup === 'function') {
            mountedRef.current.cleanup = cleanup;
          }
        });
      }
    }, isDev ? 200 : 50);
    
    // PWA event handlers with safety checks
    const handleInstallAvailable = () => {
      if (!isDev) {
        safeSetState(setIsInstallable, true);
        safeSetState(setShowInstallPrompt, true);
      }
    };
    
    const handleInstalled = () => {
      safeSetState(setIsInstalled, true);
      safeSetState(setIsInstallable, false);
      safeSetState(setShowInstallPrompt, false);
    };
    
    const handleUpdateAvailable = () => {
      if (!isDev) {
        safeSetState(setShowUpdatePrompt, true);
      }
    };

    // Add event listeners
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      initializingRef.current = false;
      clearTimeout(initTimer);
      
      // Call stored cleanup function
      if (mountedRef.current?.cleanup) {
        mountedRef.current.cleanup();
      }
      
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, [isDev]);

  // Handle install PWA
  const handleInstallPWA = async () => {
    try {
      const installed = await installPWA();
      if (installed) {
        safeSetState(setShowInstallPrompt, false);
        safeSetState(setIsInstalled, true);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  // Handle update app
  const handleUpdateApp = () => {
    if (isDev) {
      window.location.reload();
    } else {
      const registration = getServiceWorkerRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  // Context value
  const contextValue = {
    isInstallable,
    isInstalled,
    isOnline,
    capabilities,
    isDevMode,
    installPWA: handleInstallPWA,
    updateApp: handleUpdateApp,
    ...(isDev ? { devHelpers } : {})
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Development Debug Panel */}
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <details className="bg-gray-900 text-white p-2 rounded text-xs">
            <summary className="cursor-pointer">🔧 Dev PWA</summary>
            <div className="mt-2 space-y-2">
              <button 
                onClick={devHelpers.clearCache}
                className="block w-full text-left hover:bg-gray-800 p-1 rounded"
              >
                Clear SW Cache
              </button>
              <button 
                onClick={devHelpers.forceReload}
                className="block w-full text-left hover:bg-gray-800 p-1 rounded"
              >
                Force Reload
              </button>
              <div className="text-xs opacity-70 pt-1 border-t border-gray-700">
                SW: {capabilities.serviceWorker ? '✅' : '❌'}<br/>
                Online: {isOnline ? '✅' : '❌'}
              </div>
            </div>
          </details>
        </div>
      )}
      
      {/* Install Prompt */}
      {showInstallPrompt && !isDev && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
          <Alert className="bg-blue-50 border-blue-200">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>Install Farm Direct as an app?</span>
              <div className="flex gap-2 ml-2">
                <Button size="sm" onClick={handleInstallPWA} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowInstallPrompt(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>App update available!</span>
              <div className="flex gap-2 ml-2">
                <Button size="sm" onClick={handleUpdateApp} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowUpdatePrompt(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Offline Alert */}
      {showOfflineAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
          <Alert className="bg-orange-50 border-orange-200">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              You're offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </PWAContext.Provider>
  );
};