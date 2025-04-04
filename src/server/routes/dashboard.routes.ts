import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

const router = Router();
const dashboardController = DashboardController.getInstance();

// Protected routes
router.get('/summary', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => dashboardController.getSummary(req, res));
router.get('/stats', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => dashboardController.getStats(req, res));
router.get('/revenue', authMiddleware([UserRole.ADMIN]), (req, res) => dashboardController.getRevenue(req, res));
router.get('/occupancy', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => dashboardController.getOccupancy(req, res));

export default router; 