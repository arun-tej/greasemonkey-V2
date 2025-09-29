import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import EditProfileDialog from './EditProfileDialog';
import FollowersDialog from './FollowersDialog';
import { 
  Edit, 
  MapPin, 
  Calendar, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Grid3X3,
  Bookmark,
  Settings,
  Camera,
  Link,
  Mail,
  Phone
} from 'lucide-react';
import axios from 'axios';

const ProfilePage = () => {
  const { user, API_BASE } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState(234);
  const [following, setFollowing] = useState(156);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // In a real app, you'd fetch user posts and other data
      // For demo, we'll use mock data
      setUserPosts([
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          likes: 45,
          comments: 12,
          caption: 'Perfect day for a ride! 🏍️'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
          likes: 89,
          comments: 23,
          caption: 'New bike day! Can\'t wait to hit the road.'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400',
          likes: 156,
          comments: 34,
          caption: 'Weekend garage session with the crew 🔧'
        },
        {
          id: 4,
          image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400',
          likes: 78,
          comments: 18,
          caption: 'Mountain roads are calling!'
        },
        {
          id: 5,
          image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
          likes: 92,
          comments: 27,
          caption: 'Track day at Laguna Seca 🏁'
        },
        {
          id: 6,
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
          likes: 134,
          comments: 41,
          caption: 'Custom paint job finally done!'
        }
      ]);
      
      setSavedPosts([
        {
          id: 7,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          likes: 203,
          comments: 56,
          caption: 'Epic motorcycle photography tips'
        },
        {
          id: 8,
          image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400',
          likes: 167,
          comments: 32,
          caption: 'Best roads for motorcycle touring'
        }
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const PostGrid = ({ posts }) => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map((post) => (
        <div key={post.id} className="relative aspect-square group cursor-pointer">
          <img
            src={post.image}
            alt={post.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-1">
                <Heart className="h-5 w-5" />
                <span className="font-medium">{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-orange-200">
                  <AvatarImage src={user?.profile_image_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-4xl font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              {/* Username and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h1 className="text-2xl font-bold">@{user?.username}</h1>
                <div className="flex gap-2">
                  <EditProfileDialog>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </EditProfileDialog>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center sm:text-left">
                <div>
                  <span className="font-bold text-lg">{userPosts.length}</span>
                  <p className="text-gray-600 text-sm">posts</p>
                </div>
                <FollowersDialog title="Followers">
                  <div className="cursor-pointer hover:text-orange-600">
                    <span className="font-bold text-lg">{followers}</span>
                    <p className="text-gray-600 text-sm">followers</p>
                  </div>
                </FollowersDialog>
                <FollowersDialog title="Following">
                  <div className="cursor-pointer hover:text-orange-600">
                    <span className="font-bold text-lg">{following}</span>
                    <p className="text-gray-600 text-sm">following</p>
                  </div>
                </FollowersDialog>
              </div>

              {/* Profile Details */}
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">{user?.full_name}</h2>
                {user?.bio && (
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {user?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user?.created_at || '2024-01-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    🏍️ Rider
                  </Badge>
                  {user?.ride_count > 10 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      🏆 Veteran Rider
                    </Badge>
                  )}
                  {user?.post_count > 5 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      📸 Active Poster
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="tagged" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Tagged</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {userPosts.length > 0 ? (
              <PostGrid posts={userPosts} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Share your rides</h3>
                  <p className="text-gray-600 mb-4">When you share photos, they'll appear on your profile.</p>
                  <Button>Share your first photo</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedPosts.length > 0 ? (
              <PostGrid posts={savedPosts} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Save posts you like</h3>
                  <p className="text-gray-600">Bookmark posts to easily find them later.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tagged" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Photos of you</h3>
                <p className="text-gray-600">When people tag you in photos, they'll appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;