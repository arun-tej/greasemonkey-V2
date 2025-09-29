import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Repeat, Share, MoreHorizontal, Verified, ChevronDown, Search, Bell, Mail, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './FeedStyles.css';

const FeedPage = () => {
  const { user, API_BASE } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef();
  const [newPostContent, setNewPostContent] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou'); // 'forYou' or 'following'
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'

  // Sample data similar to Truth Social
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
      content: 'Just completed an amazing 500-mile ride through the mountains! The new Harley is performing beautifully. Nothing beats the freedom of the open road! 🏍️',
      image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
      created_at: '2024-01-20T10:30:00Z',
      like_count: 234,
      comment_count: 45,
      repost_count: 12,
      hashtags: ['motorcycle', 'freedom', 'harley'],
      user_vote: null,
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
      content: 'Weekend ride with the crew was EPIC! 🔥 Hit some amazing twisties and discovered a new favorite café. The motorcycle community is the best family you could ask for! #BikerLife #Brotherhood',
      image_urls: [],
      created_at: '2024-01-20T08:15:00Z',
      like_count: 189,
      comment_count: 28,
      repost_count: 8,
      hashtags: ['BikerLife', 'Brotherhood'],
      user_vote: 'like',
      is_liked: true,
      is_reposted: false
    },
    {
      id: '3',
      author: {
        id: '3',
        username: 'TechBiker',
        full_name: 'Alex Chen',
        profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        is_verified: true
      },
      content: 'Just installed the new GPS system on my bike. Technology and motorcycles make the perfect combination! Real-time traffic updates and route optimization are game changers.',
      image_urls: ['https://images.unsplash.com/photo-1609057159688-df9b5b5a3a07?w=600&h=400&fit=crop'],
      created_at: '2024-01-19T22:45:00Z',
      like_count: 156,
      comment_count: 33,
      repost_count: 15,
      hashtags: ['tech', 'motorcycle', 'GPS'],
      user_vote: null,
      is_liked: false,
      is_reposted: true
    }
  ];

  // Test backend connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data.message);
        setConnectionStatus('connected');
        return true;
      } else {
        console.warn('⚠️ Backend responded with error:', response.status);
        setConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
    
    // Add dev tools helper for testing
    if (process.env.NODE_ENV === 'development') {
      window.testGreaseMonkeyAPI = testAllEndpoints;
      console.log('🔧 Development mode: Use window.testGreaseMonkeyAPI() to test all endpoints');
    }
  }, [API_BASE]);

  // Comprehensive API endpoint testing
  const testAllEndpoints = async () => {
    console.log('📝 Testing all API endpoints...');
    
    const tests = [
      {
        name: 'Health Check',
        url: `${API_BASE}/api/`,
        method: 'GET'
      },
      {
        name: 'Posts Feed',
        url: `${API_BASE}/api/posts`,
        method: 'GET'
      },
      {
        name: 'User Authentication',
        url: `${API_BASE}/api/auth/me`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer mock_token_1' }
      },
      {
        name: 'Login',
        url: `${API_BASE}/api/auth/login`,
        method: 'POST',
        body: { email: 'john@example.com', password: 'demo' }
      }
    ];

    for (const test of tests) {
      try {
        const options = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            ...test.headers
          }
        };
        
        if (test.body) {
          options.body = JSON.stringify(test.body);
        }
        
        const response = await fetch(test.url, options);
        
        if (response.ok) {
          console.log(`✅ ${test.name}: Success (${response.status})`);
        } else {
          console.warn(`⚠️ ${test.name}: Failed (${response.status})`);
        }
      } catch (error) {
        console.error(`❌ ${test.name}: Error -`, error.message);
      }
    }
    
    console.log('✨ API endpoint testing completed!');
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('📝 Fetching posts from:', `${API_BASE}/api/posts`);
        
        const response = await fetch(`${API_BASE}/api/posts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Posts API response:', data);
          let postsData = [];
          
          // Handle different API response formats
          if (Array.isArray(data)) {
            postsData = data;
          } else if (data && Array.isArray(data.posts)) {
            postsData = data.posts;
          } else {
            console.warn('API response is not in expected format:', data);
            setPosts(samplePosts);
            return;
          }
          
          // Transform API posts to match frontend expectations
          const transformedPosts = postsData.map(post => ({
            id: post.id,
            author: {
              id: post.author_id || '1',
              username: post.author_name ? post.author_name.replace(/\s+/g, '').toLowerCase() : 'user',
              full_name: post.author_name || 'Anonymous User',
              profile_image_url: post.author_profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
              is_verified: post.is_verified || false
            },
            content: post.content || '',
            image_urls: post.image_urls || [],
            created_at: post.created_at || new Date().toISOString(),
            like_count: post.like_count || 0,
            comment_count: post.comment_count || 0,
            repost_count: post.repost_count || 0,
            hashtags: post.hashtags || [],
            user_vote: post.user_vote || null,
            is_liked: post.is_liked || false,
            is_reposted: post.is_reposted || false
          }));
          
          console.log('✨ Transformed posts:', transformedPosts);
          setPosts(transformedPosts);
          setConnectionStatus('connected');
        } else {
          console.warn('⚠️ API request failed with status:', response.status);
          setPosts(samplePosts);
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('❌ Error fetching posts:', error);
        setPosts(samplePosts);
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [API_BASE]);

  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

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
      
      if (response.ok && Array.isArray(posts)) {
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

  const handleRepost = async (postId) => {
    try {
      // For now, just update locally - implement repost API later
      if (Array.isArray(posts)) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_reposted: !post.is_reposted,
                repost_count: post.is_reposted ? post.repost_count - 1 : post.repost_count + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return postDate.toLocaleDateString();
  };

  // Header button handlers
  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setShowNotifications(false);
    setShowMessages(false);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setShowSearch(false);
    setShowMessages(false);
    // TODO: Mark notifications as read
  };

  const handleMessagesClick = () => {
    setShowMessages(!showMessages);
    setShowSearch(false);
    setShowNotifications(false);
  };

  // Feed tab handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // TODO: Fetch different posts based on tab
    if (tab === 'following') {
      // Filter posts from followed users
      console.log('Switching to Following feed');
    } else {
      // Show all posts (For You)
      console.log('Switching to For You feed');
    }
  };

  // Image upload handlers
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const imageUrls = imageFiles.map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...imageUrls]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Comment handler
  const handleComment = (postId) => {
    // TODO: Open comment modal/sheet
    console.log('Opening comments for post:', postId);
  };

  // Share handler
  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: `${post.author.full_name} on GreaseMonkey`,
        text: post.content,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Check out this truth: ${post.content} - ${window.location.href}`);
      alert('Link copied to clipboard!');
    }
  };

  // Search functionality
  const handleSearch = (query) => {
    if (!query.trim()) return;
    
    // TODO: Implement actual search
    console.log('Searching for:', query);
    // Filter posts by content or hashtags
    const filteredPosts = posts.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase()) ||
      post.hashtags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    console.log('Search results:', filteredPosts);
  };

  const PostItem = ({ post, isLast }) => {
    // Safety checks for post and author data
    if (!post || !post.author) {
      return null;
    }
    
    const author = post.author || {};
    const safePost = {
      id: post.id || '',
      content: post.content || '',
      image_urls: post.image_urls || [],
      created_at: post.created_at || new Date().toISOString(),
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      repost_count: post.repost_count || 0,
      hashtags: post.hashtags || [],
      is_liked: post.is_liked || false,
      is_reposted: post.is_reposted || false
    };
    
    return (
      <div 
        ref={isLast ? lastPostElementRef : null}
        className="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start space-x-3">
            <img
              src={author.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
              alt={author.full_name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900 truncate">
                  {author.full_name || 'Anonymous User'}
                </h3>
                {author.is_verified && (
                  <Verified className="w-5 h-5 text-blue-500 fill-current" />
                )}
                <span className="text-gray-500 truncate">
                  @{author.username || 'user'}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-sm">
                  {formatTimeAgo(safePost.created_at)}
                </span>
              </div>
              
              {/* Content */}
              <div className="mt-2">
                <p className="text-gray-900 text-base leading-relaxed">
                  {safePost.content}
                </p>
                
                {/* Images */}
                {safePost.image_urls && safePost.image_urls.length > 0 && (
                  <div className="mt-3 rounded-2xl overflow-hidden">
                    <img
                      src={safePost.image_urls[0]}
                      alt="Post content"
                      className="w-full max-h-96 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Hashtags */}
                {safePost.hashtags && safePost.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {safePost.hashtags.map((tag, index) => (
                      <span 
                        key={index}
                        className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="mt-4 flex items-center justify-between max-w-md">
                <button 
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group"
                  onClick={() => handleComment(safePost.id)}
                  title="Comment"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{safePost.comment_count}</span>
                </button>
                
                <button 
                  className={`flex items-center space-x-2 transition-colors group ${
                    safePost.is_reposted ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                  }`}
                  onClick={() => handleRepost(safePost.id)}
                >
                  <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{safePost.repost_count}</span>
                </button>
                
                <button 
                  className={`flex items-center space-x-2 transition-colors group ${
                    safePost.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  }`}
                  onClick={() => handleLike(safePost.id)}
                >
                  <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                    <Heart className={`w-5 h-5 ${safePost.is_liked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-sm font-medium">{safePost.like_count}</span>
                </button>
                
                <button 
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group"
                  onClick={() => handleShare(post)}
                  title="Share"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                    <Share className="w-5 h-5" />
                  </div>
                </button>
                
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ComposePost = () => {
    const handleSubmit = async () => {
      if (!newPostContent.trim() && selectedImages.length === 0) return;
      
      try {
        const postData = {
          content: newPostContent,
          hashtags: newPostContent.match(/#\w+/g)?.map(tag => tag.slice(1)) || [],
          image_urls: selectedImages // In a real app, these would be uploaded to a server first
        };
        
        const response = await fetch(`${API_BASE}/api/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });
        
        if (response.ok) {
          const newPost = await response.json();
          if (Array.isArray(posts)) {
            setPosts([newPost, ...posts]);
          } else {
            setPosts([newPost]);
          }
          setNewPostContent('');
          setSelectedImages([]);
          setShowComposer(false);
        }
      } catch (error) {
        console.error('Error creating post:', error);
      }
    };
    
    return (
      <div className="border-b border-gray-100 bg-white p-4">
        <div className="flex space-x-3">
          <img
            src={user?.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt="Your profile"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's happening in the world of motorcycles?"
              className="w-full text-xl placeholder-gray-500 border-none resize-none outline-none"
              rows="3"
            />
            
            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {selectedImages.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-blue-600">
                <button 
                  onClick={handleImageUpload}
                  className="hover:bg-blue-50 p-2 rounded-full transition-colors" 
                  title="Add photos"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  className="hover:bg-blue-50 p-2 rounded-full transition-colors" 
                  title="Add video"
                  onClick={() => alert('Video upload coming soon!')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <button 
                className={`px-6 py-2 rounded-full font-bold transition-colors ${
                  (newPostContent.trim() || selectedImages.length > 0)
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!newPostContent.trim() && selectedImages.length === 0}
                onClick={handleSubmit}
              >
                Truth
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Home</h1>
              {/* Connection Status Indicator */}
              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-700' 
                  : connectionStatus === 'disconnected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-500' 
                    : connectionStatus === 'disconnected'
                    ? 'bg-red-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' 
                    ? 'Connected' 
                    : connectionStatus === 'disconnected'
                    ? 'Offline'
                    : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSearchClick}
                className={`p-2 rounded-full transition-colors ${
                  showSearch 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNotificationsClick}
                className={`p-2 rounded-full transition-colors relative ${
                  showNotifications 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <button 
                onClick={handleMessagesClick}
                className={`p-2 rounded-full transition-colors relative ${
                  showMessages 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Messages"
              >
                <Mail className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  1
                </span>
              </button>
              <button 
                onClick={testAllEndpoints}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Test API Connection"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search GreaseMonkey..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="flex-1 text-lg border-none outline-none placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-900 mb-3">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">BikerMike</span> liked your truth about the mountain ride
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">SpeedDemon</span> commented on your post
                  </p>
                  <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">TechBiker</span> started following you
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Panel */}
      {showMessages && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-900 mb-3">Messages</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">RoadCaptain</h4>
                    <span className="text-xs text-gray-500">10m</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">Hey! Want to join our ride this weekend?</p>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">MotoBabe</h4>
                    <span className="text-xs text-gray-500">2h</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">Thanks for the bike recommendation!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Compose Post */}
        <ComposePost />
        
        {/* Feed Filter Tabs */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex">
            <button 
              onClick={() => handleTabChange('forYou')}
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                activeTab === 'forYou'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              For You
            </button>
            <button 
              onClick={() => handleTabChange('following')}
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
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
        <div className="bg-white">
          {Array.isArray(posts) && posts.map((post, index) => (
            <PostItem 
              key={post.id} 
              post={post} 
              isLast={index === posts.length - 1}
            />
          ))}
          
          {/* Show message if no posts */}
          {Array.isArray(posts) && posts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>No posts to show yet.</p>
              <p className="text-sm mt-1">Be the first to share something with the community!</p>
            </div>
          )}
        </div>

        {/* Load More Indicator */}
        {!loading && hasMore && (
          <div className="flex justify-center items-center py-4 bg-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* End of Feed */}
        {!loading && !hasMore && (
          <div className="text-center py-8 text-gray-500 bg-white">
            <p>You're all caught up!</p>
            <p className="text-sm mt-1">Check back later for more truths from the motorcycle community</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;