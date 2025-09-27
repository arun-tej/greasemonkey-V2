import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  TrendingUp, 
  Users, 
  Calendar,
  MapPin,
  Plus,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

const RightSidebar = () => {
  const navigate = useNavigate();
  const { user, API_BASE } = useAuth();
  const [trendingGarages, setTrendingGarages] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalGarages: 0,
    totalMembers: 0
  });

  useEffect(() => {
    loadTrendingGarages();
  }, []);

  const loadTrendingGarages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/garages/discover`);
      setTrendingGarages(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load trending garages:', error);
    }
  };

  const trendingHashtags = [
    { tag: 'sportbike', count: 1247 },
    { tag: 'harley', count: 892 },
    { tag: 'trackday', count: 654 },
    { tag: 'touring', count: 543 },
    { tag: 'maintenance', count: 432 },
  ];

  const upcomingRides = [
    {
      id: '1',
      title: 'Canyon Run',
      date: '2024-01-15',
      participants: 12,
      location: 'Pacific Coast Highway'
    },
    {
      id: '2',
      title: 'Track Day',
      date: '2024-01-18',
      participants: 8,
      location: 'Laguna Seca'
    },
  ];

  return (
    <div className="space-y-4">
      {/* User Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Posts</span>
            <span className="font-medium">{user?.post_count || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Garages</span>
            <span className="font-medium">{user?.garages?.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Friends</span>
            <span className="font-medium">{user?.friends?.length || 0}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/profile')}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>

      {/* Trending Hashtags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trendingHashtags.map((item, index) => (
              <div
                key={item.tag}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                onClick={() => navigate(`/search?tag=${item.tag}`)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                    #{item.tag}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count.toLocaleString()} posts
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Garages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Popular Garages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingGarages.map((garage) => (
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
                <Button size="sm" variant="outline">
                  Join
                </Button>
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/garages')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Rides */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingRides.map((ride) => (
              <div
                key={ride.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/rides/${ride.id}`)}
              >
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {ride.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(ride.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{ride.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {ride.participants} riders
                  </span>
                  <Button size="sm" variant="outline">
                    Join Ride
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/rides')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Ride
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GreaseMonkey Info */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_codeflow-9/artifacts/ly6ycfum_Gemini_Generated_Image_ni2zlyni2zlyni2z.svg" 
              alt="GreaseMonkey Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Welcome to GreaseMonkey
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Connect, ride, and share with the gearhead community worldwide.
          </p>
          <Button size="sm" variant="outline" className="w-full">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RightSidebar;