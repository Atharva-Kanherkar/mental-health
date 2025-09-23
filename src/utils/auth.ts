 import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
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
