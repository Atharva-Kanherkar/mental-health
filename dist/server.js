"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_1 = require("better-auth/node");
const auth_1 = require("./utils/auth");
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const memories_1 = __importDefault(require("./routes/memories"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const vault_1 = __importDefault(require("./routes/vault"));
const files_1 = __importDefault(require("./routes/files"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
// Better Auth handler - handles all /api/auth/* routes (Express v5 syntax)
app.all("/api/auth/*splat", (0, node_1.toNodeHandler)(auth_1.auth));
// Mount express json middleware after Better Auth handler
app.use(express_1.default.json());
// Serve static files
app.use(express_1.default.static('public'));
// Onboarding routes (protected)
app.use('/onboarding', onboarding_1.default);
// Dashboard routes (protected)
app.use('/dashboard', dashboard_1.default);
// Memory vault API routes (protected)
app.use('/memories', memories_1.default);
app.use('/favorites', favorites_1.default);
app.use('/vault', vault_1.default);
app.use('/api/files', files_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mental Health API is running' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
