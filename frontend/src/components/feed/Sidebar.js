import React, { useState } from 'react';
import { Home, Search, Bell, Mail, Bookmark, User, Settings, LogOut, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('home');
  const [followingUsers, setFollowingUsers] = useState([]);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/feed' },
    { id: 'explore', label: 'Explore', icon: Search, path: '/explore' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: 3 },
    { id: 'messages', label: 'Messages', icon: Mail, path: '/messages', badge: 1 },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const trendingTopics = [
    { tag: 'HarleyDavidson', posts: '12.5K' },
    { tag: 'BikerLife', posts: '8.9K' },
    { tag: 'MotorcycleAdventure', posts: '6.2K' },
    { tag: 'RoadTrip2024', posts: '4.8K' },
    { tag: 'BikeWeek', posts: '3.1K' },
  ];

  const suggestedUsers = [
    {
      id: '1',
      username: 'RoadCaptain',
      full_name: 'Captain America',
      profile_image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      followers: '2.3M',
      is_verified: true
    },
    {
      id: '2',
      username: 'MotoBabe',
      full_name: 'Lisa Anderson',
      profile_image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      followers: '856K',
      is_verified: false
    },
    {
      id: '3',
      username: 'BikeBuilder',
      full_name: 'Custom Bikes Inc',
      profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      followers: '1.2M',
      is_verified: true
    },
  ];

  const handleMenuClick = (item) => {
    setActiveItem(item.id);
    
    // Handle navigation
    switch(item.id) {
      case 'home':
        navigate('/feed');
        break;
      case 'explore':
        navigate('/explore');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'bookmarks':
        navigate('/bookmarks');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        console.log(`Navigation to ${item.label} coming soon!`);
    }
  };

  const handleTruthButtonClick = () => {
    // TODO: Open compose modal or focus on compose box
    const composeElement = document.querySelector('textarea[placeholder*="What\'s happening"]');
    if (composeElement) {
      composeElement.focus();
      composeElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTrendingClick = (tag) => {
    // TODO: Navigate to hashtag search
    console.log(`Searching for hashtag: ${tag}`);
    navigate(`/search?q=${encodeURIComponent('#' + tag)}`);
  };

  const handleFollowUser = async (userId) => {
    // TODO: Implement follow API call
    console.log(`Following user: ${userId}`);
    
    // Optimistic UI update
    setFollowingUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    
    // TODO: Make API call
    try {
      // const response = await fetch(`${API_BASE}/api/users/${userId}/follow`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error following user:', error);
      // Revert optimistic update on error
      setFollowingUsers(prev => 
        prev.includes(userId) 
          ? [...prev, userId]
          : prev.filter(id => id !== userId)
      );
    }
  };

  const handleShowMoreUsers = () => {
    console.log('Loading more suggested users...');
    // TODO: Load more suggested users
  };

  const handleEventClick = (eventName) => {
    console.log(`Opening event: ${eventName}`);
    // TODO: Navigate to event details
  };

  const handleViewAllEvents = () => {
    navigate('/events');
  };

  return (
    <div className="w-80 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600">GreaseMonkey</h1>
          <p className="text-sm text-gray-500 mt-1">World of Motor Heads</p>
        </div>

        {/* User Profile */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <img
              src={user?.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
              alt={user?.full_name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user?.full_name || 'Motor Head'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                @{user?.username || 'username'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{user?.following_count || 156}</div>
              <div className="text-gray-500">Following</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{user?.followers_count || 234}</div>
              <div className="text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{user?.post_count || 89}</div>
              <div className="text-gray-500">Truths</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mb-8">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                        isActive 
                          ? 'bg-white text-blue-600' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Truth Button */}
        <button 
          onClick={handleTruthButtonClick}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors mb-8"
        >
          Truth
        </button>

        {/* Trending Section */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Trending in Motorcycles</h3>
            </div>
            <div className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer hover:bg-white rounded-lg p-2 transition-colors"
                  onClick={() => handleTrendingClick(topic.tag)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-600 hover:text-blue-700">#{topic.tag}</span>
                    <span className="text-sm text-gray-500">{topic.posts} truths</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested Users */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Who to follow</h3>
            </div>
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser) => {
                const isFollowing = followingUsers.includes(suggestedUser.id);
                return (
                  <div key={suggestedUser.id} className="flex items-center space-x-3">
                    <img
                      src={suggestedUser.profile_image_url}
                      alt={suggestedUser.full_name}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      onClick={() => navigate(`/profile/${suggestedUser.username}`)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <h4 className="font-medium text-gray-900 truncate text-sm cursor-pointer hover:text-blue-600"
                            onClick={() => navigate(`/profile/${suggestedUser.username}`)}>
                          {suggestedUser.full_name}
                        </h4>
                        {suggestedUser.is_verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">@{suggestedUser.username}</p>
                      <p className="text-xs text-gray-400">{suggestedUser.followers} followers</p>
                    </div>
                    <button 
                      onClick={() => handleFollowUser(suggestedUser.id)}
                      className={`px-4 py-1 text-sm rounded-full transition-colors ${
                        isFollowing 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={handleShowMoreUsers}
              className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
            >
              Show more
            </button>
          </div>
        </div>

        {/* Events Section */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Upcoming Events</h3>
            </div>
            <div className="space-y-3">
              <div 
                className="cursor-pointer hover:bg-white rounded-lg p-2 transition-colors"
                onClick={() => handleEventClick('Sturgis Motorcycle Rally')}
              >
                <h4 className="font-medium text-gray-900 text-sm hover:text-blue-600">Sturgis Motorcycle Rally</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Sturgis, SD</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Aug 5-14, 2024</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-white rounded-lg p-2 transition-colors"
                onClick={() => handleEventClick('Daytona Bike Week')}
              >
                <h4 className="font-medium text-gray-900 text-sm hover:text-blue-600">Daytona Bike Week</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Daytona Beach, FL</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Mar 8-17, 2024</p>
              </div>
            </div>
            <button 
              onClick={handleViewAllEvents}
              className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
            >
              View all events
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;