import { Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest, PaymentMethod, PaymentStatus, ParkingFee, Receipt } from '../shared/types';

export class PaymentController {
  private readonly BASE_RATE = 2.00; // Base rate per hour
  private readonly CURRENCY = 'USD';

  constructor(private db: Pool) {}

  calculateParkingFee = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { exitTime } = req.body;

      const parkingRecord = await this.db.query(
        'SELECT entry_time FROM parking_sessions WHERE vehicle_id = $1 AND exit_time IS NULL',
        [vehicleId]
      );

      if (parkingRecord.rows.length === 0) {
        return res.status(404).json({ message: 'No active parking session found' });
      }

      const entryTime = new Date(parkingRecord.rows[0].entry_time);
      const parsedExitTime = new Date(exitTime);
      const durationInMinutes = Math.ceil((parsedExitTime.getTime() - entryTime.getTime()) / (1000 * 60));
      const durationInHours = durationInMinutes / 60;

      const baseRate = Math.ceil(durationInHours) * this.BASE_RATE;
      const additionalFees = 0; // Can be calculated based on specific rules

      const parkingFee: ParkingFee = {
        vehicleId: parseInt(vehicleId),
        entryTime,
        exitTime: parsedExitTime,
        duration: durationInMinutes,
        baseRate,
        additionalFees,
        totalAmount: baseRate + additionalFees,
        currency: this.CURRENCY
      };

      return res.json(parkingFee);
    } catch (error) {
      console.error('Calculate parking fee error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  processPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { amount, paymentMethod } = req.body;

      // Start transaction
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');

        // Get parking session
        const parkingSession = await client.query(
          'SELECT * FROM parking_sessions WHERE vehicle_id = $1 AND exit_time IS NULL',
          [vehicleId]
        );

        if (parkingSession.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'No active parking session found' });
        }

        // Create parking fee record
        const parkingFee = await client.query(
          `INSERT INTO parking_fees (vehicle_id, entry_time, exit_time, duration, base_rate, additional_fees, total_amount, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            vehicleId,
            parkingSession.rows[0].entry_time,
            new Date(),
            0, // Will be calculated by trigger
            this.BASE_RATE,
            0,
            amount,
            this.CURRENCY
          ]
        );

        // Create payment transaction
        const transaction = await client.query(
          `INSERT INTO payment_transactions (parking_fee_id, amount, currency, method, status, transaction_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            parkingFee.rows[0].id,
            amount,
            this.CURRENCY,
            paymentMethod,
            PaymentStatus.COMPLETED,
            `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`
          ]
        );

        // Update parking session
        await client.query(
          'UPDATE parking_sessions SET exit_time = NOW(), payment_id = $1 WHERE vehicle_id = $2 AND exit_time IS NULL',
          [transaction.rows[0].id, vehicleId]
        );

        await client.query('COMMIT');

        // Generate receipt
        const receipt = await this.generateReceipt(transaction.rows[0].id);
        return res.json(receipt);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Process payment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  generateReceipt = async (transactionId: number): Promise<Receipt> => {
    const result = await this.db.query(
      `SELECT 
        pt.id as transaction_id,
        v.plate_number,
        ps.entry_time,
        ps.exit_time,
        pf.total_amount,
        pf.currency,
        pt.method as payment_method,
        ps.operator_id
       FROM payment_transactions pt
       JOIN parking_fees pf ON pt.parking_fee_id = pf.id
       JOIN parking_sessions ps ON pf.vehicle_id = ps.vehicle_id
       JOIN vehicles v ON ps.vehicle_id = v.id
       WHERE pt.id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const data = result.rows[0];
    const duration = this.formatDuration(
      new Date(data.exit_time).getTime() - new Date(data.entry_time).getTime()
    );

    return {
      id: Date.now(), // Receipt number
      transactionId: data.transaction_id,
      vehiclePlate: data.plate_number,
      entryTime: new Date(data.entry_time),
      exitTime: new Date(data.exit_time),
      duration,
      amount: data.total_amount,
      currency: data.currency,
      paymentMethod: data.payment_method,
      operatorId: data.operator_id,
      createdAt: new Date()
    };
  };

  getPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate } = req.query;

      let query = `
        SELECT 
          pt.*,
          pf.entry_time,
          pf.exit_time,
          pf.duration,
          v.plate_number
        FROM payment_transactions pt
        JOIN parking_fees pf ON pt.parking_fee_id = pf.id
        JOIN vehicles v ON pf.vehicle_id = v.id
        WHERE pf.vehicle_id = $1
      `;
      const params: any[] = [vehicleId];

      if (startDate && endDate) {
        query += ' AND pt.created_at BETWEEN $2 AND $3';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY pt.created_at DESC';

      const result = await this.db.query(query, params);
      return res.json(result.rows);
    } catch (error) {
      console.error('Get payment history error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
} 