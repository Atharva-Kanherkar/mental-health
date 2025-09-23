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
            // Return a clear JSON response instead of a 302 redirect.
            // Frontend can use `redirectTo` to navigate, but a 302 status
            // caused unexpected client-side redirect/logouts in some flows.
            return res.status(400).json({
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
            // If the user already has a vault, do not send a 302 redirect.
            // - For GET requests (e.g. onboarding page data), respond with a harmless JSON
            //   payload indicating the user is already onboarded so the frontend can display
            //   a friendly message instead of performing a hard redirect.
            // - For non-GET requests (POST/PUT) allow the request to proceed so onboarding
            //   handlers can be idempotent and accept content (controllers already handle
            //   existing-vault logic). Blocking POSTs caused 302 errors when the vault
            //   was created proactively during initialization.
            if (req.method === 'GET') {
                return res.status(200).json({
                    success: true,
                    data: {
                        alreadyOnboarded: true,
                        redirectTo: '/dashboard'
                    }
                });
            }

            // Attach the found vault for convenience and continue to handlers
            req.memoryVault = memoryVault;
            return next();
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
