/**
 * Walkthrough Screen
 * AI-guided memory walkthrough experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { MemoryWalkthrough } from '../types/memory';
import { CloseIcon, PlayIcon, PauseIcon } from '../components/Icons';

export const WalkthroughScreen = ({ route, navigation }: any) => {
  const { walkthrough } = route.params as { walkthrough: MemoryWalkthrough };
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (currentStepIndex === -1) {
      setDisplayText(walkthrough.introduction);
    } else if (currentStepIndex < walkthrough.steps.length) {
      setDisplayText(walkthrough.steps[currentStepIndex].text);
    } else {
      setDisplayText(walkthrough.conclusion);
    }
  }, [currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < walkthrough.steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handleStart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const getProgress = () => {
    if (currentStepIndex === -1) return 0;
    return ((currentStepIndex + 1) / (walkthrough.steps.length + 1)) * 100;
  };

  return (
    <LinearGradient colors={['#6B5FA8', '#5A4F96', '#4A3F86']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <CloseIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{walkthrough.title}</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>

          <Text style={styles.text}>{displayText}</Text>

          {currentStepIndex === -1 ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <PlayIcon size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Begin Journey</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentStepIndex >= walkthrough.steps.length ? 'Complete' : 'Continue'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.duration}>
            Duration: {Math.ceil(walkthrough.estimatedDuration / 60)} minutes
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: theme.fontWeights.light as any,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontFamily: theme.fonts.serif,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: theme.spacing['2xl'],
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  text: {
    fontSize: theme.fontSizes.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: theme.spacing['2xl'],
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
  },
  startButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
  },
  nextButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  duration: {
    fontSize: theme.fontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
