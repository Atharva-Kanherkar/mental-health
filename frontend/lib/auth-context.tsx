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
    try {
      // Use the correct Better Auth session endpoint
      const response = await fetch('http://localhost:4000/api/auth/get-session', {
        method: 'GET',
        credentials: 'include', // Important: Send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser({
            id: data.user.id || data.user.userId,
            email: data.user.email,
            username: data.user.name || data.user.email,
          });
        } else {
          setUser(null);
        }
      } else {
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
    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });
    
    if (result.data?.user) {
      setUser({
        id: result.data.user.id,
        email: result.data.user.email,
        username: result.data.user.name || result.data.user.email,
      });
    } else {
      throw new Error(result.error?.message || 'Login failed');
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