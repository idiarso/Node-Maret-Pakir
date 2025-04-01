import { Pool } from 'pg';
import { TicketData } from '../entry-point';

export class DatabaseService {
    constructor(private readonly pool: Pool) {}

    async createTicket(ticketData: TicketData): Promise<string> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO tickets (
                    barcode,
                    plate_number,
                    vehicle_type,
                    entry_time,
                    operator_id
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING barcode
            `;

            const values = [
                ticketData.barcode,
                ticketData.plateNumber,
                ticketData.vehicleType,
                ticketData.entryTime,
                ticketData.operatorId
            ];

            const result = await client.query(query, values);
            await client.query('COMMIT');

            return result.rows[0].barcode;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getTicketByBarcode(barcode: string): Promise<TicketData | null> {
        const query = `
            SELECT 
                barcode,
                plate_number as "plateNumber",
                vehicle_type as "vehicleType",
                entry_time as "entryTime",
                operator_id as "operatorId",
                exit_time as "exitTime",
                payment_amount as "paymentAmount"
            FROM tickets
            WHERE barcode = $1
        `;

        const result = await this.pool.query(query, [barcode]);
        return result.rows[0] || null;
    }

    async getTicketByPlateNumber(plateNumber: string): Promise<TicketData | null> {
        const query = `
            SELECT 
                barcode,
                plate_number as "plateNumber",
                vehicle_type as "vehicleType",
                entry_time as "entryTime",
                operator_id as "operatorId",
                exit_time as "exitTime",
                payment_amount as "paymentAmount"
            FROM tickets
            WHERE plate_number = $1
            AND exit_time IS NULL
            ORDER BY entry_time DESC
            LIMIT 1
        `;

        const result = await this.pool.query(query, [plateNumber]);
        return result.rows[0] || null;
    }

    async updateTicketExit(barcode: string, paymentAmount: number): Promise<void> {
        const query = `
            UPDATE tickets
            SET 
                exit_time = NOW(),
                payment_amount = $2,
                updated_at = NOW()
            WHERE barcode = $1
        `;

        await this.pool.query(query, [barcode, paymentAmount]);
    }

    async getVehicleTypePrice(vehicleType: string): Promise<number> {
        const query = `
            SELECT base_price
            FROM vehicle_types
            WHERE id = $1
        `;

        const result = await this.pool.query(query, [vehicleType]);
        return result.rows[0]?.base_price || 0;
    }

    async dispose(): Promise<void> {
        await this.pool.end();
    }
} 