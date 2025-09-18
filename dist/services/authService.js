"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_client_1 = require("../utils/auth-client");
class AuthService {
    /**
     * Sign up a new user with email and password
     */
    static async signUp(data) {
        try {
            const result = await auth_client_1.authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
                image: data.image,
                callbackURL: "/dashboard"
            });
            return { success: true, data: result.data, error: null };
        }
        catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }
    /**
     * Sign in a user with email and password
     */
    static async signIn(data) {
        try {
            const result = await auth_client_1.authClient.signIn.email({
                email: data.email,
                password: data.password,
                callbackURL: "/dashboard",
                rememberMe: data.rememberMe ?? true
            });
            return { success: true, data: result.data, error: null };
        }
        catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }
    /**
     * Sign in with Google OAuth
     */
    static async signInWithGoogle(callbackURL = "/dashboard") {
        try {
            await auth_client_1.authClient.signIn.social({
                provider: "google",
                callbackURL,
                errorCallbackURL: "/auth/error",
                newUserCallbackURL: "/welcome"
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Sign in with GitHub OAuth
     */
    static async signInWithGitHub(callbackURL = "/dashboard") {
        try {
            await auth_client_1.authClient.signIn.social({
                provider: "github",
                callbackURL,
                errorCallbackURL: "/auth/error",
                newUserCallbackURL: "/welcome"
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Sign out the current user
     */
    static async signOut() {
        try {
            await auth_client_1.authClient.signOut();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Get the current user session
     */
    static async getSession() {
        try {
            const result = await auth_client_1.authClient.getSession();
            return { success: true, session: result.data, error: null };
        }
        catch (error) {
            return { success: false, session: null, error: error.message };
        }
    }
    /**
     * Check if user is authenticated
     */
    static async isAuthenticated() {
        const { session } = await this.getSession();
        return !!session?.user;
    }
}
exports.AuthService = AuthService;
