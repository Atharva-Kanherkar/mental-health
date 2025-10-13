/**
 * Onboarding Screen
 * Creates memory vault - REQUIRED before using app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Button } from '../components/Button';
import { api } from '../services/api';

type OnboardingStep = 'welcome' | 'initializing' | 'complete';

const HeartIcon = () => <Text style={styles.icon}>❤️</Text>;
const CheckIcon = () => <Text style={styles.icon}>✓</Text>;

interface OnboardingScreenProps {
  navigation: any;
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);

  const handleBeginJourney = async () => {
    try {
      setIsLoading(true);
      setStep('initializing');

      console.log('🚀 Starting onboarding...');

      // Initialize onboarding (send empty object, matching frontend)
      await api.onboarding.initialize({});
      console.log('✅ Initialized');

      // Create memory vault
      await api.onboarding.createVault({});
      console.log('✅ Vault created');

      // Complete onboarding
      await api.onboarding.complete();
      console.log('✅ Onboarding complete!');

      setStep('complete');
    } catch (error: any) {
      console.error('❌ Onboarding failed:', error);
      console.error('Error details:', error.message);
      alert(`Onboarding failed: ${error.message}`);
      setStep('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    // Trigger re-check in AppNavigator which will show Dashboard
    if (onComplete) {
      onComplete();
    }
  };

  if (step === 'initializing') {
    return (
      <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Creating your sanctuary...</Text>
            <Text style={styles.loadingSubtext}>This will only take a moment</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === 'complete') {
    return (
      <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.centerContent}>
              <View style={styles.successIconCircle}>
                <CheckIcon />
              </View>
              <Text style={styles.successTitle}>Your Sanctuary is Ready!</Text>
              <Text style={styles.successSubtitle}>
                Welcome to your safe space. You can now start journaling, preserving memories, and tracking your wellness journey.
              </Text>
              <Button
                title="Enter My Sanctuary"
                onPress={handleGoToDashboard}
                style={styles.enterButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircle}>
              <HeartIcon />
            </View>
            <Text style={styles.title}>Welcome to Your Sanctuary</Text>
            <Text style={styles.subtitle}>
              This is your safe space - a gentle place where memories become medicine and healing becomes possible.
            </Text>

            <View style={styles.card}>
              <View style={styles.cardIconCircle}>
                <HeartIcon />
              </View>
              <Text style={styles.cardTitle}>Your Healing Journey Begins Here</Text>
              <Text style={styles.cardText}>
                We'll help you create a memory sanctuary - a place where you can safely store your precious moments,
                connect with people who matter, and find comfort when you need it most.
              </Text>
              <Text style={styles.cardSubtext}>
                Take your time. There's no pressure. You can always add more later.
              </Text>

              <Button
                title={isLoading ? 'Preparing your space...' : 'Begin My Journey'}
                onPress={handleBeginJourney}
                loading={isLoading}
                disabled={isLoading}
                style={styles.beginButton}
              />
            </View>

            <Text style={styles.footerText}>
              You are worthy of healing. Your pain is valid. Your journey matters.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: theme.spacing.xl },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.purple.light, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl },
  icon: { fontSize: 40 },
  title: { fontSize: theme.fontSizes['4xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.md, textAlign: 'center' },
  subtitle: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 28, marginBottom: theme.spacing.xl, maxWidth: 400 },
  card: { backgroundColor: theme.colors.surface.whiteAlpha80, borderRadius: theme.borderRadius['3xl'], padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.xl, alignItems: 'center', maxWidth: 500 },
  cardIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.purple.light, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  cardTitle: { fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.md, textAlign: 'center' },
  cardText: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: theme.spacing.md },
  cardSubtext: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.light, textAlign: 'center', marginBottom: theme.spacing.lg, fontStyle: 'italic' },
  beginButton: { width: '100%' },
  footerText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.light, textAlign: 'center', marginTop: theme.spacing.lg, fontStyle: 'italic' },
  loadingText: { fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, marginTop: theme.spacing.lg, textAlign: 'center' },
  loadingSubtext: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, marginTop: theme.spacing.sm, textAlign: 'center' },
  successIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl },
  successTitle: { fontSize: theme.fontSizes['4xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.md, textAlign: 'center' },
  successSubtitle: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 28, marginBottom: theme.spacing.xl, maxWidth: 400 },
  enterButton: { marginTop: theme.spacing.lg },
});
