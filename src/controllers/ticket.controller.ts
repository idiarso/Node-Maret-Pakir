import { Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from '../shared/types';
import { HardwareManager } from '../services/hardware.manager';
import { ParkingSession } from '../entities/ParkingSession';
import { Ticket } from '../entities/Ticket';

export class TicketController {
    constructor(
        private readonly dataSource: DataSource,
        private readonly hardwareManager: HardwareManager
    ) {}

    public generateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { plateNumber, vehicleType } = req.body;
        const operatorId = req.user.id;

        if (!plateNumber || !vehicleType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const queryRunner = this.dataSource.createQueryRunner();
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
            await this.hardwareManager.printTicket({
                barcode: savedTicket.barcode,
                plateNumber: plateNumber,
                vehicleType: vehicleType,
                entryTime: savedSession.entry_time
            });

            // Open gate
            await this.hardwareManager.openGate();

            // Set timeout to close gate after 30 seconds
            setTimeout(async () => {
                try {
                    await this.hardwareManager.closeGate();
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
            console.error('Failed to generate ticket:', error);
            res.status(500).json({ error: 'Failed to generate ticket' });
        } finally {
            await queryRunner.release();
        }
    };

    public validateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { barcode } = req.params;

        if (!barcode) {
            res.status(400).json({ error: 'Barcode is required' });
            return;
        }

        try {
            const ticket = await this.dataSource
                .getRepository(Ticket)
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.parkingSession', 'parkingSession')
                .where('ticket.barcode = :barcode', { barcode })
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