import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('aayu_token');
      if (token) {
        try {
          const response = await authApi.getProfile();
          setUser(response.data.data);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('aayu_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { token, user: userData } = response.data.data;
      localStorage.setItem('aayu_token', token);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('aayu_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('aayu_token');
    if (token) {
      try {
        const response = await authApi.getProfile();
        setUser(response.data.data);
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
  };

  useEffect(() => {
    if (user && user.themePreference) {
      if (user.themePreference === 'light') {
        document.body.classList.add('light');
      } else {
        document.body.classList.remove('light');
      }
    } else {
      document.body.classList.remove('light');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
