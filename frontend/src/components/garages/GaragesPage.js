import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Plus, 
  Search,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  Eye,
  Lock,
  Crown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const GaragesPage = () => {
  const { user, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [userGarages, setUserGarages] = useState([]);
  const [popularGarages, setPopularGarages] = useState([]);
  const [newGarages, setNewGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-garages');

  useEffect(() => {
    loadGarages();
  }, []);

  const loadGarages = async () => {
    try {
      const [userResponse, popularResponse] = await Promise.all([
        axios.get(`${API_BASE}/garages/`),
        axios.get(`${API_BASE}/garages/discover`)
      ]);

      setUserGarages(userResponse.data);
      setPopularGarages(popularResponse.data.slice(0, 10));
      setNewGarages(popularResponse.data.slice().reverse().slice(0, 8));
    } catch (error) {
      console.error('Failed to load garages:', error);
      toast.error('Failed to load garages');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGarage = async (garageId) => {
    try {
      await axios.post(`${API_BASE}/garages/${garageId}/join`);
      toast.success('Successfully joined garage!');
      loadGarages(); // Refresh data
    } catch (error) {
      console.error('Failed to join garage:', error);
      toast.error('Failed to join garage');
    }
  };

  const GarageCard = ({ garage, showJoinButton = true, isOwned = false }) => {
    const isJoined = userGarages.some(ug => ug.id === garage.id);
    
    return (
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="relative">
              {garage.image_url ? (
                <img
                  src={garage.image_url}
                  alt={garage.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {garage.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {garage.is_private && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 
                  className="font-bold text-lg text-gray-900 group-hover:text-orange-600 cursor-pointer"
                  onClick={() => navigate(`/g/${garage.id}`)}
                >
                  g/{garage.name}
                </h3>
                {isOwned && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
              
              {garage.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {garage.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{garage.member_count.toLocaleString()} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{garage.post_count || 0} posts</span>
                </div>
                {garage.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{garage.location}</span>
                  </div>
                )}
              </div>
              
              {showJoinButton && !isJoined && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinGarage(garage.id);
                  }}
                  disabled={garage.is_private}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {garage.is_private ? 'Private' : 'Join'}
                </Button>
              )}
              
              {isJoined && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Joined
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading garages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Garages</h1>
              <p className="text-orange-100">
                Join communities of motorcycle enthusiasts and share your passion
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-orange-600 hover:bg-orange-50"
              onClick={() => navigate('/garages/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Garage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search garages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-garages" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>My Garages ({userGarages.length})</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Popular</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>New</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-garages" className="space-y-4">
          {userGarages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No garages yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Join your first garage or create one to get started!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setActiveTab('popular')}>
                    Explore Popular Garages
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/garages/create')}>
                    Create New Garage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userGarages
                .filter(garage => 
                  garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (garage.description && garage.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((garage) => (
                  <GarageCard 
                    key={garage.id} 
                    garage={garage} 
                    showJoinButton={false}
                    isOwned={garage.owner_id === user?.id}
                  />
                ))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-4">
            {popularGarages
              .filter(garage => 
                garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (garage.description && garage.description.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))
            }
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="grid gap-4">
            {newGarages
              .filter(garage => 
                garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (garage.description && garage.description.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GaragesPage;