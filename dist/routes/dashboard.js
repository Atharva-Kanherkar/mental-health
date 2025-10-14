"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const onboarding_1 = require("../middleware/onboarding");
const client_1 = __importDefault(require("../prisma/client"));
const router = (0, express_1.Router)();
// Protect all dashboard routes and require onboarding
router.use(auth_1.requireAuth);
router.use(onboarding_1.requireOnboarding);
// Dashboard home - onboarding is guaranteed by middleware
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const memoryVaultId = req.memoryVault.id;
        // Get recent memories and favorite people
        const memoryVaultData = await client_1.default.memoryVault.findUnique({
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
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    image: req.user.image
                },
                memoryVault: {
                    id: memoryVaultData.id,
                    recentMemories: memoryVaultData.memories,
                    favPeople: memoryVaultData.favPeople,
                    totalMemories: await client_1.default.memory.count({
                        where: { vaultId: memoryVaultId }
                    }),
                    totalFavPeople: await client_1.default.favPerson.count({
                        where: { vaultId: memoryVaultId }
                    })
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
});
// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await client_1.default.user.findUnique({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
exports.default = router;
