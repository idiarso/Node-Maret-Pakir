import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', (req, res) => {
  // Return dummy data for now
  res.json({
    activeTickets: 12,
    totalRevenue: 2500000,
    averageDuration: 2.5,
    totalTickets: 85,
    vehicleDistribution: {
      CAR: 65,
      MOTORCYCLE: 30,
      TRUCK: 5
    }
  });
});

// Get revenue report (admin only)
router.get('/revenue', adminMiddleware, DashboardController.getRevenueReport);

// Get occupancy report
router.get('/occupancy', DashboardController.getOccupancyReport);

export default router; 