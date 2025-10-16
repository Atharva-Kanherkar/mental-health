/**
 * AI Insights Service - Gemini-powered analysis for mental health check-ins
 * Uses Google Gemini 2.5 Flash for fast, cost-effective insights
 * Provides fallback for when AI is unavailable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyCheckIn } from '../generated/prisma';
import {
  ThemeAnalysis,
  MoodDriver,
  IAIInsightsService
} from '../types/insights';
import { UserProfileService } from './userProfileService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class AIInsightsService implements IAIInsightsService {
  private aiAvailable: boolean = true;
  private lastAIFailure: Date | null = null;
  private consecutiveFailures: number = 0;

  /**
   * Check if AI should be attempted (circuit breaker pattern)
   */
  private shouldAttemptAI(): boolean {
    // If we've had 3+ consecutive failures in the last 5 minutes, don't try
    if (this.consecutiveFailures >= 3 && this.lastAIFailure) {
      const timeSinceFailure = Date.now() - this.lastAIFailure.getTime();
      if (timeSinceFailure < 5 * 60 * 1000) {
        return false;
      }
      // Reset after 5 minutes
      this.consecutiveFailures = 0;
    }
    return this.aiAvailable;
  }

  /**
   * Record AI success/failure for circuit breaker
   */
  private recordAIResult(success: boolean) {
    if (success) {
      this.consecutiveFailures = 0;
      this.aiAvailable = true;
    } else {
      this.consecutiveFailures++;
      this.lastAIFailure = new Date();
      if (this.consecutiveFailures >= 3) {
        console.warn('AI circuit breaker activated - switching to fallback mode');
      }
    }
  }

  /**
   * Analyze gratitude entries for themes and patterns
   */
  async analyzeGratitudePatterns(entries: string[]): Promise<ThemeAnalysis> {
    if (entries.length === 0) {
      return this.getEmptyThemeAnalysis('positive');
    }

    if (!this.shouldAttemptAI()) {
      return this.analyzePatternsStatistically(entries, 'positive');
    }

    try {
      const prompt = `You are a mental health analytics expert. Analyze these gratitude entries and identify recurring themes.

GRATITUDE ENTRIES:
${entries.map((e, i) => `${i + 1}. ${e}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Identify 3-5 main themes in these gratitude entries
2. Count frequency of each theme
3. Extract key keywords for each theme
4. Assess overall sentiment
5. Measure diversity (how varied are the themes?)

FORMAT RESPONSE AS JSON:
{
  "themes": [
    {
      "name": "Family & Relationships",
      "count": 8,
      "keywords": ["family", "loved ones", "partner", "friends"],
      "sentiment": "positive"
    }
  ],
  "topTheme": "Family & Relationships",
  "diversity": 75,
  "overallSentiment": "positive"
}

Focus on identifying meaningful patterns that show what brings this person joy and meaning.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in AI response');
      }

      this.recordAIResult(true);
      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Error in AI gratitude analysis:', error);
      this.recordAIResult(false);
      return this.analyzePatternsStatistically(entries, 'positive');
    }
  }

  /**
   * Analyze challenge entries for themes and patterns
   */
  async analyzeChallengePatterns(entries: string[]): Promise<ThemeAnalysis> {
    if (entries.length === 0) {
      return this.getEmptyThemeAnalysis('neutral');
    }

    if (!this.shouldAttemptAI()) {
      return this.analyzePatternsStatistically(entries, 'negative');
    }

    try {
      const prompt = `You are a mental health analytics expert. Analyze these challenge entries to identify stressors and difficulties.

CHALLENGE ENTRIES:
${entries.map((e, i) => `${i + 1}. ${e}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Identify 3-5 main challenge themes
2. Count frequency of each challenge type
3. Extract key stress indicators
4. Assess sentiment (negative, neutral, or showing resilience)
5. Measure diversity of challenges

FORMAT RESPONSE AS JSON:
{
  "themes": [
    {
      "name": "Work Stress",
      "count": 6,
      "keywords": ["work", "deadlines", "pressure", "meetings"],
      "sentiment": "negative"
    }
  ],
  "topTheme": "Work Stress",
  "diversity": 60,
  "overallSentiment": "negative"
}

Be compassionate and identify patterns that could help with coping strategies.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in AI response');
      }

      this.recordAIResult(true);
      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Error in AI challenge analysis:', error);
      this.recordAIResult(false);
      return this.analyzePatternsStatistically(entries, 'negative');
    }
  }

  /**
   * Generate personalized insight from check-in data
   */
  async generatePersonalizedInsight(checkInData: DailyCheckIn[], userId?: string): Promise<string> {
    if (checkInData.length === 0) {
      return this.getFallbackInsight();
    }

    if (!this.shouldAttemptAI()) {
      return this.generateStatisticalInsight(checkInData);
    }

    try {
      // Get user profile context if userId provided
      let profileContext = '';
      if (userId) {
        profileContext = await UserProfileService.getAIContext(userId);
      }

      const avgMood = this.average(checkInData.map(c => c.overallMood));
      const avgEnergy = this.average(checkInData.map(c => c.energyLevel));
      const avgStress = this.average(checkInData.map(c => c.stressLevel));
      const avgAnxiety = this.average(checkInData.map(c => c.anxietyLevel));

      const exerciseRate = (checkInData.filter(c => c.exercised).length / checkInData.length) * 100;
      const selfCareRate = (checkInData.filter(c => c.practicedSelfCare).length / checkInData.length) * 100;

      const gratitudes = checkInData
        .map(c => c.gratefulFor)
        .filter(g => g && g.length > 0)
        .slice(0, 5);

      const challenges = checkInData
        .map(c => c.challengesToday)
        .filter(c => c && c.length > 0)
        .slice(0, 5);

      const prompt = `You are a compassionate mental health therapist providing a brief, personalized insight.

${profileContext ? `${profileContext}\n` : ''}

DATA SUMMARY (Last ${checkInData.length} days):
- Average Mood: ${avgMood.toFixed(1)}/10
- Average Energy: ${avgEnergy.toFixed(1)}/10
- Average Stress: ${avgStress.toFixed(1)}/10
- Average Anxiety: ${avgAnxiety.toFixed(1)}/10
- Exercise Rate: ${exerciseRate.toFixed(0)}%
- Self-Care Rate: ${selfCareRate.toFixed(0)}%

RECENT GRATITUDES:
${gratitudes.length > 0 ? gratitudes.map((g, i) => `${i + 1}. ${g}`).join('\n') : 'None recorded'}

RECENT CHALLENGES:
${challenges.length > 0 ? challenges.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'None recorded'}

INSTRUCTIONS:
Generate a warm, supportive 2-3 sentence insight that:
1. Acknowledges their emotional patterns
2. Highlights a positive trend or strength
3. Offers one gentle, actionable suggestion

Keep it personal, warm, and under 150 words. Speak directly to them using "you".`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.recordAIResult(true);
      return text.trim();

    } catch (error) {
      console.error('Error generating personalized insight:', error);
      this.recordAIResult(false);
      return this.generateStatisticalInsight(checkInData);
    }
  }

  /**
   * Detect what factors are driving mood changes
   */
  async detectMoodDrivers(checkInData: DailyCheckIn[]): Promise<MoodDriver[]> {
    if (checkInData.length < 7) {
      return [];
    }

    if (!this.shouldAttemptAI()) {
      return this.detectDriversStatistically(checkInData);
    }

    try {
      const dataPoints = checkInData.slice(0, 30).map(c => ({
        date: c.date.toISOString().split('T')[0],
        mood: c.overallMood,
        energy: c.energyLevel,
        stress: c.stressLevel,
        anxiety: c.anxietyLevel,
        exercised: c.exercised,
        selfCare: c.practicedSelfCare,
        social: c.socializedHealthily,
        sleep: c.sleepQuality || 'N/A'
      }));

      const prompt = `You are a mental health data scientist. Identify what factors are most strongly driving mood changes.

CHECK-IN DATA:
${JSON.stringify(dataPoints, null, 2)}

ANALYSIS INSTRUCTIONS:
1. Identify 3-5 key factors that influence mood
2. Estimate impact (-10 to +10)
3. Assess confidence (0-100)
4. Provide evidence from data
5. Give actionable recommendation

FORMAT AS JSON:
{
  "drivers": [
    {
      "driver": "Exercise",
      "impact": 7,
      "confidence": 85,
      "evidence": {
        "dates": ["2024-01-15", "2024-01-18"],
        "observations": ["Mood 8 on exercise days vs 5 on non-exercise days"]
      },
      "recommendation": "Try to exercise at least 3 times per week for mood boost"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      this.recordAIResult(true);
      return parsed.drivers || [];

    } catch (error) {
      console.error('Error detecting mood drivers:', error);
      this.recordAIResult(false);
      return this.detectDriversStatistically(checkInData);
    }
  }

  /**
   * Generate weekly summary of check-ins
   */
  async generateWeeklySummary(checkIns: DailyCheckIn[], journalAggregation?: any): Promise<string> {
    if (checkIns.length === 0) {
      return 'No check-in data available for this week.';
    }

    if (!this.shouldAttemptAI()) {
      return this.generateStatisticalSummary(checkIns);
    }

    try {
      const avgMood = this.average(checkIns.map(c => c.overallMood));
      const moodChange = this.calculateTrendDirection(checkIns.map(c => c.overallMood));

      const summary = checkIns.map(c => ({
        date: c.date.toISOString().split('T')[0],
        mood: c.overallMood,
        exercised: c.exercised,
        selfCare: c.practicedSelfCare,
        gratefulFor: c.gratefulFor?.substring(0, 50) || null
      }));

      const prompt = `Generate a warm, supportive weekly summary (2-3 sentences) for these check-ins:

${JSON.stringify(summary, null, 2)}

Average mood: ${avgMood.toFixed(1)}/10 (${moodChange})

Be encouraging, highlight progress, and speak directly to the user.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      this.recordAIResult(true);
      return response.text().trim();

    } catch (error) {
      console.error('Error generating weekly summary:', error);
      this.recordAIResult(false);
      return this.generateStatisticalSummary(checkIns);
    }
  }

  /**
   * Get a generic fallback insight when AI is unavailable
   */
  getFallbackInsight(): string {
    const insights = [
      'Your journey of self-reflection is valuable. Keep checking in with yourself regularly.',
      'Every day you track your mental health is a step toward better self-awareness.',
      'Remember: progress isn\'t always linear. Be kind to yourself.',
      'Your commitment to mental health awareness shows strength and resilience.',
      'Taking time to understand your patterns is an important part of healing.'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  // ========== STATISTICAL FALLBACK METHODS ==========

  /**
   * Statistical pattern analysis (no AI)
   */
  private analyzePatternsStatistically(
    entries: string[],
    defaultSentiment: 'positive' | 'neutral' | 'negative'
  ): ThemeAnalysis {
    if (entries.length === 0) {
      return this.getEmptyThemeAnalysis(defaultSentiment);
    }

    // Simple word frequency analysis
    const wordFreq: { [word: string]: number } = {};

    entries.forEach(entry => {
      const words = entry.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3); // Only words > 3 chars

      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Get top words
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Group similar words into themes
    const themes = [
      {
        name: 'Common Topics',
        count: entries.length,
        keywords: topWords.map(w => w[0]),
        sentiment: defaultSentiment
      }
    ];

    return {
      themes,
      topTheme: 'Common Topics',
      diversity: Math.min(100, (topWords.length / entries.length) * 100),
      overallSentiment: defaultSentiment
    };
  }

  /**
   * Statistical insight generation (no AI)
   */
  private generateStatisticalInsight(checkInData: DailyCheckIn[]): string {
    const avgMood = this.average(checkInData.map(c => c.overallMood));
    const trend = this.calculateTrendDirection(checkInData.map(c => c.overallMood));

    const exerciseCount = checkInData.filter(c => c.exercised).length;
    const selfCareCount = checkInData.filter(c => c.practicedSelfCare).length;

    let insight = `Over the past ${checkInData.length} days, your average mood has been ${avgMood.toFixed(1)}/10`;

    if (trend === 'improving') {
      insight += ', and it\'s trending upward! ';
    } else if (trend === 'declining') {
      insight += '. Things have been challenging lately. ';
    } else {
      insight += ', staying relatively stable. ';
    }

    if (exerciseCount > checkInData.length * 0.6) {
      insight += 'Your commitment to exercise has been strong. ';
    } else if (selfCareCount > checkInData.length * 0.6) {
      insight += 'You\'ve been prioritizing self-care, which is wonderful. ';
    }

    insight += 'Keep tracking your patterns - it helps build self-awareness.';

    return insight;
  }

  /**
   * Statistical driver detection (no AI)
   */
  private detectDriversStatistically(checkInData: DailyCheckIn[]): MoodDriver[] {
    const drivers: MoodDriver[] = [];

    // Exercise impact
    const withExercise = checkInData.filter(c => c.exercised);
    const withoutExercise = checkInData.filter(c => !c.exercised);

    if (withExercise.length >= 2 && withoutExercise.length >= 2) {
      const moodWithEx = this.average(withExercise.map(c => c.overallMood));
      const moodWithoutEx = this.average(withoutExercise.map(c => c.overallMood));
      const impact = Math.round((moodWithEx - moodWithoutEx) * 10) / 10;

      if (Math.abs(impact) > 0.5) {
        drivers.push({
          driver: 'Exercise',
          impact: Math.round(impact),
          confidence: Math.min(80, (withExercise.length / checkInData.length) * 100),
          evidence: {
            dates: withExercise.slice(0, 3).map(c => c.date),
            observations: [`Mood averages ${moodWithEx.toFixed(1)} with exercise vs ${moodWithoutEx.toFixed(1)} without`]
          },
          recommendation: impact > 0
            ? 'Continue exercising regularly for mood benefits'
            : 'Consider adjusting exercise routine'
        });
      }
    }

    return drivers;
  }

  /**
   * Statistical summary generation (no AI)
   */
  private generateStatisticalSummary(checkIns: DailyCheckIn[]): string {
    const avgMood = this.average(checkIns.map(c => c.overallMood));
    const highMoodDays = checkIns.filter(c => c.overallMood >= 7).length;

    return `This week you completed ${checkIns.length} check-ins with an average mood of ${avgMood.toFixed(1)}/10. You had ${highMoodDays} good days. Keep up the self-reflection!`;
  }

  // ========== HELPER METHODS ==========

  private getEmptyThemeAnalysis(sentiment: 'positive' | 'neutral' | 'negative'): ThemeAnalysis {
    return {
      themes: [],
      topTheme: 'Not enough data',
      diversity: 0,
      overallSentiment: sentiment
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateTrendDirection(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = this.average(firstHalf);
    const avgSecond = this.average(secondHalf);

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }
}

export const aiInsightsService = new AIInsightsService();
