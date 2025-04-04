import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

const router = Router();

// Protected routes - Admin only
router.get('/', authMiddleware([UserRole.ADMIN]), SettingsController.getSettings);
router.put('/', authMiddleware([UserRole.ADMIN]), SettingsController.updateSettings);

// Backup and restore routes
router.post('/backup', authMiddleware([UserRole.ADMIN]), SettingsController.createBackup);
router.post('/restore', authMiddleware([UserRole.ADMIN]), SettingsController.restoreBackup);

export default router; 