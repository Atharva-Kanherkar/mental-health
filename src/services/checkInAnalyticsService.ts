/**
 * Check-In Analytics Service - Main Business Logic Layer
 *
 * Combines statistical analysis (correlationService) with AI insights (aiInsightsService)
 * Uses existing infrastructure: CircuitBreaker, CacheService, RetryHandler, RateLimiter
 * Provides comprehensive mental health insights from check-in data
 */

import prisma from '../prisma/client';
import { CircuitBreaker } from '../infrastructure/circuitBreaker';
import { CacheService, CACHE_TTL } from '../infrastructure/cacheService';
import { RetryHandler } from '../infrastructure/retryHandler';
import { RateLimiter } from '../infrastructure/rateLimiter';
import { correlationService } from './correlationService';
import { aiInsightsService } from './aiInsightsService';
import {
  Pattern,
  WeeklyInsight,
  MoodPrediction,
  Warning,
  ICheckInAnalyticsService,
  Correlation,
  ReflectionAnalysis,
  ProgressMetrics
} from '../types/insights';

export class CheckInAnalyticsService implements ICheckInAnalyticsService {
  private circuitBreaker: CircuitBreaker;
  private cache: CacheService;
  private retry: RetryHandler;
  private rateLimiter: RateLimiter;

  constructor() {
    // Initialize infrastructure components
    this.circuitBreaker = new CircuitBreaker('check-in-analytics', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000
    });

    this.cache = new CacheService();

    this.retry = new RetryHandler({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      factor: 2,
      jitter: true
    });

    this.rateLimiter = new RateLimiter({
      maxConcurrent: 5,
      requestsPerMinute: 30,
      queueSize: 100
    });
  }

  /**
   * Detect patterns in gratitude, challenges, and accomplishments
   */
  async detectPatterns(userId: string, days: number = 30): Promise<Pattern[]> {
    // Check cache first
    const cacheKey = CacheService.generateKey(userId, 'patterns', { days });
    const cached = this.cache.get<Pattern[]>(cacheKey);
    if (cached) {
      console.log('[CheckInAnalyticsService] Returning cached patterns');
      return cached;
    }

    try {
      // Fetch check-in data
      const checkIns = await this.fetchCheckIns(userId, days);

      if (checkIns.length === 0) {
        return [];
      }

      const patterns: Pattern[] = [];

      // Analyze gratitude patterns
      const gratitudeEntries = checkIns
        .map(c => c.gratefulFor)
        .filter((g): g is string => !!g && g.length > 0);

      if (gratitudeEntries.length >= 3) {
        const gratitudeThemes = await this.retry.execute(async () => {
          return await aiInsightsService.analyzeGratitudePatterns(gratitudeEntries);
        });

        gratitudeThemes.themes.forEach(theme => {
          patterns.push({
            type: 'gratitude',
            name: theme.name,
            frequency: theme.count,
            examples: theme.keywords.slice(0, 3),
            trend: 'stable', // Could be enhanced with trend analysis
            firstOccurrence: checkIns[checkIns.length - 1].date,
            lastOccurrence: checkIns[0].date,
            impactOnMood: 2 // Positive impact
          });
        });
      }

      // Analyze challenge patterns
      const challengeEntries = checkIns
        .map(c => c.challengesToday)
        .filter((c): c is string => !!c && c.length > 0);

      if (challengeEntries.length >= 3) {
        const challengeThemes = await this.retry.execute(async () => {
          return await aiInsightsService.analyzeChallengePatterns(challengeEntries);
        });

        challengeThemes.themes.forEach(theme => {
          patterns.push({
            type: 'challenge',
            name: theme.name,
            frequency: theme.count,
            examples: theme.keywords.slice(0, 3),
            trend: 'stable',
            firstOccurrence: checkIns[checkIns.length - 1].date,
            lastOccurrence: checkIns[0].date,
            impactOnMood: -2 // Negative impact
          });
        });
      }

      // Analyze behavior patterns
      const behaviors = [
        { key: 'exercised' as const, name: 'Regular Exercise', impact: 2 },
        { key: 'practicedSelfCare' as const, name: 'Self-Care Practice', impact: 2 },
        { key: 'socializedHealthily' as const, name: 'Social Connection', impact: 1 },
        { key: 'ateWell' as const, name: 'Healthy Nutrition', impact: 1 },
        { key: 'tookMedication' as const, name: 'Medication Adherence', impact: 1 }
      ];

      behaviors.forEach(behavior => {
        const count = checkIns.filter(c => c[behavior.key]).length;
        if (count > 0) {
          const frequency = (count / checkIns.length) * 100;
          patterns.push({
            type: 'behavior',
            name: behavior.name,
            frequency: count,
            examples: [`Practiced ${frequency.toFixed(0)}% of days`],
            trend: this.calculateBehaviorTrend(checkIns, behavior.key),
            firstOccurrence: checkIns[checkIns.length - 1].date,
            lastOccurrence: checkIns[0].date,
            impactOnMood: behavior.impact
          });
        }
      });

      // Cache results
      this.cache.set(cacheKey, patterns, CACHE_TTL.PATTERNS);

      return patterns;
    } catch (error) {
      console.error('[CheckInAnalyticsService] Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Find correlations between behaviors and mental health metrics
   */
  async findCorrelations(userId: string, days: number = 30): Promise<Correlation[]> {
    // Check cache
    const cacheKey = CacheService.generateKey(userId, 'correlations', { days });
    const cached = this.cache.get<Correlation[]>(cacheKey);
    if (cached) {
      console.log('[CheckInAnalyticsService] Returning cached correlations');
      return cached;
    }

    try {
      const checkIns = await this.fetchCheckIns(userId, days);

      if (checkIns.length < 7) {
        return [];
      }

      // Use pure statistical analysis (no AI, no external calls)
      const correlations = correlationService.identifyStrongCorrelations(checkIns);

      // Cache results
      this.cache.set(cacheKey, correlations, CACHE_TTL.CORRELATIONS);

      return correlations;
    } catch (error) {
      console.error('[CheckInAnalyticsService] Error finding correlations:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered weekly insights
   */
  async generateWeeklyInsights(userId: string): Promise<WeeklyInsight> {
    // Check cache
    const cacheKey = CacheService.generateKey(userId, 'weekly-insights');
    const cached = this.cache.get<WeeklyInsight>(cacheKey);
    if (cached) {
      console.log('[CheckInAnalyticsService] Returning cached weekly insights');
      return cached;
    }

    try {
      // Fetch last 7 days of check-ins AND journals
      const [checkIns, journals] = await Promise.all([
        this.fetchCheckIns(userId, 7),
        this.fetchJournals(userId, 7)
      ]);

      if (checkIns.length === 0) {
        return this.getEmptyWeeklyInsight();
      }

      // Calculate mood trend
      const moodValues = checkIns.map(c => c.overallMood);
      const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;

      const firstHalfAvg = this.average(moodValues.slice(0, Math.floor(moodValues.length / 2)));
      const secondHalfAvg = this.average(moodValues.slice(Math.floor(moodValues.length / 2)));
      const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

      let direction: 'improving' | 'stable' | 'declining';
      if (changePercent > 10) direction = 'improving';
      else if (changePercent < -10) direction = 'declining';
      else direction = 'stable';

      // Get patterns
      const patterns = await this.detectPatterns(userId, 7);

      // Aggregate journal data (statistical, not LLM)
      const journalAggregation = this.aggregateJournalData(journals);

      // Generate AI summary with circuit breaker and rate limiting
      // NOW includes journal context
      const aiSummary = await this.rateLimiter.enqueue(async () => {
        return await this.circuitBreaker.execute(async () => {
          return await aiInsightsService.generateWeeklySummary(checkIns, journalAggregation);
        });
      });

      // Get personalized insight with journal context
      const personalizedInsight = await this.rateLimiter.enqueue(async () => {
        return await this.circuitBreaker.execute(async () => {
          return await aiInsightsService.generatePersonalizedInsight(checkIns, journalAggregation);
        });
      });

      // Extract highlights and recommendations
      const highlights = this.extractHighlights(checkIns, patterns);
      const recommendations = await this.generateRecommendations(checkIns, patterns);

      const weeklyInsight: WeeklyInsight = {
        weekStart: checkIns[checkIns.length - 1].date,
        weekEnd: checkIns[0].date,
        summary: aiSummary,
        moodTrend: {
          direction,
          changePercent: Math.round(changePercent * 10) / 10,
          averageMood: Math.round(avgMood * 10) / 10
        },
        highlights,
        patterns: patterns.slice(0, 5),
        recommendations,
        progressNotes: [personalizedInsight],
        aiAnalysis: personalizedInsight,
        generatedBy: 'ai'
      };

      // Cache for 24 hours
      this.cache.set(cacheKey, weeklyInsight, CACHE_TTL.WEEKLY_INSIGHTS);

      return weeklyInsight;
    } catch (error) {
      console.error('[CheckInAnalyticsService] Error generating weekly insights:', error);
      // Return statistical fallback
      return this.generateStatisticalWeeklyInsight(userId);
    }
  }

  /**
   * Analyze reflection text (gratitude, challenges, accomplishments)
   */
  async analyzeReflections(userId: string, days: number = 30): Promise<ReflectionAnalysis> {
    const checkIns = await this.fetchCheckIns(userId, days);

    if (checkIns.length === 0) {
      return this.getEmptyReflectionAnalysis(days);
    }

    // Analyze gratitude themes
    const gratitudeEntries = checkIns
      .map(c => c.gratefulFor)
      .filter((g): g is string => !!g && g.length > 0);

    const gratitudeThemes = gratitudeEntries.length >= 3
      ? await aiInsightsService.analyzeGratitudePatterns(gratitudeEntries)
      : { themes: [], topTheme: 'N/A', diversity: 0, overallSentiment: 'positive' as const };

    // Analyze challenge themes
    const challengeEntries = checkIns
      .map(c => c.challengesToday)
      .filter((c): c is string => !!c && c.length > 0);

    const challengeThemes = challengeEntries.length >= 3
      ? await aiInsightsService.analyzeChallengePatterns(challengeEntries)
      : { themes: [], topTheme: 'N/A', diversity: 0, overallSentiment: 'neutral' as const };

    // Analyze accomplishment themes (use gratitude analysis as proxy)
    const accomplishmentEntries = checkIns
      .map(c => c.accomplishments)
      .filter((a): a is string => !!a && a.length > 0);

    const accomplishmentThemes = accomplishmentEntries.length >= 3
      ? await aiInsightsService.analyzeGratitudePatterns(accomplishmentEntries)
      : { themes: [], topTheme: 'N/A', diversity: 0, overallSentiment: 'positive' as const };

    return {
      period: {
        start: checkIns[checkIns.length - 1].date,
        end: checkIns[0].date,
        days: checkIns.length
      },
      gratitudeThemes,
      challengeThemes,
      accomplishmentThemes,
      emotionalTrends: {
        dominantEmotion: this.identifyDominantEmotion(checkIns),
        emotionFrequency: this.calculateEmotionFrequency(checkIns)
      },
      insights: [
        `Completed ${checkIns.length} check-ins over ${days} days`,
        gratitudeThemes.topTheme !== 'N/A' ? `Primary gratitude focus: ${gratitudeThemes.topTheme}` : 'No gratitude patterns identified yet',
        challengeThemes.topTheme !== 'N/A' ? `Main challenge area: ${challengeThemes.topTheme}` : 'No challenge patterns identified yet'
      ],
      growthAreas: this.identifyGrowthAreas(checkIns)
    };
  }

  /**
   * Predict mood trends based on historical data
   */
  async predictMoodTrend(userId: string): Promise<MoodPrediction> {
    const cacheKey = CacheService.generateKey(userId, 'mood-prediction');
    const cached = this.cache.get<MoodPrediction>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const checkIns = await this.fetchCheckIns(userId, 30);

      if (checkIns.length < 7) {
        return {
          nextSevenDays: [],
          trend: 'stable',
          accuracy: 0,
          recommendation: 'Need more check-in data for predictions'
        };
      }

      // Calculate trend using linear regression
      const moodValues = checkIns.map(c => c.overallMood);
      const trend = correlationService.calculateTrend(moodValues);

      // Determine trend direction
      let trendDirection: 'improving' | 'stable' | 'declining';
      if (trend.slope > 0.1) trendDirection = 'improving';
      else if (trend.slope < -0.1) trendDirection = 'declining';
      else trendDirection = 'stable';

      // Generate predictions for next 7 days
      const predictions = [];
      const lastMood = moodValues[0];

      for (let i = 1; i <= 7; i++) {
        const predictedMood = Math.max(1, Math.min(10, lastMood + (trend.slope * i)));
        const confidence = Math.max(30, Math.min(85, trend.rSquared * 100));

        predictions.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          predictedMood: Math.round(predictedMood * 10) / 10,
          confidence: Math.round(confidence),
          factors: this.identifyPredictionFactors(checkIns)
        });
      }

      const prediction: MoodPrediction = {
        nextSevenDays: predictions,
        trend: trendDirection,
        accuracy: Math.round(trend.rSquared * 100),
        recommendation: this.generatePredictionRecommendation(trendDirection, trend.slope)
      };

      // Cache for 6 hours
      this.cache.set(cacheKey, prediction, CACHE_TTL.PREDICTIONS);

      return prediction;
    } catch (error) {
      console.error('[CheckInAnalyticsService] Error predicting mood:', error);
      return {
        nextSevenDays: [],
        trend: 'stable',
        accuracy: 0,
        recommendation: 'Unable to generate prediction at this time'
      };
    }
  }

  /**
   * Detect early warning signs
   */
  async detectWarnings(userId: string): Promise<Warning[]> {
    const cacheKey = CacheService.generateKey(userId, 'warnings');
    const cached = this.cache.get<Warning[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const checkIns = await this.fetchCheckIns(userId, 14);

      if (checkIns.length < 3) {
        return [];
      }

      const warnings: Warning[] = [];
      const recentCheckIns = checkIns.slice(0, 7);

      // 1. Check for declining mood trend
      const moodValues = checkIns.map(c => c.overallMood);
      const recentAvg = this.average(recentCheckIns.map(c => c.overallMood));
      const olderAvg = this.average(checkIns.slice(7).map(c => c.overallMood));

      if (recentAvg < olderAvg - 2) {
        warnings.push({
          id: `mood-decline-${Date.now()}`,
          severity: recentAvg < 4 ? 'high' : 'moderate',
          type: 'mood_decline',
          message: 'Your mood has been declining recently',
          details: `Your recent mood average (${recentAvg.toFixed(1)}) is lower than previous weeks (${olderAvg.toFixed(1)})`,
          detectedAt: new Date(),
          relatedData: {
            dates: recentCheckIns.map(c => c.date),
            values: recentCheckIns.map(c => c.overallMood),
            threshold: 4
          },
          recommendations: [
            'Consider reaching out to a friend or loved one',
            'Practice a self-care activity you enjoy',
            'If feelings persist, consider speaking with a mental health professional'
          ],
          urgent: recentAvg < 3
        });
      }

      // 2. Check for consistently high stress
      const highStressCount = recentCheckIns.filter(c => c.stressLevel >= 8).length;
      if (highStressCount >= 5) {
        warnings.push({
          id: `stress-high-${Date.now()}`,
          severity: 'high',
          type: 'stress_increase',
          message: 'Your stress levels have been consistently high',
          details: `You've reported high stress (8+) on ${highStressCount} of the last 7 days`,
          detectedAt: new Date(),
          relatedData: {
            dates: recentCheckIns.filter(c => c.stressLevel >= 8).map(c => c.date),
            values: recentCheckIns.filter(c => c.stressLevel >= 8).map(c => c.stressLevel),
            threshold: 8
          },
          recommendations: [
            'Try stress-reduction techniques like deep breathing or meditation',
            'Identify and address major stressors if possible',
            'Consider stress management resources or counseling'
          ],
          urgent: false
        });
      }

      // 3. Check for concerning safety indicators
      const safetyCheckIns = recentCheckIns.filter(c =>
        c.hadSelfHarmThoughts || c.hadSuicidalThoughts || c.actedOnHarm
      );

      if (safetyCheckIns.length > 0) {
        warnings.push({
          id: `safety-concern-${Date.now()}`,
          severity: 'critical',
          type: 'behavior_change',
          message: 'Safety concerns detected in recent check-ins',
          details: 'You\'ve reported thoughts or behaviors that concern us',
          detectedAt: new Date(),
          relatedData: {
            dates: safetyCheckIns.map(c => c.date),
            values: safetyCheckIns.map(() => 10), // Max severity
            threshold: 10
          },
          recommendations: [
            'Please reach out to a mental health professional immediately',
            'Contact a crisis hotline: Call 988 (US)',
            'Reach out to a trusted friend or family member',
            'If in immediate danger, call emergency services'
          ],
          urgent: true
        });
      }

      // Cache for 30 minutes (short TTL for safety)
      this.cache.set(cacheKey, warnings, CACHE_TTL.WARNINGS);

      return warnings;
    } catch (error) {
      console.error('[CheckInAnalyticsService] Error detecting warnings:', error);
      return [];
    }
  }

  /**
   * Get progress metrics comparing current vs previous period
   */
  async getProgressMetrics(userId: string, days: number = 30): Promise<ProgressMetrics> {
    const currentCheckIns = await this.fetchCheckIns(userId, days);
    const previousCheckIns = await this.fetchCheckIns(userId, days, days); // Previous period

    if (currentCheckIns.length === 0) {
      return this.getEmptyProgressMetrics();
    }

    const currentMood = this.average(currentCheckIns.map(c => c.overallMood));
    const previousMood = this.average(previousCheckIns.map(c => c.overallMood));

    const currentEnergy = this.average(currentCheckIns.map(c => c.energyLevel));
    const previousEnergy = this.average(previousCheckIns.map(c => c.energyLevel));

    const currentStress = this.average(currentCheckIns.map(c => c.stressLevel));
    const previousStress = this.average(previousCheckIns.map(c => c.stressLevel));

    // Behavior streaks
    const behaviors = [
      { key: 'exercised' as const, name: 'Exercise' },
      { key: 'practicedSelfCare' as const, name: 'Self-Care' },
      { key: 'socializedHealthily' as const, name: 'Social Connection' },
      { key: 'ateWell' as const, name: 'Healthy Eating' },
      { key: 'tookMedication' as const, name: 'Medication' }
    ];

    const behaviorStreaks = behaviors.map(behavior => ({
      behavior: behavior.name,
      currentStreak: this.calculateCurrentStreak(currentCheckIns, behavior.key),
      bestStreak: this.calculateBestStreak([...currentCheckIns, ...previousCheckIns], behavior.key),
      frequency: (currentCheckIns.filter(c => c[behavior.key]).length / currentCheckIns.length) * 100
    }));

    return {
      timeframe: {
        start: currentCheckIns[currentCheckIns.length - 1].date,
        end: currentCheckIns[0].date
      },
      moodProgress: {
        current: Math.round(currentMood * 10) / 10,
        previous: Math.round(previousMood * 10) / 10,
        change: Math.round((currentMood - previousMood) * 10) / 10,
        changePercent: previousMood > 0 ? Math.round(((currentMood - previousMood) / previousMood) * 100) : 0
      },
      energyProgress: {
        current: Math.round(currentEnergy * 10) / 10,
        previous: Math.round(previousEnergy * 10) / 10,
        change: Math.round((currentEnergy - previousEnergy) * 10) / 10,
        changePercent: previousEnergy > 0 ? Math.round(((currentEnergy - previousEnergy) / previousEnergy) * 100) : 0
      },
      stressProgress: {
        current: Math.round(currentStress * 10) / 10,
        previous: Math.round(previousStress * 10) / 10,
        change: Math.round((currentStress - previousStress) * 10) / 10,
        changePercent: previousStress > 0 ? Math.round(((currentStress - previousStress) / previousStress) * 100) : 0
      },
      behaviorStreaks,
      overallProgress: this.calculateOverallProgress(currentMood, previousMood, currentStress, previousStress)
    };
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async fetchCheckIns(userId: string, days: number, offset: number = 0) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - offset);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    endDate.setHours(23, 59, 59, 999);

    return await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateBehaviorTrend(checkIns: any[], behaviorKey: string): 'increasing' | 'stable' | 'decreasing' {
    if (checkIns.length < 4) return 'stable';

    const firstHalf = checkIns.slice(Math.floor(checkIns.length / 2));
    const secondHalf = checkIns.slice(0, Math.floor(checkIns.length / 2));

    const firstRate = firstHalf.filter(c => c[behaviorKey]).length / firstHalf.length;
    const secondRate = secondHalf.filter(c => c[behaviorKey]).length / secondHalf.length;

    if (secondRate > firstRate + 0.2) return 'increasing';
    if (secondRate < firstRate - 0.2) return 'decreasing';
    return 'stable';
  }

  private extractHighlights(checkIns: any[], patterns: Pattern[]): string[] {
    const highlights: string[] = [];

    // High mood days
    const highMoodCount = checkIns.filter(c => c.overallMood >= 7).length;
    if (highMoodCount > 0) {
      highlights.push(`${highMoodCount} days with good mood (7+/10)`);
    }

    // Consistent behaviors
    const exerciseCount = checkIns.filter(c => c.exercised).length;
    if (exerciseCount >= checkIns.length * 0.5) {
      highlights.push(`Exercised ${exerciseCount} times this week!`);
    }

    // Positive patterns
    const positivePatterns = patterns.filter(p => p.impactOnMood && p.impactOnMood > 0);
    if (positivePatterns.length > 0) {
      highlights.push(`Identified ${positivePatterns.length} positive patterns`);
    }

    return highlights;
  }

  private async generateRecommendations(checkIns: any[], patterns: Pattern[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Exercise recommendation
    const exerciseRate = checkIns.filter(c => c.exercised).length / checkIns.length;
    if (exerciseRate < 0.3) {
      recommendations.push('Try to incorporate more physical activity into your routine');
    }

    // Self-care recommendation
    const selfCareRate = checkIns.filter(c => c.practicedSelfCare).length / checkIns.length;
    if (selfCareRate < 0.3) {
      recommendations.push('Consider dedicating time to self-care activities');
    }

    // Mood-based recommendation
    const avgMood = this.average(checkIns.map(c => c.overallMood));
    if (avgMood < 5) {
      recommendations.push('Your mood has been low recently. Consider reaching out for support');
    }

    return recommendations.slice(0, 3);
  }

  private identifyDominantEmotion(checkIns: any[]): string {
    const avgMood = this.average(checkIns.map(c => c.overallMood));
    const avgStress = this.average(checkIns.map(c => c.stressLevel));
    const avgAnxiety = this.average(checkIns.map(c => c.anxietyLevel));

    if (avgMood >= 7 && avgStress <= 4) return 'positive';
    if (avgAnxiety >= 7) return 'anxious';
    if (avgStress >= 7) return 'stressed';
    if (avgMood <= 4) return 'low';
    return 'neutral';
  }

  private calculateEmotionFrequency(checkIns: any[]): { [emotion: string]: number } {
    return {
      happy: checkIns.filter(c => c.overallMood >= 7).length,
      stressed: checkIns.filter(c => c.stressLevel >= 7).length,
      anxious: checkIns.filter(c => c.anxietyLevel >= 7).length,
      low: checkIns.filter(c => c.overallMood <= 4).length
    };
  }

  private identifyGrowthAreas(checkIns: any[]): string[] {
    const areas: string[] = [];

    const exerciseRate = checkIns.filter(c => c.exercised).length / checkIns.length;
    if (exerciseRate < 0.4) areas.push('Regular exercise');

    const selfCareRate = checkIns.filter(c => c.practicedSelfCare).length / checkIns.length;
    if (selfCareRate < 0.4) areas.push('Self-care practice');

    const socialRate = checkIns.filter(c => c.socializedHealthily).length / checkIns.length;
    if (socialRate < 0.4) areas.push('Social connection');

    return areas;
  }

  private identifyPredictionFactors(checkIns: any[]): string[] {
    const factors: string[] = [];

    const exerciseImpact = correlationService.calculateExerciseMoodCorrelation(checkIns);
    if (Math.abs(exerciseImpact) > 0.3) factors.push('Exercise');

    const avgStress = this.average(checkIns.map(c => c.stressLevel));
    if (avgStress > 6) factors.push('Stress management');

    const selfCareRate = checkIns.filter(c => c.practicedSelfCare).length / checkIns.length;
    if (selfCareRate > 0.5) factors.push('Self-care consistency');

    return factors;
  }

  private generatePredictionRecommendation(trend: string, slope: number): string {
    if (trend === 'improving') {
      return 'Your mood is trending upward! Keep up your positive habits.';
    } else if (trend === 'declining') {
      return 'Your mood appears to be declining. Consider implementing stress-reduction strategies and reaching out for support if needed.';
    } else {
      return 'Your mood is stable. Continue your current self-care practices.';
    }
  }

  private calculateCurrentStreak(checkIns: any[], behaviorKey: string): number {
    let streak = 0;
    for (const checkIn of checkIns) {
      if (checkIn[behaviorKey]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private calculateBestStreak(checkIns: any[], behaviorKey: string): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const checkIn of checkIns) {
      if (checkIn[behaviorKey]) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  private calculateOverallProgress(
    currentMood: number,
    previousMood: number,
    currentStress: number,
    previousStress: number
  ): 'excellent' | 'good' | 'fair' | 'needs_attention' {
    const moodImprovement = currentMood - previousMood;
    const stressImprovement = previousStress - currentStress; // Lower is better

    if (moodImprovement > 1 && stressImprovement > 1) return 'excellent';
    if (moodImprovement > 0 || stressImprovement > 0) return 'good';
    if (moodImprovement >= -0.5 && stressImprovement >= -0.5) return 'fair';
    return 'needs_attention';
  }

  private async generateStatisticalWeeklyInsight(userId: string): Promise<WeeklyInsight> {
    const checkIns = await this.fetchCheckIns(userId, 7);

    if (checkIns.length === 0) {
      return this.getEmptyWeeklyInsight();
    }

    const avgMood = this.average(checkIns.map(c => c.overallMood));
    const summary = `This week you completed ${checkIns.length} check-ins with an average mood of ${avgMood.toFixed(1)}/10.`;

    return {
      weekStart: checkIns[checkIns.length - 1].date,
      weekEnd: checkIns[0].date,
      summary,
      moodTrend: {
        direction: 'stable',
        changePercent: 0,
        averageMood: avgMood
      },
      highlights: [`Completed ${checkIns.length} check-ins`],
      patterns: [],
      recommendations: ['Continue tracking your mental health daily'],
      progressNotes: [summary],
      aiAnalysis: summary,
      generatedBy: 'statistical'
    };
  }

  private getEmptyWeeklyInsight(): WeeklyInsight {
    return {
      weekStart: new Date(),
      weekEnd: new Date(),
      summary: 'No check-in data available for this week.',
      moodTrend: {
        direction: 'stable',
        changePercent: 0,
        averageMood: 0
      },
      highlights: [],
      patterns: [],
      recommendations: ['Start checking in daily to build insights'],
      progressNotes: [],
      aiAnalysis: 'Complete more check-ins to receive personalized insights.',
      generatedBy: 'statistical'
    };
  }

  private getEmptyReflectionAnalysis(days: number): ReflectionAnalysis {
    return {
      period: {
        start: new Date(),
        end: new Date(),
        days: 0
      },
      gratitudeThemes: {
        themes: [],
        topTheme: 'N/A',
        diversity: 0,
        overallSentiment: 'positive'
      },
      challengeThemes: {
        themes: [],
        topTheme: 'N/A',
        diversity: 0,
        overallSentiment: 'neutral'
      },
      accomplishmentThemes: {
        themes: [],
        topTheme: 'N/A',
        diversity: 0,
        overallSentiment: 'positive'
      },
      emotionalTrends: {
        dominantEmotion: 'neutral',
        emotionFrequency: {}
      },
      insights: ['No data available for analysis'],
      growthAreas: []
    };
  }

  private getEmptyProgressMetrics(): ProgressMetrics {
    return {
      timeframe: {
        start: new Date(),
        end: new Date()
      },
      moodProgress: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      },
      energyProgress: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      },
      stressProgress: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      },
      behaviorStreaks: [],
      overallProgress: 'needs_attention'
    };
  }
}

export const checkInAnalyticsService = new CheckInAnalyticsService();
