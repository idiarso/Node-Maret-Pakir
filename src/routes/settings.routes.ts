import { Router } from 'express';
import { DataSource } from 'typeorm';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../shared/types';

export function createSettingsRouter(dataSource: DataSource): Router {
  const router = Router();
  const controller = new SettingsController(dataSource);

  // Rute untuk pengaturan bahasa - tanpa auth agar bisa diakses semua pengguna
  router.get('/language', controller.getLanguageSettings);
  
  // Rute update hanya untuk admin
  router.put('/language', authMiddleware([UserRole.ADMIN]), controller.updateLanguageSettings);

  return router;
} 