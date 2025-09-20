import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { EncryptedFileRequest } from '../middleware/fileUpload';
import { s3, SPACES_CONFIG, generateFileKey, deleteFile, getSignedUrl } from '../config/storage';
import { generateFileMetadata } from '../middleware/fileUpload';

const prisma = new PrismaClient();

// Validation schema for encrypted file upload
const CreateEncryptedMemorySchema = z.object({
  type: z.enum(['text', 'image', 'audio', 'video']),
  content: z.string().optional(), // Optional description
  associatedPersonId: z.string().uuid().optional(),
  iv: z.string().regex(/^[a-fA-F0-9]{32}$/, 'Invalid IV format'),
  authTag: z.string().optional() // For AES-GCM
});

export class FileUploadController {
  /**
   * Upload an encrypted file and create a memory
   */
  static async uploadEncryptedFile(req: EncryptedFileRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = CreateEncryptedMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const { type, content, associatedPersonId, iv, authTag } = validationResult.data;

      // Ensure we have the encrypted file
      if (!req.encryptedFile) {
        return res.status(400).json({
          success: false,
          message: 'No encrypted file provided'
        });
      }

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

      // Validate associated person if provided
      if (associatedPersonId) {
        const associatedPerson = await prisma.favPerson.findFirst({
          where: {
            id: associatedPersonId,
            vaultId: memoryVault.id
          }
        });

        if (!associatedPerson) {
          return res.status(404).json({
            success: false,
            message: 'Associated person not found in your vault.'
          });
        }
      }

      // Generate unique file key for storage
      const fileKey = generateFileKey(userId, type, req.encryptedFile.originalName);
      
      // Upload encrypted file to DigitalOcean Spaces
      const uploadParams = {
        Bucket: SPACES_CONFIG.bucket,
        Key: fileKey,
        Body: req.encryptedFile.buffer,
        ContentType: 'application/octet-stream', // Encrypted files are binary
        ServerSideEncryption: 'AES256', // Additional server-side encryption
        Metadata: {
          'original-mimetype': req.encryptedFile.mimeType,
          'original-filename': req.encryptedFile.originalName,
          'user-id': userId,
          'encryption-version': '1' // For future compatibility
        }
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      // Create memory record in database
      const memory = await prisma.memory.create({
        data: {
          vaultId: memoryVault.id,
          type,
          content: content || null,
          fileKey,
          fileUrl: uploadResult.Location,
          fileName: req.encryptedFile.originalName,
          fileMimeType: req.encryptedFile.mimeType,
          fileSize: req.encryptedFile.size,
          encryptionIV: iv,
          encryptionAuthTag: authTag || null,
          isEncrypted: true,
          associatedPersonId: associatedPersonId || null
        },
        include: {
          associatedPerson: {
            select: {
              id: true,
              name: true,
              relationship: true
            }
          }
        }
      });

      // Generate a short-lived signed URL for immediate access
      const signedUrl = getSignedUrl(fileKey, 3600); // 1 hour expiry

      res.status(201).json({
        success: true,
        message: 'Encrypted file uploaded successfully',
        data: {
          memory: {
            ...memory,
            signedUrl // Include signed URL for immediate access
          }
        }
      });

    } catch (error) {
      console.error('Error uploading encrypted file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload encrypted file'
      });
    }
  }

  /**
   * Get a signed URL for accessing an encrypted file
   */
  static async getFileAccess(req: EncryptedFileRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { memoryId } = req.params;

      // Find the memory and verify ownership
      const memory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vault: {
            userId
          },
          isEncrypted: true
        }
      });

      if (!memory || !memory.fileKey) {
        return res.status(404).json({
          success: false,
          message: 'Encrypted file not found'
        });
      }

      // Generate signed URL with 1 hour expiry
      const signedUrl = getSignedUrl(memory.fileKey, 3600);

      res.json({
        success: true,
        data: {
          signedUrl,
          fileName: memory.fileName,
          mimeType: memory.fileMimeType,
          size: memory.fileSize,
          encryptionIV: memory.encryptionIV,
          encryptionAuthTag: memory.encryptionAuthTag,
          expiresIn: 3600 // seconds
        }
      });

    } catch (error) {
      console.error('Error generating file access URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate file access URL'
      });
    }
  }

  /**
   * Delete a memory and its associated encrypted file
   */
  static async deleteEncryptedMemory(req: EncryptedFileRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { memoryId } = req.params;

      // Find the memory and verify ownership
      const memory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vault: {
            userId
          }
        }
      });

      if (!memory) {
        return res.status(404).json({
          success: false,
          message: 'Memory not found'
        });
      }

      // If memory has an encrypted file, delete it from storage
      if (memory.fileKey && memory.isEncrypted) {
        try {
          await deleteFile(memory.fileKey);
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
          // We'll log this for manual cleanup if needed
        }
      }

      // Delete memory from database
      await prisma.memory.delete({
        where: { id: memoryId }
      });

      res.json({
        success: true,
        message: 'Memory and associated file deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting encrypted memory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete memory'
      });
    }
  }

  /**
   * Get upload progress/status (for future implementation)
   */
  static async getUploadStatus(req: EncryptedFileRequest, res: Response) {
    // Placeholder for upload progress tracking
    // This could be implemented with Redis or database tracking
    res.json({
      success: true,
      message: 'Upload status feature coming soon'
    });
  }
}
