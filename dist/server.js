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
const walkthrough_1 = __importDefault(require("./routes/walkthrough"));
const journal_1 = __importDefault(require("./routes/journal"));
const mentalHealth_1 = __importDefault(require("./routes/mentalHealth"));
const rewards_1 = __importDefault(require("./routes/rewards"));
const dailyCheckin_1 = __importDefault(require("./routes/dailyCheckin"));
const questionnaires_1 = __importDefault(require("./routes/questionnaires"));
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
// Behind proxy/CDN (required for Secure cookies + correct proto)
app.set('trust proxy', 1);
// Strict, explicit origin allowlist for credentialed CORS
const allowed = new Set([
    'http://localhost:3000',
    'https://my-echoes.app',
    'https://www.my-echoes.app',
    process.env.FRONTEND_URL,
].filter(Boolean));
app.use((0, cors_1.default)({
    origin(origin, cb) {
        // Allow same-origin/non-browser (no Origin header) or allowed origins
        if (!origin || allowed.has(origin))
            return cb(null, true);
        return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Optional: make caches vary by Origin when using allowlist
app.use((req, res, next) => {
    res.header('Vary', 'Origin');
    next();
});
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Better Auth handler (Express v5 catch-all syntax)
app.all('/api/auth/{*splat}', (0, node_1.toNodeHandler)(auth_1.auth)); // or '/api/auth/*splat' if you don't need to match the base path
// Mount JSON after Better Auth - only for application/json requests
app.use((req, res, next) => {
    if (req.headers['content-type']?.includes('application/json')) {
        return express_1.default.json()(req, res, next);
    }
    next();
});
// Static files
app.use(express_1.default.static('public'));
// Protected routes
app.use('/onboarding', onboarding_1.default);
app.use('/dashboard', dashboard_1.default);
app.use('/memories', memories_1.default);
app.use('/favorites', favorites_1.default);
app.use('/vault', vault_1.default);
app.use('/api/files', files_1.default);
app.use('/api/walkthrough', walkthrough_1.default);
app.use('/api/journal', journal_1.default);
app.use('/api/mental-health', mentalHealth_1.default);
app.use('/api/rewards', rewards_1.default);
app.use('/api/checkin', dailyCheckin_1.default);
app.use('/api/questionnaires', questionnaires_1.default);
app.use('/api/user', user_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Mental Health API is running' });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
