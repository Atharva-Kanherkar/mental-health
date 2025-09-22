'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  getBackgroundClass: () => string;
  getCardClass: () => string;
  getTextClass: () => string;
  getAccentClass: () => string;
  getBorderClass: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  const getBackgroundClass = () => {
    return isDark 
      ? 'min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black' 
      : 'min-h-screen bg-gradient-to-br from-[#6B5FA8]/5 via-purple-50/30 to-white';
  };

  const getCardClass = () => {
    return isDark
      ? 'bg-gray-800/70 backdrop-blur-md border-gray-700/50'
      : 'bg-white/70 backdrop-blur-md border-white/30';
  };

  const getTextClass = () => {
    return isDark ? 'text-gray-100' : 'text-gray-800';
  };

  const getAccentClass = () => {
    return isDark ? 'text-purple-300' : 'text-[#6B5FA8]';
  };

  const getBorderClass = () => {
    return isDark ? 'border-gray-700' : 'border-gray-200';
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark,
    getBackgroundClass,
    getCardClass,
    getTextClass,
    getAccentClass,
    getBorderClass,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}