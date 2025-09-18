import { Router } from 'express';
import { FavPersonController } from '../controllers/favPersonController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Favorite people routes
router.post('/', FavPersonController.createFavPerson);           // POST /api/favorites
router.get('/', FavPersonController.getFavPeople);              // GET /api/favorites
router.get('/:id', FavPersonController.getFavPersonById);       // GET /api/favorites/:id
router.put('/:id', FavPersonController.updateFavPerson);        // PUT /api/favorites/:id
router.delete('/:id', FavPersonController.deleteFavPerson);     // DELETE /api/favorites/:id

export default router;
