/**
 * Profile Analysis Screen - AI insights from profile
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { MentalHealthAnalysis } from '../types/profile';
import { ArrowBackIcon } from '../components/Icons';

export const ProfileAnalysisScreen = ({ route, navigation }: any) => {
  const { analysis } = route.params as { analysis: MentalHealthAnalysis };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Analysis</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Wellness Score</Text>
            <Text style={styles.score}>{analysis.wellnessScore}/100</Text>
            <Text style={[styles.riskLevel, { color: analysis.riskAssessment.level === 'low' ? theme.colors.mood.excellent : analysis.riskAssessment.level === 'moderate' ? theme.colors.mood.okay : theme.colors.mood.difficult }]}>
              {analysis.riskAssessment.level.toUpperCase()} RISK
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Assessment</Text>
            <Text style={styles.text}>{analysis.overallAssessment}</Text>
          </View>

          {analysis.strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              {analysis.strengths.map((item, index) => (
                <Text key={index} style={styles.listItem}>• {item}</Text>
              ))}
            </View>
          )}

          {analysis.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {analysis.recommendations.map((item, index) => (
                <Text key={index} style={styles.listItem}>• {item}</Text>
              ))}
            </View>
          )}

          {analysis.supportiveMessage && (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{analysis.supportiveMessage}</Text>
            </View>
          )}
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
  backButton: {
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
    marginBottom: theme.spacing.sm,
  },
  score: {
    fontSize: 64,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  riskLevel: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold as any,
  },
  section: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    lineHeight: 24,
  },
  listItem: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  messageCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  messageText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
});
