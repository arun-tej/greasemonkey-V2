import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex">
        {/* Left Sidebar - Hidden on mobile, shown as overlay */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white/95 backdrop-blur-sm border-r border-blue-200/50 lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          transition duration-200 ease-in-out lg:transition-none
        `}>
          <div className="flex items-center justify-between p-4 border-b border-blue-200/50 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-blue-50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-6xl mx-auto">
            {/* Mobile menu button */}
            <div className="lg:hidden p-4 border-b bg-white/90 backdrop-blur-sm border-blue-200/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-blue-50"
              >
                <Menu className="h-5 w-5 mr-2" />
                Menu
              </Button>
            </div>
            
            {/* Page content */}
            <div className="lg:flex lg:gap-6 p-4">
              <div className="flex-1">
                {children}
              </div>
              
              {/* Right Sidebar - Hidden on mobile and tablet */}
              <div className="hidden xl:block w-80">
                <RightSidebar />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;