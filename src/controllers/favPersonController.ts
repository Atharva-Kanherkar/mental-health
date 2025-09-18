import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Zod validation schemas
const PersonaMetadataSchema = z.object({
  tone: z.string().optional(),
  style: z.string().optional(),
  keyPhrases: z.array(z.string()).optional(),
  reminderPreferences: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
    frequency: z.enum(['daily', 'weekly']).optional(),
  }).optional(),
}).catchall(z.any()); // Allow additional properties

const CreateFavPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  priority: z.number().int().min(1).max(10),
  timezone: z.string().optional(),
  supportMsg: z.string().optional(),
  voiceNoteUrl: z.string().url().optional(),
  videoNoteUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
  personaMetadata: PersonaMetadataSchema.optional(),
});

const UpdateFavPersonSchema = z.object({
  name: z.string().min(1).optional(),
  relationship: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  timezone: z.string().optional(),
  supportMsg: z.string().optional(),
  voiceNoteUrl: z.string().url().optional(),
  videoNoteUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
  personaMetadata: PersonaMetadataSchema.optional(),
});

export class FavPersonController {
  /**
   * Create a new favorite person in the user's vault
   */
  static async createFavPerson(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = CreateFavPersonSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const data = validationResult.data;

      // Check if user has a memory vault
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found. Please complete onboarding first.'
        });
      }

      // Create the favorite person
      const favPerson = await prisma.favPerson.create({
        data: {
          vaultId: memoryVault.id,
          name: data.name,
          relationship: data.relationship,
          phoneNumber: data.phoneNumber,
          email: data.email,
          priority: data.priority,
          timezone: data.timezone,
          supportMsg: data.supportMsg,
          voiceNoteUrl: data.voiceNoteUrl,
          videoNoteUrl: data.videoNoteUrl,
          photoUrl: data.photoUrl,
          personaMetadata: data.personaMetadata || {}
        }
      });

      res.status(201).json({
        success: true,
        message: 'Favorite person created successfully',
        data: {
          favPerson: {
            id: favPerson.id,
            name: favPerson.name,
            relationship: favPerson.relationship,
            phoneNumber: favPerson.phoneNumber,
            email: favPerson.email,
            priority: favPerson.priority,
            timezone: favPerson.timezone,
            supportMsg: favPerson.supportMsg,
            voiceNoteUrl: favPerson.voiceNoteUrl,
            videoNoteUrl: favPerson.videoNoteUrl,
            photoUrl: favPerson.photoUrl,
            personaMetadata: favPerson.personaMetadata,
            createdAt: favPerson.createdAt,
            updatedAt: favPerson.updatedAt
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Get all favorite people for the authenticated user
   */
  static async getFavPeople(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const sortBy = req.query.sortBy as string || 'priority';
      const order = req.query.order as string || 'asc';

      // Check if user has a memory vault
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found. Please complete onboarding first.'
        });
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'priority') {
        orderBy.priority = order;
      } else if (sortBy === 'name') {
        orderBy.name = order;
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = order;
      } else {
        orderBy.priority = 'asc'; // default
      }

      // Get favorite people
      const favPeople = await prisma.favPerson.findMany({
        where: { vaultId: memoryVault.id },
        orderBy
      });

      res.json({
        success: true,
        data: {
          favPeople: favPeople.map(person => ({
            id: person.id,
            name: person.name,
            relationship: person.relationship,
            phoneNumber: person.phoneNumber,
            email: person.email,
            priority: person.priority,
            timezone: person.timezone,
            supportMsg: person.supportMsg,
            voiceNoteUrl: person.voiceNoteUrl,
            videoNoteUrl: person.videoNoteUrl,
            photoUrl: person.photoUrl,
            personaMetadata: person.personaMetadata,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Get a specific favorite person by ID
   */
  static async getFavPersonById(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const personId = req.params.id;

      if (!personId) {
        return res.status(400).json({
          success: false,
          message: 'Person ID is required'
        });
      }

      // Get user's memory vault
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found'
        });
      }

      // Get the favorite person
      const favPerson = await prisma.favPerson.findFirst({
        where: {
          id: personId,
          vaultId: memoryVault.id
        }
      });

      if (!favPerson) {
        return res.status(404).json({
          success: false,
          message: 'Favorite person not found'
        });
      }

      res.json({
        success: true,
        data: {
          favPerson: {
            id: favPerson.id,
            name: favPerson.name,
            relationship: favPerson.relationship,
            phoneNumber: favPerson.phoneNumber,
            email: favPerson.email,
            priority: favPerson.priority,
            timezone: favPerson.timezone,
            supportMsg: favPerson.supportMsg,
            voiceNoteUrl: favPerson.voiceNoteUrl,
            videoNoteUrl: favPerson.videoNoteUrl,
            photoUrl: favPerson.photoUrl,
            personaMetadata: favPerson.personaMetadata,
            createdAt: favPerson.createdAt,
            updatedAt: favPerson.updatedAt
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Update a favorite person
   */
  static async updateFavPerson(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const personId = req.params.id;

      if (!personId) {
        return res.status(400).json({
          success: false,
          message: 'Person ID is required'
        });
      }

      // Validate request body
      const validationResult = UpdateFavPersonSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const data = validationResult.data;

      // Get user's memory vault
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found'
        });
      }

      // Check if person exists and belongs to user
      const existingPerson = await prisma.favPerson.findFirst({
        where: {
          id: personId,
          vaultId: memoryVault.id
        }
      });

      if (!existingPerson) {
        return res.status(404).json({
          success: false,
          message: 'Favorite person not found'
        });
      }

      // Build update data
      const updateData: any = {};
      Object.keys(data).forEach(key => {
        if (data[key as keyof typeof data] !== undefined) {
          updateData[key] = data[key as keyof typeof data];
        }
      });

      // Update the favorite person
      const updatedPerson = await prisma.favPerson.update({
        where: { id: personId },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Favorite person updated successfully',
        data: {
          favPerson: {
            id: updatedPerson.id,
            name: updatedPerson.name,
            relationship: updatedPerson.relationship,
            phoneNumber: updatedPerson.phoneNumber,
            email: updatedPerson.email,
            priority: updatedPerson.priority,
            timezone: updatedPerson.timezone,
            supportMsg: updatedPerson.supportMsg,
            voiceNoteUrl: updatedPerson.voiceNoteUrl,
            videoNoteUrl: updatedPerson.videoNoteUrl,
            photoUrl: updatedPerson.photoUrl,
            personaMetadata: updatedPerson.personaMetadata,
            createdAt: updatedPerson.createdAt,
            updatedAt: updatedPerson.updatedAt
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Delete a favorite person
   */
  static async deleteFavPerson(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const personId = req.params.id;

      if (!personId) {
        return res.status(400).json({
          success: false,
          message: 'Person ID is required'
        });
      }

      // Get user's memory vault
      const memoryVault = await prisma.memoryVault.findUnique({
        where: { userId }
      });

      if (!memoryVault) {
        return res.status(404).json({
          success: false,
          message: 'Memory vault not found'
        });
      }

      // Check if person exists and belongs to user
      const existingPerson = await prisma.favPerson.findFirst({
        where: {
          id: personId,
          vaultId: memoryVault.id
        }
      });

      if (!existingPerson) {
        return res.status(404).json({
          success: false,
          message: 'Favorite person not found'
        });
      }

      // Delete the favorite person
      await prisma.favPerson.delete({
        where: { id: personId }
      });

      res.json({
        success: true,
        message: 'Favorite person deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}
