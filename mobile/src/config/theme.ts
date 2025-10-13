/**
 * Theme Configuration - Matches Frontend Design System
 * Colors, fonts, and styles from the Next.js frontend
 */

export const theme = {
  colors: {
    // Primary purple palette
    primary: '#6B5FA8',
    primaryDark: '#5A4F96',
    primaryLight: '#8B86B8',

    // Background gradients
    background: {
      light: '#FAFAFE',
      lightMid: '#F6F4FC',
      lightEnd: '#F0EDFA',
    },

    // Purple tints for decorative elements
    purple: {
      lightest: '#F8F6FF',
      veryLight: '#F0EDFA',
      light: '#EBE7F8',
      medium: '#E0DBF3',
      base: '#6B5FA8',
      dark: '#5A4F96',
      muted: '#8B86B8',
    },

    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Text colors
    text: {
      primary: '#6B5FA8',
      secondary: '#8B86B8',
      light: '#A8A3C8',
      dark: '#4A4A4A',
    },

    // Border colors
    border: {
      light: 'rgba(139, 134, 184, 0.1)',
      medium: 'rgba(139, 134, 184, 0.2)',
      strong: 'rgba(139, 134, 184, 0.3)',
    },

    // Card/Surface colors
    surface: {
      white: '#FFFFFF',
      whiteAlpha80: 'rgba(255, 255, 255, 0.8)',
      whiteAlpha70: 'rgba(255, 255, 255, 0.7)',
      whiteAlpha60: 'rgba(255, 255, 255, 0.6)',
      whiteAlpha40: 'rgba(255, 255, 255, 0.4)',
    },

    // Mood colors
    mood: {
      excellent: '#10B981',  // green
      good: '#84CC16',       // lime
      okay: '#F59E0B',       // yellow
      struggling: '#F97316', // orange
      difficult: '#EF4444',  // red
    },
  },

  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    // Serif for journal content (Georgia equivalent on mobile)
    serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#6B5FA8',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#6B5FA8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#6B5FA8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#6B5FA8',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};

export type Theme = typeof theme;

import { Platform } from 'react-native';
