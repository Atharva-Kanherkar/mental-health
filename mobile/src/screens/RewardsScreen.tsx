/**
 * Rewards Screen - Gamification, points, achievements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { GamificationStats, UserAchievement } from '../types/rewards';
import { ArrowBackIcon, TrophyIcon, FlameIcon, MedalIcon, StarIcon } from '../components/Icons';

export const RewardsScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading rewards data...');
      const [statsData, achievementsData] = await Promise.all([
        api.rewards.getStats().catch(err => {
          console.error('Stats error:', err);
          return {
            totalPoints: 0,
            currentLevel: 1,
            streaks: [],
            totalRewardsEarned: 0,
            recentAchievements: [],
          };
        }),
        api.rewards.getMyAchievements().catch(err => {
          console.error('Achievements error:', err);
          return [];
        }),
      ]);
      console.log('Stats loaded:', statsData);
      console.log('Achievements loaded:', achievementsData.length);
      setStats(statsData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Failed to load rewards:', error);
      setStats({
        totalPoints: 0,
        currentLevel: 1,
        streaks: [],
        totalRewardsEarned: 0,
        recentAchievements: [],
      });
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9C27B0';
      case 'rare': return '#2196F3';
      default: return theme.colors.primary;
    }
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Rewards</Text>
            <Text style={styles.headerSubtitle}>Your progress & achievements</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {stats && (
              <>
                <View style={styles.statsCard}>
                  <View style={styles.statItem}>
                    <TrophyIcon size={32} color={theme.colors.primary} />
                    <Text style={styles.statValue}>{stats.totalPoints}</Text>
                    <Text style={styles.statLabel}>Points</Text>
                  </View>
                  <View style={styles.statItem}>
                    <StarIcon size={32} color={theme.colors.primary} />
                    <Text style={styles.statValue}>Level {stats.currentLevel}</Text>
                    <Text style={styles.statLabel}>Keep going!</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FlameIcon size={32} color="#EF4444" />
                    <Text style={styles.statValue}>
                      {stats.streaks?.find(s => s.type === 'checkin')?.currentStreak || 0}
                    </Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Achievements ({achievements.length})
                  </Text>
                  {achievements.map((item) => (
                    <View key={item.id} style={styles.achievementCard}>
                      <View style={[styles.achievementIcon, { backgroundColor: getRarityColor(item.achievement.rarity) }]}>
                        <MedalIcon size={28} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.achievementName}>{item.achievement.name}</Text>
                        <Text style={styles.achievementDesc}>{item.achievement.description}</Text>
                        <Text style={styles.achievementDate}>
                          Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.rarity, { color: getRarityColor(item.achievement.rarity) }]}>
                        {item.achievement.rarity.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
  rarity: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.bold as any,
  },
});
