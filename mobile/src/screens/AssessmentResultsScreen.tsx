/**
 * Assessment Results Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { AssessmentResponse } from '../types/assessment';
import { CloseIcon, HeartIcon } from '../components/Icons';

export const AssessmentResultsScreen = ({ route, navigation }: any) => {
  const { result } = route.params as { result: AssessmentResponse };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'minimal': return theme.colors.mood.excellent;
      case 'mild': return theme.colors.mood.good;
      case 'moderate': return theme.colors.mood.okay;
      case 'moderately_severe': return theme.colors.mood.struggling;
      case 'severe': return theme.colors.mood.difficult;
      default: return theme.colors.primary;
    }
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <CloseIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.scoreCard}>
            <HeartIcon size={64} color={getRiskColor(result.riskLevel)} />
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={[styles.score, { color: getRiskColor(result.riskLevel) }]}>
              {result.totalScore}
            </Text>
            {result.riskLevel && (
              <Text style={[styles.riskLevel, { color: getRiskColor(result.riskLevel) }]}>
                {result.riskLevel.replace('_', ' ').toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              These results are for informational purposes only and do not constitute medical advice.
              Please consult with a healthcare professional for proper diagnosis and treatment.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface.whiteAlpha70,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  scrollContent: { padding: theme.spacing.lg },
  scoreCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  scoreLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  score: {
    fontSize: 64,
    fontWeight: theme.fontWeights.bold as any,
    marginBottom: theme.spacing.sm,
  },
  riskLevel: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold as any,
  },
  infoCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
});
