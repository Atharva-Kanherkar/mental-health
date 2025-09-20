import { Router, Request, Response } from 'express';
import { MemoryController } from '../controllers/memoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

 
router.post('/', MemoryController.createMemory);           // POST /api/memories
router.get('/', MemoryController.getMemories);             // GET /api/memories
router.get('/:id', MemoryController.getMemoryById);        // GET /api/memories/:id
router.put('/:id', MemoryController.updateMemory);         // PUT /api/memories/:id
router.delete('/:id', MemoryController.deleteMemory);      // DELETE /api/memories/:id

export default router;
