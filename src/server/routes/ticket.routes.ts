import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

export const createTicketRouter = () => {
    const router = Router();
    const ticketController = TicketController.getInstance();

    // Protected routes
    router.get('/', 
        authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), 
        (req, res) => ticketController.listTickets(req, res)
    );
    
    router.get('/:id', 
        authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), 
        (req, res) => ticketController.getTicket(req, res)
    );
    
    router.post('/', 
        authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), 
        (req, res) => ticketController.createTicket(req, res)
    );
    
    router.put('/:id', 
        authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), 
        (req, res) => ticketController.updateTicket(req, res)
    );
    
    router.delete('/:id', 
        authMiddleware([UserRole.ADMIN]), 
        (req, res) => ticketController.cancelTicket(req, res)
    );

    // Ticket validation routes
    router.post('/:id/validate', 
        authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), 
        (req, res) => ticketController.validateTicket(req, res)
    );

    return router;
}; 