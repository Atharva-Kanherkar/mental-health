/**
 * Auth Context
 * Manages authentication state with Better Auth
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User, LoginCredentials, SignUpData } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);

      // Retry logic for network errors on app startup
      let retries = 3;
      let session = null;

      while (retries > 0) {
        try {
          session = await api.auth.getSession();
          break;
        } catch (error: any) {
          const isNetworkError = error.message?.includes('Network') || error.code === 'ERR_NETWORK';
          if (isNetworkError && retries > 1) {
            console.log(`Auth check network error, retrying... (${retries - 1} left)`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            retries--;
          } else {
            throw error;
          }
        }
      }

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Graceful fallback - just show login screen
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user: loggedInUser } = await api.auth.login(credentials);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignUpData) => {
    try {
      const { user: newUser } = await api.auth.signup(data);
      setUser(newUser);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      await SecureStore.deleteItemAsync('auth_session');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user locally even if server logout fails
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
