/**
 * Report Generation Service
 * Generates comprehensive mental health reports for sharing with therapists
 */

import prisma from '../prisma/client';
import { CheckInAnalyticsService } from './checkInAnalyticsService';
const checkInAnalyticsService = new CheckInAnalyticsService();
import { medicationService } from './medicationService';

export interface Report {
  userId: string;
  userName: string;
  reportPeriod: {
    start: Date;
    end: Date;
    days: number;
  };
  summary: {
    totalCheckIns: number;
    totalJournalEntries: number;
    averageMood: number;
    averageEnergy: number;
    averageStress: number;
    averageAnxiety: number;
  };
  moodTrends: {
    daily: Array<{ date: Date; mood: number; energy: number; stress: number; anxiety: number }>;
    weeklyAverages: Array<{ week: string; avgMood: number; avgEnergy: number }>;
    trend: 'improving' | 'stable' | 'declining';
  };
  patterns: Array<{
    type: string;
    name: string;
    frequency: number;
    examples: string[];
    trend: string;
    impactOnMood?: number;
  }>;
  correlations: Array<{
    factor: string;
    metric: string;
    strength: number;
    direction: 'positive' | 'negative';
    significance: string;
  }>;
  behaviors: {
    exercise: { count: number; percentage: number };
    selfCare: { count: number; percentage: number };
    socialConnection: { count: number; percentage: number };
    healthyEating: { count: number; percentage: number };
    medication: { count: number; percentage: number };
  };
  assessments: Array<{
    type: string;
    date: Date;
    score: number;
    severity: string;
    interpretation: string;
  }>;
  journalInsights: {
    totalEntries: number;
    averageWellnessScore: number;
    commonThemes: string[];
    sentimentDistribution: { positive: number; neutral: number; negative: number };
  };
  safetyIndicators: {
    selfHarmThoughts: number;
    suicidalThoughts: number;
    actedOnHarm: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  medications: {
    activeMedications: Array<{
      id: string;
      name: string;
      dosage: string;
      dosageUnit: string;
      frequency: string;
      startDate: Date;
      purpose?: string;
    }>;
    adherenceRate: {
      totalScheduled: number;
      totalTaken: number;
      adherenceRate: number;
      period: number;
    };
    missedDoses: Array<{
      medicationId: string;
      medicationName: string;
      scheduledTime: Date;
      status: string;
    }>;
    sideEffects: Array<{
      medicationId: string;
      medicationName: string;
      count: number;
      sideEffects: Array<{ date: Date; sideEffects: string; effectiveness?: number }>;
    }>;
  };
  recommendations: string[];
  progressMetrics: {
    moodChange: number;
    energyChange: number;
    stressChange: number;
    behaviorImprovements: string[];
  };
}

class ReportGenerationService {
  /**
   * Generate comprehensive mental health report
   */
  async generateComprehensiveReport(userId: string, days: number = 30): Promise<Report> {
    console.log(`[ReportGenerationService] Generating ${days}-day report for user ${userId}`);

    // Fetch all necessary data in parallel
    const [user, checkIns, journalEntries, patterns, correlations, assessments, profile, progressMetrics, medications, adherenceRate, missedDoses, sideEffects] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      this.fetchCheckIns(userId, days),
      this.fetchJournalEntries(userId, days),
      checkInAnalyticsService.detectPatterns(userId, days),
      checkInAnalyticsService.findCorrelations(userId, days),
      this.fetchAssessments(userId, days),
      prisma.mentalHealthProfile.findUnique({ where: { userId } }),
      checkInAnalyticsService.getProgressMetrics(userId, days),
      // Medication data
      medicationService.getUserMedications(userId, true),
      medicationService.getAdherenceRate(userId, undefined, days),
      medicationService.getMissedDoses(userId, days),
      medicationService.getSideEffectsSummary(userId)
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Calculate summary statistics
    const summary = this.calculateSummary(checkIns, journalEntries);

    // Calculate mood trends
    const moodTrends = this.calculateMoodTrends(checkIns);

    // Calculate behavior statistics
    const behaviors = this.calculateBehaviors(checkIns);

    // Analyze journal insights
    const journalInsights = this.analyzeJournalInsights(journalEntries);

    // Assess safety indicators
    const safetyIndicators = this.assessSafetyIndicators(checkIns);

    // Calculate progress metrics
    const progressMetricsData = this.calculateProgressMetrics(progressMetrics, checkIns);

    // Format medication data
    const medicationData = this.formatMedicationData(medications, adherenceRate, missedDoses, sideEffects);

    // Generate recommendations (includes medication data)
    const recommendations = this.generateRecommendations(
      summary,
      patterns,
      behaviors,
      safetyIndicators,
      medicationData
    );

    return {
      userId,
      userName: user.name,
      reportPeriod: {
        start: startDate,
        end: endDate,
        days
      },
      summary,
      moodTrends,
      patterns,
      correlations: this.formatCorrelations(correlations),
      behaviors,
      assessments: this.formatAssessments(assessments),
      journalInsights,
      safetyIndicators,
      medications: medicationData,
      recommendations,
      progressMetrics: progressMetricsData
    };
  }

  /**
   * Generate weekly report (7 days)
   */
  async generateWeeklyReport(userId: string): Promise<Report> {
    return this.generateComprehensiveReport(userId, 7);
  }

  /**
   * Generate monthly report (30 days)
   */
  async generateMonthlyReport(userId: string): Promise<Report> {
    return this.generateComprehensiveReport(userId, 30);
  }

  // ===== PRIVATE HELPER METHODS =====

  private async fetchCheckIns(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' }
    });
  }

  private async fetchJournalEntries(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private async fetchAssessments(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.assessmentResponse.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private calculateSummary(checkIns: any[], journalEntries: any[]) {
    const moodValues = checkIns.map(c => c.overallMood);
    const energyValues = checkIns.map(c => c.energyLevel);
    const stressValues = checkIns.map(c => c.stressLevel);
    const anxietyValues = checkIns.map(c => c.anxietyLevel);

    return {
      totalCheckIns: checkIns.length,
      totalJournalEntries: journalEntries.length,
      averageMood: this.average(moodValues),
      averageEnergy: this.average(energyValues),
      averageStress: this.average(stressValues),
      averageAnxiety: this.average(anxietyValues)
    };
  }

  private calculateMoodTrends(checkIns: any[]) {
    // Daily data
    const daily = checkIns.map(c => ({
      date: c.date,
      mood: c.overallMood,
      energy: c.energyLevel,
      stress: c.stressLevel,
      anxiety: c.anxietyLevel
    }));

    // Weekly averages
    const weeklyAverages = this.calculateWeeklyAverages(checkIns);

    // Calculate trend
    const moodValues = checkIns.map(c => c.overallMood);
    const firstHalf = moodValues.slice(Math.floor(moodValues.length / 2));
    const secondHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));

    const firstAvg = this.average(firstHalf);
    const secondAvg = this.average(secondHalf);

    let trend: 'improving' | 'stable' | 'declining';
    if (secondAvg > firstAvg + 1) trend = 'improving';
    else if (secondAvg < firstAvg - 1) trend = 'declining';
    else trend = 'stable';

    return {
      daily,
      weeklyAverages,
      trend
    };
  }

  private calculateWeeklyAverages(checkIns: any[]) {
    const weeks: { [key: string]: any[] } = {};

    checkIns.forEach(checkIn => {
      const weekStart = new Date(checkIn.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(checkIn);
    });

    return Object.entries(weeks).map(([week, entries]) => ({
      week,
      avgMood: this.average(entries.map(e => e.overallMood)),
      avgEnergy: this.average(entries.map(e => e.energyLevel))
    }));
  }

  private calculateBehaviors(checkIns: any[]) {
    const total = checkIns.length;

    return {
      exercise: {
        count: checkIns.filter(c => c.exercised).length,
        percentage: Math.round((checkIns.filter(c => c.exercised).length / total) * 100)
      },
      selfCare: {
        count: checkIns.filter(c => c.practicedSelfCare).length,
        percentage: Math.round((checkIns.filter(c => c.practicedSelfCare).length / total) * 100)
      },
      socialConnection: {
        count: checkIns.filter(c => c.socializedHealthily).length,
        percentage: Math.round((checkIns.filter(c => c.socializedHealthily).length / total) * 100)
      },
      healthyEating: {
        count: checkIns.filter(c => c.ateWell).length,
        percentage: Math.round((checkIns.filter(c => c.ateWell).length / total) * 100)
      },
      medication: {
        count: checkIns.filter(c => c.tookMedication).length,
        percentage: Math.round((checkIns.filter(c => c.tookMedication).length / total) * 100)
      }
    };
  }

  private analyzeJournalInsights(journalEntries: any[]) {
    const wellnessScores = journalEntries
      .map(e => e.aiWellnessScore)
      .filter((s): s is number => s !== null && s !== undefined);

    const sentiments = journalEntries
      .map(e => e.aiSentiment)
      .filter((s): s is string => !!s);

    const themes = journalEntries
      .flatMap(e => e.aiThemes || [])
      .reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const topThemes = Object.entries(themes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([theme]) => theme);

    return {
      totalEntries: journalEntries.length,
      averageWellnessScore: wellnessScores.length > 0 ? this.average(wellnessScores) : 0,
      commonThemes: topThemes,
      sentimentDistribution: {
        positive: sentiments.filter(s => s === 'positive').length,
        neutral: sentiments.filter(s => s === 'neutral').length,
        negative: sentiments.filter(s => s === 'negative').length
      }
    };
  }

  private assessSafetyIndicators(checkIns: any[]) {
    const selfHarmThoughts = checkIns.filter(c => c.hadSelfHarmThoughts).length;
    const suicidalThoughts = checkIns.filter(c => c.hadSuicidalThoughts).length;
    const actedOnHarm = checkIns.filter(c => c.actedOnHarm).length;

    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (actedOnHarm > 0 || suicidalThoughts > 2) {
      riskLevel = 'critical';
    } else if (suicidalThoughts > 0 || selfHarmThoughts > 3) {
      riskLevel = 'high';
    } else if (selfHarmThoughts > 0) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }

    return {
      selfHarmThoughts,
      suicidalThoughts,
      actedOnHarm,
      riskLevel
    };
  }

  private formatAssessments(assessments: any[]) {
    return assessments.map(a => ({
      type: a.assessmentType,
      date: a.createdAt,
      score: a.totalScore || 0,
      severity: a.severity || 'unknown',
      interpretation: a.interpretation || 'No interpretation available'
    }));
  }

  private formatCorrelations(correlations: any[]): Array<{
    factor: string;
    metric: string;
    strength: number;
    direction: 'positive' | 'negative';
    significance: string;
  }> {
    return correlations.map(corr => ({
      factor: corr.factorA || corr.factor || 'Unknown',
      metric: corr.factorB || corr.metric || 'Unknown',
      strength: corr.correlation || corr.strength || 0,
      direction: (corr.correlation || corr.strength || 0) >= 0 ? 'positive' as const : 'negative' as const,
      significance: corr.interpretation || corr.significance || 'Not significant'
    }));
  }

  private formatMedicationData(
    medications: any[],
    adherenceRate: any,
    missedDoses: any[],
    sideEffects: any[]
  ) {
    return {
      activeMedications: medications.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        dosageUnit: med.dosageUnit,
        frequency: med.frequency,
        startDate: med.startDate,
        purpose: med.purpose
      })),
      adherenceRate,
      missedDoses: missedDoses.map(log => ({
        medicationId: log.medicationId,
        medicationName: log.medication.name,
        scheduledTime: log.scheduledTime,
        status: log.status
      })),
      sideEffects
    };
  }

  private generateRecommendations(
    summary: any,
    patterns: any[],
    behaviors: any,
    safetyIndicators: any,
    medicationData?: any
  ): string[] {
    const recommendations: string[] = [];

    // Safety-based recommendations
    if (safetyIndicators.riskLevel === 'critical' || safetyIndicators.riskLevel === 'high') {
      recommendations.push('⚠️ URGENT: Consider immediate professional mental health intervention');
      recommendations.push('Discuss safety planning with a mental health professional');
    }

    // Mood-based recommendations
    if (summary.averageMood < 5) {
      recommendations.push('Consider scheduling additional therapy sessions to address low mood');
      recommendations.push('Evaluate current treatment plan effectiveness');
    }

    // Behavior-based recommendations
    if (behaviors.exercise.percentage < 30) {
      recommendations.push('Encourage gradual increase in physical activity (evidence shows strong mood correlation)');
    }

    if (behaviors.selfCare.percentage < 40) {
      recommendations.push('Develop structured self-care routine (currently inconsistent)');
    }

    // Stress/anxiety recommendations
    if (summary.averageStress > 7 || summary.averageAnxiety > 7) {
      recommendations.push('Consider stress management techniques or anxiety-focused interventions');
      recommendations.push('Evaluate environmental stressors and coping strategies');
    }

    // Medication adherence
    if (behaviors.medication.percentage < 80 && behaviors.medication.count > 0) {
      recommendations.push('Address medication adherence barriers (current compliance: ' + behaviors.medication.percentage + '%)');
    }

    // Medication-based recommendations
    if (medicationData) {
      // Adherence recommendations
      if (medicationData.adherenceRate.adherenceRate < 80 && medicationData.activeMedications.length > 0) {
        recommendations.push(`⚠️ Medication adherence at ${medicationData.adherenceRate.adherenceRate}% - discuss barriers and strategies to improve compliance`);
      }

      // Missed doses
      if (medicationData.missedDoses.length > 3) {
        recommendations.push(`Consider medication reminders or routine adjustments (${medicationData.missedDoses.length} missed doses in period)`);
      }

      // Side effects
      if (medicationData.sideEffects.length > 0) {
        const totalSideEffects = medicationData.sideEffects.reduce((sum: number, se: any) => sum + se.count, 0);
        if (totalSideEffects > 5) {
          recommendations.push(`Review medication side effects (${totalSideEffects} reported instances) - consider adjustment or alternative medications`);
        }
      }

      // No active medications but low mood
      if (medicationData.activeMedications.length === 0 && summary.averageMood < 5) {
        recommendations.push('Consider medication evaluation given persistent low mood levels');
      }
    }

    // Positive reinforcement
    if (summary.averageMood >= 7 && behaviors.exercise.percentage >= 50) {
      recommendations.push('✅ Current habits showing positive results - encourage continuation');
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private calculateProgressMetrics(progressMetrics: any, checkIns: any[]) {
    const improvements: string[] = [];

    if (progressMetrics.moodProgress.change > 0.5) {
      improvements.push('Mood improvement');
    }
    if (progressMetrics.energyProgress.change > 0.5) {
      improvements.push('Energy levels increased');
    }
    if (progressMetrics.stressProgress.change < -0.5) {
      improvements.push('Stress reduction');
    }

    return {
      moodChange: progressMetrics.moodProgress.change,
      energyChange: progressMetrics.energyProgress.change,
      stressChange: progressMetrics.stressProgress.change,
      behaviorImprovements: improvements
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
}

export const reportGenerationService = new ReportGenerationService();
