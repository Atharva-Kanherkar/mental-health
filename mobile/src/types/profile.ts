/**
 * Mental Health Profile Type Definitions
 * Types for user mental health profile and analysis
 */

export interface MentalHealthProfile {
  id: string;
  userId: string;
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
  occupation?: string;
  educationLevel?: 'high-school' | 'some-college' | 'bachelor' | 'master' | 'doctorate' | 'other';
  relationshipStatus?: 'single' | 'partnered' | 'married' | 'divorced' | 'widowed' | 'other';
  livingArrangement?: 'alone' | 'family' | 'roommates' | 'partner' | 'other';
  primaryConcerns?: string[];
  diagnosedConditions?: string[];
  symptomSeverity?: 'mild' | 'moderate' | 'severe' | 'very-severe';
  symptomDuration?: 'days' | 'weeks' | 'months' | 'years';
  substanceUseRisk?: 'none' | 'low' | 'moderate' | 'high';
  eatingDisorderRisk?: 'none' | 'low' | 'moderate' | 'high';
  hasTherapyHistory?: boolean;
  hasMedicationHistory?: boolean;
  hasHospitalization?: boolean;
  familySupport?: 'none' | 'limited' | 'moderate' | 'strong';
  friendSupport?: 'none' | 'limited' | 'moderate' | 'strong';
  professionalSupport?: 'none' | 'limited' | 'moderate' | 'strong';
  sleepQuality?: 'very-poor' | 'poor' | 'fair' | 'good' | 'excellent';
  exerciseFrequency?: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  nutritionQuality?: 'very-poor' | 'poor' | 'fair' | 'good' | 'excellent';
  socialConnection?: 'very-isolated' | 'isolated' | 'some-connection' | 'well-connected' | 'very-connected';
  consentToAnalysis?: boolean;
  consentToInsights?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
  occupation?: string;
  educationLevel?: 'high-school' | 'some-college' | 'bachelor' | 'master' | 'doctorate' | 'other';
  relationshipStatus?: 'single' | 'partnered' | 'married' | 'divorced' | 'widowed' | 'other';
  livingArrangement?: 'alone' | 'family' | 'roommates' | 'partner' | 'other';
  primaryConcerns?: string[];
  diagnosedConditions?: string[];
  symptomSeverity?: 'mild' | 'moderate' | 'severe' | 'very-severe';
  symptomDuration?: 'days' | 'weeks' | 'months' | 'years';
  substanceUseRisk?: 'none' | 'low' | 'moderate' | 'high';
  eatingDisorderRisk?: 'none' | 'low' | 'moderate' | 'high';
  hasTherapyHistory?: boolean;
  hasMedicationHistory?: boolean;
  hasHospitalization?: boolean;
  familySupport?: 'none' | 'limited' | 'moderate' | 'strong';
  friendSupport?: 'none' | 'limited' | 'moderate' | 'strong';
  professionalSupport?: 'none' | 'limited' | 'moderate' | 'strong';
  sleepQuality?: 'very-poor' | 'poor' | 'fair' | 'good' | 'excellent';
  exerciseFrequency?: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  nutritionQuality?: 'very-poor' | 'poor' | 'fair' | 'good' | 'excellent';
  socialConnection?: 'very-isolated' | 'isolated' | 'some-connection' | 'well-connected' | 'very-connected';
  consentToAnalysis?: boolean;
  consentToInsights?: boolean;
}

export interface MentalHealthAnalysis {
  overallAssessment: string;
  strengths: string[];
  areasOfConcern: string[];
  recommendations: string[];
  wellnessScore: number;
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
  };
  supportiveMessage: string;
  nextSteps: string[];
}

export interface ProfileResponse {
  success: boolean;
  profile: MentalHealthProfile;
}

export interface AnalysisResponse {
  success: boolean;
  analysis: MentalHealthAnalysis;
}
