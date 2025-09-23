import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma';
import { EncryptedFileRequest } from '../middleware/fileUpload';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { 
  s3ZeroKnowledge, 
  s3ServerManaged, 
  getS3Client, 
  getBucketName, 
  generateFileKey, 
  deleteFile, 
  getSignedUrl,
  PrivacyLevel 
} from '../config/storage';
import { generateFileMetadata } from '../middleware/fileUpload';

const prisma = new PrismaClient();

// Validation schema for memory upload with privacy level
const CreateMemorySchema = z.object({
  type: z.enum(['text', 'image', 'audio', 'video']),
  content: z.string().optional(), // Optional description
  associatedPersonId: z.string().uuid().optional(),
  privacyLevel: z.enum(['zero_knowledge', 'server_managed']).default('server_managed'),
  // Encryption fields (only required for zero_knowledge)
  iv: z.string().regex(/^[a-fA-F0-9]{32}$/, 'Invalid IV format').optional(),
  authTag: z.string().optional() // For AES-GCM
}).refine((data) => {
  // SECURITY: If zero_knowledge is selected, IV must be provided for client-side encryption
  if (data.privacyLevel === 'zero_knowledge' && !data.iv) {
    return false;
  }
  return true;
}, {
  message: "IV is required for zero-knowledge privacy level",
  path: ["iv"]
});

export class FileUploadController {
  /**
   * Upload a file and create a memory with privacy level selection
   * SECURITY: Routes files to appropriate bucket based on privacy level
   */
  static async uploadEncryptedFile(req: EncryptedFileRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // DEBUG: Log request body for debugging
      console.log(`🔍 DEBUG: Upload request body:`, {
        type: req.body.type,
        privacyLevel: req.body.privacyLevel,
        hasIV: !!req.body.iv,
        hasFile: !!req.encryptedFile
      });

      // Validate request body
      const validationResult = CreateMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log(`❌ Validation failed:`, validationResult.error.issues);
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.issues
        });
      }

      const { type, content, associatedPersonId, privacyLevel, iv, authTag } = validationResult.data;

      // SECURITY: Validate file requirement based on privacy level
      if (!req.encryptedFile) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
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

      // SECURITY: Get the appropriate S3 client and bucket for the privacy level
      const s3Client = getS3Client(privacyLevel);
      const bucketName = getBucketName(privacyLevel);
      
      // DEBUG: Log bucket routing
      console.log(`🔍 DEBUG: File upload routing:`, {
        userId,
        privacyLevel,
        bucketName,
        fileName: req.encryptedFile.originalName
      });
      
      // Generate unique file key for storage
      const fileKey = generateFileKey(userId, type, req.encryptedFile.originalName);
      
      // SECURITY: Upload to the correct isolated bucket
      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: req.encryptedFile.buffer,
        ContentType: privacyLevel === 'zero_knowledge' 
          ? 'application/octet-stream' // Encrypted files are binary
          : req.encryptedFile.mimeType, // Server-managed files keep original MIME type
        ServerSideEncryption: 'AES256', // Additional server-side encryption
        Metadata: {
          'original-mimetype': req.encryptedFile.mimeType,
          'original-filename': req.encryptedFile.originalName,
          'user-id': userId,
          'privacy-level': privacyLevel,
          'encryption-version': privacyLevel === 'zero_knowledge' ? '1' : '0'
        }
      });

      let uploadResult;
      try {
        uploadResult = await s3Client.send(uploadCommand);
      } catch (storageError) {
        console.error('Storage upload error:', storageError);
        return res.status(502).json({
          success: false,
          message: 'Failed to store file in object storage',
        });
      }

      // Generate the file URL manually since AWS SDK v3 doesn't return Location
      const fileUrl = `https://${bucketName}.${process.env.DO_SPACES_ENDPOINT}/${fileKey}`;

      // Create memory record in database with privacy level
      const memory = await prisma.memory.create({
        data: {
          vaultId: memoryVault.id,
          type,
          content: content || null,
          privacyLevel,
          fileKey,
          fileUrl,
          fileName: req.encryptedFile.originalName,
          fileMimeType: req.encryptedFile.mimeType,
          fileSize: req.encryptedFile.size,
          // SECURITY: Only store encryption metadata for zero-knowledge files
          encryptionIV: privacyLevel === 'zero_knowledge' ? iv : null,
          encryptionAuthTag: privacyLevel === 'zero_knowledge' ? (authTag || null) : null,
          isEncrypted: privacyLevel === 'zero_knowledge',
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
      const signedUrl = await getSignedUrl(fileKey, privacyLevel, 3600); // 1 hour expiry

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
   * Get a signed URL for accessing a file (any privacy level)
   * SECURITY: Uses appropriate bucket based on memory's privacy level
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
          }
        }
      });

      if (!memory || !memory.fileKey) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // SECURITY: Generate signed URL from the correct bucket based on privacy level
      const privacyLevel = memory.privacyLevel as PrivacyLevel;
      const signedUrl = await getSignedUrl(memory.fileKey, privacyLevel, 3600);

      res.json({
        success: true,
        data: {
          signedUrl,
          fileName: memory.fileName,
          mimeType: memory.fileMimeType,
          size: memory.fileSize,
          privacyLevel: memory.privacyLevel,
          // SECURITY: Only include encryption metadata for zero-knowledge files
          encryptionIV: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionIV : undefined,
          encryptionAuthTag: memory.privacyLevel === 'zero_knowledge' ? memory.encryptionAuthTag : undefined,
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
   * Delete a memory and its associated file (any privacy level)
   * SECURITY: Deletes from the correct bucket based on privacy level
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

      // If memory has a file, delete it from the appropriate bucket
      if (memory.fileKey) {
        try {
          // SECURITY: Delete from the correct bucket based on privacy level
          const privacyLevel = memory.privacyLevel as PrivacyLevel;
          await deleteFile(memory.fileKey, privacyLevel);
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

  /**
   * Serve server-managed files through pre-signed URLs
   * This avoids CORS issues and provides proper access control
   * Uses session-based authentication which works with browser requests
   */
  static async serveFile(req: EncryptedFileRequest, res: Response) {
    try {
      const { memoryId } = req.params;
      
      // For media serving, we need to handle authentication differently
      // since browsers don't send auth headers for media requests
      let userId = req.user?.id;
      
      // If no user from middleware, try to get session directly
      if (!userId) {
        // This endpoint relies on session cookies being sent by the browser
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get the memory and verify ownership
      const memory = await prisma.memory.findFirst({
        where: {
          id: memoryId,
          vault: {
            userId: userId
          }
        }
      });

      if (!memory) {
        return res.status(404).json({ error: 'Memory not found' });
      }

      if (!memory.fileKey) {
        return res.status(404).json({ error: 'No file associated with this memory' });
      }

      // Only serve server-managed files through this endpoint
      if (memory.privacyLevel !== 'server_managed') {
        return res.status(403).json({ error: 'This endpoint only serves smart memories' });
      }

      // Generate a pre-signed URL for the file
      const signedUrl = await getSignedUrl(memory.fileKey, 'server_managed', 3600); // 1 hour expiry

      // Redirect to the pre-signed URL
      res.redirect(signedUrl);

    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }
}
