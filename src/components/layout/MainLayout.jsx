// src/components/layout/MainLayout.jsx - Updated with Mobile Menu for <1024px screens
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
  Users
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
        return 'Admin';
      default:
        return 'User';
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview and activity' }
    ];

    if (isRolnik) {
      return [
        ...commonItems,
        { name: 'My Products', href: '/products', icon: Package, description: 'Manage your inventory' },
        { name: 'Orders', href: '/orders', icon: ShoppingBag, description: 'Track your sales' },
        { name: 'Messages', href: '/messages', icon: MessageSquare, description: 'Customer communications' },
        { name: 'Add Product', href: '/products/new', icon: Plus, description: 'List new items' }
      ];
    }

    if (isKlient) {
      return [
        ...commonItems,
        { name: 'Browse Products', href: '/browse', icon: Search, description: 'Find fresh produce' },
        { name: 'Find Farmers', href: '/farmers', icon: Users, description: 'Discover local farms' },
        { name: 'My Orders', href: '/orders', icon: ShoppingBag, description: 'Order history' },
        { name: 'Wishlist', href: '/wishlist', icon: Heart, description: 'Saved items' },
        { name: 'Messages', href: '/messages', icon: MessageSquare, description: 'Farmer communications' }
      ];
    }

    if (isAdmin) {
      return [
        ...commonItems,
        { name: 'User Management', href: '/admin/users', icon: Users, description: 'Manage all users' },
        { name: 'Product Management', href: '/admin/products', icon: Package, description: 'Oversee all products' },
        { name: 'Order Management', href: '/admin/orders', icon: ShoppingBag, description: 'Monitor all orders' },
        { name: 'System Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' }
      ];
    }

    return commonItems;
  };

  const visibleNavItems = getNavigationItems();

  // If user is not authenticated, show simple layout
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
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
              
              {/* Desktop navigation - Shows on 1024px+ (unchanged) */}
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
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side - User menu and mobile controls */}
            <div className="flex items-center space-x-4">
              {/* Desktop notifications - Shows on 1024px+ (unchanged) */}
              <div className="hidden lg:block">
                <NotificationBell />
              </div>

              {/* Desktop cart for clients - Shows on 1024px+ (unchanged) */}
              {isKlient && (
                <Link to="/cart" className="hidden lg:flex relative p-2 text-gray-400 hover:text-gray-500">
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

              {/* Desktop user dropdown - Shows on 1024px+ (unchanged) */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-600 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-700 font-medium">
                        {userProfile?.firstName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {userProfile?.email}
                        </p>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {getRoleDisplayName()}
                        </Badge>
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
                    
                    {isRolnik && (
                      <DropdownMenuItem asChild>
                        <Link to="/farm-location" className="cursor-pointer">
                          <MapPin className="mr-3 h-4 w-4" />
                          <div>
                            <p className="font-medium">Farm Location</p>
                            <p className="text-xs text-gray-500">Update your farm address</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}

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

              {/* Mobile menu button - CHANGED: lg:hidden instead of sm:hidden (shows on < 1024px instead of < 640px) */}
              <div className="lg:hidden flex items-center space-x-2">
                
                {/* Mobile Quick Actions */}
                {(isKlient || isAdmin) && (
                  <>
                    <Link to="/farmers" className="p-2 text-gray-400" title="Find Farmers">
                      <Users className="h-5 w-5" />
                    </Link>
                    <Link to="/search" className="p-2 text-gray-400" title="Search Products">
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
        </div>

        {/* Mobile navigation menu - CHANGED: lg:hidden instead of sm:hidden (shows on < 1024px instead of < 640px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t max-h-[calc(100vh-4rem)] overflow-y-auto">
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

              {/* Additional mobile-only links for farmers */}
              {isRolnik && (
                <>
                  <Link
                    to="/farm-location"
                    className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                      location.pathname === '/farm-location'
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

              {/* Divider before user section */}
              <div className="border-t border-gray-200 my-3"></div>
              
              {/* Mobile user section with Profile Settings button */}
              <div className="px-3 py-3 bg-gray-50 mx-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-600 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {userProfile?.firstName} {userProfile?.lastName}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {userProfile?.email}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getRoleDisplayName()}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Profile Settings Button */}
                  <Link
                    to="/profile"
                    className="flex items-center px-3 py-2 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-gray-700 font-medium">Profile Settings</span>
                  </Link>
                </div>
              </div>
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Admin Panel</p>
                    <p className="text-xs text-gray-500">System administration</p>
                  </div>
                </Link>
              )}
              
              {/* Sign Out button as menu item */}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-xs text-gray-500">Sign out of your account</p>
                </div>
              </button>
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