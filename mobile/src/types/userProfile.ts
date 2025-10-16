/**
 * User Profile Types
 * Simple, lightweight profile for AI personalization
 */

export type MainGoal =
  | 'reduce_anxiety'
  | 'improve_mood'
  | 'better_sleep'
  | 'manage_stress'
  | 'build_habits'
  | 'general_wellness';

export type PreferredTone = 'gentle' | 'direct' | 'encouraging' | 'professional';

export interface UserProfile {
  id: string;
  userId: string;

  // Basic Info
  age?: number;
  pronouns?: string;

  // Mental Health Context
  mainGoal?: MainGoal;
  currentChallenges?: string;
  whatHelps?: string;

  // AI Personalization
  preferredTone: PreferredTone;

  // Optional
  bio?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateUserProfileData {
  age?: number;
  pronouns?: string;
  mainGoal?: MainGoal;
  currentChallenges?: string;
  whatHelps?: string;
  preferredTone?: PreferredTone;
  bio?: string;
}

export interface UpdateUserProfileData extends CreateUserProfileData {}

export interface UserProfileResponse {
  success: boolean;
  profile: UserProfile;
  message?: string;
}

export interface UserProfileStatusResponse {
  success: boolean;
  hasProfile: boolean;
  completeness: number;
}

// Helper for displaying goal labels
export const MainGoalLabels: Record<MainGoal, string> = {
  reduce_anxiety: 'Reduce Anxiety',
  improve_mood: 'Improve Mood',
  better_sleep: 'Better Sleep',
  manage_stress: 'Manage Stress',
  build_habits: 'Build Healthy Habits',
  general_wellness: 'General Wellness',
};

// Helper for displaying tone labels
export const PreferredToneLabels: Record<PreferredTone, string> = {
  gentle: 'Gentle & Supportive',
  direct: 'Direct & Clear',
  encouraging: 'Encouraging & Uplifting',
  professional: 'Professional & Clinical',
};
