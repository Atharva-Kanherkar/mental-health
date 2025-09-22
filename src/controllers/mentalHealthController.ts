import { Request, Response } from 'express';
import { mentalHealthService } from '../services/mentalHealthService';
import { z } from 'zod';

// Validation schemas
const MentalHealthProfileSchema = z.object({
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']).optional(),
  occupation: z.string().max(100).optional(),
  educationLevel: z.enum(['high-school', 'some-college', 'bachelor', 'master', 'doctorate', 'other']).optional(),
  relationshipStatus: z.enum(['single', 'partnered', 'married', 'divorced', 'widowed', 'other']).optional(),
  livingArrangement: z.enum(['alone', 'family', 'roommates', 'partner', 'other']).optional(),
  
  primaryConcerns: z.array(z.string()).optional(),
  diagnosedConditions: z.array(z.string()).optional(),
  symptomSeverity: z.enum(['mild', 'moderate', 'severe', 'very-severe']).optional(),
  symptomDuration: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  
  suicidalIdeation: z.boolean().optional(),
  selfHarmHistory: z.boolean().optional(),
  substanceUseRisk: z.enum(['none', 'low', 'moderate', 'high']).optional(),
  eatingDisorderRisk: z.enum(['none', 'low', 'moderate', 'high']).optional(),
  
  hasTherapyHistory: z.boolean().optional(),
  hasMedicationHistory: z.boolean().optional(),
  hasHospitalization: z.boolean().optional(),
  
  familySupport: z.enum(['none', 'limited', 'moderate', 'strong']).optional(),
  friendSupport: z.enum(['none', 'limited', 'moderate', 'strong']).optional(),
  professionalSupport: z.enum(['none', 'limited', 'moderate', 'strong']).optional(),
  
  sleepQuality: z.enum(['very-poor', 'poor', 'fair', 'good', 'excellent']).optional(),
  exerciseFrequency: z.enum(['never', 'rarely', 'sometimes', 'often', 'daily']).optional(),
  nutritionQuality: z.enum(['very-poor', 'poor', 'fair', 'good', 'excellent']).optional(),
  socialConnection: z.enum(['very-isolated', 'isolated', 'some-connection', 'well-connected', 'very-connected']).optional(),
  
  consentToAnalysis: z.boolean().optional(),
  consentToInsights: z.boolean().optional()
});

const AssessmentResponseSchema = z.object({
  assessmentType: z.string().min(1),
  responses: z.record(z.string(), z.any()),
  totalScore: z.number().optional(),
  severity: z.string().optional(),
  interpretation: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  triggeredBy: z.string().optional(),
  notes: z.string().optional()
});

const MedicationSchema = z.object({
  medicationName: z.string().min(1).max(200),
  dosage: z.string().max(50).optional(),
  frequency: z.enum(['daily', 'twice-daily', 'weekly', 'as-needed', 'other']).optional(),
  prescribedBy: z.string().max(100).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  isCurrentlyTaking: z.boolean().optional(),
  effectiveness: z.enum(['very-ineffective', 'ineffective', 'somewhat-effective', 'effective', 'very-effective']).optional(),
  sideEffects: z.array(z.string()).optional(),
  adherence: z.enum(['never', 'rarely', 'sometimes', 'often', 'always']).optional(),
  reasonForStopping: z.string().optional(),
  notes: z.string().optional()
});

const TherapySchema = z.object({
  therapyType: z.enum(['CBT', 'DBT', 'psychodynamic', 'humanistic', 'family', 'group', 'other']),
  providerType: z.enum(['psychiatrist', 'psychologist', 'counselor', 'social-worker', 'other']),
  providerName: z.string().max(100).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'as-needed']).optional(),
  sessionCount: z.number().min(0).optional(),
  effectiveness: z.enum(['very-ineffective', 'ineffective', 'somewhat-effective', 'effective', 'very-effective']).optional(),
  reasonForEnding: z.enum(['completed', 'no-longer-needed', 'not-helpful', 'cost', 'scheduling', 'other']).optional(),
  isOngoing: z.boolean().optional(),
  notes: z.string().optional()
});

const CrisisEventSchema = z.object({
  crisisType: z.enum(['suicidal-ideation', 'suicide-attempt', 'self-harm', 'panic-attack', 'psychotic-episode', 'substance-overdose', 'other']),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
  triggeringEvents: z.array(z.string()).optional(),
  warningSignsUsed: z.array(z.string()).optional(),
  copingStrategies: z.array(z.string()).optional(),
  interventionUsed: z.array(z.string()).optional(),
  outcome: z.enum(['resolved', 'ongoing', 'worsened', 'hospitalized']).optional(),
  followUpNeeded: z.boolean().optional(),
  followUpReceived: z.boolean().optional(),
  safetyPlanUsed: z.boolean().optional(),
  safetyPlanEffective: z.boolean().optional(),
  notes: z.string().optional()
});

export class MentalHealthController {
  // Mental Health Profile endpoints
  async createOrUpdateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log('Received profile data:', JSON.stringify(req.body, null, 2));
      const validation = MentalHealthProfileSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('Validation errors:', JSON.stringify(validation.error.issues, null, 2));
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validation.error.issues 
        });
      }

      const profile = await mentalHealthService.createOrUpdateProfile(userId, validation.data);
      
      // Remove sensitive data from response
      const safeProfile = {
        ...profile,
        suicidalIdeation: undefined,
        selfHarmHistory: undefined
      };

      res.json({ success: true, profile: safeProfile });
    } catch (error) {
      console.error('Error creating/updating mental health profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const profile = await mentalHealthService.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Remove highly sensitive data from standard response
      const safeProfile = {
        ...profile,
        suicidalIdeation: undefined,
        selfHarmHistory: undefined
      };

      res.json({ profile: safeProfile });
    } catch (error) {
      console.error('Error fetching mental health profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await mentalHealthService.deleteProfile(userId);
      res.json({ success: true, message: 'Mental health profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting mental health profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get the user's mental health profile
      const profile = await mentalHealthService.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Mental health profile not found. Please complete the assessment first.' });
      }

      // Get comprehensive user context for personalized analysis
      const { getUserContextForAI } = await import('../utils/userContextHelper');
      const userContext = await getUserContextForAI(userId);

      // Generate personalized AI analysis using comprehensive context
      const { GeminiService } = await import('../services/geminiService');
      const analysis = await GeminiService.generateProfileAnalysis({
        demographics: {
          age: profile.age,
          gender: profile.gender,
          occupation: profile.occupation,
          educationLevel: profile.educationLevel,
          relationshipStatus: profile.relationshipStatus,
          livingArrangement: profile.livingArrangement
        },
        mentalHealth: {
          primaryConcerns: profile.primaryConcerns,
          diagnosedConditions: profile.diagnosedConditions, 
          symptomSeverity: profile.symptomSeverity,
          symptomDuration: profile.symptomDuration
        },
        support: {
          familySupport: profile.familySupport,
          friendSupport: profile.friendSupport,
          professionalSupport: profile.professionalSupport
        },
        lifestyle: {
          sleepQuality: profile.sleepQuality,
          exerciseFrequency: profile.exerciseFrequency,
          nutritionQuality: profile.nutritionQuality,
          socialConnection: profile.socialConnection
        },
        riskFactors: {
          substanceUseRisk: profile.substanceUseRisk,
          eatingDisorderRisk: profile.eatingDisorderRisk
        },
        treatmentHistory: {
          hasTherapyHistory: profile.hasTherapyHistory,
          hasMedicationHistory: profile.hasMedicationHistory,
          hasHospitalization: profile.hasHospitalization
        }
      }, userContext || undefined);

      res.json({ 
        success: true, 
        analysis,
        generatedAt: new Date().toISOString(),
        profileId: profile.id
      });
    } catch (error) {
      console.error('Error generating profile analysis:', error);
      res.status(500).json({ error: 'Failed to generate analysis. Please try again later.' });
    }
  }

  // Assessment endpoints
  async submitAssessment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = AssessmentResponseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid assessment data', 
          details: validation.error.issues 
        });
      }

      const assessment = await mentalHealthService.submitAssessment(userId, validation.data);
      
      // Check if this is a high-risk assessment
      if (assessment.flagged) {
        // In a real application, you might trigger crisis intervention protocols here
        console.warn(`High-risk assessment submitted by user ${userId}:`, {
          assessmentType: assessment.assessmentType,
          totalScore: assessment.totalScore,
          severity: assessment.severity
        });
      }

      res.json({ 
        success: true, 
        assessment: {
          id: assessment.id,
          assessmentType: assessment.assessmentType,
          totalScore: assessment.totalScore,
          severity: assessment.severity,
          interpretation: assessment.interpretation,
          recommendations: assessment.recommendations,
          createdAt: assessment.createdAt
        }
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAssessmentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { type, days } = req.query;
      
      let assessments;
      if (days) {
        assessments = await mentalHealthService.getRecentAssessments(userId, parseInt(days as string));
      } else {
        assessments = await mentalHealthService.getAssessmentHistory(userId, type as string);
      }

      res.json({ assessments });
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Medication endpoints
  async addMedication(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = MedicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid medication data', 
          details: validation.error.issues 
        });
      }

      const medication = await mentalHealthService.addMedication(userId, validation.data);
      res.json({ success: true, medication });
    } catch (error) {
      console.error('Error adding medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateMedication(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { medicationId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = MedicationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid medication data', 
          details: validation.error.issues 
        });
      }

      const medication = await mentalHealthService.updateMedication(medicationId, userId, validation.data);
      res.json({ success: true, medication });
    } catch (error) {
      console.error('Error updating medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMedications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentOnly } = req.query;
      const medications = await mentalHealthService.getMedications(userId, currentOnly === 'true');
      res.json({ medications });
    } catch (error) {
      console.error('Error fetching medications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Therapy endpoints
  async addTherapyHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = TherapySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid therapy data', 
          details: validation.error.issues 
        });
      }

      const therapy = await mentalHealthService.addTherapyHistory(userId, validation.data);
      res.json({ success: true, therapy });
    } catch (error) {
      console.error('Error adding therapy history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTherapyHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const therapyHistory = await mentalHealthService.getTherapyHistory(userId);
      res.json({ therapyHistory });
    } catch (error) {
      console.error('Error fetching therapy history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Crisis event endpoints
  async recordCrisisEvent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = CrisisEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid crisis event data', 
          details: validation.error.issues 
        });
      }

      const crisisEvent = await mentalHealthService.recordCrisisEvent(userId, validation.data);
      
      // Log high-risk events for monitoring
      console.warn(`Crisis event recorded for user ${userId}:`, {
        crisisType: crisisEvent.crisisType,
        severity: crisisEvent.severity
      });

      res.json({ success: true, crisisEvent });
    } catch (error) {
      console.error('Error recording crisis event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCrisisHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const crisisHistory = await mentalHealthService.getCrisisHistory(userId);
      res.json({ crisisHistory });
    } catch (error) {
      console.error('Error fetching crisis history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Comprehensive summary for AI analysis
  async getComprehensiveSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const summary = await mentalHealthService.getComprehensiveSummary(userId);
      
      // Only return if user has consented to AI analysis
      if (!summary.profile?.consentToAnalysis) {
        return res.status(403).json({ 
          error: 'User has not consented to AI analysis of mental health data' 
        });
      }

      res.json({ summary });
    } catch (error) {
      console.error('Error fetching comprehensive summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Data export for GDPR compliance
  async exportData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userData = await mentalHealthService.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mental-health-data-${userId}.json"`);
      res.json(userData);
    } catch (error) {
      console.error('Error exporting user data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const mentalHealthController = new MentalHealthController();
