/**
 * User Profile Screen
 * Display and edit simple UserProfile (not MentalHealthProfile)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { UserProfile, MainGoalLabels, PreferredToneLabels } from '../types/userProfile';
import { ArrowBackIcon, BrainIcon, SparklesIcon, LogoutIcon, EditIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completeness, setCompleteness] = useState(0);
  const { logout, user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileData, statusData] = await Promise.all([
        api.userProfile.get(),
        api.userProfile.getStatus(),
      ]);
      console.log('Profile data loaded:', profileData);
      console.log('Status data:', statusData);
      setProfile(profileData);
      setCompleteness(statusData.completeness);
    } catch (error) {
      console.log('No profile found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('ProfileSetup', {
      isEditing: true,
      existingProfile: profile,
      onComplete: loadProfile,
    });
  };

  const handleCreateProfile = () => {
    navigation.navigate('ProfileSetup', {
      isEditing: false,
      onComplete: loadProfile,
    });
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogoutIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {profile ? (
              <>
                {/* Profile Completeness */}
                <View style={styles.completenessCard}>
                  <View style={styles.completenessHeader}>
                    <Text style={styles.completenessTitle}>Profile Completeness</Text>
                    <Text style={styles.completenessPercent}>{completeness}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${completeness}%` }]}
                    />
                  </View>
                  <Text style={styles.completenessHint}>
                    Complete your profile for better AI personalization
                  </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity style={styles.actionCard} onPress={handleEdit}>
                  <SparklesIcon size={32} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Edit Profile</Text>
                    <Text style={styles.actionDesc}>Update your information</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                {/* Age */}
                {profile.age && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{profile.age}</Text>
                  </View>
                )}

                {/* Pronouns */}
                {profile.pronouns && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Pronouns</Text>
                    <Text style={styles.infoValue}>{profile.pronouns}</Text>
                  </View>
                )}

                {/* Main Goal */}
                {profile.mainGoal && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Main Goal</Text>
                    <Text style={styles.infoValue}>{MainGoalLabels[profile.mainGoal]}</Text>
                  </View>
                )}

                {/* Current Challenges */}
                {profile.currentChallenges && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Current Challenges</Text>
                    <Text style={styles.infoValue}>{profile.currentChallenges}</Text>
                  </View>
                )}

                {/* What Helps */}
                {profile.whatHelps && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>What Helps</Text>
                    <Text style={styles.infoValue}>{profile.whatHelps}</Text>
                  </View>
                )}

                {/* Preferred Tone */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Communication Style</Text>
                  <Text style={styles.infoValue}>{PreferredToneLabels[profile.preferredTone]}</Text>
                </View>

                {/* Bio */}
                {profile.bio && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>About You</Text>
                    <Text style={styles.infoValue}>{profile.bio}</Text>
                  </View>
                )}

                {/* Profile Created */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Profile Created</Text>
                  <Text style={styles.infoValue}>
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyCard}>
                <BrainIcon size={64} color={theme.colors.text.light} />
                <Text style={styles.emptyTitle}>No Profile Yet</Text>
                <Text style={styles.emptyText}>
                  Create your profile to get personalized AI experiences throughout the app
                </Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateProfile}>
                  <Text style={styles.createButtonText}>Create Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
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
  headerTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  completenessCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  completenessTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.primary,
  },
  completenessPercent: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  completenessHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  actionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  infoCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  infoLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.md,
  },
  createButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold as any,
    color: '#FFFFFF',
  },
});
