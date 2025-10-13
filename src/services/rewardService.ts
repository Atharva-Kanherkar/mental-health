import prisma from '../prisma/client';

export interface CreateRewardData {
  name: string;
  description: string;
  type: 'streak' | 'milestone' | 'behavior' | 'wellness';
  pointValue: number;
  requiredCount?: number;
  requiredDays?: number;
  behaviorType?: string;
  maxClaimsPerUser?: number;
}

export interface CreateUserRewardData {
  rewardId: string;
  pointsEarned: number;
}

export interface UpdateStreakData {
  type: string;
  currentStreak?: number;
  lastActiveDate?: Date;
}

export interface CreateAchievementData {
  name: string;
  description: string;
  category: 'writing' | 'wellness' | 'safety' | 'consistency';
  requiredValue?: number;
  requiredStreak?: number;
  behaviorType?: string;
  iconName?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  pointReward?: number;
}

class RewardService {
  // ========== REWARD MANAGEMENT ==========
  
  async createReward(data: CreateRewardData) {
    return await prisma.reward.create({
      data: {
        ...data,
        isActive: true
      }
    });
  }

  async getAllRewards(includeInactive = false) {
    return await prisma.reward.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { type: 'asc' },
        { pointValue: 'asc' }
      ]
    });
  }

  async getRewardById(rewardId: string) {
    return await prisma.reward.findUnique({
      where: { id: rewardId }
    });
  }

  async updateReward(rewardId: string, data: Partial<CreateRewardData>) {
    return await prisma.reward.update({
      where: { id: rewardId },
      data
    });
  }

  async deactivateReward(rewardId: string) {
    return await prisma.reward.update({
      where: { id: rewardId },
      data: { isActive: false }
    });
  }

  // ========== USER REWARDS ==========
  
  async getUserRewards(userId: string) {
    return await prisma.userReward.findMany({
      where: { userId },
      include: {
        reward: true
      },
      orderBy: { earnedAt: 'desc' }
    });
  }

  async awardReward(userId: string, data: CreateUserRewardData) {
    // Check if user already has this reward (if it has claim limits)
    const reward = await this.getRewardById(data.rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.maxClaimsPerUser) {
      const existingRewards = await prisma.userReward.count({
        where: {
          userId,
          rewardId: data.rewardId
        }
      });

      if (existingRewards >= reward.maxClaimsPerUser) {
        throw new Error('User has already claimed maximum number of this reward');
      }
    }

    // Award the reward and update user points
    const [userReward] = await prisma.$transaction([
      // Create user reward
      prisma.userReward.create({
        data: {
          userId,
          ...data
        },
        include: {
          reward: true
        }
      }),
      // Update user total points
      prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: data.pointsEarned
          }
        }
      })
    ]);

    return userReward;
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true }
    });
    return user?.totalPoints || 0;
  }

  async getUserLevel(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true }
    });
    return user?.currentLevel || 1;
  }

  async updateUserLevel(userId: string): Promise<void> {
    const totalPoints = await this.getUserTotalPoints(userId);
    
    // Simple level calculation: Level = floor(totalPoints / 100) + 1
    // You can adjust this formula based on your gamification needs
    const newLevel = Math.floor(totalPoints / 100) + 1;
    
    await prisma.user.update({
      where: { id: userId },
      data: { currentLevel: newLevel }
    });
  }

  // ========== STREAK MANAGEMENT ==========
  
  async getUserStreaks(userId: string) {
    return await prisma.streak.findMany({
      where: { userId },
      orderBy: { type: 'asc' }
    });
  }

  async getStreak(userId: string, type: string) {
    return await prisma.streak.findUnique({
      where: {
        userId_type: {
          userId,
          type
        }
      }
    });
  }

  async updateStreak(userId: string, data: UpdateStreakData) {
    const existing = await this.getStreak(userId, data.type);
    
    if (existing) {
      // Update existing streak
      const updatedStreak = await prisma.streak.update({
        where: {
          userId_type: {
            userId,
            type: data.type
          }
        },
        data: {
          currentStreak: data.currentStreak ?? existing.currentStreak,
          longestStreak: Math.max(
            existing.longestStreak,
            data.currentStreak ?? existing.currentStreak
          ),
          lastActiveDate: data.lastActiveDate ?? existing.lastActiveDate,
          updatedAt: new Date()
        }
      });

      // Check for streak-based rewards
      await this.checkStreakRewards(userId, updatedStreak);
      
      return updatedStreak;
    } else {
      // Create new streak
      const newStreak = await prisma.streak.create({
        data: {
          userId,
          type: data.type,
          currentStreak: data.currentStreak ?? 1,
          longestStreak: data.currentStreak ?? 1,
          lastActiveDate: data.lastActiveDate ?? new Date()
        }
      });

      await this.checkStreakRewards(userId, newStreak);
      
      return newStreak;
    }
  }

  async incrementStreak(userId: string, type: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await this.getStreak(userId, type);
    
    if (existing) {
      const lastActive = existing.lastActiveDate ? new Date(existing.lastActiveDate) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = 1;
      
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        
        if (lastActive.getTime() === yesterday.getTime()) {
          // Consecutive day - increment streak
          newStreak = existing.currentStreak + 1;
        } else if (lastActive.getTime() === today.getTime()) {
          // Already updated today - no change
          return;
        }
        // If gap > 1 day, streak resets to 1
      }
      
      await this.updateStreak(userId, {
        type,
        currentStreak: newStreak,
        lastActiveDate: today
      });
    } else {
      await this.updateStreak(userId, {
        type,
        currentStreak: 1,
        lastActiveDate: today
      });
    }
  }

  private async checkStreakRewards(userId: string, streak: any): Promise<void> {
    // Find rewards that match this streak type and length
    const streakRewards = await prisma.reward.findMany({
      where: {
        type: 'streak',
        isActive: true,
        behaviorType: streak.type,
        requiredDays: {
          lte: streak.currentStreak
        }
      }
    });

    for (const reward of streakRewards) {
      // Check if user already has this reward
      const existingReward = await prisma.userReward.findUnique({
        where: {
          userId_rewardId: {
            userId,
            rewardId: reward.id
          }
        }
      });

      if (!existingReward) {
        await this.awardReward(userId, {
          rewardId: reward.id,
          pointsEarned: reward.pointValue
        });
      }
    }
  }

  // ========== ACHIEVEMENTS ==========
  
  async createAchievement(data: CreateAchievementData) {
    return await prisma.achievement.create({
      data: {
        ...data,
        rarity: data.rarity || 'common',
        pointReward: data.pointReward || 0,
        isActive: true
      }
    });
  }

  async getAllAchievements(includeInactive = false) {
    return await prisma.achievement.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { category: 'asc' },
        { rarity: 'desc' },
        { pointReward: 'desc' }
      ]
    });
  }

  async getUserAchievements(userId: string) {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    });
  }

  async unlockAchievement(userId: string, achievementId: string) {
    // Check if user already has this achievement
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    });

    if (existing) {
      throw new Error('Achievement already unlocked');
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Award achievement and points
    const [userAchievement] = await prisma.$transaction([
      prisma.userAchievement.create({
        data: {
          userId,
          achievementId
        },
        include: {
          achievement: true
        }
      }),
      // Award points if achievement has point reward
      ...(achievement.pointReward > 0 ? [
        prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: {
              increment: achievement.pointReward
            }
          }
        })
      ] : [])
    ]);

    return userAchievement;
  }

  async checkMilestoneAchievements(userId: string, behaviorType: string, count: number): Promise<void> {
    const milestoneAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        behaviorType,
        requiredValue: {
          lte: count
        }
      }
    });

    for (const achievement of milestoneAchievements) {
      try {
        await this.unlockAchievement(userId, achievement.id);
      } catch (error) {
        // Achievement already unlocked or other error - continue
        continue;
      }
    }
  }

  async checkStreakAchievements(userId: string, streakType: string, streakLength: number): Promise<void> {
    const streakAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        behaviorType: streakType,
        requiredStreak: {
          lte: streakLength
        }
      }
    });

    for (const achievement of streakAchievements) {
      try {
        await this.unlockAchievement(userId, achievement.id);
      } catch (error) {
        // Achievement already unlocked or other error - continue
        continue;
      }
    }
  }

  // ========== ANALYTICS & INSIGHTS ==========
  
  async getUserGamificationStats(userId: string) {
    const [user, streaks, totalRewards, recentAchievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalPoints: true,
          currentLevel: true
        }
      }),
      this.getUserStreaks(userId),
      prisma.userReward.count({
        where: { userId }
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 5
      })
    ]);

    return {
      totalPoints: user?.totalPoints || 0,
      currentLevel: user?.currentLevel || 1,
      streaks,
      totalRewardsEarned: totalRewards,
      recentAchievements
    };
  }

  async getLeaderboard(limit = 10) {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        totalPoints: true,
        currentLevel: true,
        image: true
      },
      orderBy: [
        { totalPoints: 'desc' },
        { currentLevel: 'desc' }
      ],
      take: limit
    });
  }

  // ========== BEHAVIOR TRACKING ==========
  
  async trackBehavior(userId: string, behaviorType: string, value = 1): Promise<void> {
    // Update streak for this behavior
    await this.incrementStreak(userId, behaviorType);
    
    // Check for milestone achievements
    const totalCount = await this.getUserBehaviorCount(userId, behaviorType);
    await this.checkMilestoneAchievements(userId, behaviorType, totalCount);
    
    // Check for streak achievements
    const streak = await this.getStreak(userId, behaviorType);
    if (streak) {
      await this.checkStreakAchievements(userId, behaviorType, streak.currentStreak);
    }
    
    // Update user level based on new points
    await this.updateUserLevel(userId);
  }

  private async getUserBehaviorCount(userId: string, behaviorType: string): Promise<number> {
    switch (behaviorType) {
      case 'journaling':
        return await prisma.journalEntry.count({ where: { userId } });
      case 'checkin':
        return await prisma.dailyCheckIn.count({ where: { userId } });
      default:
        return 0;
    }
  }
}

export const rewardService = new RewardService();
