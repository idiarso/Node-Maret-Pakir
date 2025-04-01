import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole, AuthenticatedRequestHandler } from '../shared/types';
import { Pool } from 'pg';
import { RequestHandler } from 'express';

export const createVehicleRouter = (db: Pool) => {
  const router = Router();
  const vehicleController = new VehicleController(db);

  // Protected routes
  router.post('/', authMiddleware(), vehicleController.registerVehicle as AuthenticatedRequestHandler);
  router.get('/', authMiddleware(), vehicleController.listVehicles as AuthenticatedRequestHandler);
  router.get('/search', authMiddleware(), vehicleController.searchVehicles as AuthenticatedRequestHandler);
  router.get('/:plateNumber', authMiddleware(), vehicleController.getVehicle as AuthenticatedRequestHandler);
  router.put('/:plateNumber', authMiddleware(), vehicleController.updateVehicle as AuthenticatedRequestHandler);
  router.delete('/:plateNumber', authMiddleware(), vehicleController.deleteVehicle as AuthenticatedRequestHandler);

  return router;
}; 