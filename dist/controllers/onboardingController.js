"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
// Zod validation schemas
const CompleteOnboardingSchema = zod_1.z.object({
    timezone: zod_1.z.string().optional(),
});
const UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    timezone: zod_1.z.string().optional(),
});
class OnboardingController {
    /**
     * Get onboarding status for the authenticated user
     */
    static async getOnboardingStatus(req, res) {
        try {
            // User is guaranteed to exist due to requireAuth middleware
            const userId = req.user.id;
            // Check if user has completed onboarding by looking for MemoryVault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            const isOnboarded = !!memoryVault;
            res.json({
                success: true,
                data: {
                    isOnboarded,
                    user: {
                        id: req.user.id,
                        name: req.user.name,
                        email: req.user.email,
                        image: req.user.image
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Complete onboarding for the authenticated user
     */
    static async completeOnboarding(req, res) {
        try {
            const userId = req.user.id;
            // Validate request body
            const validationResult = CompleteOnboardingSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: validationResult.error.issues
                });
            }
            const { timezone } = validationResult.data;
            // Check if user is already onboarded
            const existingVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (existingVault) {
                return res.status(400).json({
                    success: false,
                    message: 'User has already completed onboarding'
                });
            }
            // Update user timezone if provided
            if (timezone) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { timezone }
                });
            }
            // Create MemoryVault for the user (marks them as onboarded)
            const memoryVault = await prisma.memoryVault.create({
                data: {
                    userId: userId
                }
            });
            res.status(201).json({
                success: true,
                message: 'Onboarding completed successfully',
                data: {
                    memoryVault: {
                        id: memoryVault.id,
                        userId: memoryVault.userId,
                        createdAt: memoryVault.createdAt
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Get onboarding page data (only for non-onboarded users)
     */
    static async getOnboardingPage(req, res) {
        try {
            const userId = req.user.id;
            // Check if user is already onboarded
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (memoryVault) {
                return res.status(400).json({
                    success: false,
                    message: 'User has already completed onboarding',
                    redirectTo: '/dashboard'
                });
            }
            // Return user data for onboarding page
            res.json({
                success: true,
                data: {
                    user: {
                        id: req.user.id,
                        name: req.user.name,
                        email: req.user.email,
                        image: req.user.image
                    },
                    onboardingSteps: [
                        {
                            step: 1,
                            title: 'Welcome to Mental Health App',
                            description: 'Let\'s set up your personal memory vault'
                        },
                        {
                            step: 2,
                            title: 'Time Zone Setup',
                            description: 'Help us personalize your experience'
                        },
                        {
                            step: 3,
                            title: 'Memory Vault Creation',
                            description: 'Create your secure space for memories'
                        }
                    ]
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Update user profile during onboarding
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            // Validate request body
            const validationResult = UpdateProfileSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: validationResult.error.issues
                });
            }
            const { name, timezone } = validationResult.data;
            const updateData = {};
            if (name)
                updateData.name = name;
            if (timezone)
                updateData.timezone = timezone;
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: updatedUser.id,
                        name: updatedUser.name,
                        email: updatedUser.email,
                        timezone: updatedUser.timezone
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}
exports.OnboardingController = OnboardingController;
