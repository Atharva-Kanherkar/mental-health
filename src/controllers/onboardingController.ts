
import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from "../prisma/client";
import { MemoryController } from './memoryController';
import { FavPersonController } from './favPersonController';


// Zod validation schemas
const CreateVaultSchema = z.object({
  timezone: z.string().optional(),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
});

// We'll reuse the validation schemas from the other controllers
// No need to duplicate validation logic

export class OnboardingController {
    /**
     * Get onboarding status for the authenticated user
     */
    static async getOnboardingStatus(req: Request, res: Response) {
        try {
            // User is guaranteed to exist due to requireAuth middleware
            const userId = req.user!.id;

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
                        id: req.user!.id,
                        name: req.user!.name,
                        email: req.user!.email,
                        image: req.user!.image
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Step 1: Initialize onboarding session (collect timezone, but don't create vault yet)
     */
    static async initializeOnboarding(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            
            // Validate request body
            const validationResult = CreateVaultSchema.safeParse(req.body);
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

            // Update user timezone if provided (preparing for vault creation)
            let updatedUser = null;
            if (timezone) {
                updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: { timezone }
                });
            }

            res.status(200).json({
                success: true,
                message: 'Onboarding initialized. Ready to collect your first memories and people.',
                data: {
                    user: updatedUser ? {
                        timezone: updatedUser.timezone
                    } : null,
                    nextStep: 'Add your first cherished person - someone who matters most to you'
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Final Step: Create Memory Vault with collected data
     * This should only be called after user has added at least one person or memory
     */
    static async createMemoryVaultWithContent(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

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

            // For now, create an empty vault but in the future this could include initial content
            const memoryVault = await prisma.memoryVault.create({
                data: {
                    userId: userId
                }
            });

            res.status(201).json({
                success: true,
                message: 'Your memory sanctuary has been created! Welcome to your safe space.',
                data: {
                    memoryVault: {
                        id: memoryVault.id,
                        userId: memoryVault.userId,
                        createdAt: memoryVault.createdAt
                    },
                    nextStep: 'Explore your sanctuary - add more memories and people as you feel comfortable'
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Get onboarding page data (only for non-onboarded users)
     */
    static async getOnboardingPage(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

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
                        id: req.user!.id,
                        name: req.user!.name,
                        email: req.user!.email,
                        image: req.user!.image
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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Update user profile during onboarding
     */
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            
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

            const updateData: any = {};
            if (name) updateData.name = name;
            if (timezone) updateData.timezone = timezone;

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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Step 2: Add a favorite person during onboarding
     * Delegates to FavPersonController and adds onboarding-specific progress tracking
     */
    static async addFavoritePersonOnboarding(req: Request, res: Response) {
        try {
            // Check if user has a memory vault first
            const userId = req.user!.id;
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });

            if (!memoryVault) {
                return res.status(400).json({
                    success: false,
                    message: 'Please create your memory vault first',
                    redirectTo: '/onboarding/create-vault'
                });
            }

            // Create a custom response handler to add onboarding progress
            const originalSend = res.json;
            res.json = function(data: any) {
                if (data.success && data.data?.favPerson) {
                    // Add onboarding-specific progress information
                    prisma.favPerson.count({ where: { vaultId: memoryVault.id } })
                        .then(count => {
                            data.data.progress = {
                                totalFavPeople: count,
                                nextStep: 'Continue adding favorite people or move to memories'
                            };
                            originalSend.call(this, data);
                        })
                        .catch(() => originalSend.call(this, data));
                } else {
                    originalSend.call(this, data);
                }
                return this;
            };

            // Delegate to the main FavPersonController
            await FavPersonController.createFavPerson(req, res);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Step 3: Add a memory during onboarding
     * Delegates to MemoryController and adds onboarding-specific progress tracking
     */
    static async addMemoryOnboarding(req: Request, res: Response) {
        try {
            // Check if user has a memory vault first
            const userId = req.user!.id;
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });

            if (!memoryVault) {
                return res.status(400).json({
                    success: false,
                    message: 'Please create your memory vault first',
                    redirectTo: '/onboarding/create-vault'
                });
            }

            // Create a custom response handler to add onboarding progress
            const originalSend = res.json;
            res.json = function(data: any) {
                if (data.success && data.data?.memory) {
                    // Add onboarding-specific progress information
                    prisma.memory.count({ where: { vaultId: memoryVault.id } })
                        .then(count => {
                            data.data.progress = {
                                totalMemories: count,
                                nextStep: 'Continue adding memories or complete onboarding'
                            };
                            originalSend.call(this, data);
                        })
                        .catch(() => originalSend.call(this, data));
                } else {
                    originalSend.call(this, data);
                }
                return this;
            };

            // Delegate to the main MemoryController
            await MemoryController.createMemory(req, res);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Final Step: Complete the entire onboarding process
     * If no vault exists yet, create it. Then provide summary.
     */
    static async completeOnboarding(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            // Check if user has a memory vault
            let memoryVault = await prisma.memoryVault.findUnique({
                where: { userId },
                include: {
                    memories: true,
                    favPeople: true
                }
            });

            // If no vault exists, create it now (progressive onboarding completion)
            if (!memoryVault) {
                const newVault = await prisma.memoryVault.create({
                    data: { userId },
                    include: {
                        memories: true,
                        favPeople: true
                    }
                });
                memoryVault = newVault;
            }

            // Get final summary
            res.json({
                success: true,
                message: 'Welcome to your memory sanctuary! Your safe space is ready.',
                data: {
                    memoryVault: {
                        id: memoryVault.id,
                        createdAt: memoryVault.createdAt
                    },
                    summary: {
                        totalFavPeople: memoryVault.favPeople.length,
                        totalMemories: memoryVault.memories.length,
                        memoriesByType: {
                            text: memoryVault.memories.filter(m => m.type === 'text').length,
                            image: memoryVault.memories.filter(m => m.type === 'image').length,
                            audio: memoryVault.memories.filter(m => m.type === 'audio').length
                        }
                    },
                    message: memoryVault.favPeople.length === 0 && memoryVault.memories.length === 0 
                        ? "Your sanctuary awaits your first cherished memories and people." 
                        : "Your sanctuary is populated with the people and memories you hold dear.",
                    redirectTo: '/dashboard'
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Get current onboarding progress
     */
    static async getOnboardingProgress(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            // Check if user has a memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId },
                include: {
                    memories: true,
                    favPeople: true
                }
            });

            if (!memoryVault) {
                return res.json({
                    success: true,
                    data: {
                        currentStep: 'create-vault',
                        progress: {
                            vaultCreated: false,
                            favPeopleCount: 0,
                            memoriesCount: 0
                        },
                        nextAction: 'Create your memory vault'
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    currentStep: memoryVault.favPeople.length === 0 ? 'add-people' : 
                                memoryVault.memories.length === 0 ? 'add-memories' : 'complete',
                    progress: {
                        vaultCreated: true,
                        favPeopleCount: memoryVault.favPeople.length,
                        memoriesCount: memoryVault.memories.length,
                        memoriesByType: {
                            text: memoryVault.memories.filter(m => m.type === 'text').length,
                            image: memoryVault.memories.filter(m => m.type === 'image').length,
                            audio: memoryVault.memories.filter(m => m.type === 'audio').length
                        }
                    },
                    nextAction: memoryVault.favPeople.length === 0 ? 'Add your favorite people' :
                               memoryVault.memories.length === 0 ? 'Add your memories' : 'Complete onboarding'
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}