import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { userController } from '../controllers/userController';

const router = Router();

// Apply authentication to all user routes
router.use(requireAuth);

// ========== PROFILE MANAGEMENT ==========

// Get user profile
router.get('/profile', userController.getProfile.bind(userController));

// Update user profile
router.put('/profile', userController.updateProfile.bind(userController));

// ========== DASHBOARD ==========

// Get comprehensive dashboard data
router.get('/dashboard', userController.getDashboard.bind(userController));

// Get user statistics
router.get('/stats', userController.getStats.bind(userController));

// Get user activity feed
router.get('/activity', userController.getActivityFeed.bind(userController));

// ========== PREFERENCES ==========

// Get user preferences
router.get('/preferences', userController.getPreferences.bind(userController));

// Update user preferences
router.put('/preferences', userController.updatePreferences.bind(userController));

// ========== ONBOARDING ==========

// Get onboarding status and next steps
router.get('/onboarding-status', userController.getOnboardingStatus.bind(userController));

// ========== ACCOUNT MANAGEMENT ==========

// Verify email address
router.post('/verify-email', userController.verifyEmail.bind(userController));

// Update email address
router.put('/email', userController.updateEmail.bind(userController));

// Export user data (GDPR compliance)
router.get('/export-data', userController.exportData.bind(userController));

// Delete user account (with confirmation)
router.delete('/account', userController.deleteAccount.bind(userController));

export default router;
