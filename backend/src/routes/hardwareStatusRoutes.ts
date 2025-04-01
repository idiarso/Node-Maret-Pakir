import { Router } from 'express';
import { HardwareStatusController } from '../controllers/HardwareStatusController';

const router = Router();
const controller = new HardwareStatusController();

router.get('/', controller.getStatus);
router.get('/:deviceId', controller.getDeviceStatus);
router.post('/:deviceId', controller.updateStatus);

export default router; 