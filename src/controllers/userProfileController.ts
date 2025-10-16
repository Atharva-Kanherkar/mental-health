import { Request, Response } from 'express';
import { z } from 'zod';
import { UserProfileService } from '../services/userProfileService';

// Zod validation schema for profile data
const ProfileSchema = z.object({
  age: z.number().int().min(13).max(120).optional(),
  pronouns: z.string().max(50).optional(),
  mainGoal: z
    .enum([
      'reduce_anxiety',
      'improve_mood',
      'better_sleep',
      'manage_stress',
      'build_habits',
      'general_wellness',
    ])
    .optional(),
  currentChallenges: z.string().max(200).optional(),
  whatHelps: z.string().max(200).optional(),
  preferredTone: z.enum(['gentle', 'direct', 'encouraging', 'professional']).optional(),
  bio: z.string().max(300).optional(),
});

export class UserProfileController {
  /**
   * GET /api/user/profile
   * Get the current user's profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const profile = await UserProfileService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        profile,
      });
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  /**
   * POST /api/user/profile
   * Create or update the current user's profile
   */
  static async createOrUpdateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Validate request body
      const validationResult = ProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile data',
          errors: validationResult.error.errors,
        });
      }

      const profile = await UserProfileService.createOrUpdateProfile(userId, validationResult.data);

      return res.status(200).json({
        success: true,
        message: 'Profile saved successfully',
        profile,
      });
    } catch (error: any) {
      console.error('Error in createOrUpdateProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to save profile',
      });
    }
  }

  /**
   * DELETE /api/user/profile
   * Delete the current user's profile
   */
  static async deleteProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      await UserProfileService.deleteProfile(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete profile',
      });
    }
  }

  /**
   * GET /api/user/profile/status
   * Check if user has a profile and get completeness
   */
  static async getProfileStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const hasProfile = await UserProfileService.hasProfile(userId);
      const completeness = await UserProfileService.getProfileCompleteness(userId);

      return res.status(200).json({
        success: true,
        hasProfile,
        completeness,
      });
    } catch (error: any) {
      console.error('Error in getProfileStatus:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check profile status',
      });
    }
  }
}
