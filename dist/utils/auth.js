"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("../generated/prisma");
const prisma = new prisma_2.PrismaClient();
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true, // Automatically sign in users after successful signup
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000", // Your backend app's base URL
    trustedOrigins: [
        "http://localhost:3000", // Next.js frontend
        "http://localhost:4000" // Backend (for testing)
    ],
});
