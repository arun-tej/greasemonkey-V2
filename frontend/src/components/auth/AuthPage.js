import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6 text-center lg:text-left">
          {/* Centered Logo */}
          <div className="flex flex-col items-center lg:items-start space-y-4">
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_codeflow-9/artifacts/lz1argy3_Gemini_Generated_Image_bhb3n2bhb3n2bhb3.png" 
                alt="GreaseMonkey Logo" 
                className="w-full h-full object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(139, 69, 19, 0.5))'
                }}
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              GreaseMonkey
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-100">
              Connect with the motorcycle community
            </h2>
            <p className="text-lg text-gray-300">
              Join garages, share your rides, plan group adventures, and connect with fellow motorcycle enthusiasts around the world.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h3 className="font-semibold text-amber-400 mb-2">🏍️ Join Garages</h3>
              <p className="text-sm text-gray-300">Connect with local and global riding communities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h3 className="font-semibold text-amber-400 mb-2">📸 Share Rides</h3>
              <p className="text-sm text-gray-300">Post photos and stories from your adventures</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h3 className="font-semibold text-amber-400 mb-2">🗺️ Plan Routes</h3>
              <p className="text-sm text-gray-300">Organize group rides and discover new paths</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h3 className="font-semibold text-amber-400 mb-2">🛒 Marketplace</h3>
              <p className="text-sm text-gray-300">Buy and sell motorcycle parts and gear</p>
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