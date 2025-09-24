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

/**
 * GET /api/files/debug
 * Debug endpoint to test environment variables and basic functionality
 */
router.get('/debug', (req, res) => {
  try {
    const envCheck = {
      hasDoSpacesEndpoint: !!process.env.DO_SPACES_ENDPOINT,
      hasZkBucket: !!process.env.DO_SPACES_ZK_BUCKET,
      hasSmBucket: !!process.env.DO_SPACES_SM_BUCKET,
      hasZkKey: !!process.env.DO_SPACES_ZK_KEY,
      hasZkSecret: !!process.env.DO_SPACES_ZK_SECRET,
      hasSmKey: !!process.env.DO_SPACES_SM_KEY,
      hasSmSecret: !!process.env.DO_SPACES_SM_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 DEBUG: Environment check:', envCheck);

    res.json({
      success: true,
      message: 'Debug endpoint working',
      environment: envCheck,
      upload_endpoint: '/api/files/upload'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
