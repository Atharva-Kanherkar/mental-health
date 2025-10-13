/**
 * Custom Slider Component for Mood Tracking
 * Matches frontend slider design
 * Using React Native's built-in Slider (works with Expo Go)
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
// @ts-ignore - Slider is deprecated but still works in Expo
import SliderBase from '@react-native-community/slider';
import { theme } from '../config/theme';

interface SliderComponentProps {
  label: string;
  value?: number;
  onValueChange: (value: number) => void;
  minimumLabel: string;
  maximumLabel: string;
  icon?: React.ReactNode;
}

// Simple Slider wrapper for basic use
interface SimpleSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
}

export const Slider: React.FC<SimpleSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
}) => {
  return (
    <SliderBase
      style={{ width: '100%', height: 40 }}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      value={value}
      onValueChange={onValueChange}
      minimumTrackTintColor={theme.colors.primary}
      maximumTrackTintColor={theme.colors.border.medium}
      thumbTintColor={theme.colors.primary}
    />
  );
};

export const SliderComponent: React.FC<SliderComponentProps> = ({
  label,
  value = 5,
  onValueChange,
  minimumLabel,
  maximumLabel,
  icon,
}) => {
  const getMoodColor = (val: number) => {
    if (val >= 8) return theme.colors.success;
    if (val >= 6) return '#F59E0B';
    if (val >= 4) return '#F97316';
    return theme.colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {icon}
        <Text style={styles.label}>{label}</Text>
        {value && (
          <Text style={styles.valueText}>({value}/10)</Text>
        )}
      </View>

      <SliderBase
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={getMoodColor(value)}
        maximumTrackTintColor={theme.colors.border.medium}
        thumbTintColor={theme.colors.primary}
      />

      <View style={styles.labelsRow}>
        <Text style={styles.minMaxLabel}>{minimumLabel}</Text>
        <Text style={styles.minMaxLabel}>{maximumLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    flex: 1,
  },
  valueText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.light as any,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -theme.spacing.xs,
  },
  minMaxLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    fontWeight: theme.fontWeights.light as any,
  },
});
