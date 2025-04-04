import { Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from '../shared/types';
import { HardwareManager } from '../services/hardware.manager';
import { ParkingSession } from '../entities/ParkingSession';
import { Ticket } from '../entities/Ticket';
import { BaseController } from './base.controller';

export class TicketController extends BaseController {
    private static dataSource: DataSource;
    private static hardwareManager: HardwareManager;

    private constructor() {
        super();
    }

    public static initialize(dataSource: DataSource, hardwareManager: HardwareManager): void {
        TicketController.dataSource = dataSource;
        TicketController.hardwareManager = hardwareManager;
    }

    public listTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tickets = await TicketController.dataSource
                .getRepository(Ticket)
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.parkingSession', 'parkingSession')
                .getMany();

            res.json(tickets);
        } catch (error) {
            console.error('Failed to list tickets:', error);
            res.status(500).json({ error: 'Failed to list tickets' });
        }
    };

    public getTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const ticket = await TicketController.dataSource
                .getRepository(Ticket)
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.parkingSession', 'parkingSession')
                .where('ticket.id = :id', { id })
                .getOne();

            if (!ticket) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }

            res.json(ticket);
        } catch (error) {
            console.error('Failed to get ticket:', error);
            res.status(500).json({ error: 'Failed to get ticket' });
        }
    };

    public createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { plateNumber, vehicleType } = req.body;
        const operatorId = req.user.id;

        if (!plateNumber || !vehicleType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const queryRunner = TicketController.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create parking session
            const parkingSession = new ParkingSession();
            parkingSession.entry_operator_id = operatorId;
            parkingSession.entry_time = new Date();
            parkingSession.status = 'ACTIVE';
            
            const savedSession = await queryRunner.manager.save(parkingSession);

            // Generate unique barcode
            const barcode = await this.generateBarcode(savedSession.id);

            // Create ticket
            const ticket = new Ticket();
            ticket.parking_session_id = savedSession.id;
            ticket.barcode = barcode;
            
            const savedTicket = await queryRunner.manager.save(ticket);

            // Print ticket
            await TicketController.hardwareManager.printTicket({
                barcode: savedTicket.barcode,
                plateNumber: plateNumber,
                vehicleType: vehicleType,
                entryTime: savedSession.entry_time
            });

            // Open gate
            await TicketController.hardwareManager.openGate();

            // Set timeout to close gate after 30 seconds
            setTimeout(async () => {
                try {
                    await TicketController.hardwareManager.closeGate();
                } catch (error) {
                    console.error('Failed to close gate:', error);
                }
            }, 30000);

            await queryRunner.commitTransaction();

            res.status(201).json({
                id: savedTicket.id,
                barcode: savedTicket.barcode,
                plateNumber,
                vehicleType,
                entryTime: savedSession.entry_time,
                operatorId
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Failed to create ticket:', error);
            res.status(500).json({ error: 'Failed to create ticket' });
        } finally {
            await queryRunner.release();
        }
    };

    public updateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const ticket = await TicketController.dataSource
                .getRepository(Ticket)
                .findOne({ where: { id: parseInt(id) } });

            if (!ticket) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }

            // Update ticket status
            ticket.status = status;
            await TicketController.dataSource.getRepository(Ticket).save(ticket);

            res.json(ticket);
        } catch (error) {
            console.error('Failed to update ticket:', error);
            res.status(500).json({ error: 'Failed to update ticket' });
        }
    };

    public cancelTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const ticket = await TicketController.dataSource
                .getRepository(Ticket)
                .findOne({ where: { id: parseInt(id) } });

            if (!ticket) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }

            // Cancel ticket
            ticket.status = 'CANCELLED';
            await TicketController.dataSource.getRepository(Ticket).save(ticket);

            res.json({ message: 'Ticket cancelled successfully' });
        } catch (error) {
            console.error('Failed to cancel ticket:', error);
            res.status(500).json({ error: 'Failed to cancel ticket' });
        }
    };

    public validateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const ticket = await TicketController.dataSource
                .getRepository(Ticket)
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.parkingSession', 'parkingSession')
                .where('ticket.id = :id', { id })
                .getOne();

            if (!ticket) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }

            if (ticket.parkingSession.exit_time) {
                res.status(400).json({ error: 'Ticket has already been used' });
                return;
            }

            res.json({
                id: ticket.id,
                barcode: ticket.barcode,
                created_at: ticket.created_at,
                entry_time: ticket.parkingSession.entry_time,
                operator_id: ticket.parkingSession.entry_operator_id
            });
        } catch (error) {
            console.error('Failed to validate ticket:', error);
            res.status(500).json({ error: 'Failed to validate ticket' });
        }
    };

    private async generateBarcode(sessionId: number): Promise<string> {
        const timestamp = Date.now();
        const barcode = `PKG${timestamp}${sessionId.toString().padStart(6, '0')}`;
        return barcode;
    }
} 