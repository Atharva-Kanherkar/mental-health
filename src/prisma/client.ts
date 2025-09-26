 // src/prisma/client.ts

import { PrismaClient } from '../generated/prisma';

// This helps us avoid creating a new PrismaClient on every hot-reload in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// This is the singleton pattern. 
// It checks if a prisma client already exists. If not, it creates one.
// This prevents connection pool exhaustion.
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;