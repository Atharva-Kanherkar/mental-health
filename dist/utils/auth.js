"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const client_1 = __importDefault(require("../prisma/client"));
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(client_1.default, { provider: 'postgresql' }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
        }),
        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && {
            github: {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
            },
        }),
    },
    // Must match the exact backend origin (protocol + host + port)
    baseURL: process.env.BETTER_AUTH_URL || 'https://api.my-echoes.app',
    // Must include the exact frontend origin(s) that will call the API
    trustedOrigins: [
        'http://localhost:3000',
        'https://my-echoes.app',
        'https://www.my-echoes.app',
        process.env.FRONTEND_URL || '',
    ].filter(Boolean),
});
