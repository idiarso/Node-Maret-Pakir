import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../shared/types';
import { Pool } from 'pg';
import { RequestHandler } from 'express';

export const createPaymentRouter = (db: Pool) => {
  const router = Router();
  const paymentController = new PaymentController(db);

  // Calculate parking fee
  router.get(
    '/calculate/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.calculateParkingFee as RequestHandler
  );

  // Process payment
  router.post(
    '/process/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.processPayment as RequestHandler
  );

  // Get payment history
  router.get(
    '/history/:vehicleId',
    authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]),
    paymentController.getPaymentHistory as RequestHandler
  );

  return router;
}; 