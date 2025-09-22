import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { mentalHealthController } from '../controllers/mentalHealthController';

const router = Router();

// Apply authentication to all mental health routes
router.use(requireAuth);

// Mental Health Profile Routes
router.post('/profile', mentalHealthController.createOrUpdateProfile.bind(mentalHealthController));
router.get('/profile', mentalHealthController.getProfile.bind(mentalHealthController));
router.delete('/profile', mentalHealthController.deleteProfile.bind(mentalHealthController));
router.post('/profile/analysis', mentalHealthController.generateAnalysis.bind(mentalHealthController));

// Assessment Routes
router.post('/assessments', mentalHealthController.submitAssessment.bind(mentalHealthController));
router.get('/assessments', mentalHealthController.getAssessmentHistory.bind(mentalHealthController));

// Medication Routes
router.post('/medications', mentalHealthController.addMedication.bind(mentalHealthController));
router.put('/medications/:medicationId', mentalHealthController.updateMedication.bind(mentalHealthController));
router.get('/medications', mentalHealthController.getMedications.bind(mentalHealthController));

// Therapy Routes
router.post('/therapy', mentalHealthController.addTherapyHistory.bind(mentalHealthController));
router.get('/therapy', mentalHealthController.getTherapyHistory.bind(mentalHealthController));

// Crisis Event Routes
router.post('/crisis-events', mentalHealthController.recordCrisisEvent.bind(mentalHealthController));
router.get('/crisis-events', mentalHealthController.getCrisisHistory.bind(mentalHealthController));

// Comprehensive Data Routes
router.get('/summary', mentalHealthController.getComprehensiveSummary.bind(mentalHealthController));
router.get('/export', mentalHealthController.exportData.bind(mentalHealthController));

export default router;
