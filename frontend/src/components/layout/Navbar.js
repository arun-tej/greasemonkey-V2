import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Home, Users, Settings, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home, current: location.pathname === '/feed' },
    { name: 'Garages', href: '/garages', icon: Users, current: location.pathname === '/garages' },
    { name: 'Profile', href: '/profile', icon: User, current: location.pathname === '/profile' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand - Centered */}
          <div className="flex items-center">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/feed')}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://customer-assets.emergentagent.com/job_codeflow-9/artifacts/lz1argy3_Gemini_Generated_Image_bhb3n2bhb3n2bhb3.png" 
                  alt="GreaseMonkey Logo" 
                  className="w-full h-full object-contain drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(139, 69, 19, 0.3))'
                  }}
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                GreaseMonkey
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={item.current ? "default" : "ghost"}
                  className={`flex items-center space-x-2 ${
                    item.current 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                      : 'hover:bg-amber-50 hover:text-amber-700'
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Profile dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-amber-200">
                    <AvatarImage src={user?.profile_image_url} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{user?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
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
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t bg-white">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className={`w-full justify-start space-x-2 ${
                  item.current 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                    : 'hover:bg-amber-50 hover:text-amber-700'
                }`}
                onClick={() => navigate(item.href)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;