"use strict";
// src/prisma/client.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma");
// This is the singleton pattern. 
// It checks if a prisma client already exists. If not, it creates one.
// This prevents connection pool exhaustion.
exports.prisma = global.prisma ||
    new prisma_1.PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        datasourceUrl: process.env.DATABASE_URL,
    });
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
exports.default = exports.prisma;
