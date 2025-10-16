/**
 * Profile Setup Screen
 * Shows after onboarding to collect basic user information for AI personalization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import {
  CreateUserProfileData,
  MainGoal,
  PreferredTone,
  MainGoalLabels,
  PreferredToneLabels,
} from '../types/userProfile';

export const ProfileSetupScreen = ({ navigation, onComplete }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserProfileData>({
    preferredTone: 'gentle',
  });

  const mainGoals: MainGoal[] = [
    'reduce_anxiety',
    'improve_mood',
    'better_sleep',
    'manage_stress',
    'build_habits',
    'general_wellness',
  ];

  const tones: PreferredTone[] = ['gentle', 'direct', 'encouraging', 'professional'];

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.userProfile.createOrUpdate(formData);

      Alert.alert('Profile Created!', 'Your profile has been saved successfully.', [
        {
          text: 'Continue',
          onPress: () => {
            if (onComplete) {
              onComplete();
            } else {
              navigation.replace('Main');
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can always add this information later in your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            if (onComplete) {
              onComplete();
            } else {
              navigation.replace('Main');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tell Us About Yourself</Text>
          <Text style={styles.headerSubtitle}>
            This helps us personalize your experience
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Age */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Age (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your age"
              placeholderTextColor={theme.colors.text.light}
              keyboardType="number-pad"
              value={formData.age?.toString() || ''}
              onChangeText={(text) =>
                setFormData({ ...formData, age: text ? parseInt(text) : undefined })
              }
            />
          </View>

          {/* Pronouns */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Pronouns (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., he/him, she/her, they/them"
              placeholderTextColor={theme.colors.text.light}
              value={formData.pronouns || ''}
              onChangeText={(text) => setFormData({ ...formData, pronouns: text })}
            />
          </View>

          {/* Main Goal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>What's your main goal?</Text>
            <View style={styles.optionsGrid}>
              {mainGoals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionButton,
                    formData.mainGoal === goal && styles.optionButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, mainGoal: goal })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.mainGoal === goal && styles.optionButtonTextSelected,
                    ]}
                  >
                    {MainGoalLabels[goal]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Challenges */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Current Challenges (Optional)</Text>
            <Text style={styles.fieldHint}>Max 200 characters</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What are you struggling with?"
              placeholderTextColor={theme.colors.text.light}
              multiline
              maxLength={200}
              value={formData.currentChallenges || ''}
              onChangeText={(text) => setFormData({ ...formData, currentChallenges: text })}
            />
          </View>

          {/* What Helps */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>What Helps You? (Optional)</Text>
            <Text style={styles.fieldHint}>Max 200 characters</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What coping strategies work for you?"
              placeholderTextColor={theme.colors.text.light}
              multiline
              maxLength={200}
              value={formData.whatHelps || ''}
              onChangeText={(text) => setFormData({ ...formData, whatHelps: text })}
            />
          </View>

          {/* Preferred Tone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Preferred Communication Style</Text>
            <View style={styles.optionsGrid}>
              {tones.map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.optionButton,
                    formData.preferredTone === tone && styles.optionButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, preferredTone: tone })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.preferredTone === tone && styles.optionButtonTextSelected,
                    ]}
                  >
                    {PreferredToneLabels[tone]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>About You (Optional)</Text>
            <Text style={styles.fieldHint}>Max 300 characters</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Anything else you'd like us to know?"
              placeholderTextColor={theme.colors.text.light}
              multiline
              maxLength={300}
              value={formData.bio || ''}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isLoading}>
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface.whiteAlpha70,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  fieldContainer: {
    marginBottom: theme.spacing.xl,
  },
  fieldLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  fieldHint: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeights.medium as any,
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold as any,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
  },
});
