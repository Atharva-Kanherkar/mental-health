"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../utils/auth");
class AuthController {
    /**
     * Sign up endpoint
     */
    static async signUp(req, res) {
        try {
            const { email, password, name, image } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, password, and name are required'
                });
            }
            // Call Better Auth API directly on server side
            const response = await auth_1.auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                    image
                }
            });
            res.status(201).json({
                success: true,
                data: response,
                message: 'User created successfully'
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
     * Sign in endpoint
     */
    static async signIn(req, res) {
        try {
            const { email, password, rememberMe } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            // Call Better Auth API directly on server side
            const response = await auth_1.auth.api.signInEmail({
                body: {
                    email,
                    password,
                    rememberMe: rememberMe ?? true
                }
            });
            res.json({
                success: true,
                data: response,
                message: 'Signed in successfully'
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
     * Sign out endpoint
     */
    static async signOut(req, res) {
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
            const response = await auth_1.auth.api.signOut({
                headers: headers
            });
            res.json({
                success: true,
                message: 'Signed out successfully'
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
     * Get current session endpoint
     */
    static async getSession(req, res) {
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
            const session = await auth_1.auth.api.getSession({
                headers: headers
            });
            res.json({
                success: true,
                session: session
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
     * Get current user profile
     */
    static async getProfile(req, res) {
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
            const session = await auth_1.auth.api.getSession({
                headers: headers
            });
            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }
            res.json({
                success: true,
                user: session.user
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
exports.AuthController = AuthController;
