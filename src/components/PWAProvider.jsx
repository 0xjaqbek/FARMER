import React, { createContext, useContext, useEffect, useState } from 'react';
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
  checkForAppUpdate,
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
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [capabilities, setCapabilities] = useState({});
  
  useEffect(() => {
    // Initialize PWA features
    const initializePWA = async () => {
      // Register service worker
      await registerServiceWorker();
      
      // Setup PWA installation handling
      setupPWAInstall();
      
      // Check initial states
      setIsInstalled(isPWA());
      setIsInstallable(isPWAInstallable());
      setCapabilities(getPWACapabilities());
      
      // Setup network monitoring
      setupNetworkMonitoring(
        () => {
          setIsOnline(true);
          setShowOfflineAlert(false);
        },
        () => {
          setIsOnline(false);
          setShowOfflineAlert(true);
          // Auto-hide after 5 seconds
          setTimeout(() => setShowOfflineAlert(false), 5000);
        }
      );
      
      // Setup push notifications if user is already logged in
      if (localStorage.getItem('authToken')) {
        setupPushNotifications();
      }
    };
    
    initializePWA();
    
    // Listen for PWA events
    const handleInstallAvailable = () => {
      setIsInstallable(true);
      setShowInstallPrompt(true);
    };
    
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
    };
    
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };
    
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await installPWA();
    if (installed) {
      setShowInstallPrompt(false);
      setIsInstalled(true);
    }
  };

  const handleUpdate = async () => {
    const registration = getServiceWorkerRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } else {
      await checkForAppUpdate();
      window.location.reload();
    }
  };

  const contextValue = {
    isInstallable,
    isInstalled,
    isOnline,
    capabilities,
    installPWA: handleInstall,
    checkForUpdates: checkForAppUpdate,
    serviceWorkerRegistration: getServiceWorkerRegistration()
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Alert className="bg-green-50 border-green-200 shadow-lg">
            <Smartphone className="h-4 w-4 text-green-600" />
            <AlertDescription className="pr-8">
              <div className="font-semibold text-green-800 mb-2">
                Install Farm Direct
              </div>
              <p className="text-sm text-green-700 mb-3">
                Get the full app experience with offline access and notifications.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowInstallPrompt(false)}
                >
                  Later
                </Button>
              </div>
            </AlertDescription>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => setShowInstallPrompt(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {/* App Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Alert className="bg-blue-50 border-blue-200 shadow-lg">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="pr-8">
              <div className="font-semibold text-blue-800 mb-2">
                App Update Available
              </div>
              <p className="text-sm text-blue-700 mb-3">
                A new version of Farm Direct is ready to install.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleUpdate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowUpdatePrompt(false)}
                >
                  Later
                </Button>
              </div>
            </AlertDescription>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => setShowUpdatePrompt(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {/* Offline Alert */}
      {showOfflineAlert && (
        <div className="fixed top-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
          <Alert className="bg-yellow-50 border-yellow-200 shadow-lg">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-semibold text-yellow-800 mb-1">
                You're offline
              </div>
              <p className="text-sm text-yellow-700">
                Some features may be limited. We'll sync your changes when you're back online.
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
};