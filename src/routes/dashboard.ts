import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireOnboarding } from '../middleware/onboarding';
import prisma from "../prisma/client";

const router = Router();

// Protect all dashboard routes and require onboarding
router.use(requireAuth);
router.use(requireOnboarding);

// Dashboard home - onboarding is guaranteed by middleware
router.get('/', async (req, res) => {
    try {
        const userId = req.user!.id;
        const memoryVaultId = req.memoryVault!.id;

        // Get recent memories and favorite people
        const memoryVaultData = await prisma.memoryVault.findUnique({
            where: { id: memoryVaultId },
            include: {
                memories: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
                favPeople: {
                    take: 3
                }
            }
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: req.user!.id,
                    name: req.user!.name,
                    email: req.user!.email,
                    image: req.user!.image
                },
                memoryVault: {
                    id: memoryVaultData!.id,
                    recentMemories: memoryVaultData!.memories,
                    favPeople: memoryVaultData!.favPeople,
                    totalMemories: await prisma.memory.count({
                        where: { vaultId: memoryVaultId }
                    }),
                    totalFavPeople: await prisma.favPerson.count({
                        where: { vaultId: memoryVaultId }
                    })
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                memoryVault: {
                    include: {
                        _count: {
                            select: {
                                memories: true,
                                favPeople: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    timezone: user.timezone,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                stats: user.memoryVault ? {
                    memoriesCount: user.memoryVault._count.memories,
                    favPeopleCount: user.memoryVault._count.favPeople,
                    vaultCreatedAt: user.memoryVault.createdAt
                } : null
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

export default router;
