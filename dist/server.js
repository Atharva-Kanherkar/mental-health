"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_1 = require("better-auth/node");
const auth_1 = require("./utils/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const memories_1 = __importDefault(require("./routes/memories"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const vault_1 = __importDefault(require("./routes/vault"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.all("/api/auth/{*path}", (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json());
// Serve static files
app.use(express_1.default.static('public'));
// Custom auth routes
app.use('/auth', auth_2.default);
// Onboarding routes (protected)
app.use('/onboarding', onboarding_1.default);
// Dashboard routes (protected)
app.use('/dashboard', dashboard_1.default);
// Memory vault API routes (protected)
app.use('/api/memories', memories_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/vault', vault_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mental Health API is running' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
