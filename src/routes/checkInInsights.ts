/**
 * Check-In Insights Routes
 * AI-powered insights and analytics for daily check-ins
 *
 * All routes require authentication
 * Mount at: /api/checkin/insights
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { checkInInsightsController } from '../controllers/checkInInsightsController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /weekly
 * Get AI-generated weekly insights summary
 * Returns: WeeklyInsight with AI analysis, trends, highlights, recommendations
 */
router.get('/weekly', (req, res) => {
  checkInInsightsController.getWeeklyInsights(req, res);
});

/**
 * GET /patterns?days=30
 * Detect patterns in gratitude, challenges, and accomplishments
 * Query params:
 *   - days: Number of days to analyze (1-365, default: 30)
 * Returns: Array of Pattern objects
 */
router.get('/patterns', (req, res) => {
  checkInInsightsController.getPatterns(req, res);
});

/**
 * GET /correlations?days=30
 * Find statistical correlations between behaviors and mental health metrics
 * Query params:
 *   - days: Number of days to analyze (1-365, default: 30)
 * Returns: Array of Correlation objects with statistical significance
 */
router.get('/correlations', (req, res) => {
  checkInInsightsController.getCorrelations(req, res);
});

/**
 * GET /predictions
 * Get mood trend predictions for the next 7 days
 * Uses linear regression and historical patterns
 * Returns: MoodPrediction with daily forecasts and confidence scores
 */
router.get('/predictions', (req, res) => {
  checkInInsightsController.getPredictions(req, res);
});

/**
 * GET /warnings
 * Detect early warning signs in mental health data
 * Checks for declining mood, high stress, and safety concerns
 * Returns: Array of Warning objects with severity and recommendations
 */
router.get('/warnings', (req, res) => {
  checkInInsightsController.getWarnings(req, res);
});

/**
 * GET /reflections?days=30
 * Analyze reflection text (gratitude, challenges, accomplishments)
 * Uses AI to identify themes and emotional patterns
 * Query params:
 *   - days: Number of days to analyze (1-365, default: 30)
 * Returns: ReflectionAnalysis with theme breakdowns
 */
router.get('/reflections', (req, res) => {
  checkInInsightsController.getReflections(req, res);
});

/**
 * GET /progress?days=30
 * Get progress metrics comparing current vs previous period
 * Shows improvements in mood, energy, stress, and behaviors
 * Query params:
 *   - days: Number of days to analyze (1-365, default: 30)
 * Returns: ProgressMetrics with comparison data
 */
router.get('/progress', (req, res) => {
  checkInInsightsController.getProgress(req, res);
});

/**
 * GET /comprehensive?days=30
 * Get all insights in a single request
 * Combines weekly, patterns, correlations, predictions, warnings, and progress
 * Query params:
 *   - days: Number of days to analyze (1-365, default: 30)
 * Returns: Comprehensive insights object with all analysis types
 */
router.get('/comprehensive', (req, res) => {
  checkInInsightsController.getComprehensiveInsights(req, res);
});

export default router;
