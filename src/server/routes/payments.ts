import { Router } from 'express';
import { getRepository } from 'typeorm';
import { PaymentTransaction } from '../entities/PaymentTransaction';
import { Vehicle } from '../entities/Vehicle';
import { PaymentMethod, PaymentStatus } from '../../shared/types';

const router = Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const paymentRepository = getRepository(PaymentTransaction);
    const payments = await paymentRepository.find({
      relations: ['operator', 'vehicle']
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by receipt number
router.get('/:receiptNumber', async (req, res) => {
  try {
    const paymentRepository = getRepository(PaymentTransaction);
    const payment = await paymentRepository.findOne({
      where: { receiptNumber: req.params.receiptNumber },
      relations: ['operator', 'vehicle']
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const {
      ticketNumber,
      amount,
      paymentMethod,
      operatorId,
      notes
    } = req.body;

    // Find vehicle
    const vehicleRepository = getRepository(Vehicle);
    const vehicle = await vehicleRepository.findOne({
      where: { ticketNumber }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Generate receipt number
    const receiptNumber = `RCP${Date.now()}`;

    const paymentRepository = getRepository(PaymentTransaction);
    const payment = paymentRepository.create({
      amount,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      operator: { id: operatorId },
      vehicle,
      receiptNumber,
      notes
    });

    await paymentRepository.save(payment);

    // Update payment status to PAID
    payment.paymentStatus = PaymentStatus.PAID;
    await paymentRepository.save(payment);

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payments by date range
router.get('/report/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const paymentRepository = getRepository(PaymentTransaction);
    const payments = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.operator', 'operator')
      .leftJoinAndSelect('payment.vehicle', 'vehicle')
      .where('payment.transactionTime >= :startDate', { startDate })
      .andWhere('payment.transactionTime <= :endDate', { endDate })
      .orderBy('payment.transactionTime', 'DESC')
      .getMany();

    // Calculate totals
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      acc[method] = (acc[method] || 0) + Number(payment.amount);
      return acc;
    }, {} as Record<PaymentMethod, number>);

    res.json({
      payments,
      summary: {
        total,
        totalByMethod,
        count: payments.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate payment report' });
  }
});

export default router; 