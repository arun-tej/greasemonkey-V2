import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card.jsx';
import { Alert, AlertDescription } from '../ui/alert.jsx';
import { Loader2 } from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';

const LoginForm = ({ onSwitchToRegister }) => {
  const { login, socialLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting login with:', { email: formData.email, password: '***' });
    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSocialLogin = async (provider, credentials) => {
    setLoading(true);
    setError('');

    const result = await socialLogin(provider, credentials);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    const result = await login('john@example.com', 'demo');
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-800">Welcome Back</CardTitle>
        <CardDescription className="text-center text-gray-600">
          Sign in to your GreaseMonkey account
        </CardDescription>
        <div className="text-center text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 Demo: Use john@example.com with any password, or click "Demo Login"
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          
          {/* Demo Login Button */}
          <Button 
            type="button"
            variant="outline"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Demo Login (John Rider)
          </Button>
          
          {/* Social Login Buttons */}
          <SocialLoginButtons onSocialLogin={handleSocialLogin} loading={loading} />
          
          <p className="text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Sign up
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;