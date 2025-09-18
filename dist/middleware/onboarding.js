"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireNoOnboarding = exports.requireOnboarding = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
/**
 * Middleware to check if user has completed onboarding
 * Redirects to onboarding if not completed
 */
const requireOnboarding = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const userId = req.user.id;
        // Check if user has completed onboarding by looking for MemoryVault
        const memoryVault = await prisma.memoryVault.findUnique({
            where: { userId }
        });
        if (!memoryVault) {
            return res.status(302).json({
                success: false,
                message: 'Onboarding required',
                redirectTo: '/onboarding'
            });
        }
        // Attach memoryVault to request for convenience
        req.memoryVault = memoryVault;
        next();
    }
    catch (error) {
        console.error('Onboarding check middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.requireOnboarding = requireOnboarding;
/**
 * Middleware to check if user has NOT completed onboarding
 * Redirects to dashboard if already completed
 */
const requireNoOnboarding = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const userId = req.user.id;
        // Check if user has completed onboarding
        const memoryVault = await prisma.memoryVault.findUnique({
            where: { userId }
        });
        if (memoryVault) {
            return res.status(302).json({
                success: false,
                message: 'Onboarding already completed',
                redirectTo: '/dashboard'
            });
        }
        next();
    }
    catch (error) {
        console.error('No onboarding check middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.requireNoOnboarding = requireNoOnboarding;
