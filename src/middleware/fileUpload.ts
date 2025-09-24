import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { SPACES_CONFIG } from '../config/storage';
import crypto from 'crypto';

// Custom interface to extend Request with file and encryption metadata
export interface EncryptedFileRequest extends Request {
  encryptedFile?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    iv: string; // Initialization Vector for decryption
    authTag?: string; // Authentication tag for AES-GCM
  };
}

// Configure multer for memory storage (we'll encrypt before uploading)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SPACES_CONFIG.maxFileSize,
    files: 1 // Only allow one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is allowed
    const allAllowedTypes = [
      ...SPACES_CONFIG.allowedMimeTypes.text,
      ...SPACES_CONFIG.allowedMimeTypes.images,
      ...SPACES_CONFIG.allowedMimeTypes.videos,
      ...SPACES_CONFIG.allowedMimeTypes.audio
    ];
    
    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Supported types: ${allAllowedTypes.join(', ')}`));
    }
  }
}).single('file');

/**
 * Middleware to handle encrypted file uploads
 * Expects the file to already be encrypted on the client side
 */
export const handleEncryptedUpload = (req: EncryptedFileRequest, res: Response, next: NextFunction) => {
  console.log('🔍 Upload middleware started:', {
    contentType: req.headers['content-type'],
    method: req.method,
    url: req.url
  });

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${SPACES_CONFIG.maxFileSize / (1024 * 1024)}MB`
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
        debug: {
          hasBody: !!req.body,
          bodyKeys: Object.keys(req.body || {}),
          contentType: req.headers['content-type'],
          bodyValues: req.body
        }
      });
    }

    // Validate file size (additional check beyond multer)
    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'File cannot be empty',
        debug: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    }

    // Validate encryption metadata based on privacy level
    const privacyLevel = req.body.privacyLevel || 'server_managed';
    const iv = req.body.iv;
    
    // SECURITY: Only require IV for zero-knowledge uploads (client-side encryption)
    if (privacyLevel === 'zero_knowledge') {
      if (!iv) {
        return res.status(400).json({
          success: false,
          message: 'Missing encryption metadata (IV) - required for zero-knowledge privacy level',
          debug: {
            privacyLevel,
            hasIV: !!iv,
            bodyKeys: Object.keys(req.body || {})
          }
        });
      }

      // Validate IV format (should be hex string)
      if (!/^[a-fA-F0-9]{32}$/.test(iv)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid encryption metadata format',
          debug: {
            ivLength: iv.length,
            ivValue: iv
          }
        });
      }
    }

    // Store file data and metadata
    req.encryptedFile = {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      iv: iv || '', // Empty string for server-managed uploads
      authTag: req.body.authTag // Optional for AES-GCM
    };

    next();
  });
};

/**
 * Validate file type against memory content
 */
export function getFileTypeFromContent(buffer: Buffer): string {
  // Check file signatures (magic numbers) for security
  // Note: Since files are encrypted, we'll rely on the original mimetype
  // This is a basic check - in production, you might want more sophisticated validation
  
  if (buffer.length < 4) {
    throw new Error('File too small to determine type');
  }

  // For encrypted files, we'll validate the mimetype was in our allowed list
  // The actual content validation happens before encryption on the client side
  return 'encrypted'; // Placeholder - we trust the mimetype from the upload
}

/**
 * Generate file metadata for database storage
 */
export function generateFileMetadata(encryptedFile: EncryptedFileRequest['encryptedFile'], userId: string) {
  if (!encryptedFile) {
    throw new Error('No encrypted file data provided');
  }

  return {
    originalName: encryptedFile.originalName,
    mimeType: encryptedFile.mimeType,
    size: encryptedFile.size,
    iv: encryptedFile.iv,
    authTag: encryptedFile.authTag,
    uploadedBy: userId,
    uploadedAt: new Date(),
    // Generate a unique identifier for this file
    fileId: crypto.randomUUID()
  };
}
