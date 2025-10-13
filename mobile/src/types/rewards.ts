/**
 * Rewards Type Definitions
 * Types for gamification, rewards, and achievements
 */

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'milestone' | 'streak' | 'wellness' | 'behavior' | 'safety';
  pointValue: number;
  requiredValue?: number;
  requiredDays?: number;
  requiredCount?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  claimedAt?: string;
  progress: number;
  isEarned: boolean;
  reward: Reward;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'consistency' | 'wellness' | 'safety' | 'behavior' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointReward: number;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}

export interface Streak {
  type: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface GamificationStats {
  totalPoints: number;
  currentLevel: number;
  streaks: Streak[];
  totalRewardsEarned: number;
  recentAchievements: UserAchievement[];
}

export interface RewardsListResponse {
  success: boolean;
  rewards: UserReward[];
}

export interface AchievementsListResponse {
  success: boolean;
  achievements: Achievement[];
}

export interface UserAchievementsListResponse {
  success: boolean;
  achievements: UserAchievement[];
}

export interface GamificationStatsResponse {
  success: boolean;
  stats: GamificationStats;
}

export interface TrackBehaviorResponse {
  success: boolean;
  pointsEarned: number;
  rewardsEarned: UserReward[];
}
