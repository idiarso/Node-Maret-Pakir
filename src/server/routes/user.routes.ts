import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

const router = Router();
const userController = UserController.getInstance();

// Protected routes
router.get('/', authMiddleware([UserRole.ADMIN]), (req, res) => userController.getAllUsers(req, res));
router.get('/:id', authMiddleware([UserRole.ADMIN]), (req, res) => userController.getUserById(req, res));
router.post('/', authMiddleware([UserRole.ADMIN]), (req, res) => userController.createUser(req, res));
router.put('/:id', authMiddleware([UserRole.ADMIN]), (req, res) => userController.updateUser(req, res));
router.delete('/:id', authMiddleware([UserRole.ADMIN]), (req, res) => userController.deleteUser(req, res));

// Password management
router.post('/:id/reset-password', authMiddleware([UserRole.ADMIN]), (req, res) => userController.resetPassword(req, res));

export default router; 