import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "https://mental-health-nbvq2.ondigitalocean.app", // Points to your backend API
});
