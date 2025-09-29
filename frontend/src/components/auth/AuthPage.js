import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Centered Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_codeflow-9/artifacts/ly6ycfum_Gemini_Generated_Image_ni2zlyni2zlyni2z.svg" 
              alt="GreaseMonkey Logo" 
              className="w-40 h-40 object-contain object-center"
            />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-wide" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            GreaseMonkey
          </h1>
          <p className="text-gray-500 text-base font-medium">
            World of Motor Heads
          </p>
        </div>
        
        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;