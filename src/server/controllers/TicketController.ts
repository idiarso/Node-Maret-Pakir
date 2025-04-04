import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/TicketService';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

export class TicketController {
    private static instance: TicketController;
    private ticketService: TicketService;
    private logger: Logger;

    private constructor() {
        this.ticketService = TicketService.getInstance();
        this.logger = Logger.getInstance();
    }

    public static getInstance(): TicketController {
        if (!TicketController.instance) {
            TicketController.instance = new TicketController();
        }
        return TicketController.instance;
    }

    public async createTicket(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await this.ticketService.createTicket({
                plateNumber: req.body.plateNumber,
                vehicleTypeId: req.body.vehicleTypeId,
                operatorId: req.user!.id,
                notes: req.body.notes
            });

            res.status(201).json({
                success: true,
                data: ticket
            });
        } catch (error) {
            next(error);
        }
    }

    public async getTicket(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await this.ticketService.getTicket(req.params.barcode);
            res.json({
                success: true,
                data: ticket
            });
        } catch (error) {
            next(error);
        }
    }

    public async completeTicket(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await this.ticketService.completeTicket(req.params.barcode);
            res.json({
                success: true,
                data: ticket
            });
        } catch (error) {
            next(error);
        }
    }

    public async calculateFee(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await this.ticketService.getTicket(req.params.barcode);
            const fee = await this.ticketService.calculateParkingFee(ticket);
            
            res.json({
                success: true,
                data: { fee }
            });
        } catch (error) {
            next(error);
        }
    }

    public async createPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const payment = await this.ticketService.createPayment({
                ticketId: req.body.ticketId,
                amount: req.body.amount,
                paymentMethod: req.body.paymentMethod,
                operatorId: req.user!.id,
                notes: req.body.notes
            });

            res.status(201).json({
                success: true,
                data: payment
            });
        } catch (error) {
            next(error);
        }
    }

    public async getActiveTickets(req: Request, res: Response, next: NextFunction) {
        try {
            const tickets = await this.ticketService.getActiveTickets();
            res.json({
                success: true,
                data: tickets
            });
        } catch (error) {
            next(error);
        }
    }

    public async getTicketsByDateRange(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;
            const tickets = await this.ticketService.getTicketsByDateRange(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            
            res.json({
                success: true,
                data: tickets
            });
        } catch (error) {
            next(error);
        }
    }

    public getRoutes() {
        return [
            {
                path: '/tickets',
                method: 'post',
                handler: [authMiddleware([UserRole.OPERATOR]), this.createTicket.bind(this)]
            },
            {
                path: '/tickets/:barcode',
                method: 'get',
                handler: [authMiddleware([UserRole.OPERATOR]), this.getTicket.bind(this)]
            },
            {
                path: '/tickets/:barcode/complete',
                method: 'post',
                handler: [authMiddleware([UserRole.OPERATOR]), this.completeTicket.bind(this)]
            },
            {
                path: '/tickets/:barcode/fee',
                method: 'get',
                handler: [authMiddleware([UserRole.OPERATOR]), this.calculateFee.bind(this)]
            },
            {
                path: '/payments',
                method: 'post',
                handler: [authMiddleware([UserRole.OPERATOR]), this.createPayment.bind(this)]
            },
            {
                path: '/tickets/active',
                method: 'get',
                handler: [authMiddleware([UserRole.OPERATOR]), this.getActiveTickets.bind(this)]
            },
            {
                path: '/tickets/range',
                method: 'get',
                handler: [authMiddleware([UserRole.ADMIN]), this.getTicketsByDateRange.bind(this)]
            }
        ];
    }
} 