import { Request, Response } from 'express';
import { z } from 'zod';
import { userService, UpdateUserProfileData } from '../services/userService';

// Validation schemas
const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  timezone: z.string().optional(),
  image: z.string().url('Invalid image URL').optional()
});

const UpdatePreferencesSchema = z.object({
  timezone: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    checkInReminders: z.boolean().optional(),
    journalReminders: z.boolean().optional(),
    achievementNotifications: z.boolean().optional()
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private']).optional(),
    shareStats: z.boolean().optional(),
    allowAnalytics: z.boolean().optional()
  }).optional()
});

export class UserController {
  
  // ========== PROFILE MANAGEMENT ==========
  
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return safe user data (exclude sensitive information)
      const profile = {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        image: user.image,
        totalPoints: user.totalPoints,
        currentLevel: user.currentLevel,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasMemoryVault: !!user.memoryVault,
        hasMentalHealthProfile: !!user.mentalHealthProfile,
        mentalHealthRiskLevel: user.mentalHealthProfile?.riskLevel,
        profileCompleteness: user.mentalHealthProfile?.profileCompleteness
      };

      res.json({ profile });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = UpdateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid profile data',
          details: validation.error.issues
        });
      }

      // Check for email uniqueness if email is being updated
      if (validation.data.email) {
        const existingUser = await userService.getUserById(userId);
        if (existingUser && existingUser.email !== validation.data.email) {
          // Check if new email is already taken
          const emailExists = await userService.getUserById(validation.data.email);
          if (emailExists) {
            return res.status(400).json({ error: 'Email already in use' });
          }
        }
      }

      const updatedUser = await userService.updateUserProfile(userId, validation.data);
      
      // Return updated profile data
      const profile = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        timezone: updatedUser.timezone,
        image: updatedUser.image,
        totalPoints: updatedUser.totalPoints,
        currentLevel: updatedUser.currentLevel,
        emailVerified: updatedUser.emailVerified,
        updatedAt: updatedUser.updatedAt
      };

      res.json({ success: true, profile });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== DASHBOARD ==========
  
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const dashboardData = await userService.getUserDashboardData(userId);
      res.json({ dashboard: dashboardData });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== STATISTICS ==========
  
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await userService.getUserStats(userId);
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ACTIVITY FEED ==========
  
  async getActivityFeed(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { limit } = req.query;
      const activityLimit = limit ? parseInt(limit as string) : 20;
      
      if (activityLimit < 1 || activityLimit > 100) {
        return res.status(400).json({ error: 'Limit must be between 1 and 100' });
      }

      const activities = await userService.getUserActivityFeed(userId, activityLimit);
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== PREFERENCES ==========
  
  async getPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const preferences = await userService.getUserPreferences(userId);
      res.json({ preferences });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = UpdatePreferencesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid preferences data',
          details: validation.error.issues
        });
      }

      await userService.updateUserPreferences(userId, validation.data);
      const updatedPreferences = await userService.getUserPreferences(userId);
      
      res.json({ success: true, preferences: updatedPreferences });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== DATA EXPORT (GDPR) ==========
  
  async exportData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const exportData = await userService.exportUserData(userId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);
      
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting user data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ACCOUNT MANAGEMENT ==========
  
  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // In a production environment, you might want to:
      // 1. Send a confirmation email
      // 2. Add a grace period before deletion
      // 3. Soft delete instead of hard delete
      // 4. Backup data before deletion

      await userService.deleteUser(userId);
      
      res.json({ 
        success: true, 
        message: 'Account successfully deleted. We\'re sorry to see you go.' 
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // In a production environment, this would verify a token sent via email
      await userService.markEmailAsVerified(userId);
      
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      await userService.updateEmail(userId, email);
      
      res.json({ 
        success: true, 
        message: 'Email updated successfully. Please verify your new email address.' 
      });
    } catch (error) {
      console.error('Error updating email:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(400).json({ error: 'Email already in use' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // ========== ONBOARDING STATUS ==========
  
  async getOnboardingStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const status = {
        hasCompletedOnboarding: !!user.memoryVault,
        hasMemoryVault: !!user.memoryVault,
        hasMentalHealthProfile: !!user.mentalHealthProfile,
        profileCompleteness: user.mentalHealthProfile?.profileCompleteness || 0,
        nextSteps: [] as Array<{id: string; title: string; description: string; url: string}>
      };

      // Suggest next steps based on completion status
      const nextSteps: Array<{id: string; title: string; description: string; url: string}> = [];
      if (!status.hasMemoryVault) {
        nextSteps.push({
          id: 'memory_vault',
          title: 'Set up your Memory Vault',
          description: 'Create your personal space for memories and favorite people',
          url: '/onboarding'
        });
      }
      
      if (!status.hasMentalHealthProfile) {
        nextSteps.push({
          id: 'mental_health_assessment',
          title: 'Complete Mental Health Assessment',
          description: 'Help us understand your mental health needs',
          url: '/assessment'
        });
      }

      if (status.profileCompleteness < 0.7) {
        nextSteps.push({
          id: 'complete_profile',
          title: 'Complete Your Profile',
          description: 'Add more information to get personalized recommendations',
          url: '/assessment'
        });
      }

      status.nextSteps = nextSteps;

      res.json({ status });
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const userController = new UserController();
