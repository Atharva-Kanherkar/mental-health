"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboardingController_1 = require("../controllers/onboardingController");
const auth_1 = require("../middleware/auth");
const onboarding_1 = require("../middleware/onboarding");
const router = (0, express_1.Router)();
// All onboarding routes require authentication
router.use(auth_1.requireAuth);
// Status endpoint doesn't need onboarding check
router.get('/status', onboardingController_1.OnboardingController.getOnboardingStatus);
// Other routes should only be accessible if onboarding is NOT completed
router.use(onboarding_1.requireNoOnboarding);
// Get onboarding page data (only for non-onboarded users)
router.get('/page', onboardingController_1.OnboardingController.getOnboardingPage);
// Complete onboarding
router.post('/complete', onboardingController_1.OnboardingController.completeOnboarding);
// Update profile during onboarding
router.put('/profile', onboardingController_1.OnboardingController.updateProfile);
exports.default = router;
