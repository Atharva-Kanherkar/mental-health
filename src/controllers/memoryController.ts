import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { getSignedUrl, PrivacyLevel, deleteFile } from '../config/storage';

const prisma = new PrismaClient();

// Zod validation schemas
const CreateMemorySchema = z.object({
    title: z.string().min(1, 'Title is required'),
  type: z.enum(['text', 'image', 'audio', 'video']),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  associatedPersonId: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.type === 'text' && !data.content) {
      return false;
    }
    if ((data.type === 'image' || data.type === 'audio' || data.type === 'video') && !data.fileUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Text memories require content, image/audio/video memories require fileUrl",
  }
);

const UpdateMemorySchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
});

export class MemoryController {
  /**
   * Create a new memory in the user's vault
   */
  static async createMemory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = CreateMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const {title, type, content, fileUrl, associatedPersonId } = validationResult.data;

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

      // Validate associatedPersonId if provided
      if (associatedPersonId) {
        const associatedPerson = await prisma.favPerson.findFirst({
          where: {
            id: associatedPersonId,
            vaultId: memoryVault.id
          }
        });

        if (!associatedPerson) {
          return res.status(400).json({
            success: false,
            message: 'Associated person not found in your vault'
          });
        }
      }

      // Create the memory
      const memory = await prisma.memory.create({
        data: {
          vaultId: memoryVault.id,
          type,
          content,
          fileUrl,
          associatedPersonId: associatedPersonId || null
        }
      });

      res.status(201).json({
        success: true,
        message: 'Memory created successfully',
        data: {
          memory: {
            id: memory.id,
            title,
            type: memory.type,
            content: memory.content,
            fileUrl: memory.fileUrl,
            createdAt: memory.createdAt
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
   * Get all memories for the authenticated user
   */
  static async getMemories(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;

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

      // Build where clause
      const whereClause: any = { vaultId: memoryVault.id };
      if (type && ['text', 'image', 'audio'].includes(type)) {
        whereClause.type = type;
      }

      // Get memories with pagination and include encrypted file fields
      const [memories, totalCount] = await Promise.all([
        prisma.memory.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            associatedPerson: {
              select: {
                id: true,
                name: true,
                relationship: true
              }
            }
          }
        }),
        prisma.memory.count({ where: whereClause })
      ]);

      // Process memories to generate signed URLs with proper bucket routing
      const processedMemories = await Promise.all(memories.map(async (memory) => {
        const baseMemory = {
          id: memory.id,
          type: memory.type,
          content: memory.content,
          privacyLevel: memory.privacyLevel, // Include privacy level in response
          fileUrl: memory.fileUrl,
          fileName: memory.fileName,
          fileMimeType: memory.fileMimeType,
          fileSize: memory.fileSize,
          isEncrypted: memory.isEncrypted,
          // SECURITY: Only include encryption metadata for zero-knowledge files
          encryptionIV: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionIV : undefined,
          encryptionAuthTag: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionAuthTag : undefined,
          createdAt: memory.createdAt,
          associatedPerson: memory.associatedPerson
        };

        // If the memory has a file, generate a signed URL from the appropriate bucket
        if (memory.fileKey) {
          const privacyLevel = memory.privacyLevel as PrivacyLevel;
          const signedUrl = await getSignedUrl(memory.fileKey, privacyLevel, 3600); // 1 hour expiry
          return {
            ...baseMemory,
            signedUrl
          };
        }

        return baseMemory;
      }));

      res.json({
        success: true,
        data: {
          memories: processedMemories,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
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
   * Get a specific memory by ID
   */
  static async getMemoryById(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const memoryId = req.params.id;

      if (!memoryId) {
        return res.status(400).json({
          success: false,
          message: 'Memory ID is required'
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

      // Get the memory
      const memory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vaultId: memoryVault.id
        }
      });

      if (!memory) {
        return res.status(404).json({
          success: false,
          message: 'Memory not found'
        });
      }

      // Process memory to include privacy level and signed URL if needed
      let processedMemory: any = {
        id: memory.id,
        type: memory.type,
        content: memory.content,
        privacyLevel: memory.privacyLevel,
        fileUrl: memory.fileUrl,
        fileName: memory.fileName,
        fileMimeType: memory.fileMimeType,
        fileSize: memory.fileSize,
        isEncrypted: memory.isEncrypted,
        // SECURITY: Only include encryption metadata for zero-knowledge files
        encryptionIV: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionIV : undefined,
        encryptionAuthTag: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionAuthTag : undefined,
        createdAt: memory.createdAt
      };

      // Generate signed URL if the memory has a file
      if (memory.fileKey) {
        const privacyLevel = memory.privacyLevel as PrivacyLevel;
        const signedUrl = await getSignedUrl(memory.fileKey, privacyLevel, 3600);
        processedMemory.signedUrl = signedUrl;
      }

      res.json({
        success: true,
        data: {
          memory: processedMemory
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
   * Update a memory
   */
  static async updateMemory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const memoryId = req.params.id;

      if (!memoryId) {
        return res.status(400).json({
          success: false,
          message: 'Memory ID is required'
        });
      }

      // Validate request body
      const validationResult = UpdateMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const { content, fileUrl } = validationResult.data;

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

      // Check if memory exists and belongs to user
      const existingMemory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vaultId: memoryVault.id
        }
      });

      if (!existingMemory) {
        return res.status(404).json({
          success: false,
          message: 'Memory not found'
        });
      }

      // Update the memory
      const updatedMemory = await prisma.memory.update({
        where: { id: memoryId },
        data: {
          ...(content !== undefined && { content }),
          ...(fileUrl !== undefined && { fileUrl })
        }
      });

      res.json({
        success: true,
        message: 'Memory updated successfully',
        data: {
          memory: {
            id: updatedMemory.id,
            type: updatedMemory.type,
            content: updatedMemory.content,
            fileUrl: updatedMemory.fileUrl,
            createdAt: updatedMemory.createdAt
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
   * Delete a memory
   */
  static async deleteMemory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const memoryId = req.params.id;

      if (!memoryId) {
        return res.status(400).json({
          success: false,
          message: 'Memory ID is required'
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

      // Check if memory exists and belongs to user
      const existingMemory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vaultId: memoryVault.id
        }
      });

      if (!existingMemory) {
        return res.status(404).json({
          success: false,
          message: 'Memory not found'
        });
      }

      // SECURITY: Delete file from appropriate bucket if it exists
      if (existingMemory.fileKey) {
        try {
          const privacyLevel = existingMemory.privacyLevel as PrivacyLevel;
          await deleteFile(existingMemory.fileKey, privacyLevel);
          console.log(`File deleted from ${privacyLevel} bucket: ${existingMemory.fileKey}`);
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
          // Log this for manual cleanup if needed
        }
      }

      // Delete the memory from database
      await prisma.memory.delete({
        where: { id: memoryId }
      });

      res.json({
        success: true,
        message: 'Memory and associated file deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}
