import { authClient } from '../utils/auth-client';

export interface SignUpData {
    email: string;
    password: string;
    name: string;
    image?: string;
}

export interface SignInData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export class AuthService {
    /**
     * Sign up a new user with email and password
     */
    static async signUp(data: SignUpData) {
        try {
            const result = await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
                image: data.image,
                callbackURL: "/dashboard"
            });
            
            return { success: true, data: result.data, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    }

    /**
     * Sign in a user with email and password
     */
    static async signIn(data: SignInData) {
        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
                callbackURL: "/dashboard",
                rememberMe: data.rememberMe ?? true
            });
            
            return { success: true, data: result.data, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    }

    /**
     * Sign in with Google OAuth
     */
    static async signInWithGoogle(callbackURL = "/dashboard") {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL,
                errorCallbackURL: "/auth/error",
                newUserCallbackURL: "/welcome"
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in with GitHub OAuth
     */
    static async signInWithGitHub(callbackURL = "/dashboard") {
        try {
            await authClient.signIn.social({
                provider: "github",
                callbackURL,
                errorCallbackURL: "/auth/error",
                newUserCallbackURL: "/welcome"
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out the current user
     */
    static async signOut() {
        try {
            await authClient.signOut();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get the current user session
     */
    static async getSession() {
        try {
            const result = await authClient.getSession();
            return { success: true, session: result.data, error: null };
        } catch (error: any) {
            return { success: false, session: null, error: error.message };
        }
    }

    /**
     * Check if user is authenticated
     */
    static async isAuthenticated(): Promise<boolean> {
        const { session } = await this.getSession();
        return !!session?.user;
    }
}
