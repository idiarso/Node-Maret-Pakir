import { Response } from 'express';
import { DataSource, IsNull } from 'typeorm';
import { AuthenticatedRequest, PaymentMethod, PaymentStatus, ParkingFee, Receipt } from '../shared/types';
import { Payment } from '../server/entities/Payment';
import { ParkingSession } from '../server/entities/ParkingSession';
import { Vehicle } from '../server/entities/Vehicle';
import { User } from '../server/entities/User';

export class PaymentController {
  private readonly BASE_RATE = 2.00; // Base rate per hour
  private readonly CURRENCY = 'USD';
  private paymentRepository;
  private parkingSessionRepository;
  private vehicleRepository;
  private userRepository;

  constructor(private dataSource: DataSource) {
    this.paymentRepository = dataSource.getRepository(Payment);
    this.parkingSessionRepository = dataSource.getRepository(ParkingSession);
    this.vehicleRepository = dataSource.getRepository(Vehicle);
    this.userRepository = dataSource.getRepository(User);
  }

  calculateParkingFee = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { exitTime } = req.body;

      const parkingSession = await this.parkingSessionRepository.findOne({
        where: {
          vehicle: { id: parseInt(vehicleId) },
          exit_time: IsNull()
        }
      });

      if (!parkingSession) {
        return res.status(404).json({ message: 'No active parking session found' });
      }

      const entryTime = parkingSession.entry_time;
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
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get parking session
        const parkingSession = await queryRunner.manager.findOne(ParkingSession, {
          where: {
            vehicle: { id: parseInt(vehicleId) },
            exit_time: IsNull()
          },
          relations: ['ticket']
        });

        if (!parkingSession) {
          await queryRunner.rollbackTransaction();
          return res.status(404).json({ message: 'No active parking session found' });
        }

        // Create payment
        const payment = new Payment({
          amount,
          paymentMethod,
          status: PaymentStatus.COMPLETED,
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          paidBy: req.user.id,
          ticketId: parkingSession.ticket.id
        });

        await queryRunner.manager.save(payment);

        // Update parking session
        parkingSession.exit_time = new Date();
        await queryRunner.manager.save(parkingSession);

        await queryRunner.commitTransaction();

        // Generate receipt
        const receipt = await this.generateReceipt(payment.id);
        return res.json(receipt);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Process payment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  generateReceipt = async (paymentId: number): Promise<Receipt> => {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['ticket', 'ticket.parkingSessions', 'operator']
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const parkingSession = payment.ticket.parkingSessions[0]; // Assuming one session per ticket
    const duration = this.formatDuration(
      parkingSession.exit_time!.getTime() - parkingSession.entry_time.getTime()
    );

    return {
      id: Date.now(), // Receipt number
      transactionId: payment.id,
      vehiclePlate: parkingSession.vehicle.plate_number,
      entryTime: parkingSession.entry_time,
      exitTime: parkingSession.exit_time!,
      duration,
      amount: payment.amount,
      currency: this.CURRENCY,
      paymentMethod: payment.paymentMethod!,
      operatorId: payment.paidBy,
      createdAt: new Date()
    };
  };

  getPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate } = req.query;

      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .innerJoinAndSelect('payment.ticket', 'ticket')
        .innerJoinAndSelect('ticket.parkingSessions', 'parkingSession')
        .innerJoinAndSelect('parkingSession.vehicle', 'vehicle')
        .where('vehicle.id = :vehicleId', { vehicleId });

      if (startDate && endDate) {
        queryBuilder.andWhere('payment.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      queryBuilder.orderBy('payment.created_at', 'DESC');

      const payments = await queryBuilder.getMany();
      return res.json(payments);
    } catch (error) {
      console.error('Get payment history error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
} 