import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { handleEncryptedUpload } from '../middleware/fileUpload';
import { FileUploadController } from '../controllers/fileUploadController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * POST /api/files/upload
 * Upload an encrypted file and create a memory
 * Expects:
 * - file: encrypted file (multipart/form-data)
 * - type: 'image' | 'audio' | 'video'
 * - content: optional description
 * - associatedPersonId: optional UUID
 * - iv: encryption IV (32-char hex string)
 * - authTag: optional authentication tag for AES-GCM
 */
router.post('/upload', handleEncryptedUpload, FileUploadController.uploadEncryptedFile);

/**
 * GET /api/files/:memoryId/access
 * Get a signed URL for accessing an encrypted file
 */
router.get('/:memoryId/access', FileUploadController.getFileAccess);

/**
 * DELETE /api/files/:memoryId
 * Delete a memory and its associated encrypted file
 */
router.delete('/:memoryId', FileUploadController.deleteEncryptedMemory);

/**
 * GET /api/files/:memoryId/status
 * Get upload status (future feature)
 */
router.get('/:memoryId/status', FileUploadController.getUploadStatus);

/**
 * GET /api/files/serve/:memoryId
 * Serve server-managed files through pre-signed URLs
 * This avoids CORS issues and provides proper access control
 */
router.get('/serve/:memoryId', FileUploadController.serveFile);

export default router;
