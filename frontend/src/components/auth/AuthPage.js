import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Bike } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="bg-orange-500 p-3 rounded-full">
              <Bike className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">GreaseMonkey</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl font-semibold">
              Connect with the motorcycle community
            </h2>
            <p className="text-lg text-slate-300">
              Join garages, share your rides, plan group adventures, and connect with fellow motorcycle enthusiasts around the world.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">🏍️ Join Garages</h3>
              <p className="text-sm text-slate-300">Connect with local and global riding communities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">📸 Share Rides</h3>
              <p className="text-sm text-slate-300">Post photos and stories from your adventures</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">🗺️ Plan Routes</h3>
              <p className="text-sm text-slate-300">Organize group rides and discover new paths</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">🛒 Marketplace</h3>
              <p className="text-sm text-slate-300">Buy and sell motorcycle parts and gear</p>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth Forms */}
        <div className="flex items-center justify-center">
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;