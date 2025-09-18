import { Router } from 'express';
import { OnboardingController } from '../controllers/onboardingController';
import { requireAuth } from '../middleware/auth';
import { requireNoOnboarding } from '../middleware/onboarding';

const router = Router();

// All onboarding routes require authentication
router.use(requireAuth);

// Status endpoint doesn't need onboarding check
router.get('/status', OnboardingController.getOnboardingStatus);

// Other routes should only be accessible if onboarding is NOT completed
router.use(requireNoOnboarding);

// Get onboarding page data (only for non-onboarded users)
router.get('/page', OnboardingController.getOnboardingPage);

// Get current onboarding progress
router.get('/progress', OnboardingController.getOnboardingProgress);

// Step-by-step onboarding process
router.post('/create-vault', OnboardingController.createMemoryVault);
router.post('/add-person', OnboardingController.addFavoritePersonOnboarding);
router.post('/add-memory', OnboardingController.addMemoryOnboarding);

// Complete onboarding (final step)
router.post('/complete', OnboardingController.completeOnboarding);

// Update profile during onboarding
router.put('/profile', OnboardingController.updateProfile);

export default router;
