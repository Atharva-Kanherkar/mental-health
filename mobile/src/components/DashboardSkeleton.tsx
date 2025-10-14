/**
 * Dashboard Skeleton Loading Screen
 * Shows while checking auth/onboarding status
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';

export const DashboardSkeleton = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Animated.View style={[styles.skeletonTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonSubtitle, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonButton, { opacity }]} />
        </View>

        <View style={styles.content}>
          {/* Welcome Card Skeleton */}
          <Animated.View style={[styles.welcomeCard, { opacity }]}>
            <View style={styles.skeletonTextLarge} />
            <View style={styles.skeletonTextSmall} />
          </Animated.View>

          {/* Quick Actions Skeleton */}
          <View style={styles.section}>
            <Animated.View style={[styles.skeletonSectionTitle, { opacity }]} />
            <View style={styles.actionsGrid}>
              <Animated.View style={[styles.actionCard, { opacity }]} />
              <Animated.View style={[styles.actionCard, { opacity }]} />
            </View>
          </View>

          {/* Feature Cards Skeleton */}
          <View style={styles.section}>
            <Animated.View style={[styles.skeletonSectionTitle, { opacity }]} />
            <Animated.View style={[styles.featureCard, { opacity }]}>
              <View style={styles.skeletonIconCircle} />
              <View style={{ flex: 1 }}>
                <View style={styles.skeletonFeatureTitle} />
                <View style={styles.skeletonFeatureText} />
              </View>
            </Animated.View>
            <Animated.View style={[styles.featureCard, { opacity }]}>
              <View style={styles.skeletonIconCircle} />
              <View style={{ flex: 1 }}>
                <View style={styles.skeletonFeatureTitle} />
                <View style={styles.skeletonFeatureText} />
              </View>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface.whiteAlpha70,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  skeletonTitle: {
    width: 150,
    height: 24,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 200,
    height: 12,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
  },
  skeletonButton: {
    width: 80,
    height: 32,
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius.full,
  },
  content: {
    padding: theme.spacing.lg,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  skeletonTextLarge: {
    width: '70%',
    height: 20,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  skeletonTextSmall: {
    width: '50%',
    height: 14,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 18,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius.xl,
    height: 100,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    height: 80,
  },
  skeletonIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.purple.light,
  },
  skeletonFeatureTitle: {
    width: '60%',
    height: 16,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonFeatureText: {
    width: '90%',
    height: 12,
    backgroundColor: theme.colors.purple.light,
    borderRadius: 4,
  },
});
