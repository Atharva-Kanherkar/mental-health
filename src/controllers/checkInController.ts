import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation schema for creating a daily check-in
const createCheckInSchema = z.object({
  mood: z.number().min(1).max(10),
  anxiety: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  sleep: z.number().min(1).max(10),
  socialConnection: z.number().min(1).max(10),
  notes: z.string().optional(),
  gratitude: z.string().optional(),
  goals: z.string().optional(),
});

export async function createCheckIn(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const validatedData = createCheckInSchema.parse(req.body);

    // Check if user already has a check-in for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      return res.status(400).json({ error: 'You have already completed your check-in for today' });
    }

    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(),
      },
    });

    // Update user's current streak
    await updateStreak(userId, 'DAILY_CHECKIN');

    res.status(201).json(checkIn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
}

export async function getCheckIns(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = (page - 1) * limit;

    const [checkIns, totalCount] = await Promise.all([
      prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.dailyCheckIn.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      checkIns,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
}

export async function getTodayCheckIn(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }

    res.json(checkIn);
  } catch (error) {
    console.error('Error fetching today\'s check-in:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s check-in' });
  }
}

export async function getCheckInStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Get current streak
    const currentStreak = await prisma.streak.findFirst({
      where: {
        userId,
        type: 'DAILY_CHECKIN',
      },
    });

    // Get average scores for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCheckIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const averages = recentCheckIns.reduce(
      (acc, checkIn) => {
        acc.mood += checkIn.mood;
        acc.anxiety += checkIn.anxiety;
        acc.energy += checkIn.energy;
        acc.sleep += checkIn.sleep;
        acc.socialConnection += checkIn.socialConnection;
        return acc;
      },
      { mood: 0, anxiety: 0, energy: 0, sleep: 0, socialConnection: 0 }
    );

    const count = recentCheckIns.length;
    if (count > 0) {
      averages.mood = Math.round((averages.mood / count) * 10) / 10;
      averages.anxiety = Math.round((averages.anxiety / count) * 10) / 10;
      averages.energy = Math.round((averages.energy / count) * 10) / 10;
      averages.sleep = Math.round((averages.sleep / count) * 10) / 10;
      averages.socialConnection = Math.round((averages.socialConnection / count) * 10) / 10;
    }

    res.json({
      currentStreak: currentStreak?.count || 0,
      totalCheckIns: await prisma.dailyCheckIn.count({ where: { userId } }),
      averageScores: averages,
      checkInsThisMonth: count,
    });
  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    res.status(500).json({ error: 'Failed to fetch check-in stats' });
  }
}

// Helper function to update streaks
async function updateStreak(userId: string, type: 'DAILY_CHECKIN' | 'JOURNAL_ENTRY') {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if user has an existing streak
    let streak = await prisma.streak.findFirst({
      where: { userId, type },
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.streak.create({
        data: {
          userId,
          type,
          count: 1,
          lastUpdated: today,
        },
      });
    } else {
      // Update existing streak
      const lastUpdated = new Date(streak.lastUpdated);
      lastUpdated.setHours(0, 0, 0, 0);

      if (lastUpdated.getTime() === yesterday.getTime()) {
        // Continue streak
        await prisma.streak.update({
          where: { id: streak.id },
          data: {
            count: streak.count + 1,
            lastUpdated: today,
          },
        });
      } else if (lastUpdated.getTime() !== today.getTime()) {
        // Reset broken streak
        await prisma.streak.update({
          where: { id: streak.id },
          data: {
            count: 1,
            lastUpdated: today,
          },
        });
      }
      // If lastUpdated is today, do nothing (already updated today)
    }

    // Check for achievements based on streak count
    if (streak) {
      await checkStreakAchievements(userId, type, streak.count + 1);
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

// Helper function to check and award streak achievements
async function checkStreakAchievements(userId: string, type: 'DAILY_CHECKIN' | 'JOURNAL_ENTRY', streakCount: number) {
  const milestones = [7, 14, 30, 60, 100]; // Achievement milestones
  
  for (const milestone of milestones) {
    if (streakCount >= milestone) {
      const achievementName = `${type}_STREAK_${milestone}`;
      
      // Check if user already has this achievement
      const existingUserAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievement: {
            name: achievementName,
          },
        },
      });

      if (!existingUserAchievement) {
        // Find or create the achievement
        let achievement = await prisma.achievement.findFirst({
          where: { name: achievementName },
        });

        if (!achievement) {
          const description = type === 'DAILY_CHECKIN' 
            ? `Complete daily check-ins for ${milestone} consecutive days`
            : `Write journal entries for ${milestone} consecutive days`;
          
          achievement = await prisma.achievement.create({
            data: {
              name: achievementName,
              description,
              category: 'STREAK',
              points: milestone * 10, // More points for longer streaks
            },
          });
        }

        // Award the achievement to the user
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Award points to the user
        const existingReward = await prisma.userReward.findFirst({
          where: { userId },
        });

        if (existingReward) {
          await prisma.userReward.update({
            where: { id: existingReward.id },
            data: {
              totalPoints: existingReward.totalPoints + achievement.points,
            },
          });
        } else {
          await prisma.userReward.create({
            data: {
              userId,
              totalPoints: achievement.points,
              currentLevel: 1,
              pointsToNextLevel: Math.max(0, 100 - achievement.points),
            },
          });
        }
      }
    }
  }
}
