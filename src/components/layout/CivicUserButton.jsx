// src/components/auth/CivicUserButton.jsx - FIXED ICON IMPORTS
import React from 'react';
import { useAuth, signOut } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Home,
  ShoppingCart,
  Sprout,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CivicUserButton = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/login')}>
          Login
        </Button>
        <Button onClick={() => navigate('/register')}>
          Sign Up
        </Button>
      </div>
    );
  }

const handleLogout = async () => {
  try {
    await signOut();
    window.location.href = '/home'; // Force hard redirect
  } catch {
    window.location.href = '/home';
  }
};

  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`;
    }
    if (userProfile?.displayName) {
      const names = userProfile.displayName.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    }
    return currentUser.email?.[0]?.toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    // UPDATED: Use role-based check instead of isAdmin boolean
    if (userProfile?.role === 'admin') {
      return <Badge variant="destructive" className="text-xs">Admin</Badge>;
    }
    if (userProfile?.role === 'rolnik') {
      return <Badge variant="default" className="text-xs">Farmer</Badge>;
    }
    if (userProfile?.role === 'klient') {
      return <Badge variant="secondary" className="text-xs">Customer</Badge>;
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={userProfile?.profileImage || ''} 
              alt={userProfile?.displayName || currentUser.email} 
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {userProfile?.displayName || currentUser.email}
              </p>
              {getRoleBadge()}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
            {userProfile?.authProvider === 'civic' && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Civic Verified</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          <Home className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {userProfile?.role === 'rolnik' && (
          <DropdownMenuItem onClick={() => navigate('/products/manage')}>
            <Sprout className="mr-2 h-4 w-4" />
            <span>Manage Products</span>
          </DropdownMenuItem>
        )}

        {userProfile?.role === 'klient' && (
          <DropdownMenuItem onClick={() => navigate('/orders')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>My Orders</span>
          </DropdownMenuItem>
        )}

        {/* UPDATED: Use role-based check instead of isAdmin boolean */}
        {userProfile?.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Panel</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => navigate('/notifications')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CivicUserButton;