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
      // OPTIMIZATION: Check local cache first (instant)
      const cachedSession = await SecureStore.getItemAsync('auth_session');

      if (cachedSession) {
        try {
          const parsed = JSON.parse(cachedSession);
          if (parsed.user) {
            // Show cached user immediately (optimistic)
            setUser(parsed.user);
            setIsLoading(false); // Stop loading immediately!

            // Verify in background (don't block UI)
            verifySessionInBackground();
            return;
          }
        } catch (e) {
          console.error('Failed to parse cached session:', e);
        }
      }

      // No cache - do full check
      setIsLoading(true);
      const session = await api.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await SecureStore.setItemAsync('auth_session', JSON.stringify(session));
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySessionInBackground = async () => {
    // Silently verify session validity without blocking UI
    try {
      const session = await api.auth.getSession();
      if (session?.user) {
        // Update cached user if changed
        setUser(session.user);
        await SecureStore.setItemAsync('auth_session', JSON.stringify(session));
      } else {
        // Session invalid - logout
        setUser(null);
        await SecureStore.deleteItemAsync('auth_session');
        await SecureStore.deleteItemAsync('session_token');
      }
    } catch (error) {
      console.error('Background session verification failed:', error);
      // Don't logout on network errors - keep cached user
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
