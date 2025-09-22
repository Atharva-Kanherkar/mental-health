'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    console.log('Checking authentication...');
    try {
      // Use the correct Better Auth session endpoint
      const response = await fetch('http://localhost:4000/api/auth/get-session', {
        method: 'GET',
        credentials: 'include', // Important: Send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth check data:', data);
        if (data.user) {
          const userData = {
            id: data.user.id || data.user.userId,
            email: data.user.email,
            username: data.user.name || data.user.email,
          };
          console.log('Setting user from auth check:', userData);
          setUser(userData);
        } else {
          console.log('No user in auth response');
          setUser(null);
        }
      } else {
        console.log('Auth check failed with status:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Starting login process...', { email });
    
    try {
      // Try direct fetch first to test if backend is reachable
      console.log('Testing backend connectivity...');
      const testResponse = await fetch('http://localhost:4000/health', {
        method: 'GET',
        credentials: 'include',
      });
      console.log('Backend test response:', testResponse.status);
      
      // Now try the Better Auth client
      console.log('Attempting Better Auth login...');
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });
      
      console.log('Login result:', result);
      
      if (result.data?.user) {
        const userData = {
          id: result.data.user.id,
          email: result.data.user.email,
          username: result.data.user.name || result.data.user.email,
        };
        console.log('Setting user data:', userData);
        setUser(userData);
      } else {
        console.error('Login failed:', result.error);
        throw new Error(result.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    const result = await authClient.signUp.email({
      email,
      password,
      name: username,
    });
    
    if (result.data?.user) {
      // With autoSignIn: true, user should be automatically signed in
      setUser({
        id: result.data.user.id,
        email: result.data.user.email,
        username: result.data.user.name || result.data.user.email,
      });
    } else {
      throw new Error(result.error?.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    signup,
    logout, 
    loading,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};