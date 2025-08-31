import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  getServiceWorkerRegistration
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
  // Add ref to track if component is mounted
  const mountedRef = useRef(true);
  
  // Wrap useState calls in try-catch and check if mounted
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
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

  // Safe state setter that checks if component is still mounted
  const safeSetState = (setter, value) => {
    try {
      if (mountedRef.current) {
        setter(value);
      }
    } catch (error) {
      console.warn('PWAProvider: State update failed:', error);
    }
  };
  
  useEffect(() => {
    mountedRef.current = true;

    // Initialize PWA features with error handling
    const initializePWA = async () => {
      try {
        if (!mountedRef.current) return;

        // Register service worker
        await registerServiceWorker();
        
        if (!mountedRef.current) return;

        // Setup PWA installation handling
        setupPWAInstall();
        
        if (!mountedRef.current) return;

        // Check initial states with safety checks
        safeSetState(setIsInstalled, isPWA());
        safeSetState(setIsInstallable, isPWAInstallable());
        safeSetState(setCapabilities, getPWACapabilities());
        
        if (!mountedRef.current) return;

        // Setup network monitoring
        setupNetworkMonitoring(
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
        
        // Setup push notifications if user is already logged in
        if (localStorage.getItem('authToken') && mountedRef.current) {
          setupPushNotifications();
        }
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };
    
    // Delay initialization slightly to ensure component is fully mounted
    const initTimer = setTimeout(() => {
      if (mountedRef.current) {
        initializePWA();
      }
    }, 100);
    
    // Listen for PWA events with safety checks
    const handleInstallAvailable = () => {
      safeSetState(setIsInstallable, true);
      safeSetState(setShowInstallPrompt, true);
    };
    
    const handleInstalled = () => {
      safeSetState(setIsInstalled, true);
      safeSetState(setIsInstallable, false);
      safeSetState(setShowInstallPrompt, false);
    };
    
    const handleUpdateAvailable = () => {
      safeSetState(setShowUpdatePrompt, true);
    };

    // Add event listeners
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  // Handle install PWA
  const handleInstallPWA = async () => {
    try {
      const installed = await installPWA();
      if (installed && mountedRef.current) {
        safeSetState(setShowInstallPrompt, false);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  // Handle update PWA
  const handleUpdatePWA = async () => {
    try {
      const registration = await getServiceWorkerRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
      safeSetState(setShowUpdatePrompt, false);
    } catch (error) {
      console.error('PWA update failed:', error);
      safeSetState(setShowUpdatePrompt, false);
    }
  };

  const contextValue = {
    isInstallable,
    isInstalled,
    isOnline,
    showInstallPrompt,
    showUpdatePrompt,
    capabilities,
    handleInstallPWA,
    handleUpdatePWA,
    setShowInstallPrompt: (value) => safeSetState(setShowInstallPrompt, value),
    setShowUpdatePrompt: (value) => safeSetState(setShowUpdatePrompt, value)
  };

  // Don't render anything if component is unmounted
  if (!mountedRef.current) {
    return null;
  }

  try {
    return (
      <PWAContext.Provider value={contextValue}>
        {children}

        {/* Install Prompt */}
        {showInstallPrompt && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Alert className="border-blue-200 bg-blue-50">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <div className="flex flex-col gap-2">
                <AlertDescription className="text-blue-800">
                  Install Farm Direct as an app for a better experience!
                </AlertDescription>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleInstallPWA}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => safeSetState(setShowInstallPrompt, false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Update Prompt */}
        {showUpdatePrompt && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <Alert className="border-green-200 bg-green-50">
              <RefreshCw className="h-4 w-4 text-green-600" />
              <div className="flex flex-col gap-2">
                <AlertDescription className="text-green-800">
                  A new version is available! Update now for the latest features.
                </AlertDescription>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={handleUpdatePWA}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Update
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => safeSetState(setShowUpdatePrompt, false)}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Offline Alert */}
        {showOfflineAlert && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <Alert className="border-yellow-200 bg-yellow-50">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <p className="font-semibold">You're offline</p>
                <p className="text-sm mt-1">
                  We'll sync your changes when you're back online.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Network Status Indicator */}
        <div className="fixed top-4 left-4 z-30">
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            transition-all duration-300
            ${isOnline 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
            }
          `}>
            {isOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* PWA Status Indicator (Development) */}
        {import.meta.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-30">
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${isInstalled 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
              }
            `}>
              <CheckCircle className="h-3 w-3" />
              <span>
                {isInstalled ? 'PWA Mode' : 'Browser Mode'}
              </span>
            </div>
          </div>
        )}
      </PWAContext.Provider>
    );
  } catch (error) {
    console.error('PWAProvider render error:', error);
    // Return children without PWA features if there's an error
    return <div>{children}</div>;
  }
};