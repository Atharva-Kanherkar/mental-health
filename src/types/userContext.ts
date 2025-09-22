/**
 * Comprehensive user context interface for AI personalization
 * Used to provide therapists and AI with complete user profile for personalized healing
 */

export interface UserContextForAI {
  // Mental Health Profile
  mentalHealthProfile?: {
    id: string;
    userId: string;
    age?: number;
    gender?: string;
    occupation?: string;
    educationLevel?: string;
    relationshipStatus?: string;
    livingArrangement?: string;
    primaryConcerns?: string[];
    diagnosedConditions?: string[];
    symptomSeverity?: string;
    symptomDuration?: string;
    suicidalIdeation?: boolean;
    selfHarmHistory?: boolean;
    substanceUseRisk?: string;
    eatingDisorderRisk?: string;
    hasTherapyHistory?: boolean;
    hasMedicationHistory?: boolean;
    hasHospitalization?: boolean;
    familySupport?: string;
    friendSupport?: string;
    professionalSupport?: string;
    sleepQuality?: string;
    exerciseFrequency?: string;
    nutritionQuality?: string;
    socialConnection?: string;
    profileCompleteness: number;
    riskLevel: string;
    createdAt: string;
    updatedAt: string;
  };

  // Recent Assessment History
  recentAssessments?: {
    id: string;
    assessmentType: string;
    responses: Record<string, any>;
    totalScore?: number;
    severity?: string;
    interpretation?: string;
    recommendations?: string[];
    createdAt: string;
  }[];

  // Associated People for relationship context
  associatedPeople?: {
    id: string;
    name: string;
    relationship: string;
    description?: string;
    significanceLevel?: string;
  }[];

  // Current state indicators
  currentRiskLevel?: 'low' | 'moderate' | 'high' | 'crisis' | 'unknown';
  primaryConcerns?: string[];
  supportNeeds?: string[];
  recentCrisisEvents?: boolean;
  
  // Therapy readiness indicators
  therapyExperience?: 'none' | 'some' | 'extensive';
  copingSkillsLevel?: 'basic' | 'intermediate' | 'advanced';
  emotionalRegulationLevel?: 'needs-support' | 'developing' | 'stable';
}

/**
 * Memory with associated person for AI context
 */
export interface MemoryWithPersonForAI {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileMimeType?: string;
  createdAt: Date;
  associatedPerson?: {
    id: string;
    name: string;
    relationship: string;
    description?: string;
  };
}

/**
 * Enhanced walkthrough response with personalized elements
 */
export interface PersonalizedWalkthrough {
  id: string;
  memoryId: string;
  title: string;
  introduction: string;
  steps: {
    text: string;
    duration: number;
    pauseAfter: boolean;
    personalizedNote?: string; // Additional context based on user profile
  }[];
  conclusion: string;
  estimatedDuration: number;
  personalizationLevel: 'basic' | 'moderate' | 'comprehensive';
  therapeuticApproach: string[]; // CBT, mindfulness, grounding, etc.
  safetyConsiderations: string[];
}
