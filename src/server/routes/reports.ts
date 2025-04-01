import { Router } from 'express';
import { getRepository, Between } from 'typeorm';
import { Vehicle } from '../entities/Vehicle';
import { PaymentTransaction } from '../entities/PaymentTransaction';
import { VehicleType, PaymentMethod } from '../../shared/types';

const router = Router();

// Daily report
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    const vehicleRepository = getRepository(Vehicle);
    const paymentRepository = getRepository(PaymentTransaction);

    // Get vehicle entries
    const vehicles = await vehicleRepository.find({
      where: {
        entryTime: Between(startDate, endDate)
      },
      relations: ['entryOperator', 'payment']
    });

    // Get payments
    const payments = await paymentRepository.find({
      where: {
        transactionTime: Between(startDate, endDate)
      },
      relations: ['operator', 'vehicle']
    });

    // Calculate statistics
    const stats = {
      totalVehicles: vehicles.length,
      vehiclesByType: vehicles.reduce((acc, vehicle) => {
        const type = vehicle.vehicleType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<VehicleType, number>),
      totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      revenueByMethod: payments.reduce((acc, payment) => {
        const method = payment.paymentMethod;
        acc[method] = (acc[method] || 0) + Number(payment.amount);
        return acc;
      }, {} as Record<PaymentMethod, number>)
    };

    res.json({
      date: startDate.toISOString().split('T')[0],
      stats,
      vehicles,
      payments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Monthly report
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const vehicleRepository = getRepository(Vehicle);
    const paymentRepository = getRepository(PaymentTransaction);

    // Get daily totals
    const dailyStats = await paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.transactionTime)', 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('payment.transactionTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .groupBy('date')
      .getRawMany();

    // Get vehicle type distribution
    const vehicleTypes = await vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.vehicleType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('vehicle.entryTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .groupBy('vehicle.vehicleType')
      .getRawMany();

    // Get payment method distribution
    const paymentMethods = await paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('payment.transactionTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .groupBy('payment.paymentMethod')
      .getRawMany();

    res.json({
      period: {
        year: Number(year),
        month: Number(month)
      },
      summary: {
        totalRevenue: dailyStats.reduce((sum, day) => sum + Number(day.total), 0),
        totalVehicles: vehicleTypes.reduce((sum, type) => sum + Number(type.count), 0),
        averageDaily: dailyStats.reduce((sum, day) => sum + Number(day.total), 0) / dailyStats.length
      },
      details: {
        dailyStats,
        vehicleTypes,
        paymentMethods
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Custom date range report
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const vehicleRepository = getRepository(Vehicle);
    const paymentRepository = getRepository(PaymentTransaction);

    // Get all data for the period
    const [vehicles, payments] = await Promise.all([
      vehicleRepository.find({
        where: {
          entryTime: Between(start, end)
        },
        relations: ['entryOperator', 'exitOperator', 'payment']
      }),
      paymentRepository.find({
        where: {
          transactionTime: Between(start, end)
        },
        relations: ['operator', 'vehicle']
      })
    ]);

    // Calculate comprehensive statistics
    const stats = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        durationDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      vehicles: {
        total: vehicles.length,
        byType: vehicles.reduce((acc, vehicle) => {
          const type = vehicle.vehicleType;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<VehicleType, number>),
        averageDaily: vehicles.length / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      revenue: {
        total: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        byMethod: payments.reduce((acc, payment) => {
          const method = payment.paymentMethod;
          acc[method] = (acc[method] || 0) + Number(payment.amount);
          return acc;
        }, {} as Record<PaymentMethod, number>),
        averageDaily: payments.reduce((sum, payment) => sum + Number(payment.amount), 0) / 
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    res.json({
      stats,
      data: {
        vehicles,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate custom range report' });
  }
});

export default router; 