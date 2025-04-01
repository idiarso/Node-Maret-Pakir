import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { auth } from '../middleware/auth';

const router = Router();
const ticketController = TicketController.getInstance();

// All routes require authentication
router.use(auth);

// Create new ticket
router.post('/', ticketController.createTicket.bind(ticketController));

// Get ticket by ID
router.get('/:id', ticketController.getTicket.bind(ticketController));

// Get ticket by ticket number
router.get('/number/:ticketNumber', ticketController.getTicketByNumber.bind(ticketController));

// Update ticket
router.patch('/:id', ticketController.updateTicket.bind(ticketController));

// List tickets with pagination and filters
router.get('/', ticketController.listTickets.bind(ticketController));

export default router; 