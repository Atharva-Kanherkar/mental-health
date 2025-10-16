/**
 * Panic Mode Screen
 * Emergency grounding with AI-selected therapeutic memories
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { api } from '../services/api';

export const PanicModeScreen = ({ navigation }: any) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleActivatePanicMode = async () => {
    try {
      setIsGenerating(true);

      const response = await api.walkthrough.generatePanicMode();

      if (response.selectedMemories.length === 0) {
        Alert.alert(
          'No Memories Available',
          'Please add some smart memories first to use panic mode.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Navigate to walkthrough with selected memories
      navigation.replace('Walkthrough', {
        panicMode: true,
        selectedMemories: response.selectedMemories,
        narrative: response.overallNarrative,
        duration: response.estimatedDuration,
      });
    } catch (error: any) {
      console.error('Panic mode error:', error);
      Alert.alert('Error', error.message || 'Failed to activate panic mode');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <LinearGradient colors={['#FEE2E2', '#FECACA', '#FCA5A5']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingTitle}>Finding Your Safest Memories</Text>
            <Text style={styles.loadingText}>
              AI is selecting the most grounding moments from your vault...
            </Text>
            <Text style={styles.loadingSubtext}>This may take 10-20 seconds</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FEE2E2', '#FECACA', '#FCA5A5']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#991B1B" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={64} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Panic Mode</Text>
          <Text style={styles.subtitle}>
            You're safe. I'm here to help you find your way back to calm.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              I'll select 2-3 of your most grounding memories and guide you through them.
              This usually takes 3-5 minutes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivatePanicMode}
            disabled={isGenerating}
          >
            <Ionicons name="heart" size={24} color="#FFFFFF" />
            <Text style={styles.activateButtonText}>I Need Help Now</Text>
          </TouchableOpacity>

          <View style={styles.resourcesCard}>
            <Text style={styles.resourcesTitle}>In Crisis?</Text>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => Alert.alert('988', 'Call 988 for immediate help')}
            >
              <Ionicons name="call" size={20} color="#DC2626" />
              <Text style={styles.resourceText}>Call 988 - Suicide & Crisis Lifeline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => Alert.alert('Crisis Text Line', 'Text HOME to 741741')}
            >
              <Ionicons name="chatbubble" size={20} color="#DC2626" />
              <Text style={styles.resourceText}>Text HOME to 741741</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes['4xl'],
    fontWeight: theme.fontWeights.light as any,
    color: '#7F1D1D',
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 28,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  infoText: {
    fontSize: theme.fontSizes.md,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 24,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#DC2626',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
    justifyContent: 'center',
    ...theme.shadows.lg,
    marginBottom: theme.spacing.xl,
  },
  activateButtonText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold as any,
    color: '#FFFFFF',
  },
  resourcesCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
  },
  resourcesTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold as any,
    color: '#7F1D1D',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  resourceText: {
    fontSize: theme.fontSizes.sm,
    color: '#DC2626',
    fontWeight: theme.fontWeights.medium as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.medium as any,
    color: '#991B1B',
    marginTop: theme.spacing.xl,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: theme.fontSizes.lg,
    color: '#B91C1C',
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 28,
  },
  loadingSubtext: {
    fontSize: theme.fontSizes.sm,
    color: '#DC2626',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
