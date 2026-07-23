import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.getMe();
        // response structure from ApiResponse: { success, message, data: { user } }
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('Session restore failed or no active session');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      setUser(null);
      throw error.response?.data?.message || error.message || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      setUser(null);
      throw error.response?.data?.message || error.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
