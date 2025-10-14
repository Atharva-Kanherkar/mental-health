/**
 * Correlation Service - Statistical Analysis for Mental Health Data
 * Provides pure statistical analysis without AI dependency
 * Calculates correlations between behaviors and mental health metrics
 */

import { DailyCheckIn } from '../generated/prisma';
import {
  Correlation,
  BehaviorImpact,
  CorrelationMatrix,
  ICorrelationService
} from '../types/insights';

export class CorrelationService implements ICorrelationService {

  /**
   * Calculate Pearson correlation coefficient between two arrays
   * Returns value between -1 and 1
   */
  calculateCorrelation(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      return 0;
    }

    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXSquare = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYSquare = yValues.reduce((sum, y) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumXSquare - sumX * sumX) * (n * sumYSquare - sumY * sumY)
    );

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Calculate correlation between exercise and mood
   */
  calculateExerciseMoodCorrelation(checkIns: DailyCheckIn[]): number {
    if (checkIns.length < 3) return 0;

    const exerciseValues = checkIns.map(c => c.exercised ? 1 : 0);
    const moodValues = checkIns.map(c => c.overallMood);

    return this.calculateCorrelation(exerciseValues, moodValues);
  }

  /**
   * Calculate correlation between sleep quality and energy level
   */
  calculateSleepEnergyCorrelation(checkIns: DailyCheckIn[]): number {
    const validCheckIns = checkIns.filter(c => c.sleepQuality !== null);
    if (validCheckIns.length < 3) return 0;

    const sleepValues = validCheckIns.map(c => c.sleepQuality || 0);
    const energyValues = validCheckIns.map(c => c.energyLevel);

    return this.calculateCorrelation(sleepValues, energyValues);
  }

  /**
   * Calculate impact of a specific behavior on mental health metrics
   */
  findBehaviorImpact(behavior: string, checkIns: DailyCheckIn[]): BehaviorImpact {
    if (checkIns.length < 5) {
      return this.getEmptyBehaviorImpact(behavior);
    }

    // Separate check-ins where behavior occurred vs didn't occur
    let withBehavior: DailyCheckIn[];
    let withoutBehavior: DailyCheckIn[];

    switch (behavior) {
      case 'exercise':
        withBehavior = checkIns.filter(c => c.exercised);
        withoutBehavior = checkIns.filter(c => !c.exercised);
        break;
      case 'selfCare':
        withBehavior = checkIns.filter(c => c.practicedSelfCare);
        withoutBehavior = checkIns.filter(c => !c.practicedSelfCare);
        break;
      case 'social':
        withBehavior = checkIns.filter(c => c.socializedHealthily);
        withoutBehavior = checkIns.filter(c => !c.socializedHealthily);
        break;
      case 'nutrition':
        withBehavior = checkIns.filter(c => c.ateWell);
        withoutBehavior = checkIns.filter(c => !c.ateWell);
        break;
      case 'medication':
        withBehavior = checkIns.filter(c => c.tookMedication);
        withoutBehavior = checkIns.filter(c => !c.tookMedication);
        break;
      default:
        return this.getEmptyBehaviorImpact(behavior);
    }

    if (withBehavior.length < 2 || withoutBehavior.length < 2) {
      return this.getEmptyBehaviorImpact(behavior);
    }

    // Calculate averages for both groups
    const avgMoodWith = this.average(withBehavior.map(c => c.overallMood));
    const avgMoodWithout = this.average(withoutBehavior.map(c => c.overallMood));

    const avgEnergyWith = this.average(withBehavior.map(c => c.energyLevel));
    const avgEnergyWithout = this.average(withoutBehavior.map(c => c.energyLevel));

    const avgStressWith = this.average(withBehavior.map(c => c.stressLevel));
    const avgStressWithout = this.average(withoutBehavior.map(c => c.stressLevel));

    const avgAnxietyWith = this.average(withBehavior.map(c => c.anxietyLevel));
    const avgAnxietyWithout = this.average(withoutBehavior.map(c => c.anxietyLevel));

    // Calculate percentage impacts
    const impactOnMood = this.calculatePercentageChange(avgMoodWithout, avgMoodWith);
    const impactOnEnergy = this.calculatePercentageChange(avgEnergyWithout, avgEnergyWith);
    const impactOnStress = this.calculatePercentageChange(avgStressWithout, avgStressWith);
    const impactOnAnxiety = this.calculatePercentageChange(avgAnxietyWithout, avgAnxietyWith);

    // Calculate confidence based on sample size
    const sampleSize = Math.min(withBehavior.length, withoutBehavior.length);
    const confidence = Math.min(100, (sampleSize / checkIns.length) * 100 + 20);

    return {
      behavior,
      impactOnMood,
      impactOnEnergy,
      impactOnStress: -impactOnStress, // Negative because lower stress is better
      impactOnAnxiety: -impactOnAnxiety, // Negative because lower anxiety is better
      sampleSize,
      confidence: Math.round(confidence)
    };
  }

  /**
   * Generate a correlation matrix for all key factors
   */
  generateCorrelationMatrix(checkIns: DailyCheckIn[]): CorrelationMatrix {
    if (checkIns.length < 5) {
      return {
        factors: [],
        matrix: [],
        heatmapData: []
      };
    }

    const factors = [
      { name: 'Mood', values: checkIns.map(c => c.overallMood) },
      { name: 'Energy', values: checkIns.map(c => c.energyLevel) },
      { name: 'Stress', values: checkIns.map(c => c.stressLevel) },
      { name: 'Anxiety', values: checkIns.map(c => c.anxietyLevel) },
      { name: 'Exercise', values: checkIns.map(c => c.exercised ? 10 : 0) },
      { name: 'Self-Care', values: checkIns.map(c => c.practicedSelfCare ? 10 : 0) },
      { name: 'Social', values: checkIns.map(c => c.socializedHealthily ? 10 : 0) }
    ];

    // Add sleep if enough data points
    const sleepCheckIns = checkIns.filter(c => c.sleepQuality !== null);
    if (sleepCheckIns.length >= checkIns.length * 0.5) {
      factors.push({
        name: 'Sleep',
        values: checkIns.map(c => c.sleepQuality || 5) // Use 5 as neutral default
      });
    }

    const factorNames = factors.map(f => f.name);
    const matrix: number[][] = [];
    const heatmapData: { x: string; y: string; value: number }[] = [];

    // Calculate correlations between all pairs
    for (let i = 0; i < factors.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < factors.length; j++) {
        const correlation = i === j ? 1 : this.calculateCorrelation(
          factors[i].values,
          factors[j].values
        );
        row.push(correlation);

        heatmapData.push({
          x: factorNames[i],
          y: factorNames[j],
          value: Math.round(correlation * 100) / 100
        });
      }
      matrix.push(row);
    }

    return {
      factors: factorNames,
      matrix,
      heatmapData
    };
  }

  /**
   * Identify all strong correlations (|r| > 0.5)
   */
  identifyStrongCorrelations(checkIns: DailyCheckIn[]): Correlation[] {
    if (checkIns.length < 10) {
      return [];
    }

    const correlations: Correlation[] = [];
    const matrix = this.generateCorrelationMatrix(checkIns);

    for (let i = 0; i < matrix.factors.length; i++) {
      for (let j = i + 1; j < matrix.factors.length; j++) {
        const coefficient = matrix.matrix[i][j];
        const absCoeff = Math.abs(coefficient);

        if (absCoeff >= 0.5) {
          const strength = absCoeff >= 0.7 ? 'strong' : 'moderate';
          const direction = coefficient > 0 ? 'positive' : 'negative';

          correlations.push({
            factorA: matrix.factors[i],
            factorB: matrix.factors[j],
            coefficient: Math.round(coefficient * 100) / 100,
            strength,
            direction,
            significanceLevel: this.calculateSignificance(coefficient, checkIns.length),
            interpretation: this.interpretCorrelation(
              matrix.factors[i],
              matrix.factors[j],
              coefficient
            ),
            dataPoints: checkIns.length
          });
        }
      }
    }

    return correlations.sort((a, b) =>
      Math.abs(b.coefficient) - Math.abs(a.coefficient)
    );
  }

  /**
   * Calculate p-value significance (simplified)
   */
  private calculateSignificance(r: number, n: number): number {
    if (n < 3) return 1;

    // Simplified t-test calculation
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const absT = Math.abs(t);

    // Approximate p-value based on t-statistic
    if (absT > 3) return 0.01; // p < 0.01
    if (absT > 2) return 0.05; // p < 0.05
    if (absT > 1.5) return 0.1; // p < 0.1
    return 0.2; // p > 0.1
  }

  /**
   * Generate human-readable interpretation of correlation
   */
  private interpretCorrelation(
    factorA: string,
    factorB: string,
    coefficient: number
  ): string {
    const direction = coefficient > 0 ? 'higher' : 'lower';
    const strength = Math.abs(coefficient) >= 0.7 ? 'significantly' : 'moderately';
    const percent = Math.round(Math.abs(coefficient) * 100);

    if (factorA === 'Exercise' || factorA === 'Self-Care' || factorA === 'Social') {
      return `When you engage in ${factorA.toLowerCase()}, your ${factorB.toLowerCase()} tends to be ${direction} (${percent}% correlation)`;
    }

    return `${factorA} and ${factorB} show a ${strength} ${coefficient > 0 ? 'positive' : 'negative'} relationship (${percent}% correlation)`;
  }

  /**
   * Helper: Calculate average of array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Helper: Calculate percentage change
   */
  private calculatePercentageChange(before: number, after: number): number {
    if (before === 0) return 0;
    return Math.round(((after - before) / before) * 100);
  }

  /**
   * Helper: Get empty behavior impact
   */
  private getEmptyBehaviorImpact(behavior: string): BehaviorImpact {
    return {
      behavior,
      impactOnMood: 0,
      impactOnEnergy: 0,
      impactOnStress: 0,
      impactOnAnxiety: 0,
      sampleSize: 0,
      confidence: 0
    };
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;

    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Detect outliers using Z-score method
   */
  detectOutliers(values: number[], threshold: number = 2): number[] {
    const avg = this.average(values);
    const std = this.calculateStandardDeviation(values);

    if (std === 0) return [];

    return values
      .map((value, index) => ({ value, index, zScore: Math.abs((value - avg) / std) }))
      .filter(item => item.zScore > threshold)
      .map(item => item.index);
  }

  /**
   * Calculate moving average for trend smoothing
   */
  calculateMovingAverage(values: number[], windowSize: number = 7): number[] {
    if (values.length < windowSize) {
      return values.map(() => this.average(values));
    }

    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
      const window = values.slice(start, end);
      result.push(this.average(window));
    }

    return result;
  }

  /**
   * Calculate linear regression trend
   */
  calculateTrend(values: number[]): { slope: number; intercept: number; rSquared: number } {
    if (values.length < 2) {
      return { slope: 0, intercept: values[0] || 0, rSquared: 0 };
    }

    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXSquare = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYSquare = values.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXSquare - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * i + intercept), 2),
      0
    );
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 100) / 100,
      rSquared: Math.round(rSquared * 100) / 100
    };
  }
}

export const correlationService = new CorrelationService();
