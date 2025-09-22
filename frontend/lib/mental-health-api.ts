// Mental Health Assessment API Client
import api from './api';

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
  
  profileCompleteness: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'crisis' | 'unknown';
  lastAssessmentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  id: string;
  userId: string;
  assessmentType: string;
  assessmentVersion: string;
  responses: Record<string, unknown>;
  totalScore?: number;
  severity?: string;
  interpretation?: string;
  recommendations?: string[];
  flagged: boolean;
  triggeredBy?: string;
  notes?: string;
  createdAt: string;
}

export interface MedicationHistory {
  id: string;
  userId: string;
  medicationName: string;
  dosage?: string;
  frequency?: 'daily' | 'twice-daily' | 'weekly' | 'as-needed' | 'other';
  prescribedBy?: string;
  isCurrentlyTaking: boolean;
  startDate?: string;
  endDate?: string;
  effectiveness?: 'very-ineffective' | 'ineffective' | 'somewhat-effective' | 'effective' | 'very-effective';
  sideEffects?: string[];
  adherence?: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  reasonForStopping?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TherapyHistory {
  id: string;
  userId: string;
  therapyType: 'CBT' | 'DBT' | 'psychodynamic' | 'humanistic' | 'family' | 'group' | 'other';
  providerType: 'psychiatrist' | 'psychologist' | 'counselor' | 'social-worker' | 'other';
  providerName?: string;
  startDate?: string;
  endDate?: string;
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed';
  sessionCount?: number;
  effectiveness?: 'very-ineffective' | 'ineffective' | 'somewhat-effective' | 'effective' | 'very-effective';
  reasonForEnding?: 'completed' | 'no-longer-needed' | 'not-helpful' | 'cost' | 'scheduling' | 'other';
  isOngoing: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrisisEvent {
  id: string;
  userId: string;
  crisisType: 'suicidal-ideation' | 'suicide-attempt' | 'self-harm' | 'panic-attack' | 'psychotic-episode' | 'substance-overdose' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  triggeringEvents?: string[];
  warningSignsUsed?: string[];
  copingStrategies?: string[];
  interventionUsed?: string[];
  outcome?: 'resolved' | 'ongoing' | 'worsened' | 'hospitalized';
  followUpNeeded: boolean;
  followUpReceived: boolean;
  safetyPlanUsed: boolean;
  safetyPlanEffective?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentalHealthProfileData {
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
  consentToAnalysis?: boolean;
  consentToInsights?: boolean;
}

export interface SubmitAssessmentData {
  assessmentType: string;
  responses: Record<string, unknown>;
  totalScore?: number;
  severity?: string;
  interpretation?: string;
  recommendations?: string[];
  triggeredBy?: string;
  notes?: string;
}

class MentalHealthApiClient {
  private baseUrl = '/api/mental-health';

  // Profile Management
  async createOrUpdateProfile(data: CreateMentalHealthProfileData): Promise<MentalHealthProfile> {
    const response = await api.post(`${this.baseUrl}/profile`, data);
    return response.data.profile;
  }

  async getProfile(): Promise<MentalHealthProfile | null> {
    try {
      const response = await api.get(`${this.baseUrl}/profile`);
      return response.data.profile;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  async deleteProfile(): Promise<void> {
    await api.delete(`${this.baseUrl}/profile`);
  }

  // Assessment Management
  async submitAssessment(data: SubmitAssessmentData): Promise<AssessmentResponse> {
    const response = await api.post(`${this.baseUrl}/assessments`, data);
    return response.data.assessment;
  }

  async getAssessmentHistory(assessmentType?: string, days?: number): Promise<AssessmentResponse[]> {
    const params = new URLSearchParams();
    if (assessmentType) params.append('type', assessmentType);
    if (days) params.append('days', days.toString());
    
    const response = await api.get(`${this.baseUrl}/assessments?${params.toString()}`);
    return response.data.assessments;
  }

  // Medication Management
  async addMedication(data: Partial<MedicationHistory>): Promise<MedicationHistory> {
    const response = await api.post(`${this.baseUrl}/medications`, data);
    return response.data.medication;
  }

  async updateMedication(medicationId: string, data: Partial<MedicationHistory>): Promise<MedicationHistory> {
    const response = await api.put(`${this.baseUrl}/medications/${medicationId}`, data);
    return response.data.medication;
  }

  async getMedications(currentOnly: boolean = false): Promise<MedicationHistory[]> {
    const params = currentOnly ? '?currentOnly=true' : '';
    const response = await api.get(`${this.baseUrl}/medications${params}`);
    return response.data.medications;
  }

  // Therapy Management
  async addTherapyHistory(data: Partial<TherapyHistory>): Promise<TherapyHistory> {
    const response = await api.post(`${this.baseUrl}/therapy`, data);
    return response.data.therapy;
  }

  async getTherapyHistory(): Promise<TherapyHistory[]> {
    const response = await api.get(`${this.baseUrl}/therapy`);
    return response.data.therapyHistory;
  }

  // Crisis Event Management
  async recordCrisisEvent(data: Partial<CrisisEvent>): Promise<CrisisEvent> {
    const response = await api.post(`${this.baseUrl}/crisis-events`, data);
    return response.data.crisisEvent;
  }

  async getCrisisHistory(): Promise<CrisisEvent[]> {
    const response = await api.get(`${this.baseUrl}/crisis-events`);
    return response.data.crisisHistory;
  }

  // Data Export
  async exportData(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    
    return response.blob();
  }

  // Comprehensive Summary (for AI analysis)
  async getComprehensiveSummary(): Promise<{
    profile: MentalHealthProfile | null;
    recentAssessments: AssessmentResponse[];
    currentMedications: MedicationHistory[];
    ongoingTherapy: TherapyHistory[];
    recentCrises: CrisisEvent[];
  }> {
    const response = await api.get(`${this.baseUrl}/summary`);
    return response.data.summary;
  }
}

export const mentalHealthApi = new MentalHealthApiClient();
