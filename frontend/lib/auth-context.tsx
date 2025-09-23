 'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  logout: () => Promise<void>;
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
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeUser = useCallback((u: any): User => ({
    id: u.id || u.userId,
    email: u.email,
    username: u.name || u.email,
  }), []);

  const checkAuth = useCallback(async () => {
    try {
      // Use Better Auth client to read the session; avoids manual fetch shape/version drift
      const { data, error } = await authClient.getSession({
        // ensure no caching of session on the client side
        fetchOptions: { cache: 'no-store' },
      });
      if (error) {
        setUser(null);
        return;
      }
      if (data?.user) {
        setUser(normalizeUser(data.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [normalizeUser]);

  const login = async (email: string, password: string) => {
    // Perform sign-in with the Better Auth client (credentials included by default via client config)
    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });
    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }

    // Critical: verify the cookie round-trip actually succeeded before setting UI state
    const session = await authClient.getSession({
      fetchOptions: { cache: 'no-store' },
    });
    if (session.data?.user) {
      setUser(normalizeUser(session.data.user));
    } else {
      setUser(null);
      throw new Error('Login succeeded but no session cookie was stored');
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    const result = await authClient.signUp.email({
      email,
      password,
      name: username,
      // autoSignIn is true by default; rely on getSession to confirm
    });
    if (result.error) {
      throw new Error(result.error.message || 'Signup failed');
    }

    // Confirm session after auto sign-in
    const session = await authClient.getSession({
      fetchOptions: { cache: 'no-store' },
    });
    if (session.data?.user) {
      setUser(normalizeUser(session.data.user));
    } else {
      setUser(null);
      throw new Error('Signup succeeded but no session cookie was stored');
    }
  };

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
    // Optional: refresh session when tab gains focus
    const onFocus = () => checkAuth();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
