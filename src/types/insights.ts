/**
 * Comprehensive TypeScript types for AI-powered insights and analytics system
 * Includes pattern recognition, correlations, predictions, and AI insights
 */

import { DailyCheckIn } from '../generated/prisma';

// ========== PATTERN RECOGNITION ==========

export interface Pattern {
  type: 'gratitude' | 'challenge' | 'accomplishment' | 'behavior' | 'mood';
  name: string;
  frequency: number;
  examples: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
  firstOccurrence: Date;
  lastOccurrence: Date;
  impactOnMood?: number; // -10 to +10
}

export interface ThemeAnalysis {
  themes: {
    name: string;
    count: number;
    keywords: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
  topTheme: string;
  diversity: number; // 0-100, how diverse the themes are
  overallSentiment: 'positive' | 'neutral' | 'negative';
}

export interface RecurringPattern {
  id: string;
  pattern: string;
  occurrences: number;
  dayOfWeek?: string; // e.g., "Monday"
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  associatedMood: number; // average mood when this pattern occurs
  confidence: number; // 0-100
}

// ========== CORRELATION ANALYSIS ==========

export interface Correlation {
  factorA: string;
  factorB: string;
  coefficient: number; // -1 to 1 (Pearson correlation)
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  significanceLevel: number; // p-value
  interpretation: string;
  dataPoints: number;
}

export interface BehaviorImpact {
  behavior: string;
  impactOnMood: number; // percentage change
  impactOnEnergy: number;
  impactOnStress: number;
  impactOnAnxiety: number;
  sampleSize: number;
  confidence: number; // 0-100
}

export interface CorrelationMatrix {
  factors: string[];
  matrix: number[][]; // correlation coefficients
  heatmapData: {
    x: string;
    y: string;
    value: number;
  }[];
}

// ========== AI INSIGHTS ==========

export interface AIInsight {
  id: string;
  userId: string;
  insightType: 'weekly' | 'monthly' | 'pattern' | 'warning' | 'recommendation';
  title: string;
  summary: string;
  details: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'warning';
  confidence: number; // 0-100
  actionItems: string[];
  generatedAt: Date;
  validUntil: Date;
  aiGenerated: boolean;
}

export interface WeeklyInsight {
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  moodTrend: {
    direction: 'improving' | 'stable' | 'declining';
    changePercent: number;
    averageMood: number;
  };
  highlights: string[];
  patterns: Pattern[];
  recommendations: string[];
  progressNotes: string[];
  aiAnalysis: string;
  generatedBy: 'ai' | 'statistical';
}

export interface ReflectionAnalysis {
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  gratitudeThemes: ThemeAnalysis;
  challengeThemes: ThemeAnalysis;
  accomplishmentThemes: ThemeAnalysis;
  emotionalTrends: {
    dominantEmotion: string;
    emotionFrequency: { [emotion: string]: number };
  };
  insights: string[];
  growthAreas: string[];
}

// ========== PREDICTIONS ==========

export interface MoodPrediction {
  nextSevenDays: {
    date: Date;
    predictedMood: number;
    confidence: number;
    factors: string[];
  }[];
  trend: 'improving' | 'stable' | 'declining';
  accuracy: number; // based on historical predictions
  recommendation: string;
}

export interface Warning {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  type: 'mood_decline' | 'stress_increase' | 'anxiety_spike' | 'behavior_change' | 'pattern_similarity';
  message: string;
  details: string;
  detectedAt: Date;
  relatedData: {
    dates: Date[];
    values: number[];
    threshold: number;
  };
  recommendations: string[];
  urgent: boolean;
}

// ========== PROGRESS TRACKING ==========

export interface ProgressMetrics {
  timeframe: {
    start: Date;
    end: Date;
  };
  moodProgress: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  energyProgress: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  stressProgress: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  behaviorStreaks: {
    behavior: string;
    currentStreak: number;
    bestStreak: number;
    frequency: number; // percentage
  }[];
  overallProgress: 'excellent' | 'good' | 'fair' | 'needs_attention';
}

export interface TrendData {
  date: Date;
  mood: number;
  energy: number;
  stress: number;
  anxiety: number;
  sleepQuality?: number;
  exercised: boolean;
  practicedSelfCare: boolean;
}

// ========== STATISTICAL ANALYSIS ==========

export interface StatisticalSummary {
  metric: string;
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  min: number;
  max: number;
  trend: {
    direction: 'increasing' | 'stable' | 'decreasing';
    slope: number;
    rSquared: number;
  };
}

export interface TimeSeriesAnalysis {
  metric: string;
  dataPoints: {
    date: Date;
    value: number;
  }[];
  movingAverage: number[];
  volatility: number;
  seasonality?: {
    detected: boolean;
    pattern: string; // e.g., "weekday vs weekend"
  };
}

// ========== DRIVER ANALYSIS ==========

export interface MoodDriver {
  driver: string;
  impact: number; // -10 to +10
  confidence: number; // 0-100
  evidence: {
    dates: Date[];
    observations: string[];
  };
  recommendation: string;
}

// ========== CACHING & INFRASTRUCTURE ==========

export interface CachedInsight {
  id: string;
  userId: string;
  insightType: string;
  data: any;
  generatedAt: Date;
  validUntil: Date;
  aiGenerated: boolean;
}

export interface QueuedAnalysis {
  id: string;
  userId: string;
  analysisType: string;
  priority: 'low' | 'normal' | 'high';
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
}

// ========== API REQUEST/RESPONSE TYPES ==========

export interface GetInsightsRequest {
  weeks?: number;
  days?: number;
  refresh?: boolean; // force regenerate
}

export interface GetPatternsRequest {
  days?: number;
  type?: Pattern['type'];
}

export interface GetCorrelationsRequest {
  days?: number;
  factors?: string[];
}

export interface InsightsResponse {
  insights: AIInsight[];
  cached: boolean;
  generatedAt: Date;
  validUntil: Date;
}

export interface PatternsResponse {
  patterns: Pattern[];
  recurringPatterns: RecurringPattern[];
  themeAnalysis: {
    gratitude: ThemeAnalysis;
    challenges: ThemeAnalysis;
    accomplishments: ThemeAnalysis;
  };
  cached: boolean;
}

export interface CorrelationsResponse {
  correlations: Correlation[];
  behaviorImpacts: BehaviorImpact[];
  matrix: CorrelationMatrix;
  cached: boolean;
}

export interface PredictionsResponse {
  moodPrediction: MoodPrediction;
  warnings: Warning[];
  confidence: number;
  cached: boolean;
}

export interface ProgressResponse {
  metrics: ProgressMetrics;
  trends: TrendData[];
  weeklyComparison: {
    thisWeek: StatisticalSummary;
    lastWeek: StatisticalSummary;
  };
  cached: boolean;
}

// ========== ERROR TYPES ==========

export interface AnalysisError {
  code: 'INSUFFICIENT_DATA' | 'AI_UNAVAILABLE' | 'ANALYSIS_FAILED' | 'CACHE_ERROR';
  message: string;
  fallbackAvailable: boolean;
}

// ========== SERVICE INTERFACES ==========

export interface ICorrelationService {
  calculateExerciseMoodCorrelation(checkIns: DailyCheckIn[]): number;
  calculateSleepEnergyCorrelation(checkIns: DailyCheckIn[]): number;
  calculateCorrelation(xValues: number[], yValues: number[]): number;
  findBehaviorImpact(behavior: string, checkIns: DailyCheckIn[]): BehaviorImpact;
  generateCorrelationMatrix(checkIns: DailyCheckIn[]): CorrelationMatrix;
  identifyStrongCorrelations(checkIns: DailyCheckIn[]): Correlation[];
}

export interface IAIInsightsService {
  analyzeGratitudePatterns(entries: string[]): Promise<ThemeAnalysis>;
  analyzeChallengePatterns(entries: string[]): Promise<ThemeAnalysis>;
  generatePersonalizedInsight(checkInData: DailyCheckIn[]): Promise<string>;
  detectMoodDrivers(checkInData: DailyCheckIn[]): Promise<MoodDriver[]>;
  generateWeeklySummary(checkIns: DailyCheckIn[]): Promise<string>;
  getFallbackInsight(): string;
}

export interface ICheckInAnalyticsService {
  detectPatterns(userId: string, days: number): Promise<Pattern[]>;
  findCorrelations(userId: string, days: number): Promise<Correlation[]>;
  generateWeeklyInsights(userId: string): Promise<WeeklyInsight>;
  analyzeReflections(userId: string, days: number): Promise<ReflectionAnalysis>;
  predictMoodTrend(userId: string): Promise<MoodPrediction>;
  detectWarnings(userId: string): Promise<Warning[]>;
  getProgressMetrics(userId: string, days: number): Promise<ProgressMetrics>;
}
