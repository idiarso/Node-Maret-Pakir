import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

// Get revenue report (admin only)
router.get('/revenue', adminMiddleware, DashboardController.getRevenueReport);

// Get occupancy report
router.get('/occupancy', DashboardController.getOccupancyReport);

export default router; 