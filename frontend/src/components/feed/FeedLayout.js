import React from 'react';
import Sidebar from './Sidebar';
import FeedPage from './FeedPage';

const FeedLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-80">
        <FeedPage />
      </div>
      
      {/* Right Sidebar for larger screens */}
      <div className="hidden xl:block w-80 p-6">
        <div className="sticky top-6 space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Truth Social"
                className="w-full bg-gray-100 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Truth Social Stats */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Community Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-gray-900">2.3M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Daily Truths</span>
                <span className="font-semibold text-gray-900">156K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Communities</span>
                <span className="font-semibold text-gray-900">8.9K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Countries</span>
                <span className="font-semibold text-gray-900">95</span>
              </div>
            </div>
          </div>

          {/* Sponsored Content */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Sponsored</h3>
              <span className="text-xs text-gray-500">Ad</span>
            </div>
            <div className="space-y-3">
              <div className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=150&fit=crop"
                  alt="Motorcycle gear ad"
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h4 className="font-medium text-gray-900 text-sm">Premium Motorcycle Gear</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Discover the latest in motorcycle safety and style. Shop now for exclusive deals.
                </p>
                <span className="text-xs text-blue-600 font-medium">motorcyclegear.com</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:text-blue-600">Privacy Policy</a>
                <span>·</span>
                <a href="#" className="hover:text-blue-600">Terms of Service</a>
                <span>·</span>
                <a href="#" className="hover:text-blue-600">Cookie Policy</a>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:text-blue-600">Accessibility</a>
                <span>·</span>
                <a href="#" className="hover:text-blue-600">Ads info</a>
                <span>·</span>
                <a href="#" className="hover:text-blue-600">More</a>
              </div>
              <p className="mt-3">© 2024 GreaseMonkey. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;