import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';

const RegisterForm = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    bio: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Prepare registration data
    const registrationData = {
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      password: formData.password,
      bio: formData.bio || undefined,
      location: formData.location || undefined
    };

    const result = await register(registrationData);
    
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

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-800">Join GreaseMonkey</CardTitle>
        <CardDescription className="text-center text-gray-600">
          Create your account and connect with riders
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={3}
                maxLength={20}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-700 font-medium">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
                maxLength={50}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
            
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
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-700 font-medium">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                maxLength={100}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-700 font-medium">Bio (Optional)</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself and your riding style..."
                value={formData.bio}
                onChange={handleChange}
                disabled={loading}
                maxLength={500}
                rows={3}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
              />
            </div>
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          
          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign in
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;