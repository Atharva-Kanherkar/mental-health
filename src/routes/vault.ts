import { Router } from 'express';
import { MemoryVaultController } from '../controllers/memoryVaultController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Memory vault routes
router.get('/', MemoryVaultController.getMemoryVault);         // GET /api/vault
router.get('/stats', MemoryVaultController.getVaultStats);     // GET /api/vault/stats
router.get('/search', MemoryVaultController.searchVault);      // GET /api/vault/search
router.delete('/', MemoryVaultController.deleteMemoryVault);   // DELETE /api/vault

export default router;
