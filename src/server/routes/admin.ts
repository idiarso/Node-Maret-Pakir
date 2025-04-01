import { Router } from 'express';
import { DashboardController } from '../controllers/admin/DashboardController';
import { TicketController } from '../controllers/admin/TicketController';
import { AuthController } from '../controllers/AuthController';
import { auth, adminAuth } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();
const ticketController = new TicketController();
const authController = AuthController.getInstance();

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(adminAuth);

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Ticket management routes
router.get('/tickets', ticketController.getTickets);
router.post('/tickets', ticketController.createTicket);
router.put('/tickets/:id', ticketController.updateTicket);
router.delete('/tickets/:id', ticketController.deleteTicket);
router.get('/tickets/export', ticketController.exportTickets);

// User management routes
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.post('/users/change-password', authController.changePassword);

export default router; 