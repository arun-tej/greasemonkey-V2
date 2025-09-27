import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../posts/PostCard';
import CreatePostDialog from '../posts/CreatePostDialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  Flame,
  Plus,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const Feed = () => {
  const { API_BASE, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('new');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPosts();
  }, [sortBy, filter]);

  const loadPosts = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        limit: 20,
        offset: 0
      };
      
      if (filter === 'garages') {
        // Only show posts from user's garages
        params.garage_only = true;
      }

      const response = await axios.get(`${API_BASE}/posts/`, { params });
      
      let sortedPosts = response.data;
      
      // Sort posts based on selection
      if (sortBy === 'hot') {
        sortedPosts = sortedPosts.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sortBy === 'top') {
        sortedPosts = sortedPosts.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      }
      // 'new' is default from API (sorted by created_at)
      
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handlePostUpdate = () => {
    loadPosts(true);
  };

  const handleCommentClick = (post) => {
    // TODO: Navigate to post detail page or open comments modal
    console.log('Comment clicked for post:', post.id);
  };

  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: TrendingUp },
  ];

  const filterOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'garages', label: 'My Garages' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.full_name?.split(' ')[0]}! 🏍️
              </h1>
              <p className="text-blue-100">
                What's happening in the gearhead community today?
              </p>
            </div>
            <CreatePostDialog onPostCreated={handlePostCreated} />
          </div>
        </CardContent>
      </Card>

      {/* Sorting and filtering */}
      <Card className="shadow-sm border-blue-200/50 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={sortBy === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center space-x-2 ${
                        sortBy === option.value 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                          : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border-gray-300 text-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </Button>
                  );
                })}
              </div>
              
              <div className="border-l border-blue-300 h-6" />
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPosts(true)}
              disabled={refreshing}
              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border-gray-300 text-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to share something with the community! Join some garages or create your first post.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <CreatePostDialog onPostCreated={handlePostCreated} />
                <Button variant="outline" onClick={() => window.location.href = '/garages'}>
                  Explore Garages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={handlePostUpdate}
              onCommentClick={handleCommentClick}
            />
          ))}
        </div>
      )}

      {/* Load more placeholder */}
      {posts.length >= 20 && (
        <div className="text-center py-6">
          <Button 
            variant="outline" 
            onClick={() => loadPosts()}
            className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
          >
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;