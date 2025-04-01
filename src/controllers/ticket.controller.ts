import { Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../shared/types';
import { HardwareManager } from '../services/hardware.manager';

interface Ticket {
    id: number;
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
    operatorId: number;
}

export class TicketController {
    constructor(
        private readonly pool: Pool,
        private readonly hardwareManager: HardwareManager
    ) {}

    public generateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { plateNumber, vehicleType } = req.body;
        const operatorId = req.user.id;

        if (!plateNumber || !vehicleType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create parking session
            const sessionResult = await client.query(
                `INSERT INTO parking_sessions (operator_id, entry_time)
                 VALUES ($1, CURRENT_TIMESTAMP)
                 RETURNING id, entry_time`,
                [operatorId]
            );

            const sessionId = sessionResult.rows[0].id;
            const entryTime = sessionResult.rows[0].entry_time;

            // Generate unique barcode
            const barcode = await this.generateBarcode(sessionId);

            // Create ticket
            const ticketResult = await client.query(
                `INSERT INTO tickets (parking_session_id, barcode)
                 VALUES ($1, $2)
                 RETURNING id`,
                [sessionId, barcode]
            );

            const ticket: Ticket = {
                id: ticketResult.rows[0].id,
                barcode,
                plateNumber,
                vehicleType,
                entryTime,
                operatorId
            };

            // Print ticket
            await this.hardwareManager.printTicket({
                barcode: ticket.barcode,
                plateNumber: ticket.plateNumber,
                vehicleType: ticket.vehicleType,
                entryTime: ticket.entryTime
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

            await client.query('COMMIT');

            res.status(201).json(ticket);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to generate ticket:', error);
            res.status(500).json({ error: 'Failed to generate ticket' });
        } finally {
            client.release();
        }
    };

    public validateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { barcode } = req.params;

        if (!barcode) {
            res.status(400).json({ error: 'Barcode is required' });
            return;
        }

        try {
            const result = await this.pool.query(
                `SELECT t.id, t.barcode, t.created_at,
                        ps.entry_time, ps.operator_id
                 FROM tickets t
                 JOIN parking_sessions ps ON t.parking_session_id = ps.id
                 WHERE t.barcode = $1`,
                [barcode]
            );

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }

            const ticket = result.rows[0];

            if (ticket.exit_time) {
                res.status(400).json({ error: 'Ticket has already been used' });
                return;
            }

            res.json(ticket);
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