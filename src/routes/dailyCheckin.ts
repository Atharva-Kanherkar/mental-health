import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { dailyCheckInController } from '../controllers/dailyCheckInController';

const router = Router();

// Apply authentication to all daily check-in routes
router.use(requireAuth);

// ========== DAILY CHECK-IN MANAGEMENT ==========

// Create or update today's check-in
router.post('/', dailyCheckInController.createOrUpdateCheckIn.bind(dailyCheckInController));

// Get today's check-in status
router.get('/today', dailyCheckInController.getTodaysCheckIn.bind(dailyCheckInController));

// Get check-in history with optional days parameter
router.get('/history', dailyCheckInController.getCheckInHistory.bind(dailyCheckInController));

// ========== ANALYTICS & INSIGHTS ==========

// Get comprehensive check-in summary and statistics
router.get('/summary', dailyCheckInController.getCheckInSummary.bind(dailyCheckInController));

// Get mood trends over time
router.get('/trends', dailyCheckInController.getMoodTrends.bind(dailyCheckInController));

// Get weekly averages for longer-term patterns
router.get('/weekly-averages', dailyCheckInController.getWeeklyAverages.bind(dailyCheckInController));

// ========== STATUS & STATISTICS ==========

// Get user's check-in statistics (total count, streak, etc.)
router.get('/stats', dailyCheckInController.getCheckInStatus.bind(dailyCheckInController));

// ========== CRISIS SUPPORT ==========

// Get crisis intervention resources and support information
router.get('/crisis-resources', dailyCheckInController.getCrisisResources.bind(dailyCheckInController));

export default router;
