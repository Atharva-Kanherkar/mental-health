import { Request, Response } from 'express';
import { z } from 'zod';
import { rewardService, CreateRewardData, CreateAchievementData } from '../services/rewardService';

// Validation schemas
const CreateRewardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['streak', 'milestone', 'behavior', 'wellness']),
  pointValue: z.number().int().positive('Point value must be positive'),
  requiredCount: z.number().int().positive().optional(),
  requiredDays: z.number().int().positive().optional(),
  behaviorType: z.string().optional(),
  maxClaimsPerUser: z.number().int().positive().optional()
});

const CreateAchievementSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['writing', 'wellness', 'safety', 'consistency']),
  requiredValue: z.number().int().positive().optional(),
  requiredStreak: z.number().int().positive().optional(),
  behaviorType: z.string().optional(),
  iconName: z.string().optional(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  pointReward: z.number().int().min(0).optional()
});

const ClaimRewardSchema = z.object({
  rewardId: z.string().uuid('Invalid reward ID')
});

const TrackBehaviorSchema = z.object({
  behaviorType: z.string().min(1, 'Behavior type is required'),
  value: z.number().int().positive().optional()
});

export class RewardController {
  // ========== REWARD MANAGEMENT (Admin) ==========
  
  async createReward(req: Request, res: Response) {
    try {
      const validation = CreateRewardSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid reward data',
          details: validation.error.issues
        });
      }

      const reward = await rewardService.createReward(validation.data);
      res.status(201).json({ success: true, reward });
    } catch (error) {
      console.error('Error creating reward:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllRewards(req: Request, res: Response) {
    try {
      const { includeInactive } = req.query;
      const rewards = await rewardService.getAllRewards(includeInactive === 'true');
      res.json({ rewards });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRewardById(req: Request, res: Response) {
    try {
      const { rewardId } = req.params;
      const reward = await rewardService.getRewardById(rewardId);
      
      if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
      }

      res.json({ reward });
    } catch (error) {
      console.error('Error fetching reward:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateReward(req: Request, res: Response) {
    try {
      const { rewardId } = req.params;
      const validation = CreateRewardSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid reward data',
          details: validation.error.issues
        });
      }

      const reward = await rewardService.updateReward(rewardId, validation.data);
      res.json({ success: true, reward });
    } catch (error) {
      console.error('Error updating reward:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivateReward(req: Request, res: Response) {
    try {
      const { rewardId } = req.params;
      await rewardService.deactivateReward(rewardId);
      res.json({ success: true, message: 'Reward deactivated' });
    } catch (error) {
      console.error('Error deactivating reward:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== USER REWARDS ==========
  
  async getUserRewards(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const rewards = await rewardService.getUserRewards(userId);
      res.json({ rewards });
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async claimReward(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = ClaimRewardSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid reward claim data',
          details: validation.error.issues
        });
      }

      const reward = await rewardService.getRewardById(validation.data.rewardId);
      if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
      }

      const userReward = await rewardService.awardReward(userId, {
        rewardId: validation.data.rewardId,
        pointsEarned: reward.pointValue
      });

      res.json({ success: true, userReward });
    } catch (error) {
      console.error('Error claiming reward:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // ========== STREAK MANAGEMENT ==========
  
  async getUserStreaks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const streaks = await rewardService.getUserStreaks(userId);
      res.json({ streaks });
    } catch (error) {
      console.error('Error fetching user streaks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getStreak(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { type } = req.params;
      const streak = await rewardService.getStreak(userId, type);
      
      if (!streak) {
        return res.status(404).json({ error: 'Streak not found' });
      }

      res.json({ streak });
    } catch (error) {
      console.error('Error fetching streak:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ACHIEVEMENTS ==========
  
  async createAchievement(req: Request, res: Response) {
    try {
      const validation = CreateAchievementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid achievement data',
          details: validation.error.issues
        });
      }

      const achievement = await rewardService.createAchievement(validation.data);
      res.status(201).json({ success: true, achievement });
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllAchievements(req: Request, res: Response) {
    try {
      const { includeInactive } = req.query;
      const achievements = await rewardService.getAllAchievements(includeInactive === 'true');
      res.json({ achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserAchievements(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const achievements = await rewardService.getUserAchievements(userId);
      res.json({ achievements });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unlockAchievement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { achievementId } = req.params;
      const userAchievement = await rewardService.unlockAchievement(userId, achievementId);
      
      res.json({ success: true, userAchievement });
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // ========== BEHAVIOR TRACKING ==========
  
  async trackBehavior(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = TrackBehaviorSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid behavior tracking data',
          details: validation.error.issues
        });
      }

      await rewardService.trackBehavior(
        userId,
        validation.data.behaviorType,
        validation.data.value
      );

      res.json({ success: true, message: 'Behavior tracked successfully' });
    } catch (error) {
      console.error('Error tracking behavior:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== GAMIFICATION STATS ==========
  
  async getGamificationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await rewardService.getUserGamificationStats(userId);
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLeaderboard(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const leaderboard = await rewardService.getLeaderboard(
        limit ? parseInt(limit as string) : 10
      );
      res.json({ leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserPoints(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const [totalPoints, currentLevel] = await Promise.all([
        rewardService.getUserTotalPoints(userId),
        rewardService.getUserLevel(userId)
      ]);

      res.json({ totalPoints, currentLevel });
    } catch (error) {
      console.error('Error fetching user points:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const rewardController = new RewardController();
