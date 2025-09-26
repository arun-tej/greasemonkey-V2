import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../posts/PostCard';
import CreatePostDialog from '../posts/CreatePostDialog';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Feed = () => {
  const { API_BASE } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get(`${API_BASE}/posts/`, {
        params: {
          limit: 20,
          offset: 0
        }
      });
      setPosts(response.data);
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPosts(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreatePostDialog onPostCreated={handlePostCreated} />
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to share something with the community! Join some garages or create your first post.
            </p>
            <CreatePostDialog onPostCreated={handlePostCreated} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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
          <Button variant="outline" onClick={() => loadPosts()}>
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;