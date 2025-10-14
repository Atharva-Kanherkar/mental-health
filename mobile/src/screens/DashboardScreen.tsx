/**
 * Dashboard Screen - Main hub after onboarding
 * Matches frontend dashboard design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

import {
  HeartIcon,
  BookIcon,
  PlusIcon,
  CheckIcon,
  BrainIcon,
  SparklesIcon,
  PeopleIcon,
  TrophyIcon,
  ClipboardIcon,
  ImageIcon,
  PillIcon,
} from '../components/Icons';

export const DashboardScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigation will happen automatically via AuthContext
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your Sanctuary</Text>
            <Text style={styles.headerSubtitle}>A gentle space to revisit what matters most</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Welcome Message */}
          <View style={styles.welcomeCard}>
            <HeartIcon size={32} color={theme.colors.primary} />
            <Text style={styles.welcomeText}>Welcome back, {user?.name || 'Friend'}!</Text>
            <Text style={styles.welcomeSubtext}>How are you feeling today?</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('NewJournal')}
              >
                <PlusIcon size={28} color={theme.colors.primary} />
                <Text style={styles.actionText}>Write Journal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('DailyCheckin')}
              >
                <CheckIcon size={28} color={theme.colors.primary} />
                <Text style={styles.actionText}>Daily Check-in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feature Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('AssessmentList')}
            >
              <View style={styles.featureIconCircle}>
                <BrainIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Mental Health Assessments</Text>
                <Text style={styles.featureText}>
                  Take PHQ-9, GAD-7, and other validated assessments
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Memories')}
            >
              <View style={styles.featureIconCircle}>
                <ImageIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Memory Vault</Text>
                <Text style={styles.featureText}>
                  Store cherished memories with AI-guided walkthroughs
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('FavoritesList')}
            >
              <View style={styles.featureIconCircle}>
                <PeopleIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Your People</Text>
                <Text style={styles.featureText}>
                  Keep track of people who matter most to you
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Insights')}
            >
              <View style={styles.featureIconCircle}>
                <SparklesIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>AI Insights & Trends</Text>
                <Text style={styles.featureText}>
                  Discover patterns and progress in your wellness journey
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Rewards')}
            >
              <View style={styles.featureIconCircle}>
                <TrophyIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Rewards & Progress</Text>
                <Text style={styles.featureText}>
                  Track your journey with points and achievements
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('MedicationsList')}
            >
              <View style={styles.featureIconCircle}>
                <PillIcon size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Medications</Text>
                <Text style={styles.featureText}>
                  Manage medications, track doses, and monitor adherence
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your journey to better mental health starts here. This is your safe space.
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg, backgroundColor: theme.colors.surface.whiteAlpha70, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  headerTitle: { fontSize: theme.fontSizes['2xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif },
  headerSubtitle: { fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, marginTop: 2 },
  logoutButton: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.primary },
  logoutText: { fontSize: theme.fontSizes.sm, color: '#FFFFFF', fontWeight: theme.fontWeights.medium as any },
  scrollContent: { padding: theme.spacing.lg },
  welcomeCard: { backgroundColor: theme.colors.surface.whiteAlpha80, borderRadius: theme.borderRadius['2xl'], padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.light, alignItems: 'center' },
  welcomeText: { fontSize: theme.fontSizes['2xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.xs, marginTop: theme.spacing.md, textAlign: 'center' },
  welcomeSubtext: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center' },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.md },
  actionsGrid: { flexDirection: 'row', gap: theme.spacing.md },
  actionCard: { flex: 1, backgroundColor: theme.colors.purple.light, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, alignItems: 'center', ...theme.shadows.md },
  actionText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, marginTop: theme.spacing.sm, textAlign: 'center' },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.surface.whiteAlpha80, borderRadius: theme.borderRadius['2xl'], padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.md },
  featureIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.medium as any, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  featureText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, lineHeight: 20 },
  arrow: { fontSize: 24, color: theme.colors.text.light },
  icon: { fontSize: 28 },
  infoCard: { backgroundColor: theme.colors.purple.lightest, borderRadius: theme.borderRadius.xl, padding: theme.spacing.md, marginTop: theme.spacing.lg },
  infoText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center', fontStyle: 'italic' },
});
