
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
 
import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",  
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true, // Automatically sign in users after successful signup
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            }
        }),
        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && {
            github: {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
            }
        }),
    },
    baseURL: process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "http://localhost:4000", // Prefer configured BETTER_AUTH_URL or FRONTEND_URL
    trustedOrigins: [
        // Allow frontend origin from env; fall back to localhost for local dev
        process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        // Allow the backend URL itself if provided
        process.env.BETTER_AUTH_URL || "http://localhost:4000",
    ],
});