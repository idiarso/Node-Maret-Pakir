import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';

const router = Router();
const controller = new VehicleController();

router.get('/', controller.getVehicles);
router.get('/:id', controller.getVehicle);
router.post('/', controller.createVehicle);
router.put('/:id', controller.updateVehicle);
router.delete('/:id', controller.deleteVehicle);

export default router; 