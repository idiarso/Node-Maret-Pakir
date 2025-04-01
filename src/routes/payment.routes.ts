import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole, AuthenticatedRequestHandler } from '../shared/types';
import { DataSource } from 'typeorm';

export const createPaymentRouter = (dataSource: DataSource) => {
  const router = Router();
  const paymentController = new PaymentController(dataSource);

  // Calculate parking fee
  router.get(
    '/calculate/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.calculateParkingFee as AuthenticatedRequestHandler
  );

  // Process payment
  router.post(
    '/process/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.processPayment as AuthenticatedRequestHandler
  );

  // Get payment history
  router.get(
    '/history/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.getPaymentHistory as AuthenticatedRequestHandler
  );

  return router;
}; 