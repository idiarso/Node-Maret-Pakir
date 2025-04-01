import { Request, Response } from 'express';
import { Between, FindOptionsOrder, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DatabaseService } from '../services/database.service';
import { Ticket } from '../entities/Ticket';
import { VehicleType } from '../entities/VehicleType';
import { LoggerService } from '../services/logger.service';
import { ApiError } from '../middleware/error.middleware';
import { TicketStatus } from '../../shared/types';

export class TicketController {
    private ticketService: DatabaseService<Ticket>;
    private vehicleTypeService: DatabaseService<VehicleType>;
    private static instance: TicketController;

    private constructor() {
        this.ticketService = new DatabaseService(Ticket);
        this.vehicleTypeService = new DatabaseService(VehicleType);
    }

    public static getInstance(): TicketController {
        if (!TicketController.instance) {
            TicketController.instance = new TicketController();
        }
        return TicketController.instance;
    }

    async createTicket(req: Request, res: Response) {
        try {
            const { vehicleTypeId, plateNumber } = req.body;

            if (!vehicleTypeId || !plateNumber) {
                throw new ApiError(400, 'Vehicle type and plate number are required');
            }

            // Verify vehicle type exists
            const vehicleType = await this.vehicleTypeService.findById(vehicleTypeId);

            const ticketNumber = await this.generateTicketNumber();
            
            const ticket = await this.ticketService.create({
                ticketNumber,
                vehicleTypeId,
                plateNumber,
                status: TicketStatus.ACTIVE,
                createdBy: req.user!.id,
                entryTime: new Date()
            });

            LoggerService.info('Ticket created:', { ticketNumber, plateNumber });
            return res.status(201).json(ticket);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error('Error creating ticket:', error);
            throw new ApiError(500, 'Failed to create ticket');
        }
    }

    async getTicket(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const ticket = await this.ticketService.findById(Number(id));
            return res.json(ticket);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error('Error retrieving ticket:', error);
            throw new ApiError(500, 'Failed to retrieve ticket');
        }
    }

    async getTicketByNumber(req: Request, res: Response) {
        try {
            const { ticketNumber } = req.params;
            const ticket = await this.ticketService.findOne({
                where: { ticketNumber },
                relations: ['vehicleType']
            });

            if (!ticket) {
                throw new ApiError(404, 'Ticket not found');
            }

            return res.json(ticket);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error('Error retrieving ticket:', error);
            throw new ApiError(500, 'Failed to retrieve ticket');
        }
    }

    async updateTicket(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, exitTime } = req.body;

            const ticket = await this.ticketService.update(Number(id), {
                status,
                exitTime: exitTime ? new Date(exitTime) : undefined
            });

            LoggerService.info('Ticket updated:', { id, status });
            return res.json(ticket);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error('Error updating ticket:', error);
            throw new ApiError(500, 'Failed to update ticket');
        }
    }

    async listTickets(req: Request, res: Response) {
        try {
            LoggerService.info('Listing tickets with params:', req.query);
            const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
            const take = Number(limit);
            const skip = (Number(page) - 1) * take;

            const where: any = {};
            if (status) where.status = status;
            if (startDate && endDate) {
                where.entryTime = Between(new Date(startDate as string), new Date(endDate as string));
            } else if (startDate) {
                where.entryTime = MoreThanOrEqual(new Date(startDate as string));
            } else if (endDate) {
                where.entryTime = LessThanOrEqual(new Date(endDate as string));
            }

            const order: FindOptionsOrder<Ticket> = {
                entryTime: 'DESC'
            };

            LoggerService.info('Executing database query with:', { where, skip, take, order });

            const [tickets, total] = await Promise.all([
                this.ticketService.findAll({
                    where,
                    relations: ['vehicleType'],
                    skip,
                    take,
                    order
                }),
                this.ticketService.count(where)
            ]);

            LoggerService.info('Query results:', { totalTickets: total, returnedTickets: tickets.length });

            return res.json({
                tickets,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / take)
            });
        } catch (error) {
            LoggerService.error('Error listing tickets:', error);
            if (error instanceof Error) {
                LoggerService.error('Error details:', { 
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            throw new ApiError(500, 'Failed to list tickets');
        }
    }

    private async generateTicketNumber(): Promise<string> {
        const date = new Date();
        const prefix = date.getFullYear().toString().slice(-2) +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        
        // Get count of tickets for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const count = await this.ticketService.count({
            entryTime: Between(todayStart, todayEnd)
        });

        const sequence = (count + 1).toString().padStart(4, '0');
        return `${prefix}-${sequence}`;
    }
} 