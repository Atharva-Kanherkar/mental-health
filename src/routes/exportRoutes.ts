import express from 'express';
import { exportJournalPDF, exportProfilePDF, exportCheckInsPDF, exportAssessmentsPDF, exportRewardsPDF, exportFavoritesPDF } from '../controllers/exportController';
 import { requireAuth } from '../middleware/auth';

const router = express.Router();
router.use(requireAuth);
// Individual export endpoints
router.get('/journal',  exportJournalPDF);
router.get('/profile',  exportProfilePDF);
router.get('/checkins',   exportCheckInsPDF);
router.get('/assessments',   exportAssessmentsPDF);
router.get('/rewards',  exportRewardsPDF);
router.get('/favorites',   exportFavoritesPDF);

export default router;
