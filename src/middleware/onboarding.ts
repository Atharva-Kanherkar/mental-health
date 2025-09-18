import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Middleware to check if user has completed onboarding
 * Redirects to onboarding if not completed
 */
export const requireOnboarding = async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error: any) {
        console.error('Onboarding check middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Middleware to check if user has NOT completed onboarding
 * Redirects to dashboard if already completed
 */
export const requireNoOnboarding = async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error: any) {
        console.error('No onboarding check middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Extend Request interface to include memoryVault
declare global {
    namespace Express {
        interface Request {
            memoryVault?: {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        }
    }
}
