import { PrismaClient } from '../generated/prisma';
import { rewardService } from './rewardService';

const prisma = new PrismaClient();

export interface CreateDailyCheckInData {
  overallMood: number;                    // 1-10
  energyLevel: number;                    // 1-10
  sleepQuality?: number;                  // 1-10
  stressLevel: number;                    // 1-10
  anxietyLevel: number;                   // 1-10
  hadSelfHarmThoughts?: boolean;
  hadSuicidalThoughts?: boolean;
  actedOnHarm?: boolean;
  exercised?: boolean;
  ateWell?: boolean;
  socializedHealthily?: boolean;
  practicedSelfCare?: boolean;
  tookMedication?: boolean;
  gratefulFor?: string;
  challengesToday?: string;
  accomplishments?: string;
}

export interface DailyCheckInSummary {
  totalCheckIns: number;
  currentStreak: number;
  averageMood: number;
  averageEnergy: number;
  averageStress: number;
  averageAnxiety: number;
  riskFactors: {
    hasRecentSelfHarmThoughts: boolean;
    hasRecentSuicidalThoughts: boolean;
    hasActedOnHarm: boolean;
    highStressCount: number;
    highAnxietyCount: number;
  };
  positiveHabits: {
    exerciseRate: number;
    selfCareRate: number;
    socialRate: number;
    nutritionRate: number;
    medicationRate: number;
  };
}

class DailyCheckInService {
  
  // ========== CREATE & UPDATE ==========
  
  async createOrUpdateCheckIn(userId: string, data: CreateDailyCheckInData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate points based on check-in completion and positive behaviors
    let pointsEarned = 10; // Base points for completing check-in
    
    // Bonus points for positive behaviors
    if (data.exercised) pointsEarned += 5;
    if (data.ateWell) pointsEarned += 5;
    if (data.socializedHealthily) pointsEarned += 5;
    if (data.practicedSelfCare) pointsEarned += 5;
    if (data.tookMedication) pointsEarned += 5;
    
    // Bonus for good mood/low stress
    if (data.overallMood >= 7) pointsEarned += 5;
    if (data.stressLevel <= 3) pointsEarned += 5;
    if (data.anxietyLevel <= 3) pointsEarned += 5;

    try {
      // Check if check-in already exists for today
      const existing = await prisma.dailyCheckIn.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      let checkIn;
      
      if (existing) {
        // Update existing check-in
        checkIn = await prisma.dailyCheckIn.update({
          where: { id: existing.id },
          data: {
            ...data,
            pointsEarned,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new check-in
        checkIn = await prisma.dailyCheckIn.create({
          data: {
            userId,
            date: today,
            ...data,
            pointsEarned
          }
        });

        // Award points to user and track behavior for streaks/achievements
        await Promise.all([
          prisma.user.update({
            where: { id: userId },
            data: {
              totalPoints: {
                increment: pointsEarned
              }
            }
          }),
          // Track check-in behavior for streaks
          rewardService.trackBehavior(userId, 'checkin')
        ]);

        // Track positive habits separately
        if (data.exercised) {
          await rewardService.trackBehavior(userId, 'exercise');
        }
        if (data.practicedSelfCare) {
          await rewardService.trackBehavior(userId, 'self_care');
        }

        // Track safety streak (no self-harm thoughts/actions)
        if (!data.hadSelfHarmThoughts && !data.hadSuicidalThoughts && !data.actedOnHarm) {
          await rewardService.trackBehavior(userId, 'no_self_harm');
        }

        // Track positive mood streak
        if (data.overallMood >= 6 && data.stressLevel <= 5 && data.anxietyLevel <= 5) {
          await rewardService.trackBehavior(userId, 'positive_mood');
        }
      }

      // Check for crisis intervention needs
      await this.checkCrisisIntervention(userId, checkIn);

      return checkIn;
    } catch (error) {
      console.error('Error creating/updating daily check-in:', error);
      throw error;
    }
  }

  // ========== RETRIEVAL ==========
  
  async getTodaysCheckIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.dailyCheckIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });
  }

  async getCheckInHistory(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  async getCheckInSummary(userId: string, days = 30): Promise<DailyCheckInSummary> {
    const checkIns = await this.getCheckInHistory(userId, days);
    
    if (checkIns.length === 0) {
      return {
        totalCheckIns: 0,
        currentStreak: 0,
        averageMood: 0,
        averageEnergy: 0,
        averageStress: 0,
        averageAnxiety: 0,
        riskFactors: {
          hasRecentSelfHarmThoughts: false,
          hasRecentSuicidalThoughts: false,
          hasActedOnHarm: false,
          highStressCount: 0,
          highAnxietyCount: 0
        },
        positiveHabits: {
          exerciseRate: 0,
          selfCareRate: 0,
          socialRate: 0,
          nutritionRate: 0,
          medicationRate: 0
        }
      };
    }

    // Calculate averages
    const totalCheckIns = checkIns.length;
    const averageMood = checkIns.reduce((sum, c) => sum + c.overallMood, 0) / totalCheckIns;
    const averageEnergy = checkIns.reduce((sum, c) => sum + c.energyLevel, 0) / totalCheckIns;
    const averageStress = checkIns.reduce((sum, c) => sum + c.stressLevel, 0) / totalCheckIns;
    const averageAnxiety = checkIns.reduce((sum, c) => sum + c.anxietyLevel, 0) / totalCheckIns;

    // Calculate current streak
    const currentStreak = await this.calculateCurrentStreak(userId);

    // Risk factors analysis
    const recentCheckIns = checkIns.slice(0, 7); // Last 7 days
    const riskFactors = {
      hasRecentSelfHarmThoughts: recentCheckIns.some(c => c.hadSelfHarmThoughts),
      hasRecentSuicidalThoughts: recentCheckIns.some(c => c.hadSuicidalThoughts),
      hasActedOnHarm: recentCheckIns.some(c => c.actedOnHarm),
      highStressCount: checkIns.filter(c => c.stressLevel >= 8).length,
      highAnxietyCount: checkIns.filter(c => c.anxietyLevel >= 8).length
    };

    // Positive habits rates
    const positiveHabits = {
      exerciseRate: (checkIns.filter(c => c.exercised).length / totalCheckIns) * 100,
      selfCareRate: (checkIns.filter(c => c.practicedSelfCare).length / totalCheckIns) * 100,
      socialRate: (checkIns.filter(c => c.socializedHealthily).length / totalCheckIns) * 100,
      nutritionRate: (checkIns.filter(c => c.ateWell).length / totalCheckIns) * 100,
      medicationRate: (checkIns.filter(c => c.tookMedication).length / totalCheckIns) * 100
    };

    return {
      totalCheckIns,
      currentStreak,
      averageMood: Math.round(averageMood * 10) / 10,
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      averageStress: Math.round(averageStress * 10) / 10,
      averageAnxiety: Math.round(averageAnxiety * 10) / 10,
      riskFactors,
      positiveHabits
    };
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    const streak = await rewardService.getStreak(userId, 'checkin');
    return streak?.currentStreak || 0;
  }

  // ========== ANALYTICS ==========
  
  async getMoodTrends(userId: string, days = 30) {
    const checkIns = await this.getCheckInHistory(userId, days);
    
    return checkIns.map(checkIn => ({
      date: checkIn.date,
      mood: checkIn.overallMood,
      energy: checkIn.energyLevel,
      stress: checkIn.stressLevel,
      anxiety: checkIn.anxietyLevel,
      sleepQuality: checkIn.sleepQuality
    }));
  }

  async getWeeklyAverages(userId: string, weeks = 4) {
    const days = weeks * 7;
    const checkIns = await this.getCheckInHistory(userId, days);
    
    // Group by week
    const weeklyData: { [key: string]: any[] } = {};
    
    checkIns.forEach(checkIn => {
      const weekStart = new Date(checkIn.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(checkIn);
    });

    // Calculate weekly averages
    return Object.entries(weeklyData).map(([weekStart, weekCheckIns]) => ({
      weekStart,
      averages: {
        mood: weekCheckIns.reduce((sum, c) => sum + c.overallMood, 0) / weekCheckIns.length,
        energy: weekCheckIns.reduce((sum, c) => sum + c.energyLevel, 0) / weekCheckIns.length,
        stress: weekCheckIns.reduce((sum, c) => sum + c.stressLevel, 0) / weekCheckIns.length,
        anxiety: weekCheckIns.reduce((sum, c) => sum + c.anxietyLevel, 0) / weekCheckIns.length,
        sleepQuality: weekCheckIns.reduce((sum, c) => sum + (c.sleepQuality || 0), 0) / weekCheckIns.length
      },
      checkInCount: weekCheckIns.length
    })).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  // ========== CRISIS INTERVENTION ==========
  
  private async checkCrisisIntervention(userId: string, checkIn: any): Promise<void> {
    // High-risk indicators
    const highRiskFactors = [
      checkIn.hadSuicidalThoughts,
      checkIn.actedOnHarm,
      checkIn.hadSelfHarmThoughts && checkIn.overallMood <= 3,
      checkIn.stressLevel >= 9 && checkIn.anxietyLevel >= 9,
      checkIn.overallMood <= 2
    ];

    const riskCount = highRiskFactors.filter(Boolean).length;

    if (riskCount > 0) {
      // Log crisis intervention need
      console.warn(`Crisis intervention may be needed for user ${userId}:`, {
        date: checkIn.date,
        suicidalThoughts: checkIn.hadSuicidalThoughts,
        selfHarmThoughts: checkIn.hadSelfHarmThoughts,
        actedOnHarm: checkIn.actedOnHarm,
        mood: checkIn.overallMood,
        stress: checkIn.stressLevel,
        anxiety: checkIn.anxietyLevel
      });

      // In a production environment, this could:
      // 1. Send alert to mental health professionals
      // 2. Provide crisis resources immediately
      // 3. Trigger automated safety check-ins
      // 4. Connect to crisis hotlines
      
      // For now, we'll create a flag in the database
      if (checkIn.hadSuicidalThoughts || checkIn.actedOnHarm) {
        await this.flagForCrisisIntervention(userId, checkIn.id, 'high');
      } else if (riskCount >= 2) {
        await this.flagForCrisisIntervention(userId, checkIn.id, 'moderate');
      }
    }
  }

  private async flagForCrisisIntervention(userId: string, checkInId: string, severity: 'moderate' | 'high'): Promise<void> {
    // This would typically create a record in a crisis_alerts table
    // For now, we'll use the existing MentalHealthProfile to track risk level
    try {
      await prisma.mentalHealthProfile.upsert({
        where: { userId },
        update: {
          riskLevel: severity === 'high' ? 'crisis' : 'high',
          lastAssessmentDate: new Date()
        },
        create: {
          userId,
          riskLevel: severity === 'high' ? 'crisis' : 'high',
          lastAssessmentDate: new Date(),
          privacyLevel: 'zero_knowledge'
        }
      });
    } catch (error) {
      console.error('Error flagging for crisis intervention:', error);
    }
  }

  // ========== UTILITIES ==========
  
  async hasUserCheckedInToday(userId: string): Promise<boolean> {
    const todaysCheckIn = await this.getTodaysCheckIn(userId);
    return !!todaysCheckIn;
  }

  async getUserCheckInStats(userId: string) {
    const [totalCheckIns, currentStreak] = await Promise.all([
      prisma.dailyCheckIn.count({ where: { userId } }),
      this.calculateCurrentStreak(userId)
    ]);

    return {
      totalCheckIns,
      currentStreak,
      hasCheckedInToday: await this.hasUserCheckedInToday(userId)
    };
  }
}

export const dailyCheckInService = new DailyCheckInService();
