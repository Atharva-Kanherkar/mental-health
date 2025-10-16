import prisma from '../prisma/client';

export interface UserProfileData {
  age?: number;
  pronouns?: string;
  mainGoal?: string;
  currentChallenges?: string;
  whatHelps?: string;
  preferredTone?: string;
  bio?: string;
}

export class UserProfileService {
  /**
   * Get user profile by userId
   */
  static async getProfile(userId: string) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Create or update user profile
   */
  static async createOrUpdateProfile(userId: string, data: UserProfileData) {
    try {
      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...data,
        },
        update: {
          ...data,
          updatedAt: new Date(),
        },
      });
      return profile;
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw new Error('Failed to create/update user profile');
    }
  }

  /**
   * Delete user profile
   */
  static async deleteProfile(userId: string) {
    try {
      await prisma.userProfile.delete({
        where: { userId },
      });
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  /**
   * Get AI context string from user profile
   * This is used to personalize AI responses across the app
   */
  static async getAIContext(userId: string): Promise<string> {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) {
        return '';
      }

      const contextParts: string[] = [];

      // Add basic info
      if (profile.age) {
        contextParts.push(`Age: ${profile.age}`);
      }
      if (profile.pronouns) {
        contextParts.push(`Pronouns: ${profile.pronouns}`);
      }

      // Add mental health context
      if (profile.mainGoal) {
        const goalMap: { [key: string]: string } = {
          reduce_anxiety: 'reducing anxiety',
          improve_mood: 'improving mood',
          better_sleep: 'getting better sleep',
          manage_stress: 'managing stress',
          build_habits: 'building healthy habits',
          general_wellness: 'general wellness',
        };
        contextParts.push(`Main goal: ${goalMap[profile.mainGoal] || profile.mainGoal}`);
      }
      if (profile.currentChallenges) {
        contextParts.push(`Current challenges: ${profile.currentChallenges}`);
      }
      if (profile.whatHelps) {
        contextParts.push(`What helps them: ${profile.whatHelps}`);
      }

      // Add preferred tone
      if (profile.preferredTone) {
        contextParts.push(`Preferred communication tone: ${profile.preferredTone}`);
      }

      // Add bio if present
      if (profile.bio) {
        contextParts.push(`About them: ${profile.bio}`);
      }

      // Combine into a context string
      if (contextParts.length === 0) {
        return '';
      }

      return `USER PROFILE CONTEXT:\n${contextParts.join(' | ')}`;
    } catch (error) {
      console.error('Error getting AI context:', error);
      return '';
    }
  }

  /**
   * Check if user has completed their profile
   */
  static async hasProfile(userId: string): Promise<boolean> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return !!profile;
    } catch (error) {
      console.error('Error checking if user has profile:', error);
      return false;
    }
  }

  /**
   * Get profile completeness percentage (0-100)
   */
  static async getProfileCompleteness(userId: string): Promise<number> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return 0;

      const fields = [
        profile.age,
        profile.pronouns,
        profile.mainGoal,
        profile.currentChallenges,
        profile.whatHelps,
        profile.preferredTone,
        profile.bio,
      ];

      const filledFields = fields.filter((field) => field !== null && field !== undefined).length;
      return Math.round((filledFields / fields.length) * 100);
    } catch (error) {
      console.error('Error calculating profile completeness:', error);
      return 0;
    }
  }
}
