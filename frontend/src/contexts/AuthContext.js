import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('greasemonkey_token'));
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  const API_BASE = `${BACKEND_URL}`;

  // Configure axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE}/api/auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Clear invalid token
          localStorage.removeItem('greasemonkey_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, API_BASE]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Store token and set user
      localStorage.setItem('greasemonkey_token', access_token);
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, userData);

      const { access_token, user: newUser } = response.data;
      
      // Store token and set user
      localStorage.setItem('greasemonkey_token', access_token);
      setToken(access_token);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const socialLogin = async (provider, credentials) => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/social-login`, {
        provider,
        credentials
      });

      const { access_token, user: userData } = response.data;
      
      // Store token and set user
      localStorage.setItem('greasemonkey_token', access_token);
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Social login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Social login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('greasemonkey_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    socialLogin,
    logout,
    updateUser,
    isAuthenticated: !!user,
    API_BASE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};