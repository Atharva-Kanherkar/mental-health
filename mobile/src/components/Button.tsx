/**
 * Custom Button Component
 * Matches frontend design aesthetic
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../config/theme';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  isLoading = false,
  icon,
  style,
  textStyle,
  children,
}) => {
  const isDisabled = disabled || loading || isLoading;

  const getButtonStyle = (): ViewStyle => {
    const base = {
      ...styles.button,
      ...(isDisabled && styles.buttonDisabled),
    };

    switch (variant) {
      case 'primary':
        return { ...base, ...styles.buttonPrimary };
      case 'outline':
        return { ...base, ...styles.buttonOutline };
      case 'ghost':
        return { ...base, ...styles.buttonGhost };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base = styles.buttonText;

    switch (variant) {
      case 'primary':
        return { ...base, ...styles.buttonTextPrimary };
      case 'outline':
        return { ...base, ...styles.buttonTextOutline };
      case 'ghost':
        return { ...base, ...styles.buttonTextGhost };
      default:
        return base;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {(loading || isLoading) ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : children ? (
        children
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    ...theme.shadows.sm, // Less shadow
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.normal as any,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: theme.colors.primary,
  },
  buttonTextGhost: {
    color: theme.colors.text.secondary,
  },
});
