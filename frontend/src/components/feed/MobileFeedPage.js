import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat, Share, MoreHorizontal, Verified, Plus, Search, Bell, Menu, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './FeedStyles.css';

const MobileFeedPage = () => {
  const { user, API_BASE } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Sample data for mobile
  const samplePosts = [
    {
      id: '1',
      author: {
        id: '1',
        username: 'BikerMike',
        full_name: 'Mike Thompson',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        is_verified: true
      },
      content: 'Just completed an amazing 500-mile ride through the mountains! The new Harley is performing beautifully. 🏍️',
      image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
      created_at: '2024-01-20T10:30:00Z',
      like_count: 234,
      comment_count: 45,
      repost_count: 12,
      is_liked: false,
      is_reposted: false
    },
    {
      id: '2',
      author: {
        id: '2',
        username: 'SpeedDemon',
        full_name: 'Sarah Rodriguez',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b630?w=150&h=150&fit=crop&crop=face',
        is_verified: false
      },
      content: 'Weekend ride with the crew was EPIC! 🔥 The motorcycle community is the best family! #BikerLife',
      image_urls: [],
      created_at: '2024-01-20T08:15:00Z',
      like_count: 189,
      comment_count: 28,
      repost_count: 8,
      is_liked: true,
      is_reposted: false
    }
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/posts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          // Fallback to sample data if API fails
          setPosts(samplePosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Fallback to sample data
        setPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [API_BASE]);

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote_type: 'like' })
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !post.is_liked,
                like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const PostItem = ({ post }) => (
    <div className="border-b border-gray-100 bg-white p-4">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <img
          src={post.author.profile_image_url}
          alt={post.author.full_name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {post.author.full_name}
            </h3>
            {post.author.is_verified && (
              <Verified className="w-4 h-4 text-blue-500 fill-current" />
            )}
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatTimeAgo(post.created_at)}
            </span>
          </div>
          <p className="text-gray-600 text-sm">@{post.author.username}</p>
        </div>
        <button className="text-gray-400">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
        
        {/* Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={post.image_urls[0]}
              alt="Post content"
              className="w-full max-h-80 object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comment_count}</span>
        </button>
        
        <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600">
          <Repeat className="w-5 h-5" />
          <span className="text-sm">{post.repost_count}</span>
        </button>
        
        <button 
          onClick={() => handleLike(post.id)}
          className={`flex items-center space-x-1 ${
            post.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.like_count}</span>
        </button>
        
        <button className="text-gray-500 hover:text-blue-600">
          <Share className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-blue-600">Truth Social</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2">
              <Search className="w-6 h-6 text-gray-700" />
            </button>
            <button className="p-2 relative">
              <Bell className="w-6 h-6 text-gray-700" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Filter Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex">
          <button className="flex-1 py-3 text-center font-medium text-blue-600 border-b-2 border-blue-600">
            For You
          </button>
          <button className="flex-1 py-3 text-center font-medium text-gray-500">
            Following
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Posts Feed */}
      <div>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowComposer(false)}
                  className="text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <h2 className="font-bold text-lg">New Truth</h2>
                <button
                  className={`px-4 py-2 rounded-full font-medium ${
                    newPostContent.trim()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                  disabled={!newPostContent.trim()}
                  onClick={async () => {
                    if (!newPostContent.trim()) return;
                    
                    try {
                      const response = await fetch(`${API_BASE}/api/posts`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          content: newPostContent,
                          hashtags: newPostContent.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
                        })
                      });
                      
                      if (response.ok) {
                        const newPost = await response.json();
                        setPosts([newPost, ...posts]);
                        setNewPostContent('');
                        setShowComposer(false);
                      }
                    } catch (error) {
                      console.error('Error creating post:', error);
                    }
                  }}
                >
                  Truth
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex space-x-3">
                <img
                  src={user?.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                  alt="Your profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's happening in the world of motorcycles?"
                    className="w-full text-lg placeholder-gray-500 border-none resize-none outline-none"
                    rows="6"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {280 - newPostContent.length} characters remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex items-center justify-around">
          <button className="p-3 text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          <button className="p-3 text-gray-400">
            <Search className="w-6 h-6" />
          </button>
          <button className="p-3 text-gray-400 relative">
            <Bell className="w-6 h-6" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
          <button className="p-3 text-gray-400">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="p-3 text-gray-400">
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFeedPage;