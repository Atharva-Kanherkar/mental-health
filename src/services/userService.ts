import prisma from "../prisma/client";


export interface UpdateUserProfileData {
  name?: string;
  email?: string;
  timezone?: string;
  image?: string;
}

export interface UserStats {
  totalJournalEntries: number;
  totalCheckIns: number;
  totalPoints: number;
  currentLevel: number;
  joinedDate: Date;
  lastActivity: Date;
  streakCount: number;
  totalRewards: number;
  totalAchievements: number;
}

export interface UserDashboardData {
  profile: {
    id: string;
    name: string;
    email: string;
    image?: string;
    timezone?: string;
    totalPoints: number;
    currentLevel: number;
  };
  stats: UserStats;
  recentActivity: any[];
  streaks: any[];
  recentAchievements: any[];
  hasCompletedOnboarding: boolean;
  hasMemoryVault: boolean;
  hasCompletedMentalHealthAssessment: boolean;
}

class UserService {
  
  // ========== USER PROFILE MANAGEMENT ==========
  
  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memoryVault: {
          select: {
            id: true,
            createdAt: true
          }
        },
        mentalHealthProfile: {
          select: {
            id: true,
            profileCompleteness: true,
            riskLevel: true,
            lastAssessmentDate: true
          }
        }
      }
    });
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileData) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteUser(userId: string) {
    // This is a cascading delete that removes all user data
    // In production, consider soft delete or data retention policies
    return await prisma.user.delete({
      where: { id: userId }
    });
  }

  // ========== USER STATISTICS ==========
  
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        currentLevel: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const [
      totalJournalEntries,
      totalCheckIns,
      totalRewards,
      totalAchievements,
      currentStreaks,
      recentActivity
    ] = await Promise.all([
      prisma.journalEntry.count({ where: { userId } }),
      prisma.dailyCheckIn.count({ where: { userId } }),
      prisma.userReward.count({ where: { userId } }),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.streak.findMany({
        where: { userId },
        orderBy: { currentStreak: 'desc' }
      }),
      // Get most recent activity (journal entry or check-in)
      Promise.all([
        prisma.journalEntry.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }),
        prisma.dailyCheckIn.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ])
    ]);

    // Find the most recent activity date
    const lastActivity = [
      recentActivity[0]?.createdAt,
      recentActivity[1]?.createdAt,
      user?.updatedAt
    ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || user?.createdAt || new Date();

    // Get the highest current streak
    const streakCount = currentStreaks.length > 0 ? currentStreaks[0].currentStreak : 0;

    return {
      totalJournalEntries,
      totalCheckIns,
      totalPoints: user?.totalPoints || 0,
      currentLevel: user?.currentLevel || 1,
      joinedDate: user?.createdAt || new Date(),
      lastActivity: new Date(lastActivity),
      streakCount,
      totalRewards,
      totalAchievements
    };
  }

  // ========== DASHBOARD DATA ==========
  
  async getUserDashboardData(userId: string): Promise<UserDashboardData> {
    const [user, stats, recentJournalEntries, recentCheckIns, streaks, recentAchievements] = await Promise.all([
      this.getUserById(userId),
      this.getUserStats(userId),
      // Recent journal entries
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          overallMood: true,
          aiSentiment: true
        }
      }),
      // Recent check-ins
      prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          date: true,
          overallMood: true,
          stressLevel: true,
          anxietyLevel: true
        }
      }),
      // Current streaks
      prisma.streak.findMany({
        where: { userId },
        orderBy: { currentStreak: 'desc' },
        take: 3
      }),
      // Recent achievements
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true
        },
        orderBy: { unlockedAt: 'desc' },
        take: 3
      })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Combine recent activities
    const recentActivity = [
      ...recentJournalEntries.map(entry => ({
        type: 'journal',
        id: entry.id,
        title: entry.title,
        date: entry.createdAt,
        mood: entry.overallMood,
        sentiment: entry.aiSentiment
      })),
      ...recentCheckIns.map(checkIn => ({
        type: 'checkin',
        id: checkIn.id,
        title: 'Daily Check-in',
        date: checkIn.date,
        mood: checkIn.overallMood,
        stress: checkIn.stressLevel,
        anxiety: checkIn.anxietyLevel
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || undefined,
        timezone: user.timezone || undefined,
        totalPoints: user.totalPoints,
        currentLevel: user.currentLevel
      },
      stats,
      recentActivity,
      streaks,
      recentAchievements,
      hasCompletedOnboarding: !!user.memoryVault,
      hasMemoryVault: !!user.memoryVault,
      hasCompletedMentalHealthAssessment: !!user.mentalHealthProfile
    };
  }

  // ========== USER ACTIVITY ==========
  
  async getUserActivityFeed(userId: string, limit = 20) {
    const [journalEntries, checkIns, rewards, achievements] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          overallMood: true,
          pointsEarned: true
        }
      }),
      prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true,
          date: true,
          overallMood: true,
          pointsEarned: true
        }
      }),
      prisma.userReward.findMany({
        where: { userId },
        include: {
          reward: {
            select: {
              name: true,
              pointValue: true
            }
          }
        },
        orderBy: { earnedAt: 'desc' },
        take: limit
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: {
              name: true,
              description: true,
              rarity: true,
              pointReward: true
            }
          }
        },
        orderBy: { unlockedAt: 'desc' },
        take: limit
      })
    ]);

    // Combine and sort all activities
    const activities = [
      ...journalEntries.map(entry => ({
        type: 'journal_entry',
        id: entry.id,
        title: entry.title,
        date: entry.createdAt,
        data: {
          mood: entry.overallMood,
          points: entry.pointsEarned
        }
      })),
      ...checkIns.map(checkIn => ({
        type: 'daily_checkin',
        id: checkIn.id,
        title: 'Completed daily check-in',
        date: checkIn.date,
        data: {
          mood: checkIn.overallMood,
          points: checkIn.pointsEarned
        }
      })),
      ...rewards.map(reward => ({
        type: 'reward_earned',
        id: reward.id,
        title: `Earned: ${reward.reward.name}`,
        date: reward.earnedAt,
        data: {
          points: reward.pointsEarned
        }
      })),
      ...achievements.map(achievement => ({
        type: 'achievement_unlocked',
        id: achievement.id,
        title: `Achievement: ${achievement.achievement.name}`,
        date: achievement.unlockedAt,
        data: {
          description: achievement.achievement.description,
          rarity: achievement.achievement.rarity,
          points: achievement.achievement.pointReward
        }
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);

    return activities;
  }

  // ========== USER PREFERENCES ==========
  
  async getUserPreferences(userId: string) {
    // This could be extended to include user preferences stored in a separate table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        emailVerified: true,
        // Add more preference fields as needed
      }
    });

    return {
      timezone: user?.timezone || 'UTC',
      emailVerified: user?.emailVerified || false,
      notifications: {
        email: true, // Default values - these could be stored in a preferences table
        checkInReminders: true,
        journalReminders: true,
        achievementNotifications: true
      },
      privacy: {
        profileVisibility: 'private',
        shareStats: false,
        allowAnalytics: true
      }
    };
  }

  async updateUserPreferences(userId: string, preferences: any) {
    // For now, we'll just update the timezone
    // In a full implementation, this would update a user_preferences table
    const updateData: any = {};
    
    if (preferences.timezone) {
      updateData.timezone = preferences.timezone;
    }

    if (Object.keys(updateData).length > 0) {
      return await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    return null;
  }

  // ========== DATA EXPORT (GDPR) ==========
  
  async exportUserData(userId: string) {
    const [
      user,
      journalEntries,
      checkIns,
      memoryVault,
      mentalHealthProfile,
      assessmentResponses,
      rewards,
      achievements,
      streaks
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.journalEntry.findMany({ where: { userId } }),
      prisma.dailyCheckIn.findMany({ where: { userId } }),
      prisma.memoryVault.findUnique({
        where: { userId },
        include: {
          memories: true,
          favPeople: true
        }
      }),
      prisma.mentalHealthProfile.findUnique({ where: { userId } }),
      prisma.assessmentResponse.findMany({ where: { userId } }),
      prisma.userReward.findMany({
        where: { userId },
        include: { reward: true }
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      }),
      prisma.streak.findMany({ where: { userId } })
    ]);

    return {
      exportDate: new Date().toISOString(),
      user,
      journalEntries,
      dailyCheckIns: checkIns,
      memoryVault,
      mentalHealthProfile,
      assessmentResponses,
      rewards,
      achievements,
      streaks
    };
  }

  // ========== ACCOUNT VERIFICATION ==========
  
  async markEmailAsVerified(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });
  }

  async updateEmail(userId: string, newEmail: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: false // Reset verification when email changes
      }
    });
  }
}

export const userService = new UserService();
