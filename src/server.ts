import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import dashboardRoutes from "./routes/dashboard";
import memoriesRoutes from "./routes/memories";
import favoritesRoutes from "./routes/favorites";
import vaultRoutes from "./routes/vault";

const app = express();
 
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

app.all("/api/auth/{*path}", toNodeHandler(auth)); 
app.use(express.json());

// Serve static files
app.use(express.static('public'));

 


// Custom auth routes
app.use('/auth', authRoutes);

// Onboarding routes (protected)
app.use('/onboarding', onboardingRoutes);

// Dashboard routes (protected)
app.use('/dashboard', dashboardRoutes);

// Memory vault API routes (protected)
app.use('/api/memories', memoriesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/vault', vaultRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mental Health API is running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
 
});
