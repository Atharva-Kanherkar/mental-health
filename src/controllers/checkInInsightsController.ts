/**
 * Check-In Insights Controller
 * Handles HTTP requests for AI-powered mental health insights
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { CheckInAnalyticsService } from '../services/checkInAnalyticsService';
const checkInAnalyticsService = new CheckInAnalyticsService();

// Validation schemas
const DaysQuerySchema = z.object({
  days: z.string()
    .optional()
    .default('30')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 365, {
      message: 'Days must be between 1 and 365'
    })
});

const RefreshQuerySchema = z.object({
  refresh: z.string()
    .optional()
    .default('false')
    .transform(val => val === 'true')
});

export class CheckInInsightsController {

  /**
   * GET /api/checkin/insights/weekly
   * Get AI-generated weekly insights
   */
  async getWeeklyInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      console.log(`[CheckInInsightsController] Generating weekly insights for user ${userId}`);

      const insights = await checkInAnalyticsService.generateWeeklyInsights(userId);

      res.json({
        success: true,
        insights,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error generating weekly insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate weekly insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/patterns?days=30
   * Detect patterns in gratitude, challenges, and accomplishments
   */
  async getPatterns(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validation = DaysQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { days } = validation.data;
      console.log(`[CheckInInsightsController] Detecting patterns for user ${userId} (${days} days)`);

      const patterns = await checkInAnalyticsService.detectPatterns(userId, days);

      res.json({
        success: true,
        patterns,
        period: {
          days,
          patternCount: patterns.length
        },
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error detecting patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect patterns',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/correlations?days=30
   * Find correlations between behaviors and mental health metrics
   */
  async getCorrelations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validation = DaysQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { days } = validation.data;
      console.log(`[CheckInInsightsController] Finding correlations for user ${userId} (${days} days)`);

      const correlations = await checkInAnalyticsService.findCorrelations(userId, days);

      res.json({
        success: true,
        correlations,
        period: {
          days,
          correlationCount: correlations.length
        },
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error finding correlations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find correlations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/predictions
   * Get mood predictions for the next 7 days
   */
  async getPredictions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      console.log(`[CheckInInsightsController] Generating predictions for user ${userId}`);

      const prediction = await checkInAnalyticsService.predictMoodTrend(userId);

      res.json({
        success: true,
        prediction,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error generating predictions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate predictions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/warnings
   * Detect early warning signs in mental health data
   */
  async getWarnings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      console.log(`[CheckInInsightsController] Detecting warnings for user ${userId}`);

      const warnings = await checkInAnalyticsService.detectWarnings(userId);

      res.json({
        success: true,
        warnings,
        warningCount: warnings.length,
        hasUrgentWarnings: warnings.some(w => w.urgent),
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error detecting warnings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect warnings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/reflections?days=30
   * Analyze reflection text (gratitude, challenges, accomplishments)
   */
  async getReflections(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validation = DaysQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { days } = validation.data;
      console.log(`[CheckInInsightsController] Analyzing reflections for user ${userId} (${days} days)`);

      const analysis = await checkInAnalyticsService.analyzeReflections(userId, days);

      res.json({
        success: true,
        analysis,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error analyzing reflections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze reflections',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/progress?days=30
   * Get progress metrics comparing current vs previous period
   */
  async getProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validation = DaysQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { days } = validation.data;
      console.log(`[CheckInInsightsController] Getting progress for user ${userId} (${days} days)`);

      const progress = await checkInAnalyticsService.getProgressMetrics(userId, days);

      res.json({
        success: true,
        progress,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error getting progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/checkin/insights/comprehensive?days=30
   * Get comprehensive insights (all in one)
   */
  async getComprehensiveInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validation = DaysQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { days } = validation.data;
      console.log(`[CheckInInsightsController] Getting comprehensive insights for user ${userId} (${days} days)`);

      // Fetch all insights in parallel
      const [
        weeklyInsights,
        patterns,
        correlations,
        predictions,
        warnings,
        progress
      ] = await Promise.all([
        checkInAnalyticsService.generateWeeklyInsights(userId),
        checkInAnalyticsService.detectPatterns(userId, days),
        checkInAnalyticsService.findCorrelations(userId, days),
        checkInAnalyticsService.predictMoodTrend(userId),
        checkInAnalyticsService.detectWarnings(userId),
        checkInAnalyticsService.getProgressMetrics(userId, days)
      ]);

      res.json({
        success: true,
        insights: {
          weekly: weeklyInsights,
          patterns,
          correlations,
          predictions,
          warnings,
          progress
        },
        metadata: {
          daysAnalyzed: days,
          hasUrgentWarnings: warnings.some(w => w.urgent),
          patternCount: patterns.length,
          correlationCount: correlations.length
        },
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('[CheckInInsightsController] Error getting comprehensive insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get comprehensive insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const checkInInsightsController = new CheckInInsightsController();
