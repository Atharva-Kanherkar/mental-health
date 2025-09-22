import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { assessmentQuestionnaireController } from '../controllers/assessmentQuestionnaireController';

const router = Router();

// Apply authentication to all assessment questionnaire routes
router.use(requireAuth);

// ========== PUBLIC QUESTIONNAIRE ACCESS ==========

// Get all available questionnaires (filtered by category if specified)
router.get('/', assessmentQuestionnaireController.getAllQuestionnaires.bind(assessmentQuestionnaireController));

// Get questionnaire by ID (public safe version)
router.get('/:questionnaireId', assessmentQuestionnaireController.getQuestionnaireById.bind(assessmentQuestionnaireController));

// Get questionnaire by short name (e.g., PHQ-9, GAD-7)
router.get('/by-name/:shortName', assessmentQuestionnaireController.getQuestionnaireByShortName.bind(assessmentQuestionnaireController));

// Get questionnaire categories
router.get('/meta/categories', assessmentQuestionnaireController.getCategories.bind(assessmentQuestionnaireController));

// ========== ASSESSMENT SUBMISSION ==========

// Submit completed questionnaire
router.post('/submit', assessmentQuestionnaireController.submitQuestionnaire.bind(assessmentQuestionnaireController));

// Preview score without saving (for immediate feedback)
router.post('/preview-score', assessmentQuestionnaireController.previewScore.bind(assessmentQuestionnaireController));

// ========== USER ASSESSMENT HISTORY ==========

// Get user's assessment history with optional filtering
router.get('/history/my-assessments', assessmentQuestionnaireController.getUserAssessmentHistory.bind(assessmentQuestionnaireController));

// ========== ADMIN ROUTES (TODO: Add admin middleware) ==========

// Initialize standard questionnaires (PHQ-9, GAD-7, etc.)
router.post('/admin/initialize-standard', assessmentQuestionnaireController.initializeStandardQuestionnaires.bind(assessmentQuestionnaireController));

// Create custom questionnaire (admin only)
router.post('/admin/create', assessmentQuestionnaireController.createQuestionnaire.bind(assessmentQuestionnaireController));

// Update questionnaire (admin only)
router.put('/admin/:questionnaireId', assessmentQuestionnaireController.updateQuestionnaire.bind(assessmentQuestionnaireController));

// Deactivate questionnaire (admin only)
router.delete('/admin/:questionnaireId', assessmentQuestionnaireController.deactivateQuestionnaire.bind(assessmentQuestionnaireController));

export default router;
