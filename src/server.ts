import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import onboardingRoutes from "./routes/onboarding";
import dashboardRoutes from "./routes/dashboard";
import memoriesRoutes from "./routes/memories";
import favoritesRoutes from "./routes/favorites";
import vaultRoutes from "./routes/vault";
import fileRoutes from "./routes/files";
import walkthroughRoutes from "./routes/walkthrough";
import journalRoutes from "./routes/journal";
import mentalHealthRoutes from "./routes/mentalHealth";

const app = express();
 
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Better Auth handler - handles all /api/auth/* routes (Express v5 syntax)
app.all("/api/auth/*splat", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Onboarding routes (protected)
app.use('/onboarding', onboardingRoutes);

// Dashboard routes (protected)
app.use('/dashboard', dashboardRoutes);

// Memory vault API routes (protected)
app.use('/memories', memoriesRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/vault', vaultRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/walkthrough', walkthroughRoutes);

// Journal API routes (protected)
app.use('/api/journal', journalRoutes);

// Mental Health Assessment routes (protected)
app.use('/api/mental-health', mentalHealthRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mental Health API is running' });
});

const PORT = process.env.PORT || 4000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
