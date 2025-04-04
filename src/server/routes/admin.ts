import { Router } from 'express';
import { DashboardController } from '../controllers/admin/DashboardController';
import { TicketController } from '../controllers/admin/TicketController';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

const router = Router();
const dashboardController = DashboardController.getInstance();
const ticketController = TicketController.getInstance();
const authController = AuthController.getInstance();

// Apply auth middleware with admin role to all routes
router.use(authMiddleware([UserRole.ADMIN]));

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getDashboardStats.bind(dashboardController));

// Ticket management routes
router.get('/tickets', ticketController.getTickets.bind(ticketController));
router.post('/tickets', ticketController.createTicket.bind(ticketController));
router.put('/tickets/:id', ticketController.updateTicket.bind(ticketController));
router.delete('/tickets/:id', ticketController.deleteTicket.bind(ticketController));
router.get('/tickets/export', ticketController.exportTickets.bind(ticketController));

// User management routes
router.post('/users', authController.createUser.bind(authController));
router.put('/users/:id', authController.updateUser.bind(authController));
router.post('/users/change-password', authController.changePassword.bind(authController));

export default router; 