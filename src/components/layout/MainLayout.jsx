// src/components/layout/MainLayout.jsx - Updated with Farmer Navigation
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { logoutUser } from '../../firebase/auth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '../ui/dropdown-menu';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  ShoppingBag,
  Package, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu,
  X,
  Shield,
  Settings,
  Plus,
  Bell,
  ChevronDown,
  Target,
  Heart,
  MapPin,
  Users // NEW: Added Users icon for farmers
} from 'lucide-react';

// Import NotificationBell component
import NotificationBell from '../notifications/NotificationBell';

const MainLayout = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!currentUser;
  const isRolnik = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';
  const isKlient = userProfile?.role === 'klient' || userProfile?.role === 'customer';
  const isAdmin = userProfile?.role === 'admin';

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = () => {
    if (!userProfile) return 'U';
    const first = userProfile.firstName?.[0] || '';
    const last = userProfile.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleDisplayName = () => {
    switch (userProfile?.role) {
      case 'rolnik':
      case 'farmer':
        return 'Farmer';
      case 'klient':
      case 'customer':
        return 'Customer';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  // UPDATED: Enhanced navigation items with farmer directory
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
              
              {/* Desktop navigation */}
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

            {/* Right side navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
              
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
              {isKlient && (
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

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-auto px-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-green-600 text-white text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {userProfile?.firstName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplayName()}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuLabel>
                    <div className="flex items-center space-x-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-600 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {userProfile?.email}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {getRoleDisplayName()}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">Profile Settings</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      <Bell className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-xs text-gray-500">View all notifications</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* NEW: Customer-specific menu items */}
                  {(isKlient || isAdmin) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/farmers" className="cursor-pointer">
                          <Users className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Find Farmers</p>
                            <p className="text-xs text-gray-500">Browse local farmers</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/search" className="cursor-pointer">
                          <Search className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Search & Map</p>
                            <p className="text-xs text-gray-500">Find products near you</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Farmer-specific menu items */}
                  {(isRolnik || isAdmin) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/notifications/create" className="cursor-pointer">
                          <MessageSquare className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Send Notifications</p>
                            <p className="text-xs text-gray-500">Notify your customers</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/farmer/location" className="cursor-pointer">
                          <MapPin className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Set Farm Location</p>
                            <p className="text-xs text-gray-500">Update your farm address</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Admin menu items */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Admin Panel</p>
                            <p className="text-xs text-gray-500">System administration</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-3 h-4 w-4" />
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-xs">Sign out of your account</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center space-x-2">
              
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
              {isKlient && (
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

        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t">
            <div className="pt-2 pb-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Notifications Link */}
              <Link
                to="/notifications"
                className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                  location.pathname === '/notifications'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-gray-500">View all notifications</p>
                </div>
              </Link>

              {/* Farmer-specific mobile menu items */}
              {(isRolnik || isAdmin) && (
                <>
                  <Link
                    to="/notifications/create"
                    className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                      location.pathname === '/notifications/create'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Send Notifications</p>
                      <p className="text-xs text-gray-500">Notify your customers</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/farmer/location"
                    className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                      location.pathname === '/farmer/location'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MapPin className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Set Farm Location</p>
                      <p className="text-xs text-gray-500">Update your farm address</p>
                    </div>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile user section */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4 mb-3">
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-600 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-base font-medium text-gray-800">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {userProfile?.email}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {getRoleDisplayName()}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile Settings
                </Link>
                
                {/* NEW: Mobile customer menu items */}
                {(isKlient || isAdmin) && (
                  <>
                    <Link
                      to="/farmers"
                      className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="mr-3 h-5 w-5" />
                      Find Farmers
                    </Link>
                    
                    <Link
                      to="/search"
                      className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Search className="mr-3 h-5 w-5" />
                      Search & Map
                    </Link>
                  </>
                )}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="mr-3 h-5 w-5" />
                    Admin Panel
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
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