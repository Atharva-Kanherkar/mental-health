import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { UserProfileController } from '../controllers/userProfileController';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// ========== USER PROFILE ENDPOINTS ==========

// Get user profile
router.get('/', UserProfileController.getProfile);

// Create or update user profile
router.post('/', UserProfileController.createOrUpdateProfile);

// Delete user profile
router.delete('/', UserProfileController.deleteProfile);

// Get profile status (has profile, completeness)
router.get('/status', UserProfileController.getProfileStatus);

export default router;
