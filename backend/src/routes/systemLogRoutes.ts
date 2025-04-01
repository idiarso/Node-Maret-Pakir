import { Router } from 'express';
import { SystemLogController } from '../controllers/SystemLogController';

const router = Router();
const controller = new SystemLogController();

router.get('/', controller.getLogs);
router.post('/', controller.createLog);
router.delete('/', controller.clearLogs);

export default router; 