 import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './utils/auth';

import onboardingRoutes from './routes/onboarding';
import dashboardRoutes from './routes/dashboard';
import memoriesRoutes from './routes/memories';
import favoritesRoutes from './routes/favorites';
import vaultRoutes from './routes/vault';
import fileRoutes from './routes/files';
import walkthroughRoutes from './routes/walkthrough';
import streamingWalkthroughRoutes from './routes/streamingWalkthrough';
import journalRoutes from './routes/journal';
import mentalHealthRoutes from './routes/mentalHealth';
import rewardRoutes from './routes/rewards';
import dailyCheckinRoutes from './routes/dailyCheckin';
import questionnaireRoutes from './routes/questionnaires';
import userRoutes from './routes/user';
import crisisRoutes from './routes/crisis';
import checkInInsightsRoutes from './routes/checkInInsights';
import shareRoutes from './routes/share';
import medicationRoutes from './routes/medications';

const app = express();

// Behind proxy/CDN (required for Secure cookies + correct proto)
app.set('trust proxy', 1);

// Strict, explicit origin allowlist for credentialed CORS
const allowed = new Set(
  [
    'http://localhost:3000',
    'https://my-echoes.app',
    'https://www.my-echoes.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[],
);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/non-browser (no Origin header) or allowed origins
      // Mobile apps (React Native/Expo) don't send Origin header
      if (!origin || allowed.has(origin)) return cb(null, true);
      return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  }),
);

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
app.all('/api/auth/{*splat}', toNodeHandler(auth)); // or '/api/auth/*splat' if you don't need to match the base path

// Mount JSON after Better Auth - only for application/json requests
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/json')) {
    return express.json()(req, res, next);
  }
  next();
});

// Static files
app.use(express.static('public'));

// Protected routes
app.use('/onboarding', onboardingRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/memories', memoriesRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/vault', vaultRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/walkthrough', walkthroughRoutes);
app.use('/api/walkthrough-v2', streamingWalkthroughRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/checkin', dailyCheckinRoutes);
app.use('/api/checkin/insights', checkInInsightsRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/user', userRoutes);
app.use('/api/crisis', crisisRoutes);
app.use('/api/share', shareRoutes); // Authenticated share endpoints
app.use('/share', shareRoutes); // Public share endpoints
app.use('/api/medications', medicationRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Mental Health API is running' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
