import { Request, Response } from 'express';
import AppDataSource from '../../config/ormconfig';
import { Ticket } from '../../entities/Ticket';
import { VehicleType } from '../../entities/VehicleType';
import { TicketStatus } from '../../../shared/types';

export class TicketController {
    private static instance: TicketController;
    private readonly ticketRepository = AppDataSource.getRepository(Ticket);
    private readonly vehicleTypeRepository = AppDataSource.getRepository(VehicleType);

    private constructor() {}

    public static getInstance(): TicketController {
        if (!TicketController.instance) {
            TicketController.instance = new TicketController();
        }
        return TicketController.instance;
    }

    async getTickets(req: Request, res: Response) {
        try {
            const { search, status, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const queryBuilder = this.ticketRepository
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.vehicleType', 'vehicleType')
                .orderBy('ticket.entryTime', 'DESC');

            if (search) {
                queryBuilder.where(
                    '(ticket.ticketNumber LIKE :search OR ticket.plateNumber LIKE :search)',
                    { search: `%${search}%` }
                );
            }

            if (status) {
                queryBuilder.andWhere('ticket.status = :status', { status });
            }

            const [tickets, total] = await queryBuilder
                .skip(skip)
                .take(Number(limit))
                .getManyAndCount();

            res.json({
                tickets,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Error getting tickets:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createTicket(req: Request, res: Response) {
        try {
            const { plateNumber, vehicleTypeId } = req.body;

            const vehicleType = await this.vehicleTypeRepository.findOne({
                where: { id: vehicleTypeId }
            });

            if (!vehicleType) {
                return res.status(404).json({ message: 'Vehicle type not found' });
            }

            const ticket = new Ticket({
                ticketNumber: this.generateTicketNumber(),
                plateNumber,
                vehicleTypeId,
                status: TicketStatus.ACTIVE,
                entryTime: new Date(),
                createdBy: (req as any).user?.id || 0
            });

            await this.ticketRepository.save(ticket);
            res.status(201).json(ticket);
        } catch (error) {
            console.error('Error creating ticket:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateTicket(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { plateNumber, vehicleTypeId, status } = req.body;

            const ticket = await this.ticketRepository.findOne({
                where: { id: Number(id) }
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            if (vehicleTypeId) {
                const vehicleType = await this.vehicleTypeRepository.findOne({
                    where: { id: vehicleTypeId }
                });

                if (!vehicleType) {
                    return res.status(404).json({ message: 'Vehicle type not found' });
                }

                ticket.vehicleTypeId = vehicleTypeId;
            }

            if (plateNumber) {
                ticket.plateNumber = plateNumber;
            }

            if (status && Object.values(TicketStatus).includes(status)) {
                ticket.status = status;
            }

            await this.ticketRepository.save(ticket);
            res.json(ticket);
        } catch (error) {
            console.error('Error updating ticket:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteTicket(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const ticket = await this.ticketRepository.findOne({
                where: { id: Number(id) }
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            await this.ticketRepository.remove(ticket);
            res.json({ message: 'Ticket deleted successfully' });
        } catch (error) {
            console.error('Error deleting ticket:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async exportTickets(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            const queryBuilder = this.ticketRepository
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.vehicleType', 'vehicleType')
                .orderBy('ticket.entryTime', 'DESC');

            if (startDate) {
                queryBuilder.andWhere('ticket.entryTime >= :startDate', { startDate });
            }

            if (endDate) {
                queryBuilder.andWhere('ticket.entryTime <= :endDate', { endDate });
            }

            const tickets = await queryBuilder.getMany();

            // Format data for CSV
            const csvData = tickets.map(ticket => ({
                ticketNumber: ticket.ticketNumber,
                plateNumber: ticket.plateNumber,
                entryTime: ticket.entryTime.toISOString(),
                exitTime: ticket.exitTime?.toISOString() || '',
                vehicleType: ticket.vehicleType.name,
                status: ticket.status
            }));

            res.json(csvData);
        } catch (error) {
            console.error('Error exporting tickets:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    private generateTicketNumber(): string {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TKT${timestamp.slice(-6)}${random}`;
    }
} 