
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
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000", // Your backend app's base URL
    trustedOrigins: [
        "http://localhost:3000", // Next.js frontend
        "http://localhost:4000"  // Backend (for testing)
    ],
});