import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthPage from '../auth/AuthPage';
import { Loader2 } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading GreaseMonkey...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // If authenticated, just render children (MainLayout will handle navbar and layout)
  return children;
};

export default Layout;