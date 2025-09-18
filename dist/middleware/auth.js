"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.requireAuth = void 0;
const auth_1 = require("../utils/auth");
/**
 * Authentication middleware - Protects routes by requiring valid session
 */
const requireAuth = async (req, res, next) => {
    try {
        // Create Headers object from Express headers
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.set(key, value);
            }
            else if (Array.isArray(value)) {
                headers.set(key, value.join(', '));
            }
        });
        // Get session from Better Auth
        const session = await auth_1.auth.api.getSession({
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
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session'
        });
    }
};
exports.requireAuth = requireAuth;
/**
 * Optional authentication middleware - Gets user if authenticated, but doesn't block if not
 */
const optionalAuth = async (req, res, next) => {
    try {
        // Create Headers object from Express headers
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.set(key, value);
            }
            else if (Array.isArray(value)) {
                headers.set(key, value.join(', '));
            }
        });
        // Get session from Better Auth
        const session = await auth_1.auth.api.getSession({
            headers: headers
        });
        if (session && session.user) {
            req.user = session.user;
            req.session = session;
        }
        next();
    }
    catch (error) {
        // Continue without authentication if there's an error
        console.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
