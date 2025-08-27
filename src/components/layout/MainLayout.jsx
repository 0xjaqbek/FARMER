// src/components/layout/MainLayout.jsx - Updated for Civic Auth
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  ShoppingBag,
  Package, 
  MessageSquare, 
  Menu,
  X,
  Shield,
  Plus,
  Bell,
  Target,
  Heart,
  MapPin,
  Users
} from 'lucide-react';

// Import Civic Auth components
import CivicUserButton from '../../components/layout/CivicUserButton';
import NotificationBell from '../../components/notifications/NotificationBell';

const MainLayout = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!currentUser;
  const isRolnik = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  const isKlient = userProfile?.role === 'klient' || userProfile?.role === 'customer';
  const isAdmin = userProfile?.isAdmin || userProfile?.role === 'admin';

  // Navigation items configuration
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      show: isAuthenticated,
      description: 'Overview and quick actions'
    },
    // NEW: Farmers Directory - Show for customers and admins
    {
      name: 'Find Farmers',
      href: '/farmers',
      icon: Users,
      show: isKlient || isAdmin,
      description: 'Browse local farmers and their specialties'
    },
    // SEARCH: Show for customers and admins
    {
      name: 'Search & Map',
      href: '/search',
      icon: Search,
      show: isKlient || isAdmin,
      description: 'Find local farm products with location-based search'
    },
    // BROWSE: Show for customers and admins
    {
      name: 'Browse Products',
      href: '/browse',
      icon: ShoppingBag,
      show: isKlient || isAdmin,
      description: 'Browse all available products'
    },
    // FARMER: Product management
    {
      name: 'My Products',
      href: '/products/manage',
      icon: Package,
      show: isRolnik || isAdmin,
      description: 'Manage your product listings'
    },
    {
      name: 'Add Product',
      href: '/products/add',
      icon: Plus,
      show: isRolnik,
      description: 'List a new product'
    },
    // ORDERS: Show for everyone
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      show: isAuthenticated,
      description: 'View your orders'
    },
    // CAMPAIGNS: Crowdfunding features
    {
      name: 'My Campaigns',
      href: '/campaigns/manage',
      icon: Target,
      show: isRolnik,
      description: 'Manage your crowdfunding campaigns'
    },
    {
      name: 'Browse Campaigns',
      href: '/campaigns',
      icon: Heart,
      show: isKlient || isAdmin,
      description: 'Support farming projects'
    },
    // CHAT: Show for everyone
    {
      name: 'Messages',
      href: '/chat',
      icon: MessageSquare,
      show: isAuthenticated,
      description: 'Chat with customers/farmers'
    },
    // ADMIN: Admin only
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      show: isAdmin,
      description: 'Admin dashboard and user management'
    }
  ];

  const visibleNavItems = navigationItems.filter(item => item.show);

  // Unauthenticated layout
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-green-600">Farm Direct</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-green-600 hover:bg-green-700">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-green-600">Farm Direct</span>
              </Link>
              
              {/* Desktop navigation - Shows on 1024px+ */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side navigation - Shows on 1024px+ */}
            <div className="hidden lg:ml-6 lg:flex lg:items-center space-x-3">
              
              {/* Quick Access Buttons for customers */}
              {(isKlient || isAdmin) && (
                <div className="flex items-center space-x-2">
                  {/* Quick Farmers Button */}
                  <Link 
                    to="/farmers" 
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                    title="Find Local Farmers"
                  >
                    <Users className="h-5 w-5" />
                  </Link>
                  
                  {/* Quick Search Button */}
                  <Link 
                    to="/search" 
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                    title="Search Products & Map"
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                </div>
              )}
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Cart for clients */}
              {(isKlient || isAdmin) && (
                <Link 
                  to="/cart" 
                  className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Link>
              )}

              {/* UPDATED: Use Civic User Button */}
              <CivicUserButton />
            </div>

            {/* Mobile menu button - Shows on <1024px */}
            <div className="lg:hidden flex items-center space-x-2">
              
              {/* Mobile Quick Actions */}
              {(isKlient || isAdmin) && (
                <>
                  <Link to="/farmers" className="p-2 text-gray-400" title="Find Farmers">
                    <Users className="h-5 w-5" />
                  </Link>
                  <Link to="/search" className="p-2 text-gray-400" title="Search">
                    <Search className="h-5 w-5" />
                  </Link>
                </>
              )}
              
              {/* Mobile Notification Bell */}
              <NotificationBell />
              
              {/* Mobile cart for clients */}
              {(isKlient || isAdmin) && (
                <Link to="/cart" className="relative p-2 text-gray-400">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Link>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation menu - Shows on <1024px */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="pt-2 pb-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center pl-3 pr-4 py-3 sm:py-2 border-l-4 text-base sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs sm:text-[11px] text-gray-500 leading-tight">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Notifications Link */}
              <Link
                to="/notifications"
                className={`flex items-center pl-3 pr-4 py-3 sm:py-2 border-l-4 text-base sm:text-sm font-medium transition-colors ${
                  location.pathname === '/notifications'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs sm:text-[11px] text-gray-500 leading-tight">View all notifications</p>
                </div>
              </Link>

              {/* Farmer-specific mobile menu items */}
              {(isRolnik || isAdmin) && (
                <>
                  <Link
                    to="/notifications/create"
                    className={`flex items-center pl-3 pr-4 py-3 sm:py-2 border-l-4 text-base sm:text-sm font-medium transition-colors ${
                      location.pathname === '/notifications/create'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
                    <div>
                      <p className="font-medium">Send Notifications</p>
                      <p className="text-xs sm:text-[11px] text-gray-500 leading-tight">Notify your customers</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/location-picker"
                    className={`flex items-center pl-3 pr-4 py-3 sm:py-2 border-l-4 text-base sm:text-sm font-medium transition-colors ${
                      location.pathname === '/location-picker'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MapPin className="w-5 h-5 sm:w-4 sm:h-4 mr-3 sm:mr-2" />
                    <div>
                      <p className="font-medium">Set Farm Location</p>
                      <p className="text-xs sm:text-[11px] text-gray-500 leading-tight">Update your farm address</p>
                    </div>
                  </Link>
                </>
              )}
            </div>
            
            {/* UPDATED: Mobile user section - Simplified since CivicUserButton handles the user menu */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4">
                {/* UPDATED: Use Civic User Button in mobile view */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 text-sm text-gray-600">
                      {userProfile?.displayName || currentUser?.email || 'User'}
                    </div>
                    {userProfile?.isAdmin && (
                      <Badge variant="destructive" className="text-xs">Admin</Badge>
                    )}
                    {userProfile?.role === 'rolnik' && (
                      <Badge variant="default" className="text-xs">Farmer</Badge>
                    )}
                    {userProfile?.role === 'klient' && (
                      <Badge variant="secondary" className="text-xs">Customer</Badge>
                    )}
                  </div>
                  
                  {/* Mobile Civic User Button */}
                  <CivicUserButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;