import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from "../prisma/client";
import { JournalService, JournalAnalysis } from '../services/journalService';


const createJournalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(5000, 'Title is too long'), // Encrypted title can be longer
  content: z.string().min(1, 'Content is required').max(50000, 'Content is too long'), // Encrypted content can be much longer
  mediaType: z.enum(['image', 'audio', 'video']).optional(),
  mediaUrl: z.string().url().optional(),

  // Mental Health Tracking (all 1-10 scale)
  overallMood: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  anxietyLevel: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),

  // Privacy & Memory options
  privacyLevel: z.enum(['zero_knowledge', 'server_managed']).default('server_managed'),
  convertToMemory: z.boolean().default(false),
  associatedMemoryId: z.string().uuid().optional(),
  iv: z.string().optional(), // Encryption IV for zero-knowledge journals
}).refine(
  (data) => {
    // If mediaType is provided, mediaUrl must also be provided
    if (data.mediaType && !data.mediaUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Media URL is required when media type is specified",
  }
);

export class JournalController {
  /**
   * Create a new journal entry with AI analysis
   */
  static async createJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = createJournalSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const { 
        title, 
        content, 
        mediaUrl, 
        mediaType, 
        overallMood,
        energyLevel,
        anxietyLevel,
        stressLevel,
        privacyLevel,
        convertToMemory,
        associatedMemoryId
      } = validationResult.data;

      // Check if user has a memory vault (required for journal entries)
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found. Please complete onboarding first.'
        });
      }

      // Analyze the journal entry with AI (ONLY for server-managed journals)
      let aiAnalysis: JournalAnalysis;

      if (privacyLevel === 'zero_knowledge') {
        // Skip AI analysis for encrypted journals (privacy preserved)
        aiAnalysis = {
          aiSentiment: 'encrypted',
          aiMoodTags: [],
          aiWellnessScore: 0,
          aiInsights: 'Content is encrypted - AI analysis unavailable',
          aiThemes: [],
          isSafetyRisk: false,
          supportiveMessage: 'Your thoughts are safely encrypted. Only you can read them.'
        };
      } else {
        // AI analysis for server-managed journals
        aiAnalysis = await JournalService.analyzeEntry(
          title,
          content,
          userId,
          mediaType,
          mediaUrl
        );
      }

      // For zero-knowledge journals: content is already encrypted client-side
      // AI analysis only runs for server_managed journals
      let aiAnalysisData = {};

      if (privacyLevel === 'server_managed') {
        // AI can analyze server-managed journals
        aiAnalysisData = {
          aiSentiment: aiAnalysis.aiSentiment,
          aiMoodTags: aiAnalysis.aiMoodTags,
          aiWellnessScore: aiAnalysis.aiWellnessScore,
          aiInsights: aiAnalysis.aiInsights,
          aiThemes: aiAnalysis.aiThemes,
          aiSupportiveMessage: aiAnalysis.supportiveMessage,
        };
      }
      // For zero_knowledge: AI fields remain null (privacy preserved)

      // Create the journal entry in database
      const journalEntry = await prisma.journalEntry.create({
        data: {
          userId: userId,
          title, // Encrypted if privacyLevel=zero_knowledge
          content, // Encrypted if privacyLevel=zero_knowledge
          mediaType: mediaType || null,
          mediaUrl: mediaUrl || null,

          // Privacy
          privacyLevel: privacyLevel || 'server_managed',
          isEncrypted: privacyLevel === 'zero_knowledge',
          encryptionIV: req.body.iv || null, // Client provides IV for encrypted journals

          // Mental Health Tracking
          overallMood: overallMood || null,
          energyLevel: energyLevel || null,
          anxietyLevel: anxietyLevel || null,
          stressLevel: stressLevel || null,

          // Memory Options
          convertToMemory: convertToMemory || false,
          associatedMemoryId: associatedMemoryId || null,

          // AI Analysis (only for server_managed)
          ...aiAnalysisData,

          pointsEarned: 0
        }
      });

      // Update user streaks and check for achievements
      // We'll implement this later
      // await JournalService.updateStreaks(userId, { aiAnalysis, mood: overallMood });

      res.status(201).json({
        success: true,
        message: 'Journal entry created successfully',
        data: {
          entry: {
            id: journalEntry.id,
            title: journalEntry.title,
            content: journalEntry.content,
            mediaType: journalEntry.mediaType,
            mediaUrl: journalEntry.mediaUrl,
            
            // Mental Health Tracking
            overallMood: journalEntry.overallMood,
            energyLevel: journalEntry.energyLevel,
            anxietyLevel: journalEntry.anxietyLevel,
            stressLevel: journalEntry.stressLevel,
            
            // Privacy & Memory
            privacyLevel: journalEntry.privacyLevel,
            convertToMemory: journalEntry.convertToMemory,
            associatedMemoryId: journalEntry.associatedMemoryId,
            pointsEarned: journalEntry.pointsEarned,
            createdAt: journalEntry.createdAt,
            aiAnalysis: {
              sentiment: aiAnalysis.aiSentiment,
              moodTags: aiAnalysis.aiMoodTags,
              wellnessScore: aiAnalysis.aiWellnessScore,
              insights: aiAnalysis.aiInsights,
              themes: aiAnalysis.aiThemes,
              safetyRisk: aiAnalysis.isSafetyRisk,
              supportiveMessage: aiAnalysis.supportiveMessage
            }
          }
        }
      });

    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Get all journal entries for the authenticated user
   */
  static async getJournalEntries(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 entries per page
      const skip = (page - 1) * limit;

      // Get mood filter if provided
      const moodFilter = req.query.mood as string;
      const sentimentFilter = req.query.sentiment as string;

      // Build where clause for filtering
      const whereClause: any = {
        userId: userId
      };

      if (moodFilter) {
        const mood = parseInt(moodFilter);
        if (!isNaN(mood) && mood >= 1 && mood <= 10) {
          whereClause.overallMood = mood;
        }
      }

      if (sentimentFilter) {
        whereClause.aiSentiment = {
          contains: sentimentFilter,
          mode: 'insensitive'
        };
      }

      // Get journal entries with pagination
      const [journalEntries, totalCount] = await Promise.all([
        prisma.journalEntry.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.journalEntry.count({ where: whereClause })
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          entries: journalEntries.map(entry => ({
            id: entry.id,
            title: entry.title,
            content: entry.content,
            mediaType: entry.mediaType,
            mediaUrl: entry.mediaUrl,
            
            // Mental Health Tracking
            overallMood: entry.overallMood,
            energyLevel: entry.energyLevel,
            anxietyLevel: entry.anxietyLevel,
            stressLevel: entry.stressLevel,
            
            // Privacy & Memory
            privacyLevel: entry.privacyLevel,
            convertToMemory: entry.convertToMemory,
            associatedMemoryId: entry.associatedMemoryId,
            pointsEarned: entry.pointsEarned,
            
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            
            aiAnalysis: {
              sentiment: entry.aiSentiment,
              moodTags: entry.aiMoodTags,
              wellnessScore: entry.aiWellnessScore,
              insights: entry.aiInsights,
              themes: entry.aiThemes,
              supportiveMessage: entry.aiSupportiveMessage
              // Note: Safety risk handling will be implemented separately
            }
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Get a specific journal entry by ID
   */
  static async getJournalEntryById(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      // Validate the entry ID format
      if (!entryId || entryId.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Invalid journal entry ID'
        });
      }

      // Find the journal entry and ensure it belongs to the authenticated user
      const journalEntry = await prisma.journalEntry.findFirst({
        where: {
          id: entryId,
          userId: userId
        }
      });

      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
      }

      res.json({
        success: true,
        data: {
          entry: {
            id: journalEntry.id,
            title: journalEntry.title,
            content: journalEntry.content,
            mediaType: journalEntry.mediaType,
            mediaUrl: journalEntry.mediaUrl,
            
            // Mental Health Tracking
            overallMood: journalEntry.overallMood,
            energyLevel: journalEntry.energyLevel,
            anxietyLevel: journalEntry.anxietyLevel,
            stressLevel: journalEntry.stressLevel,
            
            // Privacy & Memory
            privacyLevel: journalEntry.privacyLevel,
            convertToMemory: journalEntry.convertToMemory,
            associatedMemoryId: journalEntry.associatedMemoryId,
            pointsEarned: journalEntry.pointsEarned,
            
            createdAt: journalEntry.createdAt,
            updatedAt: journalEntry.updatedAt,
            
            aiAnalysis: {
              sentiment: journalEntry.aiSentiment,
              moodTags: journalEntry.aiMoodTags,
              wellnessScore: journalEntry.aiWellnessScore,
              insights: journalEntry.aiInsights,
              themes: journalEntry.aiThemes,
              supportiveMessage: journalEntry.aiSupportiveMessage
            }
          }
        }
      });

    } catch (error: any) {
      console.error('Error fetching journal entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Delete a specific journal entry by ID
   */
  static async deleteJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      // Validate the entry ID format
      if (!entryId || entryId.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Invalid journal entry ID'
        });
      }

      // Find and delete the journal entry (ensure it belongs to the authenticated user)
      const deletedEntry = await prisma.journalEntry.deleteMany({
        where: {
          id: entryId,
          userId: userId
        }
      });

      if (deletedEntry.count === 0) {
        return res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
      }

      res.json({
        success: true,
        message: 'Journal entry deleted successfully'
      });

    } catch (error: any) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Update a specific journal entry by ID
   */
  static async updateJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      // Validate the entry ID format
      if (!entryId || entryId.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Invalid journal entry ID'
        });
      }

      // Validate request body (allow partial updates)
      const updateSchema = createJournalSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const updateData = validationResult.data;

      // Check if the entry exists and belongs to the user
      const existingEntry = await prisma.journalEntry.findFirst({
        where: {
          id: entryId,
          userId: userId
        }
      });

      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
      }

      // If content or title is being updated, re-analyze with AI
      let aiAnalysis: JournalAnalysis | null = null;
      if (updateData.title || updateData.content) {
        const title = updateData.title || existingEntry.title;
        const content = updateData.content || existingEntry.content;
        
        aiAnalysis = await JournalService.analyzeEntry(
          title,
          content,
          userId,
          updateData.mediaType || existingEntry.mediaType || undefined,
          updateData.mediaUrl || existingEntry.mediaUrl || undefined
        );
      }

      // Update the journal entry
      const updatedEntry = await prisma.journalEntry.update({
        where: {
          id: entryId
        },
        data: {
          ...updateData,
          // Update AI analysis if we re-analyzed
          ...(aiAnalysis && {
            aiSentiment: aiAnalysis.aiSentiment,
            aiMoodTags: aiAnalysis.aiMoodTags,
            aiWellnessScore: aiAnalysis.aiWellnessScore,
            aiInsights: aiAnalysis.aiInsights,
            aiThemes: aiAnalysis.aiThemes,
            aiSupportiveMessage: aiAnalysis.supportiveMessage
          })
        }
      });

      res.json({
        success: true,
        message: 'Journal entry updated successfully',
        data: {
          entry: {
            id: updatedEntry.id,
            title: updatedEntry.title,
            content: updatedEntry.content,
            mediaType: updatedEntry.mediaType,
            mediaUrl: updatedEntry.mediaUrl,
            
            // Mental Health Tracking
            overallMood: updatedEntry.overallMood,
            energyLevel: updatedEntry.energyLevel,
            anxietyLevel: updatedEntry.anxietyLevel,
            stressLevel: updatedEntry.stressLevel,
            
            // Privacy & Memory
            privacyLevel: updatedEntry.privacyLevel,
            convertToMemory: updatedEntry.convertToMemory,
            associatedMemoryId: updatedEntry.associatedMemoryId,
            pointsEarned: updatedEntry.pointsEarned,
            
            createdAt: updatedEntry.createdAt,
            updatedAt: updatedEntry.updatedAt,
            
            aiAnalysis: {
              sentiment: updatedEntry.aiSentiment,
              moodTags: updatedEntry.aiMoodTags,
              wellnessScore: updatedEntry.aiWellnessScore,
              insights: updatedEntry.aiInsights,
              themes: updatedEntry.aiThemes,
              supportiveMessage: updatedEntry.aiSupportiveMessage
            }
          }
        }
      });

    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}