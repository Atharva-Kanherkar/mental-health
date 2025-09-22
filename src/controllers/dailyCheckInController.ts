import { Request, Response } from 'express';
import { z } from 'zod';
import { dailyCheckInService, CreateDailyCheckInData } from '../services/dailyCheckInService';

// Validation schemas
const CreateDailyCheckInSchema = z.object({
  overallMood: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10),
  anxietyLevel: z.number().int().min(1).max(10),
  hadSelfHarmThoughts: z.boolean().optional().default(false),
  hadSuicidalThoughts: z.boolean().optional().default(false),
  actedOnHarm: z.boolean().optional().default(false),
  exercised: z.boolean().optional().default(false),
  ateWell: z.boolean().optional().default(false),
  socializedHealthily: z.boolean().optional().default(false),
  practicedSelfCare: z.boolean().optional().default(false),
  tookMedication: z.boolean().optional().default(false),
  gratefulFor: z.string().max(500).optional(),
  challengesToday: z.string().max(500).optional(),
  accomplishments: z.string().max(500).optional()
});

const HistoryQuerySchema = z.object({
  days: z.string().optional().default('30').transform(val => parseInt(val)).refine(val => val > 0 && val <= 365, {
    message: 'Days must be between 1 and 365'
  })
});

export class DailyCheckInController {
  
  // ========== CREATE & UPDATE CHECK-IN ==========
  
  async createOrUpdateCheckIn(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = CreateDailyCheckInSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid check-in data',
          details: validation.error.issues
        });
      }

      const checkIn = await dailyCheckInService.createOrUpdateCheckIn(userId, validation.data);
      
      // Check if this was a high-risk check-in and provide appropriate response
      const isHighRisk = checkIn.hadSuicidalThoughts || checkIn.actedOnHarm || 
                        (checkIn.hadSelfHarmThoughts && checkIn.overallMood <= 3);

      res.json({
        success: true,
        checkIn: {
          id: checkIn.id,
          date: checkIn.date,
          overallMood: checkIn.overallMood,
          energyLevel: checkIn.energyLevel,
          stressLevel: checkIn.stressLevel,
          anxietyLevel: checkIn.anxietyLevel,
          pointsEarned: checkIn.pointsEarned,
          createdAt: checkIn.createdAt,
          updatedAt: checkIn.updatedAt
        },
        isHighRisk,
        message: isHighRisk 
          ? 'Thank you for sharing. Your wellbeing is important. Please consider reaching out for support.' 
          : 'Great job completing your daily check-in!'
      });
    } catch (error) {
      console.error('Error creating/updating daily check-in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== RETRIEVE CHECK-INS ==========
  
  async getTodaysCheckIn(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const checkIn = await dailyCheckInService.getTodaysCheckIn(userId);
      
      if (!checkIn) {
        return res.json({ checkIn: null, hasCheckedInToday: false });
      }

      res.json({ 
        checkIn: {
          id: checkIn.id,
          date: checkIn.date,
          overallMood: checkIn.overallMood,
          energyLevel: checkIn.energyLevel,
          sleepQuality: checkIn.sleepQuality,
          stressLevel: checkIn.stressLevel,
          anxietyLevel: checkIn.anxietyLevel,
          // Safety questions (limited exposure)
          hadSelfHarmThoughts: checkIn.hadSelfHarmThoughts,
          hadSuicidalThoughts: checkIn.hadSuicidalThoughts,
          // Positive behaviors
          exercised: checkIn.exercised,
          ateWell: checkIn.ateWell,
          socializedHealthily: checkIn.socializedHealthily,
          practicedSelfCare: checkIn.practicedSelfCare,
          tookMedication: checkIn.tookMedication,
          // Reflections
          gratefulFor: checkIn.gratefulFor,
          challengesToday: checkIn.challengesToday,
          accomplishments: checkIn.accomplishments,
          pointsEarned: checkIn.pointsEarned,
          createdAt: checkIn.createdAt,
          updatedAt: checkIn.updatedAt
        },
        hasCheckedInToday: true
      });
    } catch (error) {
      console.error('Error fetching today\'s check-in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCheckInHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = HistoryQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const checkIns = await dailyCheckInService.getCheckInHistory(userId, validation.data.days);
      
      // Filter sensitive data before sending to client
      const safeCheckIns = checkIns.map(checkIn => ({
        id: checkIn.id,
        date: checkIn.date,
        overallMood: checkIn.overallMood,
        energyLevel: checkIn.energyLevel,
        sleepQuality: checkIn.sleepQuality,
        stressLevel: checkIn.stressLevel,
        anxietyLevel: checkIn.anxietyLevel,
        exercised: checkIn.exercised,
        ateWell: checkIn.ateWell,
        socializedHealthily: checkIn.socializedHealthily,
        practicedSelfCare: checkIn.practicedSelfCare,
        tookMedication: checkIn.tookMedication,
        gratefulFor: checkIn.gratefulFor,
        accomplishments: checkIn.accomplishments,
        pointsEarned: checkIn.pointsEarned,
        createdAt: checkIn.createdAt
      }));

      res.json({ checkIns: safeCheckIns });
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== ANALYTICS & INSIGHTS ==========
  
  async getCheckInSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = HistoryQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const summary = await dailyCheckInService.getCheckInSummary(userId, validation.data.days);
      res.json({ summary });
    } catch (error) {
      console.error('Error fetching check-in summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMoodTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = HistoryQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const trends = await dailyCheckInService.getMoodTrends(userId, validation.data.days);
      res.json({ trends });
    } catch (error) {
      console.error('Error fetching mood trends:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getWeeklyAverages(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { weeks } = req.query;
      const weeksNumber = weeks ? parseInt(weeks as string) : 4;
      
      if (weeksNumber < 1 || weeksNumber > 52) {
        return res.status(400).json({ error: 'Weeks must be between 1 and 52' });
      }

      const weeklyAverages = await dailyCheckInService.getWeeklyAverages(userId, weeksNumber);
      res.json({ weeklyAverages });
    } catch (error) {
      console.error('Error fetching weekly averages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== STATUS & STATISTICS ==========
  
  async getCheckInStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await dailyCheckInService.getUserCheckInStats(userId);
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========== CRISIS RESOURCES ==========
  
  async getCrisisResources(req: Request, res: Response) {
    try {
      // This endpoint provides crisis intervention resources
      // In a production environment, these would be localized and comprehensive
      
      const resources = {
        immediate: {
          suicidePrevention: {
            us: {
              name: 'National Suicide Prevention Lifeline',
              phone: '988',
              text: 'Text HOME to 741741',
              chat: 'https://suicidepreventionlifeline.org/chat/'
            },
            international: {
              name: 'International Association for Suicide Prevention',
              url: 'https://www.iasp.info/resources/Crisis_Centres/'
            }
          },
          crisis: {
            us: {
              name: 'Crisis Text Line',
              text: 'Text HOME to 741741'
            }
          },
          emergency: {
            phone: '911',
            message: 'Call emergency services if you are in immediate danger'
          }
        },
        support: {
          therapy: {
            betterhelp: 'https://www.betterhelp.com',
            psychologytoday: 'https://www.psychologytoday.com/us/therapists'
          },
          peer: {
            nami: 'https://www.nami.org/Support-Education',
            mentalhealth: 'https://www.mentalhealth.gov/get-help/immediate-help'
          }
        },
        selfCare: {
          breathing: [
            'Take 5 deep breaths',
            'Try the 4-7-8 breathing technique',
            'Practice box breathing'
          ],
          grounding: [
            '5-4-3-2-1 technique (5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste)',
            'Hold an ice cube',
            'Listen to calming music'
          ],
          physical: [
            'Go for a walk',
            'Do gentle stretching',
            'Take a warm shower'
          ]
        }
      };

      res.json({ resources });
    } catch (error) {
      console.error('Error fetching crisis resources:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const dailyCheckInController = new DailyCheckInController();
