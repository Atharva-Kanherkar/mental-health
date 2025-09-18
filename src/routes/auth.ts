 import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
 
router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);
router.post('/signout', AuthController.signOut);
router.get('/session', AuthController.getSession);
router.get('/profile', AuthController.getProfile);

 

export default router;
