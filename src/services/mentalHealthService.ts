import prisma from '../prisma/client';
 
import { MentalHealthProfile, AssessmentResponse, MedicationHistory, TherapyHistory, CrisisEvent } from  '../generated/prisma';

export interface CreateMentalHealthProfileData {
  // Demographics
  age?: number;
  gender?: string;
  occupation?: string;
  educationLevel?: string;
  relationshipStatus?: string;
  livingArrangement?: string;
  
  // Mental Health Status
  primaryConcerns?: string[];
  diagnosedConditions?: string[];
  symptomSeverity?: string;
  symptomDuration?: string;
  
  // Risk Assessment
  suicidalIdeation?: boolean;
  selfHarmHistory?: boolean;
  substanceUseRisk?: string;
  eatingDisorderRisk?: string;
  
  // Treatment History
  hasTherapyHistory?: boolean;
  hasMedicationHistory?: boolean;
  hasHospitalization?: boolean;
  
  // Support System
  familySupport?: string;
  friendSupport?: string;
  professionalSupport?: string;
  
  // Lifestyle
  sleepQuality?: string;
  exerciseFrequency?: string;
  nutritionQuality?: string;
  socialConnection?: string;
  
  // Consent
  consentToAnalysis?: boolean;
  consentToInsights?: boolean;
}

export interface AssessmentResponseData {
  assessmentType: string;
  responses: Record<string, any>;
  totalScore?: number;
  severity?: string;
  interpretation?: string;
  recommendations?: string[];
  triggeredBy?: string;
  notes?: string;
}

export interface MedicationData {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrentlyTaking?: boolean;
  effectiveness?: string;
  sideEffects?: string[];
  adherence?: string;
  reasonForStopping?: string;
  notes?: string;
}

export interface TherapyData {
  therapyType: string;
  providerType: string;
  providerName?: string;
  startDate?: Date;
  endDate?: Date;
  frequency?: string;
  sessionCount?: number;
  effectiveness?: string;
  reasonForEnding?: string;
  isOngoing?: boolean;
  notes?: string;
}

export interface CrisisEventData {
  crisisType: string;
  severity: string;
  triggeringEvents?: string[];
  warningSignsUsed?: string[];
  copingStrategies?: string[];
  interventionUsed?: string[];
  outcome?: string;
  followUpNeeded?: boolean;
  followUpReceived?: boolean;
  safetyPlanUsed?: boolean;
  safetyPlanEffective?: boolean;
  notes?: string;
}

class MentalHealthService {
  // Risk assessment utility
  private calculateRiskLevel(profile: MentalHealthProfile, recentAssessments: AssessmentResponse[]): string {
    let riskScore = 0;
    
    // High-risk indicators
    if (profile.suicidalIdeation) riskScore += 10;
    if (profile.selfHarmHistory) riskScore += 8;
    if (profile.substanceUseRisk === 'high') riskScore += 6;
    if (profile.symptomSeverity === 'very-severe') riskScore += 8;
    if (profile.symptomSeverity === 'severe') riskScore += 6;
    
    // Protective factors
    if (profile.familySupport === 'strong') riskScore -= 2;
    if (profile.friendSupport === 'strong') riskScore -= 2;
    if (profile.professionalSupport === 'strong') riskScore -= 3;
    
    // Recent assessment scores
    const recentHighScores = recentAssessments.filter(a => 
      (a.assessmentType === 'PHQ-9' && (a.totalScore || 0) >= 20) ||
      (a.assessmentType === 'GAD-7' && (a.totalScore || 0) >= 15) ||
      a.flagged
    );
    riskScore += recentHighScores.length * 4;
    
    if (riskScore >= 15) return 'crisis';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 5) return 'moderate';
    return 'low';
  }

  // Profile completeness calculation
  private calculateCompleteness(profile: Partial<CreateMentalHealthProfileData>): number {
    const totalFields = 20; // Number of important fields
    let completedFields = 0;
    
    if (profile.age) completedFields++;
    if (profile.gender) completedFields++;
    if (profile.primaryConcerns?.length) completedFields++;
    if (profile.symptomSeverity) completedFields++;
    if (profile.symptomDuration) completedFields++;
    if (profile.hasTherapyHistory !== undefined) completedFields++;
    if (profile.hasMedicationHistory !== undefined) completedFields++;
    if (profile.familySupport) completedFields++;
    if (profile.friendSupport) completedFields++;
    if (profile.sleepQuality) completedFields++;
    if (profile.exerciseFrequency) completedFields++;
    if (profile.nutritionQuality) completedFields++;
    if (profile.socialConnection) completedFields++;
    if (profile.consentToAnalysis !== undefined) completedFields++;
    if (profile.consentToInsights !== undefined) completedFields++;
    // Add more field checks as needed
    
    return Math.min(completedFields / totalFields, 1.0);
  }

  async createOrUpdateProfile(userId: string, data: CreateMentalHealthProfileData): Promise<MentalHealthProfile> {
    // Calculate profile completeness
    const completeness = this.calculateCompleteness(data);
    
    const profile = await prisma.mentalHealthProfile.upsert({
      where: { userId },
      update: {
        ...data,
        profileCompleteness: completeness,
        lastAssessmentDate: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId,
        ...data,
        profileCompleteness: completeness,
        lastAssessmentDate: new Date()
      }
    });

    // Update risk level based on new data
    const recentAssessments = await this.getRecentAssessments(userId, 30);
    const riskLevel = this.calculateRiskLevel(profile, recentAssessments);
    
    return prisma.mentalHealthProfile.update({
      where: { id: profile.id },
      data: { riskLevel }
    });
  }

  async getProfile(userId: string): Promise<MentalHealthProfile | null> {
    return prisma.mentalHealthProfile.findUnique({
      where: { userId }
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    // Secure deletion - also delete related assessment data
    await prisma.$transaction([
      prisma.assessmentResponse.deleteMany({ where: { userId } }),
      prisma.medicationHistory.deleteMany({ where: { userId } }),
      prisma.therapyHistory.deleteMany({ where: { userId } }),
      prisma.crisisEvent.deleteMany({ where: { userId } }),
      prisma.mentalHealthProfile.delete({ where: { userId } })
    ]);
  }

  async submitAssessment(userId: string, data: AssessmentResponseData): Promise<AssessmentResponse> {
    // Check for high-risk responses
    let flagged = false;
    
    // PHQ-9 suicide question (question 9)
    if (data.assessmentType === 'PHQ-9' && data.responses['q9'] >= 2) {
      flagged = true;
    }
    
    // GAD-7 high scores
    if (data.assessmentType === 'GAD-7' && (data.totalScore || 0) >= 15) {
      flagged = true;
    }
    
    // General high-risk indicators
    if (data.totalScore && data.totalScore >= 20) {
      flagged = true;
    }

    const assessment = await prisma.assessmentResponse.create({
      data: {
        userId,
        ...data,
        flagged
      }
    });

    // If flagged, update user's risk level
    if (flagged) {
      const profile = await this.getProfile(userId);
      if (profile) {
        const recentAssessments = await this.getRecentAssessments(userId, 30);
        const riskLevel = this.calculateRiskLevel(profile, [...recentAssessments, assessment]);
        
        await prisma.mentalHealthProfile.update({
          where: { userId },
          data: { riskLevel }
        });
      }
    }

    return assessment;
  }

  async getRecentAssessments(userId: string, days: number = 30): Promise<AssessmentResponse[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return prisma.assessmentResponse.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAssessmentHistory(userId: string, assessmentType?: string): Promise<AssessmentResponse[]> {
    return prisma.assessmentResponse.findMany({
      where: {
        userId,
        ...(assessmentType && { assessmentType })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addMedication(userId: string, data: MedicationData): Promise<MedicationHistory> {
    return prisma.medicationHistory.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async updateMedication(medicationId: string, userId: string, data: Partial<MedicationData>): Promise<MedicationHistory> {
    return prisma.medicationHistory.update({
      where: { 
        id: medicationId,
        userId // Ensure user can only update their own medications
      },
      data
    });
  }

  async getMedications(userId: string, currentOnly: boolean = false): Promise<MedicationHistory[]> {
    return prisma.medicationHistory.findMany({
      where: {
        userId,
        ...(currentOnly && { isCurrentlyTaking: true })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addTherapyHistory(userId: string, data: TherapyData): Promise<TherapyHistory> {
    return prisma.therapyHistory.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async getTherapyHistory(userId: string): Promise<TherapyHistory[]> {
    return prisma.therapyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async recordCrisisEvent(userId: string, data: CrisisEventData): Promise<CrisisEvent> {
    const crisisEvent = await prisma.crisisEvent.create({
      data: {
        userId,
        ...data
      }
    });

    // Immediately update risk level to high/crisis
    const profile = await this.getProfile(userId);
    if (profile) {
      let newRiskLevel = 'high';
      if (data.crisisType === 'suicide-attempt' || data.severity === 'life-threatening') {
        newRiskLevel = 'crisis';
      }
      
      await prisma.mentalHealthProfile.update({
        where: { userId },
        data: { riskLevel: newRiskLevel }
      });
    }

    return crisisEvent;
  }

  async getCrisisHistory(userId: string): Promise<CrisisEvent[]> {
    return prisma.crisisEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get comprehensive mental health summary for AI analysis
  async getComprehensiveSummary(userId: string): Promise<{
    profile: MentalHealthProfile | null;
    recentAssessments: AssessmentResponse[];
    currentMedications: MedicationHistory[];
    ongoingTherapy: TherapyHistory[];
    recentCrises: CrisisEvent[];
  }> {
    const [profile, recentAssessments, currentMedications, ongoingTherapy, recentCrises] = await Promise.all([
      this.getProfile(userId),
      this.getRecentAssessments(userId, 30),
      this.getMedications(userId, true),
      prisma.therapyHistory.findMany({
        where: { userId, isOngoing: true }
      }),
      prisma.crisisEvent.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      profile,
      recentAssessments,
      currentMedications,
      ongoingTherapy,
      recentCrises
    };
  }

  // Data export for GDPR compliance
  async exportUserData(userId: string): Promise<any> {
    const [profile, assessments, medications, therapy, crises] = await Promise.all([
      this.getProfile(userId),
      this.getAssessmentHistory(userId),
      this.getMedications(userId),
      this.getTherapyHistory(userId),
      this.getCrisisHistory(userId)
    ]);

    return {
      mentalHealthProfile: profile,
      assessmentResponses: assessments,
      medicationHistory: medications,
      therapyHistory: therapy,
      crisisEvents: crises,
      exportedAt: new Date().toISOString()
    };
  }
}

export const mentalHealthService = new MentalHealthService();
