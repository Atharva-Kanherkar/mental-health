import { Request, Response } from 'express';
import { z } from 'zod';
import { assessmentQuestionnaireService, CreateQuestionnaireData } from '../services/assessmentQuestionnaireService';
import { mentalHealthService } from '../services/mentalHealthService';

// Validation schemas
const CreateQuestionnaireSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortName: z.string().min(1, 'Short name is required'),
  version: z.string().optional(),
  validated: z.boolean().optional(),
  reliability: z.number().min(0).max(1).optional(),
  reference: z.string().optional(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    type: z.enum(['scale', 'boolean', 'multiple-choice']),
    options: z.array(z.string()).optional(),
    scaleMin: z.number().optional(),
    scaleMax: z.number().optional(),
    scaleLabels: z.array(z.string()).optional(),
    required: z.boolean().optional(),
    weight: z.number().optional()
  })),
  scoring: z.object({
    type: z.enum(['sum', 'average', 'weighted', 'custom']),
    ranges: z.array(z.object({
      name: z.string(),
      min: z.number(),
      max: z.number(),
      description: z.string(),
      riskLevel: z.enum(['low', 'moderate', 'high', 'crisis'])
    })),
    interpretations: z.record(z.string(), z.string()),
    recommendations: z.record(z.string(), z.array(z.string()))
  }),
  category: z.enum(['depression', 'anxiety', 'trauma', 'bipolar', 'substance-use', 'general'])
});

const SubmitResponseSchema = z.object({
  questionnaireId: z.string().uuid('Invalid questionnaire ID'),
  responses: z.record(z.string(), z.number()),
  triggeredBy: z.string().optional(),
  notes: z.string().optional()
});

export class AssessmentQuestionnaireController {
  
  // ========== QUESTIONNAIRE MANAGEMENT (Admin) ==========
  
  async createQuestionnaire(req: Request, res: Response) {
    try {
      const validation = CreateQuestionnaireSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid questionnaire data',
          details: validation.error.issues
        });
      }

      const questionnaire = await assessmentQuestionnaireService.createQuestionnaire(validation.data);
      res.status(201).json({ success: true, questionnaire });
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllQuestionnaires(req: Request, res: Response) {
    try {
      const { includeInactive, category } = req.query;
      
      let questionnaires;
      if (category) {
        questionnaires = await assessmentQuestionnaireService.getQuestionnairesByCategory(category as string);
      } else {
        questionnaires = await assessmentQuestionnaireService.getAllQuestionnaires(includeInactive === 'true');
      }

      res.json({ questionnaires });
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getQuestionnaireById(req: Request, res: Response) {
    try {
      const { questionnaireId } = req.params;
      const questionnaire = await assessmentQuestionnaireService.getQuestionnaireById(questionnaireId);
      
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      // Remove sensitive admin data from response
      const publicQuestionnaire = {
        id: questionnaire.id,
        name: questionnaire.name,
        shortName: questionnaire.shortName,
        version: questionnaire.version,
        category: questionnaire.category,
        questions: questionnaire.questions,
        validated: questionnaire.validated,
        reference: questionnaire.reference
        // Omit scoring details for security
      };

      res.json({ questionnaire: publicQuestionnaire });
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getQuestionnaireByShortName(req: Request, res: Response) {
    try {
      const { shortName } = req.params;
      const { version } = req.query;
      
      const questionnaire = await assessmentQuestionnaireService.getQuestionnaireByShortName(
        shortName,
        version as string
      );
      
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      // Remove sensitive admin data from response
      const publicQuestionnaire = {
        id: questionnaire.id,
        name: questionnaire.name,
        shortName: questionnaire.shortName,
        version: questionnaire.version,
        category: questionnaire.category,
        questions: questionnaire.questions,
        validated: questionnaire.validated,
        reference: questionnaire.reference
      };

      res.json({ questionnaire: publicQuestionnaire });
    } catch (error) {
      console.error('Error fetching questionnaire by short name:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateQuestionnaire(req: Request, res: Response) {
    try {
      const { questionnaireId } = req.params;
      const validation = CreateQuestionnaireSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid questionnaire data',
          details: validation.error.issues
        });
      }

      const questionnaire = await assessmentQuestionnaireService.updateQuestionnaire(
        questionnaireId,
        validation.data
      );
      
      res.json({ success: true, questionnaire });
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivateQuestionnaire(req: Request, res: Response) {
    try {
      const { questionnaireId } = req.params;
      await assessmentQuestionnaireService.deactivateQuestionnaire(questionnaireId);
      res.json({ success: true, message: 'Questionnaire deactivated' });
    } catch (error) {
      console.error('Error deactivating questionnaire:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ASSESSMENT SUBMISSION ==========
  
  async submitQuestionnaire(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = SubmitResponseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid response data',
          details: validation.error.issues
        });
      }

      // Get questionnaire details
      const questionnaire = await assessmentQuestionnaireService.getQuestionnaireById(
        validation.data.questionnaireId
      );
      
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      // Calculate score
      const scoreResult = assessmentQuestionnaireService.calculateScore({
        responses: validation.data.responses,
        questionnaire
      });

      // Submit assessment response using existing mental health service
      const assessmentData = {
        assessmentType: questionnaire.shortName,
        assessmentVersion: questionnaire.version,
        responses: validation.data.responses,
        totalScore: scoreResult.totalScore,
        severity: scoreResult.severity,
        interpretation: scoreResult.interpretation,
        recommendations: scoreResult.recommendations,
        flagged: scoreResult.flagged,
        triggeredBy: validation.data.triggeredBy,
        notes: validation.data.notes
      };

      const assessment = await mentalHealthService.submitAssessment(userId, assessmentData);

      // Log high-risk assessments
      if (scoreResult.flagged) {
        console.warn(`High-risk ${questionnaire.shortName} assessment submitted by user ${userId}:`, {
          totalScore: scoreResult.totalScore,
          severity: scoreResult.severity,
          questionnaireName: questionnaire.name
        });
      }

      res.json({
        success: true,
        assessment: {
          id: assessment.id,
          questionnaireName: questionnaire.name,
          shortName: questionnaire.shortName,
          totalScore: scoreResult.totalScore,
          severity: scoreResult.severity,
          interpretation: scoreResult.interpretation,
          recommendations: scoreResult.recommendations,
          flagged: scoreResult.flagged,
          createdAt: assessment.createdAt
        },
        message: scoreResult.flagged
          ? 'Assessment completed. We recommend seeking professional support.'
          : 'Assessment completed successfully.'
      });
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== STANDARD QUESTIONNAIRES ==========
  
  async initializeStandardQuestionnaires(req: Request, res: Response) {
    try {
      // This endpoint creates standard validated questionnaires (PHQ-9, GAD-7, etc.)
      const questionnaires = await assessmentQuestionnaireService.createStandardQuestionnaires();
      
      res.json({
        success: true,
        message: 'Standard questionnaires initialized',
        created: questionnaires.length,
        questionnaires: questionnaires.map(q => ({
          id: q.id,
          name: q.name,
          shortName: q.shortName,
          category: q.category
        }))
      });
    } catch (error) {
      console.error('Error initializing standard questionnaires:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ASSESSMENT HISTORY ==========
  
  async getUserAssessmentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { type, days } = req.query;
      
      // Use existing mental health service to get assessment history
      let assessments;
      if (days) {
        assessments = await mentalHealthService.getRecentAssessments(userId, parseInt(days as string));
      } else {
        assessments = await mentalHealthService.getAssessmentHistory(userId, type as string);
      }

      // Enhance with questionnaire details
      const enhancedAssessments = await Promise.all(
        assessments.map(async (assessment) => {
          const questionnaire = await assessmentQuestionnaireService.getQuestionnaireByShortName(
            assessment.assessmentType
          );
          
          return {
            ...assessment,
            questionnaireName: questionnaire?.name || assessment.assessmentType,
            questionnaireCategory: questionnaire?.category || 'general'
          };
        })
      );

      res.json({ assessments: enhancedAssessments });
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== SCORING PREVIEW ==========
  
  async previewScore(req: Request, res: Response) {
    try {
      const { questionnaireId, responses } = req.body;
      
      if (!questionnaireId || !responses) {
        return res.status(400).json({ error: 'Questionnaire ID and responses are required' });
      }

      const questionnaire = await assessmentQuestionnaireService.getQuestionnaireById(questionnaireId);
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }

      const scoreResult = assessmentQuestionnaireService.calculateScore({
        responses,
        questionnaire
      });

      res.json({
        success: true,
        preview: {
          totalScore: scoreResult.totalScore,
          severity: scoreResult.severity,
          interpretation: scoreResult.interpretation,
          recommendations: scoreResult.recommendations,
          flagged: scoreResult.flagged
        }
      });
    } catch (error) {
      console.error('Error previewing score:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== QUESTIONNAIRE CATEGORIES ==========
  
  async getCategories(req: Request, res: Response) {
    try {
      const categories = [
        { key: 'depression', name: 'Depression', description: 'Assessments for depressive symptoms' },
        { key: 'anxiety', name: 'Anxiety', description: 'Assessments for anxiety disorders' },
        { key: 'trauma', name: 'Trauma', description: 'PTSD and trauma-related assessments' },
        { key: 'bipolar', name: 'Bipolar', description: 'Bipolar disorder screening tools' },
        { key: 'substance-use', name: 'Substance Use', description: 'Substance abuse screening' },
        { key: 'general', name: 'General', description: 'General mental health assessments' }
      ];

      res.json({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const assessmentQuestionnaireController = new AssessmentQuestionnaireController();
