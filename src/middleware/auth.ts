import { Request, Response, NextFunction } from 'express';
import { auth } from '../utils/auth';

// Extend the Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                image?: string | null;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            session?: any;
        }
    }
}

/**
 * Authentication middleware - Protects routes by requiring valid session
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Create Headers object from Express headers
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.set(key, value);
            } else if (Array.isArray(value)) {
                headers.set(key, value.join(', '));
            }
        });

        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: headers
        });

        if (!session || !session.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        // Attach user and session to request object
        req.user = session.user;
        req.session = session;

        next();
    } catch (error: any) {
        console.error('Authentication middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session'
        });
    }
};

/**
 * Optional authentication middleware - Gets user if authenticated, but doesn't block if not
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Create Headers object from Express headers
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.set(key, value);
            } else if (Array.isArray(value)) {
                headers.set(key, value.join(', '));
            }
        });

        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: headers
        });

        if (session && session.user) {
            req.user = session.user;
            req.session = session;
        }

        next();
    } catch (error: any) {
        // Continue without authentication if there's an error
        console.error('Optional auth middleware error:', error);
        next();
    }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // For now, we don't have roles in the basic setup
        // You can extend this when you add role management
        next();
    };
};
