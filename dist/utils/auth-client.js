"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authClient = void 0;
const client_1 = require("better-auth/client");
exports.authClient = (0, client_1.createAuthClient)({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:4000", // Points to your backend API
});
