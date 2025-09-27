import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Plus,
  Settings,
  Bike,
  MapPin,
  Star
} from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, API_BASE } = useAuth();
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserGarages();
  }, []);

  const loadUserGarages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/garages/`);
      setGarages(response.data);
    } catch (error) {
      console.error('Failed to load garages:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { name: 'Home', icon: Home, path: '/feed', current: location.pathname === '/feed' },
    { name: 'Popular', icon: TrendingUp, path: '/popular', current: location.pathname === '/popular' },
    { name: 'All Garages', icon: Users, path: '/garages', current: location.pathname === '/garages' },
    { name: 'Rides', icon: MapPin, path: '/rides', current: location.pathname === '/rides' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 ${
                item.current 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Button>
          );
        })}
      </div>

      <div className="border-t border-gray-200 mx-4" />

      {/* My Garages Section */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            My Garages
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/garages/create')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {garages.length === 0 ? (
                <div className="text-center py-8">
                  <Motorcycle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">
                    Join or create your first garage to get started!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/garages')}
                  >
                    Explore Garages
                  </Button>
                </div>
              ) : (
                garages.map((garage) => (
                  <div
                    key={garage.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    onClick={() => navigate(`/g/${garage.id}`)}
                  >
                    <div className="flex-shrink-0">
                      {garage.image_url ? (
                        <img
                          src={garage.image_url}
                          alt={garage.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {garage.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600">
                        g/{garage.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {garage.member_count} members
                      </p>
                    </div>
                    {garage.owner_id === user?.id && (
                      <Star className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-gray-700"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;