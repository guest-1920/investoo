import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import { setupInterceptors } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to fetch profile on load to see if cookie is valid
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        // Not logged in or invalid token
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Setup global 401 handling
    setupInterceptors(() => {
      setUser(null);
    });
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
