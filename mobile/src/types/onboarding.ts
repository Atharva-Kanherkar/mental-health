/**
 * Onboarding Type Definitions
 */

export interface OnboardingStatus {
  isOnboarded: boolean;
  hasMemoryVault: boolean;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
}
