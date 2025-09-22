/**
 * Utility functions for fetching user context for AI personalization
 */

import db from '../prisma/client';
import { UserContextForAI } from '../types/userContext';

/**
 * Fetch comprehensive user context for AI personalization
 * This provides AI with complete user profile for therapeutic guidance
 */
export async function getUserContextForAI(userId: string): Promise<UserContextForAI | null> {
  try {
    // Get mental health profile
    const mentalHealthProfile = await db.mentalHealthProfile.findFirst({
      where: { userId }
    });

    // Get recent assessments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAssessments = await db.assessmentResponse.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get associated people for relationship context
    const associatedPeople = await db.favPerson.findMany({
      where: { 
        vault: { userId } 
      },
      select: {
        id: true,
        name: true,
        relationship: true
      }
    });

    // Calculate current risk level based on recent assessments
    const currentRiskLevel = calculateRiskLevel(recentAssessments);
    
    // Extract primary concerns from profile
    const primaryConcerns = mentalHealthProfile?.primaryConcerns || [];

    // Extract support needs
    const supportNeeds = extractSupportNeeds(mentalHealthProfile);

    // Determine therapy experience level
    const therapyExperience = determineTherapyExperience(mentalHealthProfile);

    // Check for recent crisis events
    const recentCrisisEvents = recentAssessments.some(
      assessment => assessment.severity === 'severe' || assessment.severity === 'very-severe'
    );

    return {
      mentalHealthProfile: mentalHealthProfile ? {
        id: mentalHealthProfile.id,
        userId: mentalHealthProfile.userId,
        age: mentalHealthProfile.age || undefined,
        gender: mentalHealthProfile.gender || undefined,
        occupation: mentalHealthProfile.occupation || undefined,
        educationLevel: mentalHealthProfile.educationLevel || undefined,
        relationshipStatus: mentalHealthProfile.relationshipStatus || undefined,
        livingArrangement: mentalHealthProfile.livingArrangement || undefined,
        primaryConcerns: mentalHealthProfile.primaryConcerns as string[] || undefined,
        diagnosedConditions: mentalHealthProfile.diagnosedConditions as string[] || undefined,
        symptomSeverity: mentalHealthProfile.symptomSeverity || undefined,
        symptomDuration: mentalHealthProfile.symptomDuration || undefined,
        suicidalIdeation: mentalHealthProfile.suicidalIdeation || undefined,
        selfHarmHistory: mentalHealthProfile.selfHarmHistory || undefined,
        substanceUseRisk: mentalHealthProfile.substanceUseRisk || undefined,
        eatingDisorderRisk: mentalHealthProfile.eatingDisorderRisk || undefined,
        hasTherapyHistory: mentalHealthProfile.hasTherapyHistory || undefined,
        hasMedicationHistory: mentalHealthProfile.hasMedicationHistory || undefined,
        hasHospitalization: mentalHealthProfile.hasHospitalization || undefined,
        familySupport: mentalHealthProfile.familySupport || undefined,
        friendSupport: mentalHealthProfile.friendSupport || undefined,
        professionalSupport: mentalHealthProfile.professionalSupport || undefined,
        sleepQuality: mentalHealthProfile.sleepQuality || undefined,
        exerciseFrequency: mentalHealthProfile.exerciseFrequency || undefined,
        nutritionQuality: mentalHealthProfile.nutritionQuality || undefined,
        socialConnection: mentalHealthProfile.socialConnection || undefined,
        profileCompleteness: mentalHealthProfile.profileCompleteness,
        riskLevel: mentalHealthProfile.riskLevel,
        createdAt: mentalHealthProfile.createdAt.toISOString(),
        updatedAt: mentalHealthProfile.updatedAt.toISOString()
      } : undefined,
      recentAssessments: recentAssessments.map(assessment => ({
        id: assessment.id,
        assessmentType: assessment.assessmentType,
        responses: assessment.responses as Record<string, any>,
        totalScore: assessment.totalScore || undefined,
        severity: assessment.severity || undefined,
        interpretation: assessment.interpretation || undefined,
        recommendations: assessment.recommendations as string[] || undefined,
        createdAt: assessment.createdAt.toISOString()
      })),
      associatedPeople,
      currentRiskLevel,
      primaryConcerns,
      supportNeeds,
      recentCrisisEvents,
      therapyExperience,
      copingSkillsLevel: determineCopingSkillsLevel(mentalHealthProfile, recentAssessments),
      emotionalRegulationLevel: determineEmotionalRegulationLevel(mentalHealthProfile, recentAssessments)
    };

  } catch (error) {
    console.error('Error fetching user context for AI:', error);
    return null; // Fallback to basic walkthrough without context
  }
}

/**
 * Calculate current risk level based on recent assessments
 */
function calculateRiskLevel(assessments: any[]): 'low' | 'moderate' | 'high' | 'crisis' | 'unknown' {
  if (!assessments.length) return 'unknown';
  
  const latestAssessment = assessments[0];
  
  // Check for crisis indicators
  if (latestAssessment.assessmentType?.includes('suicide') || 
      latestAssessment.responses?.suicidalIdeation === true) {
    return 'crisis';
  }
  
  if (latestAssessment.severity === 'severe' || latestAssessment.severity === 'very-severe') {
    return 'high';
  } else if (latestAssessment.severity === 'moderate' || latestAssessment.severity === 'moderately-severe') {
    return 'moderate';
  }
  return 'low';
}

/**
 * Extract support needs from mental health profile
 */
function extractSupportNeeds(profile: any): string[] {
  if (!profile) return [];
  
  const needs: string[] = [];
  
  if (profile.familySupport === 'none' || profile.familySupport === 'limited') {
    needs.push('family-support');
  }
  if (profile.friendSupport === 'none' || profile.friendSupport === 'limited') {
    needs.push('social-connection');
  }
  if (profile.professionalSupport === 'none' || profile.professionalSupport === 'limited') {
    needs.push('professional-help');
  }
  if (profile.sleepQuality === 'poor' || profile.sleepQuality === 'very-poor') {
    needs.push('sleep-support');
  }
  if (profile.exerciseFrequency === 'never' || profile.exerciseFrequency === 'rarely') {
    needs.push('physical-activity');
  }
  if (profile.nutritionQuality === 'poor' || profile.nutritionQuality === 'very-poor') {
    needs.push('nutrition-support');
  }
  if (profile.socialConnection === 'very-isolated' || profile.socialConnection === 'isolated') {
    needs.push('social-engagement');
  }
  
  return needs;
}

/**
 * Determine therapy experience level
 */
function determineTherapyExperience(profile: any): 'none' | 'some' | 'extensive' {
  if (!profile) return 'none';
  
  if (profile.hasTherapyHistory && profile.hasMedicationHistory && profile.hasHospitalization) {
    return 'extensive';
  } else if (profile.hasTherapyHistory || profile.hasMedicationHistory) {
    return 'some';
  }
  return 'none';
}

/**
 * Determine coping skills level based on profile and recent assessments
 */
function determineCopingSkillsLevel(profile: any, assessments: any[]): 'basic' | 'intermediate' | 'advanced' {
  if (!profile) return 'basic';
  
  // Advanced if they have extensive therapy history and good support systems
  if (profile.hasTherapyHistory && 
      profile.familySupport === 'strong' && 
      profile.friendSupport === 'strong' &&
      !assessments.some(a => a.severity === 'severe')) {
    return 'advanced';
  }
  
  // Intermediate if they have some therapy or good support
  if (profile.hasTherapyHistory || 
      (profile.familySupport === 'moderate' || profile.familySupport === 'strong')) {
    return 'intermediate';
  }
  
  return 'basic';
}

/**
 * Determine emotional regulation level
 */
function determineEmotionalRegulationLevel(profile: any, assessments: any[]): 'needs-support' | 'developing' | 'stable' {
  if (!profile) return 'needs-support';
  
  // Check for crisis indicators
  if (profile.suicidalIdeation || 
      profile.selfHarmHistory || 
      assessments.some(a => a.severity === 'severe' || a.severity === 'very-severe')) {
    return 'needs-support';
  }
  
  // Stable if good support systems and no severe symptoms
  if (profile.familySupport === 'strong' && 
      profile.sleepQuality === 'good' &&
      !assessments.some(a => a.severity === 'moderate')) {
    return 'stable';
  }
  
  return 'developing';
}
