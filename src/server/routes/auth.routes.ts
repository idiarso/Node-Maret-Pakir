import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', authMiddleware(), AuthController.getProfile);
router.post('/change-password', authMiddleware(), AuthController.changePassword);

export default router; 