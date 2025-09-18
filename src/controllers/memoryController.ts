import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Zod validation schemas
const CreateMemorySchema = z.object({
  type: z.enum(['text', 'image', 'audio']),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
}).refine(
  (data) => {
    if (data.type === 'text' && !data.content) {
      return false;
    }
    if ((data.type === 'image' || data.type === 'audio') && !data.fileUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Text memories require content, image/audio memories require fileUrl",
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

      const { type, content, fileUrl } = validationResult.data;

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

      // Create the memory
      const memory = await prisma.memory.create({
        data: {
          vaultId: memoryVault.id,
          type,
          content,
          fileUrl
        }
      });

      res.status(201).json({
        success: true,
        message: 'Memory created successfully',
        data: {
          memory: {
            id: memory.id,
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

      // Get memories with pagination
      const [memories, totalCount] = await Promise.all([
        prisma.memory.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.memory.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          memories: memories.map(memory => ({
            id: memory.id,
            type: memory.type,
            content: memory.content,
            fileUrl: memory.fileUrl,
            createdAt: memory.createdAt
          })),
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

      res.json({
        success: true,
        data: {
          memory: {
            id: memory.id,
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

      // Delete the memory
      await prisma.memory.delete({
        where: { id: memoryId }
      });

      res.json({
        success: true,
        message: 'Memory deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}
