import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Users, 
  Heart, 
  ArrowLeft,
  MapPin,
  Sprout,
  Carrot,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Extract search terms from the current path
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // If the last segment looks like it could be a search term, use it
    if (lastSegment && lastSegment.length > 2 && !lastSegment.includes('-')) {
      setSearchQuery(decodeURIComponent(lastSegment));
    }
  }, [location.pathname]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearching(false);
    }, 500);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  // Quick navigation options
  const quickActions = [
    {
      icon: <Home className="h-5 w-5" />,
      title: 'Home',
      description: 'Return to the main page',
      path: '/',
      color: 'green'
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: 'Browse Products',
      description: 'Discover fresh local produce',
      path: '/browse',
      color: 'blue'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Find Farmers',
      description: 'Connect with local farmers',
      path: '/farmers',
      color: 'yellow'
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Search by Location',
      description: 'Find nearby farms and markets',
      path: '/search',
      color: 'purple'
    }
  ];

  // Popular/suggested pages
  const popularPages = [
    { title: 'Seasonal Vegetables', path: '/browse?category=vegetables&season=current' },
    { title: 'Farm Campaigns', path: '/campaigns' },
    { title: 'My Orders', path: '/orders' },
    { title: 'Messages', path: '/chat' },
    { title: 'My Profile', path: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Carrot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Farm Direct</h1>
            </div>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 404 Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            {/* Animated 404 with vegetables */}
            <div className="relative inline-block">
              <div className="text-8xl sm:text-9xl font-bold text-green-100 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center space-x-4">
                <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🥕</span>
                <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🥬</span>
                <span className="text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>🍅</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Oops! This crop didn't grow here
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            The page you're looking for seems to have been harvested already, 
            or maybe it was never planted in the first place. Let's help you find 
            what you're looking for!
          </p>

          {/* Current path display */}
          <div className="bg-gray-100 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-sm text-gray-600 mb-1">You were trying to visit:</p>
            <code className="text-sm font-mono text-gray-800 break-all">
              {window.location.origin}{location.pathname}
            </code>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-green-600" />
              Search for what you need
            </h2>
            
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for products, farmers, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Where would you like to go?
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="transition-all duration-200 hover:shadow-lg cursor-pointer group border-2 hover:border-green-200"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`
                    mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors
                    ${action.color === 'green' ? 'bg-green-100 text-green-600 group-hover:bg-green-200' : ''}
                    ${action.color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : ''}
                    ${action.color === 'yellow' ? 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200' : ''}
                    ${action.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' : ''}
                  `}>
                    {action.icon}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-700">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                  
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium text-green-600 inline-flex items-center">
                      Visit <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Pages */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center">
              <Sprout className="h-5 w-5 mr-2" />
              Popular Destinations
            </h3>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => navigate(page.path)}
                  className="text-left p-3 rounded-lg bg-white border border-green-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-green-800 group-hover:text-green-900 flex items-center justify-between">
                    {page.title}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-gray-600">
            Still can't find what you're looking for?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleGoHome}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Take Me Home
            </Button>
            <Button 
              onClick={() => navigate('/chat')}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Get Help from Farmers
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">
              Farm Direct - Connecting you with local farmers since 2024
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <button 
                onClick={() => navigate('/about')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                About Us
              </button>
              <button 
                onClick={() => navigate('/terms')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => navigate('/privacy')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;