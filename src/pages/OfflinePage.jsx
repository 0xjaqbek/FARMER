import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  ShoppingCart, 
  MessageSquare, 
  Heart,
  MapPin,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOffline } from '../hooks/useOffline';

const OfflinePage = () => {
  const navigate = useNavigate();
  const { isOnline, hasOfflineData, _syncOfflineData } = useOffline();
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(null);

  // Redirect when back online
  useEffect(() => {
    if (isOnline) {
      // Small delay to allow for data sync
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [isOnline, navigate]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setLastSyncAttempt(new Date());
    
    try {
      // Force refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewCachedProducts = () => {
    navigate('/browse');
  };

  // Available offline features
  const offlineFeatures = [
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: 'Browse Products',
      description: 'View previously loaded products and add to cart',
      available: true,
      action: handleViewCachedProducts
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: 'Manage Favorites',
      description: 'Add or remove products from your favorites list',
      available: true,
      action: () => navigate('/favorites')
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'View Farmer Locations',
      description: 'Check cached farmer locations and contact info',
      available: true,
      action: () => navigate('/farmers')
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Compose Messages',
      description: 'Write messages that will send when online',
      available: true,
      action: () => navigate('/chat')
    }
  ];

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-green-800">Back Online!</h2>
          <p className="text-green-600">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🥕</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Farm Direct</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">Offline Mode</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Offline Message */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <WifiOff className="h-12 w-12 text-yellow-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Currently Offline
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Don't worry! You can still browse previously viewed products, manage your cart, 
            and prepare orders that will sync when your connection returns.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {lastSyncAttempt && (
            <p className="text-sm text-gray-500 mt-4">
              Last checked: {lastSyncAttempt.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Offline Data Status */}
        {hasOfflineData && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Pending Changes
                  </h3>
                  <p className="text-blue-800 mb-4">
                    You have offline changes that will automatically sync when your connection returns. 
                    This includes cart updates, messages, and other actions you've made.
                  </p>
                  <div className="flex items-center text-sm text-blue-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Your data is safely stored and will sync automatically
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Offline Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You Can Do Offline
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {offlineFeatures.map((feature, index) => (
              <Card 
                key={index}
                className={`transition-all duration-200 ${
                  feature.available 
                    ? 'hover:shadow-md cursor-pointer border-green-200 bg-green-50' 
                    : 'opacity-50 bg-gray-50'
                }`}
                onClick={feature.available ? feature.action : undefined}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`
                      p-3 rounded-lg
                      ${feature.available ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}
                    `}>
                      {feature.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${
                        feature.available ? 'text-green-900' : 'text-gray-500'
                      }`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm ${
                        feature.available ? 'text-green-800' : 'text-gray-500'
                      }`}>
                        {feature.description}
                      </p>
                      
                      {feature.available && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-green-600 hover:text-green-700">
                            Try it now →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips for Offline Use */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              💡 Offline Tips
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Cart items are saved:</strong> Add products to your cart - they'll stay there even offline
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Messages queue up:</strong> Write messages to farmers - they'll send when you're back online
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Favorites sync:</strong> Add products to favorites - changes will sync automatically
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>View cached content:</strong> Browse previously loaded farmers and products
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Farm Direct will automatically sync your changes when you're back online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;